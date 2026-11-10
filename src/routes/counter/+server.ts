import { env } from 'cloudflare:workers';
import type { Counter } from '../../worker';

export async function POST() {
	const counter = env.COUNTER.getByName('demo') as unknown as DurableObjectStub<Counter>;
	return Response.json({ count: await counter.increment() });
}
