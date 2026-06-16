// src/app/api/auth/google/start/route.ts
import { auth } from "@clerk/nextjs/server";
import { corsair } from "@/server/corsair";
import { generateOAuthUrl } from "corsair/oauth";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.redirect("/sign-in");

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

  const { url } = await generateOAuthUrl(corsair, "gmail", {
    tenantId: userId,
    redirectUri,
  });

  return NextResponse.redirect(url);
}