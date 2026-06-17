import express from 'express';
import cors from 'cors';
import { createBaseMcpServer, createMcpRouter } from '@corsair-dev/mcp';
import { corsair } from './corsair';

const app = express();

// Allow the Next.js app to communicate with this MCP server
app.use(cors());
app.use(express.json());

// Expose Corsair's tools (run_script, get_schema, etc.) over MCP
app.use('/mcp', createMcpRouter(() => createBaseMcpServer({ corsair })));

const PORT = process.env.MCP_PORT || 3001;
app.listen(PORT, () => {
  console.log(`Corsair MCP server running on http://localhost:${PORT}/mcp`);
});