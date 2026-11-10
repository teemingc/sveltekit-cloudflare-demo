import { env } from 'cloudflare:workers';

export async function GET() {
	const n = Number((await env.KV.get('n')) ?? 0) + 1;
	await env.KV.put('n', String(n));
	return new Response(String(n));
}
