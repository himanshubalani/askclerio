// src/server/api/routers/auth.ts (New Router)
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";

export const authRouter = createTRPCRouter({
  syncGoogleCredentials: protectedProcedure.mutation(async ({ ctx }) => {
    // 1. Get the user's Google OAuth token from Clerk
    const client = await clerkClient();
    const { data } = await client.users.getUserOauthAccessToken(
      ctx.userId,
      "oauth_google"
    );

    const googleToken = data[0]?.token;
    const refreshToken = data[0]?.tokenSecret;
    
    if (!googleToken) {
      throw new Error("No Google OAuth token found in Clerk");
    }

    // 2. Hand the token securely to Corsair for this specific tenant
    // Note: Rely on your IDE's TypeScript autocomplete for the exact 
    // method name (e.g., set_access_token, set_credentials, etc.)
    await ctx.tenant.gmail.keys.set_access_token(googleToken)
    await ctx.tenant.googlecalendar.keys.set_access_token(googleToken);

    return { success: true };
  }),
});