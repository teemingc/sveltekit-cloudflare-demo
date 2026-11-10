import { env } from 'cloudflare:workers';
import { API_KEY, GREETING } from '$app/env/private';
import { stats } from '#lib/stats.js';

export async function load({ getClientAddress, cookies }) {
	const visits = Number(cookies.get('visits') ?? 0) + 1;
	cookies.set('visits', String(visits), { path: '/' });

	return {
		runtime: navigator.userAgent,
		has_websocket_pair: typeof WebSocketPair !== 'undefined',
		client_address: getClientAddress(),
		greeting_env: env.GREETING,
		greeting_kit: GREETING,
		api_key_set: Boolean(API_KEY),
		not_declared: (env as unknown as Record<string, string | undefined>).NOT_DECLARED ?? null,
		worker_loaded: stats.loaded_by_worker,
		visits,
		slow: new Promise<string>((fulfil) => setTimeout(() => fulfil('streamed'), 300))
	};
}
