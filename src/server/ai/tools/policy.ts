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
 * Rules:
 * 1. Read-classified tools → never need approval (auto-execute)
 * 2. Write-classified tools → need approval UNLESS user has explicitly set "auto_run"
 * 3. Unknown/unclassified tools → always need approval (fail-safe)
 *
 * Note: Even if a write tool has "auto_run" trust mode, the server-side
 * `experimental_toolApprovalSecret` verification still applies for irreversible
 * tools (e.g., send_email). Trust mode only affects whether the user sees
 * the confirmation UI; the cryptographic verification is independent.
 */
export function resolveNeedsApproval(
  toolName: string,
  userToolSettings: UserToolSetting[]
): boolean {
  const classification = getToolClassification(toolName);

  // Read tools never need approval
  if (classification === "read") {
    return false;
  }

  // Write tools: check user's trust setting
  const userSetting = userToolSettings.find((s) => s.toolName === toolName);

  // If user has explicitly set auto_run for this write tool, skip approval UI
  if (userSetting?.trustMode === "auto_run") {
    return false;
  }

  // Default: write tools and unknown tools require approval
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
export const IRREVERSIBLE_TOOLS: Set<string> = new Set([
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
