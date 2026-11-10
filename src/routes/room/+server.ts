import { env } from 'cloudflare:workers';

export function GET({ request }) {
	if (request.headers.get('upgrade') !== 'websocket') {
		return new Response('expected a websocket', { status: 426 });
	}

	return env.ROOM.getByName('demo').fetch(request);
}
