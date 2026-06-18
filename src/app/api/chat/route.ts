// src/app/api/chat/route.ts
import { stepCountIs, streamText, convertToModelMessages, type UIMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createVercelAiMcpClient } from '@corsair-dev/mcp';
import { auth } from '@clerk/nextjs/server';
import { buildSystemPrompt } from '@/server/ai/system-prompt';
import { env } from '@/env';

export const maxDuration = 60; // Allow longer execution for multi-step tool calls

/**
 * Constructs a Vercel AI MCP client connecting to the local Corsair MCP server.
 * The tenantId is passed as a header so the server can scope operations.
 */
async function buildMcpClient(tenantId: string) {
  return createVercelAiMcpClient({
    url: process.env.CORSAIR_MCP_URL ?? 'http://localhost:3001/mcp',
    headers: {
      'x-tenant-id': tenantId,
    },
  });
}

export async function POST(req: Request) {
  const { messages: rawMessages } = (await req.json()) as { messages: UIMessage[] };
  const { userId } = await auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Convert client UI messages (parts-based) to ModelMessage[] for streamText
  const messages = await convertToModelMessages(rawMessages);

  // --- Connect to local MCP server ---
  let mcpClient;
  let mcpTools;
  try {
    mcpClient = await buildMcpClient(userId);
    mcpTools = await mcpClient.tools();
  } catch (err) {
    console.error(
      '[chat/route] MCP connection failed:',
      err instanceof Error ? err.message : err,
    );
    return new Response(
      JSON.stringify({
        error: 'Unable to connect to your integrations. Please make sure the MCP server is running.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const systemPrompt = buildSystemPrompt(userId, new Date());

  // Build tools — MCP tools from createVercelAiMcpClient have their own execute
  // implementation that handles the MCP protocol. Pass them through directly.
  // For now, all tools auto-execute without approval to avoid blocking the flow.
  const toolsWithApproval = mcpTools;

  const result = streamText({
    model: openai(env.OPENAI_MODEL),
    messages,
    system: systemPrompt,
    tools: toolsWithApproval,
    stopWhen: stepCountIs(5),
  });

  return result.toUIMessageStreamResponse();
}
