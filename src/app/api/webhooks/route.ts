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
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
			},
		});
	}
	const headers: Record<string, string> = {};
	request.headers.forEach((value, key) => {
		headers[key] = value;
	});

const contentType = request.headers.get('content-type');

	let body: string | Record<string, unknown> = {};
	const text = await request.text();

	if (text?.trim()) {
		try {
			body = contentType?.includes('application/json') ? JSON.parse(text) : text;
		} catch (e) {
			console.error("Failed to parse webhook body:", e);
			body = {};
		}
	}

	const tenantId = request.headers.get('x-tenant-id') ?? 'default';

	const result = await processWebhook(corsair, headers, body, { tenantId });

	console.info('Plugin Processed:', result.plugin, result.action);


	const responseHeaders = (result as Record<string, unknown>).responseHeaders as
		| Record<string, string>
		| undefined;
	const nextHeaders = new Headers();
	if (responseHeaders) {
		for (const [key, value] of Object.entries(responseHeaders)) {
			nextHeaders.set(key, value);
		}
	}

	// Handle case where no webhook matched
	if (!result.response) {
		return NextResponse.json(
			{
				success: false,
				message: 'No matching webhook handler found',
			},
			{ status: 404 },
		);
	}

	if (result.response !== undefined) {
		return NextResponse.json(result.response, { headers: nextHeaders });
	}

	return new NextResponse(null, { status: 200, headers: nextHeaders });
}

export async function GET() {
	return NextResponse.json({
		status: 'ok',
		message: 'Webhook endpoint is active',
		timestamp: new Date().toISOString(),
	});
}