// src/server/api/routers/auth.ts (New Router)
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";

export const authRouter = createTRPCRouter({
  syncGoogleCredentials: protectedProcedure.mutation(async ({ ctx }) => {
    
    const client = await clerkClient();
    const { data } = await client.users.getUserOauthAccessToken(
      ctx.userId,
      "google"
    );

    const googleToken = data[0]?.token;
    const refreshToken = data[0]?.tokenSecret;
    
    if (!googleToken) {
      throw new Error("No Google OAuth token found in Clerk");
    }

    await Promise.all([
      ctx.tenant.gmail.keys.set_access_token(googleToken),
      ctx.tenant.googlecalendar.keys.set_access_token(googleToken),
    ]);

    if (refreshToken) {
      await Promise.all([
        ctx.tenant.gmail.keys.set_refresh_token(refreshToken),
        ctx.tenant.googlecalendar.keys.set_refresh_token(refreshToken),
      ]);
    }

    return { success: true };
  }),
});