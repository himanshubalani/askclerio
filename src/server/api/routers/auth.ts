import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const authRouter = createTRPCRouter({
  checkConnections: protectedProcedure.query(async ({ ctx }) => {
    let gmailConnected = false;
    let calendarConnected = false;

    // Check Gmail
    try {
      await ctx.tenant.gmail.api.labels.list({});
      gmailConnected = true;
    } catch (error: unknown) {
      // Not connected
    }

    // Check Google Calendar
    try {
      await ctx.tenant.googlecalendar.api.events.getMany({ calendarId: "primary", maxResults: 1 });
      calendarConnected = true;
    } catch (error: unknown) {
      // Not connected
    }

    return { gmail: gmailConnected, calendar: calendarConnected };
  }),
});