/**
 * Sliding-window rate limiter for write operations.
 *
 * Enforces a maximum of 10 write-classified `run_script` executions per user
 * within a rolling 60-second window. The caller is responsible for checking
 * if the operationPath is in WRITE_OPERATION_ALLOWLIST before calling check().
 *
 * Implementation: In-memory sliding window using a Map<userId, timestamp[]>.
 * Entries older than 60 seconds are pruned on each check.
 *
 * Fail-closed: If the store is unavailable (throws), all writes are blocked
 * with retryAfterSeconds: 60.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  current: number;
  retryAfterSeconds: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WINDOW_MS = 60_000; // 60 seconds
const MAX_WRITES_PER_WINDOW = 10;

// ─── Implementation ───────────────────────────────────────────────────────────

export class WriteRateLimiter {
  private store: Map<string, number[]>;

  constructor() {
    this.store = new Map<string, number[]>();
  }

  /**
   * Check whether a user is allowed to execute a write operation.
   * If allowed, increments the counter. If not, returns rejection info.
   *
   * The caller MUST verify the operation is in WRITE_OPERATION_ALLOWLIST
   * before calling this method.
   */
  check(userId: string): RateLimitResult {
    try {
      const now = Date.now();

      // Get user's timestamps array (or empty array)
      const timestamps = this.store.get(userId) ?? [];

      // Prune entries older than 60 seconds
      const pruned = timestamps.filter((ts) => ts > now - WINDOW_MS);

      // Check if over limit
      if (pruned.length >= MAX_WRITES_PER_WINDOW) {
        // Calculate retryAfterSeconds: time until the oldest entry exits the window
        const oldestTimestamp = pruned[0]!;
        const retryAfterSeconds = Math.ceil(
          (oldestTimestamp + WINDOW_MS - now) / 1000
        );

        // Store pruned array back (housekeeping)
        this.store.set(userId, pruned);

        return {
          allowed: false,
          limit: MAX_WRITES_PER_WINDOW,
          current: pruned.length,
          retryAfterSeconds,
        };
      }

      // Allowed: push current timestamp and store back
      pruned.push(now);
      this.store.set(userId, pruned);

      return {
        allowed: true,
        limit: MAX_WRITES_PER_WINDOW,
        current: pruned.length,
        retryAfterSeconds: 0,
      };
    } catch {
      // Fail-closed: if store is unavailable, block all writes
      return {
        allowed: false,
        limit: MAX_WRITES_PER_WINDOW,
        current: 0,
        retryAfterSeconds: 60,
      };
    }
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────────

export const writeRateLimiter = new WriteRateLimiter();
