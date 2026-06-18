/**
 * Server-side tool classification and approval policy.
 *
 * This is the single source of truth for which tools are "read" vs "write",
 * and whether a given tool needs user approval before execution.
 *
 * The same classification map is used by:
 * - The server (to set `needsApproval` on tool definitions)
 * - The client (to render appropriate UI states on ToolCallCards)
 */

// ─── Tool Classification ──────────────────────────────────────────────────────

/**
 * Static classification map for known Corsair MCP tools.
 * - "read": tool performs read-only operations (search, list, summarize)
 * - "write": tool performs mutations or reaches external parties (send email, create event, delete)
 */
export const TOOL_CLASSIFICATION: Record<string, "read" | "write"> = {
  // Corsair MCP tools
  run_script: "write", // Can execute arbitrary operations including sends/deletes
  get_schema: "read", // Only reads API schema definitions
  list_operations: "read", // Only lists available API operations
  corsair_setup: "write", // Modifies integration setup/configuration

  // Future tools can be added here as they become available
  // search_emails: 'read',
  // send_email: 'write',
  // create_event: 'write',
  // get_calendar: 'read',
};

/**
 * Returns the classification for a given tool name.
 * Unknown tools default to "write" (fail-safe per Requirement 8.3).
 */
export function getToolClassification(toolName: string): "read" | "write" {
  return TOOL_CLASSIFICATION[toolName] ?? "write";
}

// ─── Approval Resolution ──────────────────────────────────────────────────────

export interface UserToolSetting {
  toolName: string;
  trustMode: "ask_every_time" | "auto_run";
}

/**
 * Determines whether a tool invocation requires user approval before execution.
 *
 * Rules (operation-path-based for run_script):
 * 1. `get_schema` and `list_operations` → never need approval (read-only, no side effects)
 * 2. `corsair_setup` → always needs approval (modifies integration configuration)
 * 3. `run_script` with parseable input → return `isWriteOperation(extractOperationPath(input))`
 * 4. `run_script` with null/unparseable input → return `true` (safe fallback)
 * 5. Unknown tool names → return `true` (safe fallback)
 * 6. User trust mode "auto_run" override still applies for write-classified operations
 *
 * Note: Even if a write tool has "auto_run" trust mode, the server-side
 * `experimental_toolApprovalSecret` verification still applies for irreversible
 * tools (e.g., send_email). Trust mode only affects whether the user sees
 * the confirmation UI; the cryptographic verification is independent.
 */
export function resolveNeedsApproval(
  toolName: string,
  userToolSettings: UserToolSetting[],
  toolInput?: unknown
): boolean {
  // Read-only tools: never need approval
  if (toolName === "get_schema" || toolName === "list_operations") {
    return false;
  }

  // corsair_setup: always needs approval (modifies configuration)
  if (toolName === "corsair_setup") {
    return true;
  }

  // run_script: inspect operation path from tool input
  if (toolName === "run_script") {
    const opPath = extractOperationPath(toolInput);

    // If we can't determine the operation path, fail-safe: require approval
    if (opPath === null) {
      return true;
    }

    const needsApproval = isWriteOperation(opPath);

    // If it's a write operation, check user trust mode override
    if (needsApproval) {
      const userSetting = userToolSettings.find((s) => s.toolName === toolName);
      if (userSetting?.trustMode === "auto_run") {
        return false;
      }
    }

    return needsApproval;
  }

  // Unknown tool names: safe fallback requires approval
  return true;
}

// ─── Irreversible Tool Registry ───────────────────────────────────────────────

/**
 * Tools that have irreversible external effects and MUST be protected by
 * `experimental_toolApprovalSecret` regardless of user trust settings.
 *
 * These tools require:
 * 1. Server-side signed approval token verification
 * 2. Rate limiting
 * 3. Structured audit logging
 *
 * Even if a user sets "auto_run", the server-side verification still applies
 * (the SDK handles this transparently via the secret).
 */
export const IRREVERSIBLE_TOOLS = new Set<string>([
  "run_script", // Can send emails, delete data, modify external systems
  // Future additions as specific tools are exposed:
  // 'send_email',
  // 'forward_email',
  // 'delete_email',
  // 'share_document',
]);

/**
 * Returns whether a tool requires the additional server-side approval secret
 * verification (beyond just the client-side approval UI).
 */
export function requiresSignedApproval(toolName: string): boolean {
  return IRREVERSIBLE_TOOLS.has(toolName);
}

// ─── Operation-Path Inspection ────────────────────────────────────────────────

/**
 * The explicit set of write operation paths.
 * Only `run_script` invocations whose operation path appears here are classified
 * as write operations requiring user approval.
 */
export const WRITE_OPERATION_ALLOWLIST: ReadonlySet<string> = new Set([
  "gmail.api.messages.send",
  "googlecalendar.api.events.insert",
  "googlecalendar.api.events.update",
]);

/**
 * Extracts the operation path from a `run_script` tool input object.
 * Returns the operation path string if the input is a valid object with a
 * string-valued `operationPath` field; otherwise returns null.
 *
 * // Schema verified: 2025-06-18
 */
export function extractOperationPath(input: unknown): string | null {
  if (input == null || typeof input !== "object") {
    return null;
  }

  const record = input as Record<string, unknown>;

  if (typeof record.operationPath === "string" && record.operationPath.length > 0) {
    return record.operationPath;
  }

  return null;
}

/**
 * Returns true if the given operation path is classified as a write operation
 * (i.e. it exists in the WRITE_OPERATION_ALLOWLIST).
 */
export function isWriteOperation(opPath: string): boolean {
  return WRITE_OPERATION_ALLOWLIST.has(opPath);
}
