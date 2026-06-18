import { db } from "@/server/db";
import { structuredWriteLog } from "@/server/db/schema";

export interface WriteLogEntry {
  tenantId: string;
  approvingUserId: string | null;
  operationPath: string;
  executedAt: string; // ISO 8601
  toolCallId: string;
  status: "executed" | "rejected" | "rate_limited";
  recipientAddress?: string; // gmail.api.messages.send
  eventTitle?: string; // googlecalendar.api.events.*
  eventStartTime?: string; // googlecalendar.api.events.*
}

/**
 * Appends an audit entry for a write operation attempt.
 * Non-blocking: failures are caught and logged to stderr without blocking the caller.
 */
export async function logWriteOperation(entry: WriteLogEntry): Promise<void> {
  try {
    await db.insert(structuredWriteLog).values({
      tenantId: entry.tenantId,
      approvingUserId: entry.approvingUserId,
      operationPath: entry.operationPath,
      executedAt: new Date(entry.executedAt),
      toolCallId: entry.toolCallId,
      status: entry.status,
      recipientAddress: entry.recipientAddress ?? null,
      eventTitle: entry.eventTitle ?? null,
      eventStartTime: entry.eventStartTime ?? null,
    });
  } catch (error) {
    console.error("[audit-logger] Failed to write structured log entry:", error, {
      tenantId: entry.tenantId,
      operationPath: entry.operationPath,
      toolCallId: entry.toolCallId,
      status: entry.status,
    });
  }
}
