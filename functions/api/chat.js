// ═══════════════════════════════════════════════════════════════════
// FRED AI — Chat Proxy (Cloudflare Pages Function)
// Adds X-Fred-Key (from Cloudflare secret X_Fred_Key) so the n8n
// webhook's Header Auth accepts the request. Browser never holds the key.
// ═══════════════════════════════════════════════════════════════════

const N8N_WEBHOOK = 'https://n8n.airpg.ai/webhook/fred';
const FRED_KEY_HEADER = 'X-Fred-Key';

export async function onRequest(context) {
	const { request, env } = context;

	if (request.method !== 'POST') {
		return new Response('Method not allowed', { status: 405 });
	}

	const webhookKey = env.X_Fred_Key;
	if (!webhookKey) {
		return new Response('Chat not configured — missing X_Fred_Key', { status: 500 });
	}

	let body;
	try {
		body = await request.json();
	} catch {
		return new Response('Invalid JSON body', { status: 400 });
	}
	if (!body?.text || typeof body.text !== 'string') {
		return new Response('Missing or invalid "text" field', { status: 400 });
	}

	const upstream = await fetch(N8N_WEBHOOK, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			[FRED_KEY_HEADER]: webhookKey,
		},
		body: JSON.stringify({
			text: body.text,
			sessionId: body.sessionId,
		}),
	});

	return new Response(upstream.body, {
		status: upstream.status,
		headers: {
			'Content-Type': upstream.headers.get('content-type') || 'text/plain',
			'Cache-Control': 'no-cache',
		},
	});
}
