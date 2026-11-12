import { DurableObject, WorkerEntrypoint, env } from 'cloudflare:workers';

// everything here runs when the module is imported, rather than during a request
const greeting = env.GREETING;
const runtime = navigator.userAgent;
const classes = [DurableObject.name, WorkerEntrypoint.name];

export function load() {
	return { greeting, runtime, classes };
}
