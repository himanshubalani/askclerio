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

    // Read the plugin cookie set by /api/connect to identify which plugin is being connected
    const pluginName = request.cookies.get('oauth_plugin')?.value ?? null;

    // Always clear both cookies on every exit path
    const clearCookieHeaders = new Headers();
    clearCookieHeaders.set('Content-Type', 'text/html');
    clearCookieHeaders.append('Set-Cookie', 'oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
    clearCookieHeaders.append('Set-Cookie', 'oauth_plugin=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');

    // Build a retry link if we know which plugin was being connected
    let retryLink = '';
    if (pluginName) {
        const plugins = pluginName.split(',').map(p => p.trim()).filter(Boolean);
        if (plugins.length === 1) {
            retryLink = `<p><a href="/api/connect?plugin=${encodeURIComponent(plugins[0]!)}">Try again</a></p>`;
        } else if (plugins.length > 1) {
            retryLink = `<p><a href="/api/connect?plugins=${encodeURIComponent(plugins.join(','))}">Try again</a></p>`;
        }
    }

    if (error) {
        return new NextResponse(
            `<html><body><h2>Authorization failed</h2><p>${escapeHtml(error)}</p>${retryLink}<p><a href="/u">Back to app</a></p></body></html>`,
            { status: 400, headers: clearCookieHeaders },
        );
    }

    if (!code || !state) {
        return new NextResponse(
            `<html><body><h2>Invalid callback</h2><p>Missing code or state.</p>${retryLink}<p><a href="/u">Back to app</a></p></body></html>`,
            { status: 400, headers: clearCookieHeaders },
        );
    }

    // Validate state cookie — prevents CSRF
    const storedState = request.cookies.get('oauth_state')?.value;
    if (!storedState || storedState !== state) {
        return new NextResponse(
            `<html><body><h2>Invalid state</h2><p>Possible CSRF attempt.</p>${retryLink}<p><a href="/u">Back to app</a></p></body></html>`,
            { status: 400, headers: clearCookieHeaders },
        );
    }

    try {
        const result = await processOAuthCallback(corsair, {
            code,
            state,
            redirectUri: REDIRECT_URI,
        });

        // Redirect back to the app with the connected plugin name;
        // clear both state and plugin cookies
        const response = NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/u?connected=${encodeURIComponent(result.plugin)}`
        );
        response.cookies.delete('oauth_state');
        response.cookies.delete('oauth_plugin');
        return response;
    } catch (err) {
        console.error('OAuth callback error:', err);
        const message = err instanceof Error ? err.message : String(err);
        return new NextResponse(
            `<html><body><h2>OAuth error</h2><p>${escapeHtml(message)}</p>${retryLink}<p><a href="/u">Back to app</a></p></body></html>`,
            { status: 500, headers: clearCookieHeaders },
        );
    }
}
