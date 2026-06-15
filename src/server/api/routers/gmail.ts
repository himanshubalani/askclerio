// src/server/api/routers/gmail.ts
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
      const cachedMessages = await ctx.tenant.gmail.db.messages.search({ limit: 100 });
      const userNotes = await ctx.db.query.emailNotes.findMany({
        where: eq(emailNotes.userId, ctx.userId),
      });

      const threadMap = new Map<string, typeof cachedMessages[0]>();
      for (const msg of cachedMessages) {
        const data = msg.data as GmailMessageData;
        if (data.threadId && !threadMap.has(data.threadId)) {
          threadMap.set(data.threadId, msg);
        }
      }

      const recentThreads = Array.from(threadMap.values()).slice(0, 50);

      const threads = recentThreads.map((msg) => {
        const data = msg.data as GmailMessageData;
        const headers = data.payload?.headers ?? [];

        const getHeaderVal = (name: string) => 
          headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";

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
      
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("Account not found")) {
        return { needsAuth: true, threads: [], stats: { unread: 0, today: 0 } };
      }
      throw error;
    }
  }),

  // Force a live fetch from Gmail. Corsair intercepts this API call and 
  // automatically saves the full message payloads into your database!
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
  
  getLabels: protectedProcedure.query(async ({ ctx }) => {
    try {
      const res = await ctx.tenant.gmail.api.labels.list({});
      return res.labels ?? [];
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("Account not found")) return [];
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