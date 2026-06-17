// src/server/api/routers/calendar.ts
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
  // Reads exclusively from the Corsair DB cache — fast, no live API call.
  // Call syncLatest first to populate/refresh the cache.
  getDashboardData: protectedProcedure.query(async ({ ctx }) => {
    try {
      const cachedEvents = await ctx.tenant.googlecalendar.db.events.search({ limit: 500 });

      const userNotes = await ctx.db.query.calendarNotes.findMany({
        where: eq(calendarNotes.userId, ctx.userId),
      });

      const events = cachedEvents.map((event) => {
        const data = event.data;
        return {
          id: event.entity_id,
          summary: (data.summary as string) || "Untitled Event",
          start: (data.start as any)?.dateTime || (data.start as any)?.date || "",
          end: (data.end as any)?.dateTime || (data.end as any)?.date || "",
          note: userNotes.find((n) => n.eventId === event.entity_id)?.note ?? null,
        };
      });

      // Only upcoming events, sorted ascending
      const now = new Date();
      const upcomingEvents = events
        .filter((e) => e.start && new Date(e.start) >= new Date(now.toDateString()))
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

      const today = now.toDateString();
      const todayEvents = upcomingEvents.filter(
        (e) => e.start && new Date(e.start).toDateString() === today
      );
      const hoursBlocked = todayEvents.reduce((sum, e) => {
        if (!e.start || !e.end) return sum;
        const ms = new Date(e.end).getTime() - new Date(e.start).getTime();
        return sum + (ms > 0 ? ms / 3_600_000 : 0);
      }, 0);

      return {
        needsSync: cachedEvents.length === 0,
        events: upcomingEvents,
        stats: {
          todayCount: todayEvents.length,
          hoursBlocked: Math.round(hoursBlocked * 10) / 10,
        },
      };
    } catch (error: any) {
      const msg = String(error?.message || error);
      if (msg.includes("Account not found") || msg.includes("auth-missing")) {
        // Return needsAuth so the UI prompts the connection flow
        return { needsAuth: true, needsSync: true, events: [], stats: { todayCount: 0, hoursBlocked: 0 } };
      }
      throw error;
    }
  }),

  // Mirrors gmail.syncLatest: hits the live API per-event so Corsair
  // intercepts each call and stores it in the DB automatically.
  // After syncing, removes stale events from Corsair_DB that no longer
  // exist in Google Calendar (i.e., deleted externally).
  syncLatest: protectedProcedure.mutation(async ({ ctx }) => {
    // 1. Get the list of upcoming event IDs from the live API
    const res = await ctx.tenant.googlecalendar.api.events.getMany({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });

    // 2. Fetch each event individually — Corsair intercepts every
    //    events.get call and upserts it into the DB as a side effect,
    //    exactly the same way gmail.syncLatest does with messages.get.
    const syncedEventIds = new Set<string>();
    if (res.items?.length) {
      await Promise.all(
        res.items.map((item: any) => {
          syncedEventIds.add(item.id);
          return ctx.tenant.googlecalendar.api.events.get({
            calendarId: "primary",
            id: item.id,          // docs: param is "id", not "eventId"
          });
        })
      );
    }

    // 3. Remove stale events from Corsair_DB that were deleted externally.
    //    Query all cached events and delete any not in the live API response.
    const cachedEvents = await ctx.tenant.googlecalendar.db.events.search({ limit: 500 });
    const deletePromises = cachedEvents
      .filter((event) => !syncedEventIds.has(event.entity_id))
      .map((event) => ctx.tenant.googlecalendar.db.events.deleteByEntityId(event.entity_id));

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }

    return { success: true, count: res.items?.length ?? 0 };
  }),

  createEvent: protectedProcedure
    .input(
      z.object({
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
        attendees: z
          .array(
            z.object({
              email: z.string().email(),
              displayName: z.string().optional(),
              optional: z.boolean().optional(),
            }),
          )
          .optional(),
        calendarId: z.string().default("primary"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { calendarId, ...event } = input;
      return await ctx.tenant.googlecalendar.api.events.create({ calendarId, event });
    }),

  saveNote: protectedProcedure
    .input(z.object({ eventId: z.string(), note: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(calendarNotes)
        .values({ userId: ctx.userId, eventId: input.eventId, note: input.note })
        .onConflictDoUpdate({ target: [calendarNotes.id], set: { note: input.note } });
    }),
});