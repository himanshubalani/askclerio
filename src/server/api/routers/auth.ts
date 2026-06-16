// src/server/api/routers/auth.ts
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/server";
import { setupCorsair } from "corsair";
import { corsair } from "@/server/corsair";

export const authRouter = createTRPCRouter({
});