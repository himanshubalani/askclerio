import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { getToolClassification } from "@/server/ai/tools/policy";
import {
  chatConversations,
  chatMessages,
  chatToolCalls,
  chatToolSettings,
} from "@/server/db/schema";
import { eq, and, desc, lt } from "drizzle-orm";

export const chatRouter = createTRPCRouter({
  // ─── Conversations ──────────────────────────────────────────────────────────

  getConversations: protectedProcedure
    .input(
      z.object({
        cursor: z.string().optional(),
        limit: z.number().min(1).max(100).default(25),
      })
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit } = input;

      const conditions = [eq(chatConversations.userId, ctx.userId)];
      if (cursor) {
        // Cursor-based: fetch conversations created before the cursor item
        const cursorRow = await ctx.db
          .select({ createdAt: chatConversations.createdAt })
          .from(chatConversations)
          .where(eq(chatConversations.id, cursor))
          .limit(1);

        if (cursorRow[0]) {
          conditions.push(lt(chatConversations.createdAt, cursorRow[0].createdAt));
        }
      }

      const items = await ctx.db
        .select()
        .from(chatConversations)
        .where(and(...conditions))
        .orderBy(desc(chatConversations.createdAt))
        .limit(limit + 1);

      let nextCursor: string | undefined;
      if (items.length > limit) {
        const nextItem = items.pop()!;
        nextCursor = nextItem.id;
      }

      return { items, nextCursor };
    }),

  getConversation: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const conversation = await ctx.db
        .select()
        .from(chatConversations)
        .where(
          and(
            eq(chatConversations.id, input.id),
            eq(chatConversations.userId, ctx.userId)
          )
        )
        .limit(1);

      if (!conversation[0]) {
        return null;
      }

      const messages = await ctx.db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, input.id))
        .orderBy(chatMessages.createdAt);

      const toolCalls = await ctx.db
        .select()
        .from(chatToolCalls)
        .where(eq(chatToolCalls.conversationId, input.id))
        .orderBy(chatToolCalls.createdAt);

      return {
        ...conversation[0],
        messages,
        toolCalls,
      };
    }),

  createConversation: protectedProcedure
    .input(z.object({ title: z.string().min(1).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(chatConversations)
        .values({
          userId: ctx.userId,
          title: input.title,
        })
        .returning();

      return result[0]!;
    }),

  // ─── Messages ─────────────────────────────────────────────────────────────

  saveMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        role: z.enum(["user", "assistant", "system", "tool"]),
        content: z.string(),
        toolCalls: z.unknown().optional(),
        toolResults: z.unknown().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(chatMessages)
        .values({
          conversationId: input.conversationId,
          role: input.role,
          content: input.content,
          toolCalls: input.toolCalls ?? null,
          toolResults: input.toolResults ?? null,
        })
        .returning();

      return result[0]!;
    }),

  // ─── Tool Settings ──────────────────────────────────────────────────────────

  getToolSettings: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(chatToolSettings)
      .where(eq(chatToolSettings.userId, ctx.userId));
  }),

  updateToolSetting: protectedProcedure
    .input(
      z.object({
        toolName: z.string().min(1),
        trustMode: z.enum(["ask_every_time", "auto_run"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Server-side validation: prevent write tools being set to `auto_run`.
      // The client already disables this option in the UI, but we must
      // enforce it on the server to prevent bypass via direct API calls.
      const classification = getToolClassification(input.toolName);
      if (classification === "write" && input.trustMode === "auto_run") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Write tools cannot be set to auto_run",
        });
      }
      // Check if setting already exists for this user + toolName
      const existing = await ctx.db
        .select()
        .from(chatToolSettings)
        .where(
          and(
            eq(chatToolSettings.userId, ctx.userId),
            eq(chatToolSettings.toolName, input.toolName)
          )
        )
        .limit(1);

      if (existing[0]) {
        // Update existing setting
        const updated = await ctx.db
          .update(chatToolSettings)
          .set({
            trustMode: input.trustMode,
            updatedAt: new Date(),
          })
          .where(eq(chatToolSettings.id, existing[0].id))
          .returning();

        return updated[0]!;
      }

      // Insert new setting
      const inserted = await ctx.db
        .insert(chatToolSettings)
        .values({
          userId: ctx.userId,
          toolName: input.toolName,
          trustMode: input.trustMode,
        })
        .returning();

      return inserted[0]!;
    }),

  // ─── Tool Call Audit ────────────────────────────────────────────────────────

  recordToolCall: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        conversationId: z.string(),
        toolName: z.string(),
        toolCallId: z.string(),
        parameters: z.record(z.string(), z.unknown()).default({}),
        editedParameters: z.record(z.string(), z.unknown()).optional(),
        status: z
          .enum([
            "draft",
            "awaiting_confirmation",
            "running",
            "done",
            "cancelled",
            "failed",
          ])
          .default("draft"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(chatToolCalls)
        .values({
          messageId: input.messageId,
          conversationId: input.conversationId,
          toolName: input.toolName,
          toolCallId: input.toolCallId,
          parameters: input.parameters,
          editedParameters: input.editedParameters ?? null,
          status: input.status,
        })
        .returning();

      return result[0]!;
    }),

  updateToolCallStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum([
          "draft",
          "awaiting_confirmation",
          "running",
          "done",
          "cancelled",
          "failed",
        ]),
        result: z.unknown().optional(),
        errorMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, unknown> = {
        status: input.status,
      };

      if (input.result !== undefined) {
        updateData.result = input.result;
      }

      if (input.errorMessage !== undefined) {
        updateData.errorMessage = input.errorMessage;
      }

      // Set timestamps based on status
      if (input.status === "running") {
        updateData.startedAt = new Date();
      } else if (input.status === "done" || input.status === "failed") {
        updateData.completedAt = new Date();
      }

      const updated = await ctx.db
        .update(chatToolCalls)
        .set(updateData)
        .where(eq(chatToolCalls.id, input.id))
        .returning();

      return updated[0] ?? null;
    }),
});
