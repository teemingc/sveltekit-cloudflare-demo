import { bindings, defineConfig, exports } from '@cloudflare/config';

export default defineConfig({
	worker: {
		name: 'sveltekit-cloudflare-demo',
		compatibilityDate: '2026-11-01',
		entrypoint: './src/worker.ts',
		exports: {
			Counter: exports.durableObject({ storage: 'sqlite' }),
			Room: exports.durableObject({ storage: 'sqlite' })
		},
		env: {
			GREETING: bindings.text('hello from cloudflare.config.ts'),
			API_KEY: bindings.secret(),
			KV: bindings.kv(),
			COUNTER: bindings.durableObject({ worker: 'sveltekit-cloudflare-demo', exportName: 'Counter' }),
			ROOM: bindings.durableObject({ worker: 'sveltekit-cloudflare-demo', exportName: 'Room' })
		}
	}
});
