// src/app/api/chat/route.ts
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

  const _conversationId = req.headers.get('x-conversation-id') ?? undefined;

  const mcpUrl = process.env.MCP_URL || 'http://localhost:3001/mcp';

  let mcpClient;
  let mcpTools;
  try {
    mcpClient = await createVercelAiMcpClient({
      url: mcpUrl,
      headers: {
        'x-mcp-internal-token': process.env.MCP_INTERNAL_TOKEN || "YWdXy/fqdMnH1VfPZ7BBcxAUOC2uYs8KPe+1+VFJoU4="
      }
    });

    mcpTools = await mcpClient.tools();
  } catch (err) {
    console.error('[chat/route] MCP connection failed:', err instanceof Error ? err.message : err);
    return new Response(
      JSON.stringify({ error: 'MCP server unavailable. Ensure the Corsair MCP server is running on ' + mcpUrl }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const userSettings = await db
    .select({ toolName: chatToolSettings.toolName, trustMode: chatToolSettings.trustMode })
    .from(chatToolSettings)
    .where(eq(chatToolSettings.userId, userId));

  const userToolSettings: UserToolSetting[] = userSettings.map((s) => ({
    toolName: s.toolName,
    trustMode: s.trustMode,
  }));

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


  const toolsWithApproval = Object.fromEntries(
    Object.entries(mcpTools).map(([name, tool]) => [
      name,
      { ...tool, needsApproval: _approvalInfo[name] ?? tool.needsApproval },
    ]),
  );

  const result = streamText({
    model: openai('gpt-4o'),
    messages,
    system: systemPrompt,
    tools: toolsWithApproval,
    stopWhen: stepCountIs(5),
  });

  return result.toTextStreamResponse();
}