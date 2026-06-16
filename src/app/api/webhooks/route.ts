import { processWebhook } from 'corsair';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { corsair } from '@/server/corsair';

export async function POST(request: NextRequest) {
	const url = new URL(request.url);
	const validationToken =
		url.searchParams.get('validationtoken') ||
		url.searchParams.get('validationToken');

	if (validationToken) {
		return new NextResponse(validationToken, {
			status: 200,
			headers: { 'Content-Type': 'text/plain; charset=utf-8' },
		});
	}

	const headers = Object.fromEntries(request.headers.entries());
	const contentType = request.headers.get('content-type');
	const text = await request.text();

	let body: string | Record<string, unknown> = {};
	if (text?.trim()) {
		try {
			body = contentType?.includes('application/json') ? JSON.parse(text) : text;
		} catch (e) {
			console.error("Failed to parse webhook body:", e);
			body = text;
		}
	}

	// 1. Look for tenantId in the URL (for standard plugins)
	// 2. Look in the headers (for custom setups)
	// 3. If neither exist, let it be null so Corsair can auto-resolve Gmail via the payload!
	const tenantId = url.searchParams.get('tenantId') 
		|| url.searchParams.get('tenant') 
		|| request.headers.get('x-tenant-id');

	try {
		const result = await processWebhook(corsair, headers, body, { 
			tenantId: tenantId ?? undefined 
		});

		console.info('Plugin Processed:', result.plugin, result.action);

		const responseHeaders = (result as Record<string, unknown>).responseHeaders as Record<string, string> | undefined;
		const nextHeaders = new Headers(responseHeaders);

		if (!result.response) {
			return NextResponse.json(
				{ success: false, message: 'No matching webhook handler found' },
				{ status: 404 }
			);
		}

		return NextResponse.json(result.response, { headers: nextHeaders });

	} catch (error) {
		console.error("Webhook processing failed:", error);
		
		// Return 200 OK even on failure so Pub/Sub clears the message from its retry queue!
		return new NextResponse("Webhook processed with errors", { status: 200 });
	}
}

export async function GET() {
	return NextResponse.json({
		status: 'ok',
		message: 'Webhook endpoint is active',
		timestamp: new Date().toISOString(),
	});
}