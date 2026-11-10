import { DurableObject } from 'cloudflare:workers';
import { fetch } from '@sveltejs/adapter-cloudflare/worker';
import { stats } from '#lib/stats.js';

stats.loaded_by_worker = true;

export class Counter extends DurableObject {
	async increment(): Promise<number> {
		const count = ((await this.ctx.storage.get<number>('count')) ?? 0) + 1;
		await this.ctx.storage.put('count', count);
		return count;
	}
}

export class Room extends DurableObject {
	async fetch(): Promise<Response> {
		const [client, server] = Object.values(new WebSocketPair());
		this.ctx.acceptWebSocket(server);
		return new Response(null, { status: 101, webSocket: client });
	}

	webSocketMessage(_: WebSocket, message: string | ArrayBuffer) {
		for (const socket of this.ctx.getWebSockets()) socket.send(`room: ${message}`);
	}
}

export default {
	fetch,
	async scheduled(controller: { cron: string }) {
		stats.scheduled_runs += 1;
		console.log('scheduled ran', controller.cron);
	}
};
