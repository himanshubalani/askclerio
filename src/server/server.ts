import express from 'express';
import { createBaseMcpServer, createMcpRouter } from '@corsair-dev/mcp';
import { corsair } from './corsair';

const app = express();
app.use(express.json());

// The MCP server needs a tenant-scoped corsair client so that `run_script`
// code can call `corsair.gmail.api.messages.send(...)` directly without
// needing to call `.withTenant(id)` first.
//
// We extract the tenant ID from the `x-tenant-id` header (sent by /api/chat)
// and create a per-tenant MCP server with the scoped client.
let currentTenantId: string | undefined;

app.use('/mcp', (req, _res, next) => {
  currentTenantId = req.headers['x-tenant-id'] as string | undefined;
  next();
});

app.use('/mcp', createMcpRouter(() => {
  const tenantId = currentTenantId ?? 'default';
  const scopedCorsair = corsair.withTenant(tenantId);
  return createBaseMcpServer({ corsair: scopedCorsair, tenantId });
}));

app.listen(3001, () => console.log('MCP server running on :3001'));