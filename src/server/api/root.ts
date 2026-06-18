// src/server/api/root.ts
import { authRouter } from "@/server/api/routers/auth"
import { gmailRouter } from "@/server/api/routers/gmail";
import { calendarRouter } from "@/server/api/routers/calendar";
import { chatRouter } from "@/server/api/routers/chat";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  gmail: gmailRouter,         
  calendar: calendarRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
