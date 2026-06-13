// src/server/api/routers/calendar.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { calendarNotes } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const calendarRouter = createTRPCRouter({
  getDashboardData: protectedProcedure.query(async ({ ctx }) => {
    // 1. Fetch cached events from Corsair DB
    const cachedEvents = await ctx.tenant.googlecalendar.db.events.search({});

    // 2. Fetch local private notes
    const userNotes = await ctx.db.query.calendarNotes.findMany({
      where: eq(calendarNotes.userId, ctx.userId),
    });

    return {
      events: cachedEvents.map(event => ({
        id: event.entity_id,
        data: event.data, // Contains summary, start, end
        note: userNotes.find(n => n.eventId === event.entity_id)?.note || null
      })),
      stats: { todayCount: 0, hoursBlocked: 0 }
    };
  }),

  // Schedule new meeting via API
 createEvent: protectedProcedure
  .input(z.object({
    summary: z.string(),
    description: z.string().optional(),
    location: z.string().optional(),
    start: z.object({
      dateTime: z.string().optional(),
      date: z.string().optional(),       // for all-day events
      timeZone: z.string().optional(),
    }),
    end: z.object({
      dateTime: z.string().optional(),
      date: z.string().optional(),
      timeZone: z.string().optional(),
    }),
    attendees: z.array(z.object({
      email: z.string().email(),
      displayName: z.string().optional(),
      optional: z.boolean().optional(),
    })).optional(),
    calendarId: z.string().default('primary'),
  }))
  .mutation(async ({ ctx, input }) => {
    const { calendarId, ...event } = input;

    return await ctx.tenant.googlecalendar.api.events.create({
      calendarId,
      event,
    });
  }),

  saveNote: protectedProcedure
    .input(z.object({ eventId: z.string(), note: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(calendarNotes)
        .values({ userId: ctx.userId, eventId: input.eventId, note: input.note })
        .onConflictDoUpdate({ target: [calendarNotes.id], set: { note: input.note }});
    }),
});