// src/server/api/routers/gmail.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { emailNotes } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const gmailRouter = createTRPCRouter({
  getDashboardData: protectedProcedure.query(async ({ ctx }) => {
    // 1. Fetch cached threads from Corsair DB (No API call)
    const cachedThreads = await ctx.tenant.gmail.db.threads.search({});

    // 2. Fetch local private notes
    const userNotes = await ctx.db.query.emailNotes.findMany({
      where: eq(emailNotes.userId, ctx.userId),
    });

    return {
      threads: cachedThreads.map(thread => ({
        id: thread.entity_id,
        data: thread.data, // Contains sender, subject, snippet, labels
        note: userNotes.find(n => n.threadId === thread.entity_id)?.note || null
      })),
      stats: { unread: 0, today: 0 } // Calculate from cachedThreads.data
    };
  }),

  // Quick action: Archive via API (updates cache automatically)
  archiveThread: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // API call writes to Gmail AND updates Corsair's local db row
      return await ctx.tenant.gmail.api.threads.modify({
        id: input.threadId,
        removeLabelIds: ['INBOX']
      });
    }),

  // Save private note locally (Not synced to Gmail)
  saveNote: protectedProcedure
    .input(z.object({ threadId: z.string(), note: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(emailNotes)
        .values({ userId: ctx.userId, threadId: input.threadId, note: input.note })
        .onConflictDoUpdate({ target: [emailNotes.id], set: { note: input.note }}); // Adjust conflict target as needed
    }),
});