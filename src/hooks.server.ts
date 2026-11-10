import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import { stats } from '#lib/stats.js';

export const handle: Handle = async ({ event, resolve }) => {
	stats.requests += 1;
	const response = await resolve(event);
	// the websocket response from a durable object has immutable headers
	if (response.status !== 101) response.headers.set('x-demo-hook', 'yes');
	return response;
};

export const handleError: HandleServerError = ({ kind, error }) => {
	if (kind === 'unknown') console.error('handleError saw', error);
};
