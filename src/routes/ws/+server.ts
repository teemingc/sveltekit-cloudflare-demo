export function GET({ request }) {
	if (request.headers.get('upgrade') !== 'websocket') {
		return new Response('expected a websocket', { status: 426 });
	}

	const [client, server] = Object.values(new WebSocketPair());
	server.accept();
	server.addEventListener('message', (event) => server.send('echo ' + event.data));

	return new Response(null, { status: 101, webSocket: client });
}
