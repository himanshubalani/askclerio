// src/app/api/auth/google/callback/route.ts
import { corsair } from "@/server/corsair";
import { processOAuthCallback } from "corsair/oauth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

  if (!code || !state) {
    return new NextResponse(errorHtml("Missing authorization parameters."), {
      headers: { "Content-Type": "text/html" },
    });
  }

  try {
    await processOAuthCallback(corsair, { code, state, redirectUri });
    return new NextResponse(successHtml(), {
      headers: { "Content-Type": "text/html" },
    });
  } catch (err) {
    console.error("OAuth callback failed:", err);
    return new NextResponse(errorHtml("Something went wrong connecting your account."), {
      headers: { "Content-Type": "text/html" },
    });
  }
}

function successHtml() {
  return `<!DOCTYPE html>
<html>
  <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fafafa;">
    <div style="text-align: center;">
      <h2>Authorization complete</h2>
      <p>You can close this tab now.</p>
    </div>
    <script>
      setTimeout(() => { window.close(); }, 1500);
    </script>
  </body>
</html>`;
}

function errorHtml(message: string) {
  return `<!DOCTYPE html>
<html>
  <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #fafafa;">
    <div style="text-align: center;">
      <h2>Authorization failed</h2>
      <p>${message}</p>
    </div>
  </body>
</html>`;
}