import express from 'express';
import { createBaseMcpServer, createMcpRouter } from '@corsair-dev/mcp';
import { corsair } from './corsair';

const app = express();
app.use(express.json());

app.use('/mcp', createMcpRouter(() => createBaseMcpServer({ corsair })));

app.listen(3001, () => console.log('MCP server running on :3001'));