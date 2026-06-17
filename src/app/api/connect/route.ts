import { generateOAuthUrl } from 'corsair/oauth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { corsair } from '@/server/corsair';

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/corsair/callback`;
const ALLOWED_PLUGINS = new Set(["gmail", "googlecalendar"]);

export async function GET(request: NextRequest) {

    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const plugin = new URL(request.url).searchParams.get('plugin');
    if (!plugin || !ALLOWED_PLUGINS.has(plugin)) {
        return NextResponse.json({ error: 'Invalid plugin param' }, { status: 400 });
    }

    let url: string;
    let state: string;
    try {
        ({ url, state } = await generateOAuthUrl(corsair, plugin, {
            tenantId: userId,
            redirectUri: REDIRECT_URI,
        }));
    } catch (err) {
        console.error('generateOAuthUrl failed for plugin', plugin, err);
        return NextResponse.json({ error: 'Unable to start OAuth flow' }, { status: 502 });
    }


    const response = NextResponse.redirect(url);
    response.cookies.set('oauth_state', state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
    });
    return response;
}
