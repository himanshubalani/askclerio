// src/server/api/routers/auth.ts
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { generateOAuthUrl } from "corsair/oauth";
import { corsair } from "@/server/corsair";
import { z } from "zod";

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/corsair/callback`;

export const authRouter = createTRPCRouter({
  generateOAuthUrl: protectedProcedure
    .input(z.object({ plugin: z.enum(["gmail", "googlecalendar"]) }))
    .mutation(async ({ ctx, input }) => {
      const { url, state } = await generateOAuthUrl(corsair, input.plugin, {
        tenantId: ctx.userId, // Use Clerk userId as Corsair tenant ID
        redirectUri: REDIRECT_URI,
      });

      return { url, state };
    }),

  checkConnectionStatus: protectedProcedure
    .input(z.object({ plugin: z.enum(["gmail", "googlecalendar"]) }))
    .query(async ({ ctx, input }) => {
      try {
        // Try to make a simple API call to check if tokens are valid
        // Both Gmail and Google Calendar share the same OAuth tokens,
        // so we check Gmail by default
        const profile = await ctx.tenant.gmail.api.users.getProfile({ userId: "me" });
        return { connected: true, email: profile.emailAddress };
      } catch (error) {
        return { connected: false, error: error.message };
      }
    }),
});