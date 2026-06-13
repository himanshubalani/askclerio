/**
 * tRPC server initialization with Clerk auth and Corsair multi-tenancy.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@clerk/nextjs/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { db } from "@/server/db";
import { corsair } from "@/server/corsair";

/**
 * 1. CONTEXT
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const { userId } = await auth();
  const tenant = userId ? corsair.withTenant(userId) : null;

  return {
    db,
    userId,
    tenant,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURES
 */
export const createTRPCRouter = t.router;

/**
 * Dev timing middleware — simulates network latency in development.
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  if (t._config.isDev) {
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();
  console.log(`[TRPC] ${path} took ${Date.now() - start}ms to execute`);
  return result;
});

/**
 * Public procedure — no auth required.
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected procedure — requires Clerk userId and a valid Corsair tenant.
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.userId || !ctx.tenant) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        userId: ctx.userId,
        tenant: ctx.tenant,
        db: ctx.db,
      },
    });
  });