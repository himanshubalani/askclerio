import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { emailNotes } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";

// ─── Gmail API response shapes ────────────────────────────────────────────────
// Corsair returns `any` from API calls; these interfaces give us safety locally.

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailMessagePart {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailMessagePart[];
}

interface GmailMessageData {
  id: string;
  threadId?: string;
  labelIds?: string[];
  snippet?: string;
  payload?: { headers?: GmailHeader[] };
  internalDate?: string;
}

// Shape returned by threads.get — messages have full payload trees.
interface GmailThreadMessage {
  id: string;
  snippet?: string;
  internalDate?: string;
  labelIds?: string[];
  payload?: GmailMessagePart & { headers?: GmailHeader[] };
}

interface GmailThread {
  id: string;
  messages?: GmailThreadMessage[];
}

interface GmailListMessage {
  id: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function decodeHtmlEntities(text: string): string {
  if (!text) return "";
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([a-fA-F0-9]+);/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}

// Minimal server-side HTML sanitizer: removes script/style/iframe/object/embed
// tags, strips event handler attributes (on*) and javascript: URLs in src/href.
function sanitizeHtml(html: string): string {
  if (!html) return "";
  html = html.replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  html = html.replace(/<!--([\s\S]*?)-->/g, "");
  html = html.replace(/\s+on[a-zA-Z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  html = html.replace(/(href|src)\s*=\s*("|')?\s*(javascript:|data:)[^"' >]*/gi, "");
  html = html.replace(/<\s*(iframe|object|embed|link|meta)[^>]*\/?>/gi, "");
  return html;
}

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function extractBody(part: GmailMessagePart): string {
  if (part.body?.data) {
    return decodeBase64Url(part.body.data);
  }
  if (part.parts) {
    let htmlBody = "";
    let textBody = "";
    for (const p of part.parts) {
      if (p.mimeType === "text/html") htmlBody = extractBody(p);
      else if (p.mimeType === "text/plain") textBody = extractBody(p);
      else if (p.parts) {
        const nested = extractBody(p);
        if (nested) return nested;
      }
    }
    return htmlBody || textBody;
  }
  return "";
}

function getMessageTimestamp(msg: { data: GmailMessageData }): number {
  const data = msg.data;
  if (data.internalDate) return parseInt(data.internalDate, 10) || 0;
  const dateHeader = (data.payload?.headers ?? []).find(
    (h) => h.name.toLowerCase() === "date"
  )?.value;
  return dateHeader ? new Date(dateHeader).getTime() || 0 : 0;
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const gmailRouter = createTRPCRouter({
  // Reads exclusively from the Corsair DB cache — fast, no live API call.
  // Call syncLatest first to populate/refresh the cache.
  getDashboardData: protectedProcedure
    .input(z.object({ labelId: z.string().default("INBOX") }).optional())
    .query(async ({ ctx, input }) => {
      const labelFilter = input?.labelId ?? "INBOX";
      try {
        const cachedMessages = await ctx.tenant.gmail.db.messages.search({ limit: 1000 });
        const userNotes = await ctx.db.query.emailNotes.findMany({
          where: eq(emailNotes.userId, ctx.userId),
        });

        const threadGroups = new Map<string, typeof cachedMessages>();

        for (const msg of cachedMessages) {
          const data = msg.data as GmailMessageData;
          if (!data.threadId) continue;
          const group = threadGroups.get(data.threadId);
          if (group) {
            group.push(msg);
          } else {
            threadGroups.set(data.threadId, [msg]);
          }
        }

        const threads = Array.from(threadGroups.values()).flatMap((msgs) => {
          // msgs is guaranteed non-empty (we only push into groups that exist)
          const first = msgs[0];
          if (!first) return [];

          const latestMessage = msgs.reduce((latest, current) =>
            getMessageTimestamp(current) > getMessageTimestamp(latest) ? current : latest,
            first
          );

          const latestData = latestMessage.data as GmailMessageData;
          const headers = latestData.payload?.headers ?? [];

          const getHeaderVal = (name: string) =>
            headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

          const rawFrom = getHeaderVal("From");
          const rawSubject = getHeaderVal("Subject");
          const subject = rawSubject !== "" ? decodeHtmlEntities(rawSubject) : "No Subject";
          const rawSenderName = rawFrom.split("<")[0]?.trim().replace(/"/g, "") ?? rawFrom;
          const senderName = rawSenderName !== "" ? decodeHtmlEntities(rawSenderName) : "Unknown Sender";

          const threadId = latestData.threadId;
          if (!threadId) return [];
          const threadNote = userNotes.find((n) => n.threadId === threadId)?.note ?? null;

          const dateHeader = getHeaderVal("Date");
          const fallbackDate = latestData.internalDate
            ? new Date(parseInt(latestData.internalDate, 10)).toISOString()
            : "";
          const finalDate = dateHeader !== "" ? dateHeader : fallbackDate;
          const sortTimestamp = latestData.internalDate
            ? parseInt(latestData.internalDate, 10)
            : new Date(finalDate).getTime() || 0;

          const mergedLabels = Array.from(
            new Set(
              msgs.flatMap((m) => {
                const msgData = m.data as GmailMessageData;
                return msgData.labelIds ?? [];
              })
            )
          );

          return [{ id: threadId, subject, sender: senderName, snippet: decodeHtmlEntities(latestData.snippet ?? ""), date: finalDate, timestamp: sortTimestamp, labels: mergedLabels, note: threadNote }];
        });

        const filteredThreads = threads.filter((t) => t.labels.includes(labelFilter));
        filteredThreads.sort((a, b) => b.timestamp - a.timestamp);

        return { needsAuth: false, threads: filteredThreads, labels: [], stats: { unread: 0, today: 0 } };
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes("Account not found") || msg.includes("auth-missing")) {
          return { needsAuth: true, threads: [], labels: [], stats: { unread: 0, today: 0 } };
        }
        throw error;
      }
    }),

  // Mirrors calendar.syncLatest: hits the live API per-message so Corsair
  // intercepts each call and upserts it into the DB automatically.
  syncLatest: protectedProcedure
    .input(z.object({ labelId: z.string().default("INBOX") }).optional())
    .mutation(async ({ ctx, input }) => {
      const labelFilter = input?.labelId ?? "INBOX";
      const res = await ctx.tenant.gmail.api.messages.list({
        maxResults: 15,
        labelIds: [labelFilter],
      }) as { messages?: GmailListMessage[] };
      if (res.messages) {
        await Promise.all(
          res.messages.map((m) => ctx.tenant.gmail.api.messages.get({ id: m.id }))
        );
      }
      return { success: true };
    }),

  getEmails: protectedProcedure.query(async ({ ctx }) => {
    try {
      const fetchMessages = await ctx.tenant.gmail.api.messages.list({ maxResults: 50 }) as { messages?: GmailListMessage[] };
      return { messages: fetchMessages.messages ?? [] };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("Account not found") || msg.includes("auth-missing")) {
        return { messages: [] };
      }
      throw error;
    }
  }),

  getThread: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const res = await ctx.tenant.gmail.api.threads.get({ id: input.threadId }) as GmailThread;
        if (!res.messages) return null;

        const messages = res.messages.map((msg) => {
          const headers = msg.payload?.headers ?? [];
          const getHeaderVal = (name: string) =>
            headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

          const from = getHeaderVal("From");
          const to = getHeaderVal("To");
          const subject = getHeaderVal("Subject");
          const date = getHeaderVal("Date");
          const bodyStr = msg.payload ? extractBody(msg.payload) : "";

          return {
            id: msg.id,
            snippet: decodeHtmlEntities(msg.snippet ?? ""),
            from: decodeHtmlEntities(from),
            to,
            subject: subject ? decodeHtmlEntities(subject) : "No Subject",
            date: date || (msg.internalDate ? new Date(parseInt(msg.internalDate, 10)).toISOString() : ""),
            body: sanitizeHtml(bodyStr),
          };
        });

        // Collect labels from all messages so callers can derive read/unread state
        const allLabels = Array.from(
          new Set(res.messages.flatMap((m) => m.labelIds ?? []))
        );

        return {
          id: res.id,
          subject: messages[0]?.subject ?? "No Subject",
          labels: allLabels,
          messages,
        };
      } catch (error) {
        console.error("Failed to fetch thread:", error);
        throw error;
      }
    }),

  trashThread: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.tenant.gmail.api.threads.trash({ id: input.threadId });
    }),

  getLabels: protectedProcedure.query(async ({ ctx }) => {
    try {
      const res = await ctx.tenant.gmail.api.labels.list({}) as { labels?: {
        type: string; id: string; name: string 
}[] };
      return res.labels ?? [];
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes("Account not found") || msg.includes("auth-missing")) return [];
      throw error;
    }
  }),

  archiveThread: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.tenant.gmail.api.threads.modify({
        id: input.threadId,
        removeLabelIds: ["INBOX"],
      });
    }),

  saveNote: protectedProcedure
    .input(z.object({ threadId: z.string(), note: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.emailNotes.findMany({
        where: and(eq(emailNotes.userId, ctx.userId), eq(emailNotes.threadId, input.threadId)),
        limit: 1,
      });

      if (existing.length > 0 && existing[0]) {
        await ctx.db
          .update(emailNotes)
          .set({ note: input.note, updatedAt: new Date() })
          .where(eq(emailNotes.id, existing[0].id));
      } else {
        await ctx.db
          .insert(emailNotes)
          .values({ userId: ctx.userId, threadId: input.threadId, note: input.note });
      }
    }),

  // Strips only the UNREAD label — does NOT touch INBOX.
  markRead: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.tenant.gmail.api.threads.modify({
        id: input.threadId,
        removeLabelIds: ["UNREAD"],
      });
      try {
        const threadRes = await ctx.tenant.gmail.api.threads.get({ id: input.threadId }) as GmailThread;
        if (threadRes.messages) {
          await Promise.all(
            threadRes.messages.map((m) => ctx.tenant.gmail.api.messages.get({ id: m.id }))
          );
        }
      } catch (err) {
        console.error("Failed to refresh message cache after markRead:", err);
      }
    }),

  // Adds the UNREAD label back.
  markUnread: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.tenant.gmail.api.threads.modify({
        id: input.threadId,
        addLabelIds: ["UNREAD"],
      });
      try {
        const threadRes = await ctx.tenant.gmail.api.threads.get({ id: input.threadId }) as GmailThread;
        if (threadRes.messages) {
          await Promise.all(
            threadRes.messages.map((m) => ctx.tenant.gmail.api.messages.get({ id: m.id }))
          );
        }
      } catch (err) {
        console.error("Failed to refresh message cache after markUnread:", err);
      }
    }),
});