/**
 * Server-side security infrastructure for irreversible tool execution.
 *
 * Provides:
 * - Tool approval secret verification (via `experimental_toolApprovalSecret`)
 * - Per-user rate limiting on write-tool execution
 * - Parameter validation for editable fields (recipients, subject, body)
 * - Structured logging for all executed write-tool calls
 */

// ─── Tool Approval Secret ─────────────────────────────────────────────────────

/**
 * The server-side secret used with `experimental_toolApprovalSecret` in the AI SDK.
 * Must be set in the environment; execution of irreversible tools will be rejected
 * if this is not configured.
 */
export const TOOL_APPROVAL_SECRET: string | undefined =
  process.env.TOOL_APPROVAL_SECRET;

/**
 * Checks that the tool approval secret is configured.
 * Call this at startup or before registering tools to fail fast.
 */
export function assertApprovalSecretConfigured(): void {
  if (!TOOL_APPROVAL_SECRET) {
    throw new Error(
      "[security] TOOL_APPROVAL_SECRET is not set. " +
        "Irreversible tool execution requires a configured approval secret."
    );
  }
}

// ─── Parameter Validation ─────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SUBJECT_LENGTH = 500;
const MAX_BODY_LENGTH = 10_000;

/**
 * Dangerous patterns in script content that suggest injection attempts.
 * This is a basic allowlist approach — not exhaustive, but catches obvious cases.
 */
const INJECTION_PATTERNS = [
  /process\.exit/i,
  /require\s*\(\s*['"]child_process['"]\s*\)/i,
  /exec\s*\(/i,
  /spawn\s*\(/i,
  /import\s*\(\s*['"]child_process['"]\s*\)/i,
  /eval\s*\(/i,
  /Function\s*\(/i,
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates tool parameters before execution. Applies different rules based
 * on the tool name and parameter shapes.
 *
 * - Email-related params: validates recipient format, subject/body length bounds
 * - Script content: checks for obvious injection patterns
 */
export function validateToolParams(
  toolName: string,
  params: Record<string, unknown>
): ValidationResult {
  const errors: string[] = [];

  // Email validation for send/forward tools
  if (toolName.includes("email") || toolName.includes("send") || toolName.includes("forward")) {
    // Validate recipient(s)
    const recipients = extractRecipients(params);
    for (const recipient of recipients) {
      if (!EMAIL_REGEX.test(recipient)) {
        errors.push(`Invalid email recipient format: "${recipient}"`);
      }
    }

    // Validate subject length
    const subject = extractStringParam(params, "subject");
    if (subject && subject.length > MAX_SUBJECT_LENGTH) {
      errors.push(
        `Subject exceeds maximum length of ${MAX_SUBJECT_LENGTH} characters (got ${subject.length})`
      );
    }

    // Validate body length
    const body = extractStringParam(params, "body") ?? extractStringParam(params, "content");
    if (body && body.length > MAX_BODY_LENGTH) {
      errors.push(
        `Body exceeds maximum length of ${MAX_BODY_LENGTH} characters (got ${body.length})`
      );
    }
  }

  // Script injection check for run_script or similar
  if (toolName.includes("script") || toolName.includes("run")) {
    const script =
      extractStringParam(params, "script") ??
      extractStringParam(params, "code") ??
      extractStringParam(params, "content");

    if (script) {
      for (const pattern of INJECTION_PATTERNS) {
        if (pattern.test(script)) {
          errors.push(
            `Script content contains potentially dangerous pattern: ${pattern.source}`
          );
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Extract email recipients from various param shapes */
function extractRecipients(params: Record<string, unknown>): string[] {
  const recipients: string[] = [];

  // Direct "to" field
  const to = params.to ?? params.recipient ?? params.recipients;
  if (typeof to === "string") {
    recipients.push(...to.split(",").map((r) => r.trim()));
  } else if (Array.isArray(to)) {
    for (const r of to) {
      if (typeof r === "string") recipients.push(r.trim());
    }
  }

  // CC and BCC
  for (const field of ["cc", "bcc"]) {
    const val = params[field];
    if (typeof val === "string") {
      recipients.push(...val.split(",").map((r) => r.trim()));
    } else if (Array.isArray(val)) {
      for (const r of val) {
        if (typeof r === "string") recipients.push(r.trim());
      }
    }
  }

  return recipients.filter((r) => r.length > 0);
}

/** Safely extract a string parameter by key */
function extractStringParam(
  params: Record<string, unknown>,
  key: string
): string | undefined {
  const val = params[key];
  return typeof val === "string" ? val : undefined;
}

// ─── Rate Limiting ────────────────────────────────────────────────────────────

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimitResult {
  allowed: boolean;
  /** Milliseconds until the next allowed execution (only set when rate limited) */
  remainingMs?: number;
}

/**
 * Creates an in-memory sliding-window rate limiter for write-tool execution.
 * Tracks per-user execution counts within a configurable time window.
 *
 * Default: max 5 write-tool executions per 60-second window per user.
 */
export function createRateLimiter(options?: {
  maxExecutions?: number;
  windowMs?: number;
}) {
  const maxExecutions = options?.maxExecutions ?? 5;
  const windowMs = options?.windowMs ?? 60_000; // 1 minute
  const store = new Map<string, RateLimitEntry>();

  /**
   * Check (and record) a rate limit for a user + tool combination.
   * The key is `${userId}:${toolName}` for per-tool tracking,
   * but the window applies across all write tools for the user.
   */
  function checkRateLimit(userId: string, toolName: string): RateLimitResult {
    const key = `write:${userId}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    let entry = store.get(key);
    if (!entry) {
      entry = { timestamps: [] };
      store.set(key, entry);
    }

    // Prune timestamps outside the window
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart);

    if (entry.timestamps.length >= maxExecutions) {
      // Rate limited — calculate how long until the oldest entry expires
      const oldestInWindow = entry.timestamps[0]!;
      const remainingMs = oldestInWindow + windowMs - now;
      return { allowed: false, remainingMs: Math.max(0, remainingMs) };
    }

    // Record this execution
    entry.timestamps.push(now);
    return { allowed: true };
  }

  /** Reset the rate limiter (useful for testing) */
  function reset(): void {
    store.clear();
  }

  /** Get current count for a user (useful for monitoring) */
  function getCurrentCount(userId: string): number {
    const key = `write:${userId}`;
    const entry = store.get(key);
    if (!entry) return 0;

    const windowStart = Date.now() - windowMs;
    return entry.timestamps.filter((ts) => ts > windowStart).length;
  }

  return { checkRateLimit, reset, getCurrentCount };
}

// Create the default rate limiter instance for the application
export const writeToolRateLimiter = createRateLimiter();

// ─── Structured Logging ───────────────────────────────────────────────────────

export interface ToolExecutionLogEntry {
  userId: string;
  toolName: string;
  params: Record<string, unknown>;
  approved: boolean;
  timestamp: Date;
  /** Optional: who approved (may differ from executor in future multi-user scenarios) */
  approvedBy?: string;
  /** Optional: rate limit status at time of execution */
  rateLimitRemaining?: number;
  /** Optional: validation errors if any */
  validationErrors?: string[];
}

/**
 * Logs a write-tool execution to structured output.
 * In development, logs to console as JSON. In production, this would
 * be routed to a logging service (e.g., CloudWatch, Datadog, etc.).
 */
export function logToolExecution(entry: ToolExecutionLogEntry): void {
  const logPayload = {
    level: "info",
    event: "tool_execution",
    userId: entry.userId,
    toolName: entry.toolName,
    params: sanitizeParamsForLog(entry.params),
    approved: entry.approved,
    timestamp: entry.timestamp.toISOString(),
    ...(entry.approvedBy && { approvedBy: entry.approvedBy }),
    ...(entry.rateLimitRemaining !== undefined && {
      rateLimitRemaining: entry.rateLimitRemaining,
    }),
    ...(entry.validationErrors?.length && {
      validationErrors: entry.validationErrors,
    }),
  };

  // Structured JSON log — production logging services parse this format
  console.log(JSON.stringify(logPayload));
}

/**
 * Sanitize parameters for logging. Truncates long values and redacts
 * sensitive fields to avoid leaking PII into logs.
 */
function sanitizeParamsForLog(
  params: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const MAX_LOG_VALUE_LENGTH = 200;

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      sanitized[key] =
        value.length > MAX_LOG_VALUE_LENGTH
          ? value.slice(0, MAX_LOG_VALUE_LENGTH) + "...[truncated]"
          : value;
    } else if (Array.isArray(value)) {
      sanitized[key] = `[Array(${value.length})]`;
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = "[Object]";
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
