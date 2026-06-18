import { db } from "@/server/db";
import { tenantMcpKeys } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { encrypt, decrypt } from "./encryption";
import { corsair } from "@/server/corsair";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface McpKeyResult {
  mcpHttpUrl: string;
  secret: string;
}

/**
 * Type definition for the Corsair MCP Keys API.
 * The `mcpKeys.create` method provisions a new MCP key for a tenant.
 * This is exposed via `corsair.withTenant(tenantId)` on corsair instances
 * with multiTenancy enabled.
 *
 * Note: This API may not be present in all corsair SDK versions. The cast
 * below ensures forward-compatibility with the documented provisioning flow.
 */
interface CorsairMcpKeysApi {
  mcpKeys: {
    create: (label: string) => Promise<{ mcpHttpUrl: string; secret: string }>;
  };
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PROVISIONING_TIMEOUT_MS = 30_000; // 30-second timeout for provisioning calls
const ENCRYPTION_KEY = process.env.TENANT_KEY_ENCRYPTION_KEY!;

// ---------------------------------------------------------------------------
// Concurrency Control
// ---------------------------------------------------------------------------

/**
 * In-memory lock map to serialise concurrent provisioning/rotation per tenant.
 * Each entry holds a Promise that resolves when the in-flight operation completes.
 * Subsequent callers for the same tenant await the existing Promise instead of
 * issuing a duplicate Corsair API call.
 */
const inflight = new Map<string, Promise<McpKeyResult>>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Wraps a promise with a timeout. Rejects with a descriptive error if the
 * promise does not resolve within `ms` milliseconds.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Provisioning timed out after ${ms}ms`)),
        ms,
      ),
    ),
  ]);
}

/**
 * Provisions a new MCP key via the Corsair API.
 * Uses `corsair.withTenant(tenantId).mcpKeys.create("clerio-sidebar")`.
 * Returns the one-time secret and stable HTTP URL.
 */
async function provisionKey(tenantId: string): Promise<McpKeyResult> {
  const tenant = corsair.withTenant(tenantId) as unknown as CorsairMcpKeysApi;
  const key = await withTimeout(
    tenant.mcpKeys.create("clerio-sidebar"),
    PROVISIONING_TIMEOUT_MS,
  );

  return {
    mcpHttpUrl: key.mcpHttpUrl,
    secret: key.secret,
  };
}

// ---------------------------------------------------------------------------
// getOrProvision
// ---------------------------------------------------------------------------

/**
 * Retrieves the existing MCP key for a tenant from the database (decrypting it),
 * or provisions a new one if none exists.
 *
 * Concurrent calls for the same tenant are serialised so that exactly one
 * provisioning call is made to the Corsair API.
 */
export async function getOrProvision(tenantId: string): Promise<McpKeyResult> {
  // Check for existing key in the database
  const existing = await db
    .select()
    .from(tenantMcpKeys)
    .where(eq(tenantMcpKeys.tenantId, tenantId))
    .limit(1);

  if (existing.length > 0 && existing[0]) {
    const row = existing[0];
    const secret = decrypt(row.encryptedSecret, ENCRYPTION_KEY);
    return { mcpHttpUrl: row.mcpHttpUrl, secret };
  }

  // No key exists — provision one, serialising concurrent callers
  const existingInflight = inflight.get(tenantId);
  if (existingInflight) {
    return existingInflight;
  }

  const provisionPromise = (async (): Promise<McpKeyResult> => {
    try {
      const result = await provisionKey(tenantId);

      // Encrypt and persist
      const encryptedSecret = encrypt(result.secret, ENCRYPTION_KEY);
      await db.insert(tenantMcpKeys).values({
        tenantId,
        encryptedSecret,
        mcpHttpUrl: result.mcpHttpUrl,
        keyLabel: "clerio-sidebar",
      });

      return result;
    } finally {
      inflight.delete(tenantId);
    }
  })();

  inflight.set(tenantId, provisionPromise);
  return provisionPromise;
}

// ---------------------------------------------------------------------------
// rotate
// ---------------------------------------------------------------------------

/**
 * Provisions a new MCP key and updates the stored credentials for a tenant.
 * Used when the existing key is invalidated (401/403 from Corsair).
 *
 * Concurrent rotation calls for the same tenant are serialised.
 * Logs the rotation event (tenant id, timestamp, outcome) without secrets.
 */
export async function rotate(tenantId: string): Promise<McpKeyResult> {
  const existingInflight = inflight.get(tenantId);
  if (existingInflight) {
    return existingInflight;
  }

  const rotatePromise = (async (): Promise<McpKeyResult> => {
    const timestamp = new Date().toISOString();
    try {
      const result = await provisionKey(tenantId);

      // Encrypt and upsert
      const encryptedSecret = encrypt(result.secret, ENCRYPTION_KEY);
      const existingRow = await db
        .select({ id: tenantMcpKeys.id })
        .from(tenantMcpKeys)
        .where(eq(tenantMcpKeys.tenantId, tenantId))
        .limit(1);

      if (existingRow.length > 0) {
        await db
          .update(tenantMcpKeys)
          .set({
            encryptedSecret,
            mcpHttpUrl: result.mcpHttpUrl,
            rotatedAt: new Date(),
          })
          .where(eq(tenantMcpKeys.tenantId, tenantId));
      } else {
        await db.insert(tenantMcpKeys).values({
          tenantId,
          encryptedSecret,
          mcpHttpUrl: result.mcpHttpUrl,
          keyLabel: "clerio-sidebar",
          rotatedAt: new Date(),
        });
      }

      // Log rotation event without secrets
      console.log(
        JSON.stringify({
          event: "mcp_key_rotation",
          tenantId,
          timestamp,
          outcome: "success",
        }),
      );

      return result;
    } catch (error) {
      // Log failure without secrets
      console.error(
        JSON.stringify({
          event: "mcp_key_rotation",
          tenantId,
          timestamp,
          outcome: "failure",
          error: error instanceof Error ? error.message : "Unknown error",
        }),
      );
      throw error;
    } finally {
      inflight.delete(tenantId);
    }
  })();

  inflight.set(tenantId, rotatePromise);
  return rotatePromise;
}

// ---------------------------------------------------------------------------
// Export as a service object for convenience
// ---------------------------------------------------------------------------

export const mcpKeyService = {
  getOrProvision,
  rotate,
};
