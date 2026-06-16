import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { emailNotes } from "@/server/db/schema";
import { eq } from "drizzle-orm";

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailMessageData {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  payload?: { headers?: GmailHeader[] };
  internalDate?: string;
}

export const gmailRouter = createTRPCRouter({
  getDashboardData: protectedProcedure.query(async ({ ctx }) => {
    try {
      // 1. Fetch live IDs directly from the API, bypassing the local DB entirely
      const listRes = await ctx.tenant.gmail.api.messages.list({ maxResults: 50 });
      const messageStubs = listRes.messages ?? [];

      // 2. Fetch the full payload for each message ID directly from the API
      // Note: We use Promise.all to fetch them concurrently so it doesn't take forever
      const liveMessages = await Promise.all(
        messageStubs.map((m: any) => 
          ctx.tenant.gmail.api.messages.get({ id: m.id })
        )
      );

      // 3. Fetch user notes from your DB
      const userNotes = await ctx.db.query.emailNotes.findMany({
        where: eq(emailNotes.userId, ctx.userId),
      });

      // 4. Map the live API data into threads
      const threadMap = new Map<string, any>();
      for (const msg of liveMessages) {
        // Depending on your API wrapper, the response might be nested under `.data` or returned directly.
        const data = (msg as any).data ?? msg; 
        
        if (data.threadId && !threadMap.has(data.threadId)) {
          threadMap.set(data.threadId, data);
        }
      }

      const recentThreads = Array.from(threadMap.values()).slice(0, 50);

      const threads = recentThreads.map((data) => {
        const headers = data.payload?.headers ?? [];

        const getHeaderVal = (name: string) => 
          headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

        const rawFrom = getHeaderVal("From");
        const rawSubject = getHeaderVal("Subject");
        const subject = rawSubject !== "" ? rawSubject : "No Subject";
        
        const rawSenderName = rawFrom.split("<")[0]?.trim().replace(/"/g, "") ?? rawFrom;
        const senderName = rawSenderName !== "" ? rawSenderName : "Unknown Sender";

        const threadNote = userNotes.find((n) => n.threadId === data.threadId)?.note ?? null;
        const dateHeader = getHeaderVal("Date");
        const fallbackDate = data.internalDate ? new Date(parseInt(data.internalDate)).toISOString() : "";

        return {
          id: data.threadId, 
          subject,
          sender: senderName,
          snippet: data.snippet ?? "",
          date: dateHeader !== "" ? dateHeader : fallbackDate,
          labels: data.labelIds ?? [],
          note: threadNote,
        };
      });

      return { needsAuth: false, threads, stats: { unread: 0, today: 0 } };
      
    } catch (error: any) {
      const msg = String(error?.message || error);
      if (msg.includes("Account not found") || msg.includes("auth-missing")) {
        return { needsAuth: true, threads: [], stats: { unread: 0, today: 0 } };
      }
      throw error;
    }
  }),

  syncLatest: protectedProcedure.mutation(async ({ ctx }) => {
    const res = await ctx.tenant.gmail.api.messages.list({ maxResults: 15 });
    if (res.messages) {
      await Promise.all(
        res.messages.map((m: any) => 
          ctx.tenant.gmail.api.messages.get({ id: m.id })
        )
      );
    }
    return { success: true };
  }),

  getEmails: protectedProcedure.query(async ({ ctx }) => {
    try {
      const fetchMessages = await ctx.tenant.gmail.api.messages.list({ maxResults: 50 });
      return { messages: fetchMessages.messages ?? [] };
    } catch (error: any) {
      const msg = String(error?.message || error);
      if (msg.includes("Account not found") || msg.includes("auth-missing")) {
        return { messages: [] };
      }
    throw error;
    }
  }),
  
  getLabels: protectedProcedure.query(async ({ ctx }) => {
    try {
      const res = await ctx.tenant.gmail.api.labels.list({});
      return res.labels ?? [];
    } catch (error: any) {
      const msg = String(error?.message || error);
      // Gracefully return empty labels if auth is missing or account not found
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
      await ctx.db.insert(emailNotes)
        .values({ userId: ctx.userId, threadId: input.threadId, note: input.note })
        .onConflictDoUpdate({ target: [emailNotes.id], set: { note: input.note } });
    }),
});