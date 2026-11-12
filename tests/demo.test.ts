import { expect, test } from '@playwright/test';

const dev = process.env.MODE !== 'preview';
const workerd = 'Cloudflare-Workers';

test.describe('/', () => {
	test('renders in workerd', async ({ page }) => {
		const response = await page.goto('/');
		expect(response?.headers()['x-demo-hook']).toBe('yes');
		await expect(page.locator('#runtime')).toHaveText(workerd);
		await expect(page.locator('#websocket')).toHaveText('true');
		await expect(page.locator('#client-address')).not.toBeEmpty();
		await expect(page.locator('.title')).toHaveCSS('color', 'rgb(200, 0, 0)');
	});

	test('reads bindings and secrets', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('#greeting-env')).toHaveText('hello from cloudflare.config.ts');
		await expect(page.locator('#greeting-kit')).toHaveText('hello from cloudflare.config.ts');
		await expect(page.locator('#api-key')).toHaveText('true');
		await expect(page.locator('#not-declared')).toBeEmpty();
	});

	test('shares module state with the custom Worker', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('#worker-loaded')).toHaveText('true');
	});

	test('sets cookies and streams', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('#visits')).toHaveText('1');
		await expect(page.locator('#slow')).toHaveText('streamed');
		await page.reload();
		await expect(page.locator('#visits')).toHaveText('2');
	});
});

test.describe('/remote', () => {
	test('runs queries on a full page load', async ({ page }) => {
		await page.goto('/remote');
		await expect(page.locator('#runtime')).toHaveText(workerd);
		await expect(page.locator('#greeting')).toHaveText('hello from cloudflare.config.ts');
		await expect(page.locator('#prerendered')).toHaveText('prerendered value');
	});

	test('runs a command and a form after navigating', async ({ page }) => {
		// wait for the app to start, so that the link navigates on the client
		await page.goto('/lib', { waitUntil: 'networkidle' });
		await page.locator('nav a[href="/remote"]').click();
		await expect(page.locator('#runtime')).toHaveText(workerd);

		const count = Number(await page.locator('#count').textContent());
		await page.locator('#add').click();
		await expect(page.locator('#count')).toHaveText(String(count + 1));

		await page.locator('form input').fill('kit');
		await page.locator('#greet').click();
		await expect(page.locator('#greet-result')).toHaveText(`hi kit from ${workerd}`);
	});
});

test('/chat sends messages through a Durable Object', async ({ page }) => {
	const opened = page.waitForEvent('websocket');
	await page.goto('/chat');
	await opened;
	// retry, since the socket may not be open the first time
	await expect(async () => {
		await page.locator('form input').fill('hi');
		await page.locator('form button').click();
		await expect(page.locator('#messages li').first()).toHaveText('room: hi', { timeout: 1000 });
	}).toPass();
});

test('/ws echoes over a WebSocket', async ({ page }) => {
	await page.goto('/lib');
	const message = await page.evaluate(
		() =>
			new Promise((fulfil, reject) => {
				const socket = new WebSocket(location.origin.replace(/^http/, 'ws') + '/ws');
				socket.onopen = () => socket.send('ping');
				socket.onmessage = (event) => fulfil(event.data);
				socket.onerror = () => reject(new Error('websocket failed'));
			})
	);
	expect(message).toBe('echo ping');
});

test('/lib styles a library component without JavaScript', async ({ browser }) => {
	const context = await browser.newContext({ javaScriptEnabled: false });
	const page = await context.newPage();
	await page.goto('/lib');
	await expect(page.locator('.badge')).toHaveCSS('color', 'rgb(1, 2, 3)');
	await context.close();
});

test('/read reads a file', async ({ request }) => {
	const response = await request.get('/read');
	expect((await response.text()).trim()).toBe('hello from a file read with read()');
});

test('/kv uses a KV binding', async ({ request }) => {
	const first = Number(await (await request.get('/kv')).text());
	const second = Number(await (await request.get('/kv')).text());
	expect(second).toBe(first + 1);
});

test('/counter calls a Durable Object over RPC', async ({ request, baseURL }) => {
	// SvelteKit rejects a POST from another origin
	const headers = { origin: baseURL! };
	const first = (await (await request.post('/counter', { headers })).json()).count;
	const second = (await (await request.post('/counter', { headers })).json()).count;
	expect(second).toBe(first + 1);
});

test('/about is prerendered', async ({ page }) => {
	await page.goto('/about');
	await expect(page.locator('#about')).toHaveCSS('color', 'rgb(0, 0, 200)');
	const rendered_at = await page.locator('#rendered-at').textContent();
	expect(rendered_at).toBeTruthy();

	if (dev) {
		// dev renders prerenderable pages on demand, in workerd
		await expect(page.locator('#runtime')).toHaveText(workerd);
	} else {
		// the build rendered the page once
		await page.reload();
		await expect(page.locator('#rendered-at')).toHaveText(rendered_at!);
	}
});

test('/top-level uses cloudflare:workers at the top level', async ({ page }) => {
	await page.goto('/top-level');
	await expect(page.locator('#greeting')).toHaveText('hello from cloudflare.config.ts');
	await expect(page.locator('#runtime')).toHaveText(workerd);
	await expect(page.locator('#classes')).toHaveText('DurableObject, WorkerEntrypoint');
});

test.describe('/actions', () => {
	test('redirects after a form action', async ({ page }) => {
		await page.goto('/actions');
		await page.locator('input[name="name"]').fill('kit');
		await page.locator('button').click();
		await expect(page).toHaveURL(/\/actions\?name=kit$/);
		await expect(page.locator('#name')).toHaveText('kit');
	});

	test('fails without a name', async ({ page }) => {
		await page.goto('/actions');
		await page.locator('button').click();
		await expect(page.locator('#missing')).toHaveText('missing');
	});
});

test('/internal fetches an endpoint from a universal load', async ({ page }) => {
	await page.goto('/internal');
	expect(Number(await page.locator('#requests').textContent())).toBeGreaterThan(0);
});

test.describe('/stats', () => {
	test('shares module state with the custom Worker', async ({ request }) => {
		const stats = await (await request.get('/stats')).json();
		expect(stats.loaded_by_worker).toBe(true);
		expect(stats.requests).toBeGreaterThan(0);
	});

	test('counts runs of the scheduled handler', async ({ request }) => {
		test.skip(!dev, 'the endpoint that runs the scheduled handler only exists during dev');

		const before = (await (await request.get('/stats')).json()).scheduled_runs;
		// retry, since the Worker takes a moment to register itself after the server starts
		await expect(async () => {
			const response = await request.post(
				'/cdn-cgi/local/explorer/api/local/scheduled?worker=sveltekit-cloudflare-demo',
				{ data: { cron: '* * * * *' } }
			);
			expect(response.status(), await response.text()).toBe(200);
		}).toPass({ timeout: 15_000 });
		const after = (await (await request.get('/stats')).json()).scheduled_runs;
		expect(after).toBe(before + 1);
	});
});

test('/instrumented runs instrumentation.server.ts in workerd', async ({ request }) => {
	expect(await (await request.get('/instrumented')).text()).toBe(workerd);
});

test('/boom shows an expected error', async ({ page }) => {
	const response = await page.goto('/boom');
	expect(response?.status()).toBe(418);
	await expect(page.locator('#error')).toHaveText('418: teapot');
});

test('/crash shows an unexpected error', async ({ page }) => {
	const response = await page.goto('/crash');
	expect(response?.status()).toBe(500);
	await expect(page.locator('#error')).toContainText('500');
});
