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

    const searchParams = new URL(request.url).searchParams;
    const pluginsParam = searchParams.get('plugins');
    const pluginParam = searchParams.get('plugin');

    // Determine which plugins to authorize.
    // If both `plugins` and `plugin` are provided, prefer `plugins` (combined flow).
    let pluginsToConnect: string[];

    if (pluginsParam) {
        // Combined flow: e.g. ?plugins=gmail,googlecalendar
        pluginsToConnect = pluginsParam.split(',').map(p => p.trim()).filter(Boolean);
        const invalid = pluginsToConnect.filter(p => !ALLOWED_PLUGINS.has(p));
        if (pluginsToConnect.length === 0 || invalid.length > 0) {
            return NextResponse.json(
                { error: 'Invalid plugins param', invalidPlugins: invalid },
                { status: 400 }
            );
        }
    } else if (pluginParam) {
        // Single plugin flow: e.g. ?plugin=googlecalendar
        if (!ALLOWED_PLUGINS.has(pluginParam)) {
            return NextResponse.json({ error: 'Invalid plugin param' }, { status: 400 });
        }
        pluginsToConnect = [pluginParam];
    } else {
        return NextResponse.json(
            { error: 'Missing plugin or plugins param' },
            { status: 400 }
        );
    }

    let url: string;
    let state: string;
    try {
        // For combined flows (multiple plugins), pass the array to generateOAuthUrl so all
        // plugins are authorized in one OAuth consent screen. The Corsair runtime supports
        // both a single plugin string and an array of plugin ids (connectLink.create semantics).
        // For single plugin flows, pass the string directly.
        const pluginArg: string | string[] = pluginsToConnect.length === 1
            ? pluginsToConnect[0]!
            : pluginsToConnect;
        ({ url, state } = await generateOAuthUrl(
            corsair,
            pluginArg as string, // Corsair runtime accepts string | string[]; types lag behind
            { tenantId: userId, redirectUri: REDIRECT_URI }
        ));
    } catch (err) {
        console.error('generateOAuthUrl failed for plugins', pluginsToConnect, err);
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
    // Store the plugins being connected so the callback route knows which plugins were requested
    response.cookies.set('oauth_plugin', pluginsToConnect.join(','), {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
    });
    return response;
}
