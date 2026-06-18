import OpenAI from 'openai';
import { getOpenAIMcpConfig } from '@corsair-dev/mcp';

const client = new OpenAI();
const mcpConfig = getOpenAIMcpConfig('https://81a9-2405-201-100e-a06c-7c3c-9113-d7b8-2b8f.ngrok-free.app/mcp', {
    'x-mcp-internal-token': process.env.MCP_INTERNAL_TOKEN || '',
});

const response = await client.responses.create({
    model: 'gpt-4.1',
    tools: [
        {
            type: 'mcp',
            server_label: mcpConfig.serverLabel,
            server_url: mcpConfig.serverUrl,
            headers: mcpConfig.headers,
        },
    ],
    input: 'Setup corsair, then list all slack channels',
});

console.log(response.output_text);