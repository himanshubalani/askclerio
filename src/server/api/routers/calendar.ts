import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { calendarNotes } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: string; 
  end: string;   
  note: string | null; 
}

export const calendarRouter = createTRPCRouter({
  getDashboardData: protectedProcedure.query(async ({ ctx }) => {
    try {
      // 1. Fetch cached events from Corsair DB
      let cachedEvents = await ctx.tenant.googlecalendar.db.events.search({ limit: 100 });

      // 2. If the cache is empty, do a live API fetch to seed the local DB
      if (cachedEvents.length === 0) {
        await ctx.tenant.googlecalendar.api.events.getMany({
          calendarId: "primary",
          timeMin: new Date().toISOString(),
          maxResults: 50,
          singleEvents: true,
          orderBy: "startTime",
        });
        
        // Re-fetch from the newly populated DB
        cachedEvents = await ctx.tenant.googlecalendar.db.events.search({ limit: 100 });
      }

      // 3. Fetch local private notes
      const userNotes = await ctx.db.query.calendarNotes.findMany({
        where: eq(calendarNotes.userId, ctx.userId),
      });

      return {
        events: cachedEvents.map((event) => {
          const data = event.data; 
          return {
            id: event.entity_id,
            summary: data.summary || "Untitled Event",
            start: data.start?.dateTime || data.start?.date || "",
            end: data.end?.dateTime || data.end?.date || "",
            note: userNotes.find(n => n.eventId === event.entity_id)?.note ?? null
          };
        }),
        stats: { todayCount: 0, hoursBlocked: 0 }
      };

    } catch (error: any) {
      const msg = String(error?.message || error);
      if (msg.includes("Account not found") || msg.includes("auth-missing")) {
        return { events: [], stats: { todayCount: 0, hoursBlocked: 0 } };
      }
      throw error;
    }
  }),

  // ... syncLatest, createEvent, saveNote remain exactly the same ...
  syncLatest: protectedProcedure.mutation(async ({ ctx }) => {
    const res = await ctx.tenant.googlecalendar.api.events.getMany({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });
    return { success: true, count: res.items?.length ?? 0 };
  }),

  // Schedule new meeting via API
 createEvent: protectedProcedure
  .input(z.object({
    summary: z.string(),
    description: z.string().optional(),
    location: z.string().optional(),
    start: z.object({
      dateTime: z.string().optional(),
      date: z.string().optional(),      
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