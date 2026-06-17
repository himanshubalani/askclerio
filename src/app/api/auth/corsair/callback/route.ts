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

    const headers = { 'Content-Type': 'text/html' };

    if (error) {
        return new NextResponse(
            `<html><body>
                <h2>Authorization failed</h2>
                <p>${escapeHtml(error)}</p>
                <p><a href="/">Back to home</a></p>
            </body></html>`,
            { status: 400, headers },
        );
    }

    if (!code || !state) {
        return new NextResponse(
            `<html><body>
                <h2>Invalid OAuth callback</h2>
                <p>Missing code or state parameter.</p>
                <p><a href="/">Back to home</a></p>
            </body></html>`, 
            { status: 400, headers }
        );
    }

    try {
        const result = await processOAuthCallback(corsair, {
            code,
            state,
            redirectUri: REDIRECT_URI,
        });

        // Success - redirect to a success page or back to the app
        return new NextResponse(
            `<html><body>
                <h2>Successfully connected!</h2>
                <p><strong>${escapeHtml(result.plugin)}</strong> is now connected.</p>
                <p><a href="/">Continue to app</a></p>
                <script>
                    // Auto-close if this opened in a popup
                    if (window.opener) {
                        window.opener.postMessage({ 
                            type: 'oauth-success', 
                            plugin: '${escapeHtml(result.plugin)}'
                        }, '*');
                        window.close();
                    }
                </script>
            </body></html>`,
            { status: 200, headers },
        );
    } catch (err) {
        console.error('OAuth callback error:', err);
        const message = err instanceof Error ? err.message : String(err);
        
        return new NextResponse(
            `<html><body>
                <h2>OAuth error</h2>
                <p>${escapeHtml(message)}</p>
                <p><a href="/">Back to home</a></p>
                <script>
                    // Auto-close if this opened in a popup
                    if (window.opener) {
                        window.opener.postMessage({ 
                            type: 'oauth-error', 
                            error: '${escapeHtml(message)}'
                        }, '*');
                        window.close();
                    }
                </script>
            </body></html>`,
            { status: 500, headers },
        );
    }
}