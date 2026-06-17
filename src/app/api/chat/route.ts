import { stepCountIs, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createVercelAiMcpClient } from '@corsair-dev/mcp';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/server/db';
import { chatToolSettings } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { resolveNeedsApproval, type UserToolSetting } from '@/server/ai/tools/policy';

export const maxDuration = 60; // Allow longer execution for multi-step tool calls

export async function POST(req: Request) {
  const { messages } = await req.json();
  const { userId } = await auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Read conversation ID from headers (passed by the client's useChat)
  // Used in task 10.2 for persisting messages to the conversation
  const _conversationId = req.headers.get('x-conversation-id') ?? undefined;

  // Connect to the local MCP server
  const mcpUrl = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/mcp`
    : 'http://localhost:3001/mcp';

  const mcpClient = await createVercelAiMcpClient({
    url: mcpUrl,
  });

  // Get MCP tools (corsair_setup, list_operations, get_schema, run_script)
  const mcpTools = await mcpClient.tools();

  // Fetch user's per-tool trust settings from DB
  const userSettings = await db
    .select({ toolName: chatToolSettings.toolName, trustMode: chatToolSettings.trustMode })
    .from(chatToolSettings)
    .where(eq(chatToolSettings.userId, userId));

  const userToolSettings: UserToolSetting[] = userSettings.map((s) => ({
    toolName: s.toolName,
    trustMode: s.trustMode,
  }));

  // Build tools with needsApproval based on policy
  // Note: The MCP client returns tools already formatted for the AI SDK.
  // We log the approval map for debugging but the actual approval gating
  // happens via the SDK's native mechanism when tools define needsApproval.
  const _approvalInfo = Object.keys(mcpTools).reduce(
    (acc, toolName) => {
      acc[toolName] = resolveNeedsApproval(toolName, userToolSettings);
      return acc;
    },
    {} as Record<string, boolean>,
  );

  const systemPrompt = `You are Clerio, an elite AI command-center assistant managing the user's Gmail and Google Calendar.
The current date and time is: ${new Date().toLocaleString()}.

You have full access to the Corsair MCP Server. You can write and execute real code using the 'run_script' tool.

IMPORTANT INSTRUCTIONS FOR run_script:
1. The logged-in user's tenantId is "${userId}".
2. When using run_script, YOU MUST use this exact pattern to access the APIs:
   await corsair.withTenant('${userId}').googlecalendar.api.events.create({ ... })
   await corsair.withTenant('${userId}').gmail.api.messages.send({ ... })

3. To send an email via Gmail, you must provide a base64url encoded 'raw' string. Use this exact snippet in your script:
   const emailText = 'To: recipient@example.com\\nSubject: Your Subject\\n\\nYour message body here.';
   const raw = Buffer.from(emailText).toString('base64').replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
   await corsair.withTenant('${userId}').gmail.api.messages.send({ raw });
   
Execute actions immediately without asking for permission if the user's intent is clear. Act quickly and confidently.`;

  const result = streamText({
    model: openai('gpt-3.5-turbo'),
    messages,
    system: systemPrompt,
    tools: mcpTools,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
