import { env } from 'cloudflare:workers';
import { command, form, prerender, query } from '$app/server';
import * as v from 'valibot';

let count = 0;

export const get_count = query(async () => count);

export const add = command(v.number(), async (n) => {
	count += n;
	get_count().refresh();
	return count;
});

export const runtime = query(async () => navigator.userAgent);

export const greeting = query(async () => env.GREETING);

export const greet = form(
	v.object({ name: v.pipe(v.string(), v.minLength(1)) }),
	async ({ name }) => `hi ${name} from ${navigator.userAgent}`
);

export const build_info = prerender(async () => 'prerendered value');
