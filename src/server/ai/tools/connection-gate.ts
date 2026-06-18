/**
 * Connection Gate — verifies plugin connectivity before executing
 * plugin-specific operations.
 *
 * Before a `run_script` call for a plugin-scoped operation path is executed,
 * this gate checks that the required plugin is actually connected for the
 * tenant. If not, it returns a structured result with a connect URL so the
 * AI model can surface it to the user.
 */

import { db } from "@/server/db";
import { corsairAccounts, corsairIntegrations } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConnectionGateResult {
  connected: boolean;
  pluginNotConnected?: string;
  connectUrl?: string;
}

// ─── Connection Check ─────────────────────────────────────────────────────────

/**
 * Check if the plugin required by an operation path is connected for the tenant.
 *
 * Currently supports:
 * - `googlecalendar.*` paths → verifies googlecalendar plugin is connected
 *
 * For operation paths that don't match a known plugin prefix, returns
 * `{ connected: true }` immediately without any DB call.
 */
export async function checkPluginConnection(
  tenantId: string,
  operationPath: string
): Promise<ConnectionGateResult> {
  // Only gate googlecalendar operations
  if (!operationPath.startsWith("googlecalendar.")) {
    return { connected: true };
  }

  // Check if the googlecalendar plugin is connected for this tenant
  const account = await db
    .select({ id: corsairAccounts.id })
    .from(corsairAccounts)
    .innerJoin(
      corsairIntegrations,
      eq(corsairAccounts.integrationId, corsairIntegrations.id)
    )
    .where(
      and(
        eq(corsairAccounts.tenantId, tenantId),
        eq(corsairIntegrations.name, "googlecalendar")
      )
    )
    .limit(1);

  if (account.length === 0) {
    return {
      connected: false,
      pluginNotConnected: "googlecalendar",
      connectUrl: "/api/connect?plugin=googlecalendar",
    };
  }

  return { connected: true };
}
