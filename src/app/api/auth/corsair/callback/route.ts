import { processOAuthCallback } from 'corsair/oauth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { corsair } from '@/server/corsair';

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/corsair/callback`;

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Always clear the cookie on every exit path
    const clearCookie = {
        'Set-Cookie': 'oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
        'Content-Type': 'text/html',
    };

    if (error) {
        return new NextResponse(
            `<html><body><h2>Authorization failed</h2><p>${escapeHtml(error)}</p><p><a href="/u">Back to app</a></p></body></html>`,
            { status: 400, headers: clearCookie },
        );
    }

    if (!code || !state) {
        return new NextResponse(
            `<html><body><h2>Invalid callback</h2><p>Missing code or state.</p><p><a href="/u">Back to app</a></p></body></html>`,
            { status: 400, headers: clearCookie },
        );
    }

    // Validate state cookie — prevents CSRF
    const storedState = request.cookies.get('oauth_state')?.value;
    if (!storedState || storedState !== state) {
        return new NextResponse(
            `<html><body><h2>Invalid state</h2><p>Possible CSRF attempt.</p><p><a href="/u">Back to app</a></p></body></html>`,
            { status: 400, headers: clearCookie },
        );
    }

    try {
        const result = await processOAuthCallback(corsair, {
            code,
            state,
            redirectUri: REDIRECT_URI,
        });

        // Redirect back to the app; clear the state cookie
        const response = NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/u?connected=${encodeURIComponent(result.plugin)}`
        );
        response.cookies.delete('oauth_state');
        return response;
    } catch (err) {
        console.error('OAuth callback error:', err);
        const message = err instanceof Error ? err.message : String(err);
        return new NextResponse(
            `<html><body><h2>OAuth error</h2><p>${escapeHtml(message)}</p><p><a href="/u">Back to app</a></p></body></html>`,
            { status: 500, headers: clearCookie },
        );
    }
}
