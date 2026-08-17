// ═══════════════════════════════════════════════════════════════════
// FRED AI — TTS Proxy (Cloudflare Pages Function)
// Reads GROK_API_KEY from Cloudflare runtime env (dashboard →
// Settings → Variables and Secrets → Encrypt). Key never reaches the
// browser. Forwards the frontend's full TTS body to xAI unchanged.
// ═══════════════════════════════════════════════════════════════════

const TTS_ENDPOINT = 'https://api.x.ai/v1/tts';

export async function onRequest(context) {
	const { request, env } = context;

	if (request.method !== 'POST') {
		return new Response('Method not allowed', { status: 405 });
	}

	const apiKey = env.GROK_API_KEY;
	if (!apiKey) {
		return new Response('TTS not configured — missing GROK_API_KEY', { status: 500 });
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

	const upstream = await fetch(TTS_ENDPOINT, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	});

	if (!upstream.ok) {
		return new Response(`TTS upstream error: ${upstream.status}`, { status: 502 });
	}

	return new Response(upstream.body, {
		headers: {
			'Content-Type': upstream.headers.get('content-type') || 'audio/mpeg',
			'Cache-Control': 'no-cache',
		},
	});
}
