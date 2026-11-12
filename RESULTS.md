# Test results

SvelteKit and `@sveltejs/adapter-cloudflare` built from [`c8c3d2df8`](https://github.com/sveltejs/kit/commit/c8c3d2df8787ade8268beaf8307ee60e6dae2c4f), the tip of https://github.com/sveltejs/kit/pull/17708 when this ran.

`pnpm test` writes this file.

| Step | Result |
| --- | --- |
| `vite dev` starts | ✅ passed |
| `vite build` | ✅ passed |
| `vite preview` starts | ✅ passed |

| Test | `vite dev` | `vite preview` |
| --- | --- | --- |
| / › renders in workerd | ✅ passed | ✅ passed |
| / › reads bindings and secrets | ✅ passed | ✅ passed |
| / › shares module state with the custom Worker | ✅ passed | ✅ passed |
| / › sets cookies and streams | ✅ passed | ✅ passed |
| /remote › runs queries on a full page load | ✅ passed | ✅ passed |
| /remote › runs a command and a form after navigating | ✅ passed | ✅ passed |
| /chat sends messages through a Durable Object | ✅ passed | ✅ passed |
| /ws echoes over a WebSocket | ✅ passed | ✅ passed |
| /lib styles a library component without JavaScript | ✅ passed | ✅ passed |
| /read reads a file | ✅ passed | ✅ passed |
| /kv uses a KV binding | ✅ passed | ✅ passed |
| /counter calls a Durable Object over RPC | ✅ passed | ✅ passed |
| /about is prerendered | ✅ passed | ✅ passed |
| /top-level uses cloudflare:workers at the top level | ✅ passed | ✅ passed |
| /actions › redirects after a form action | ✅ passed | ✅ passed |
| /actions › fails without a name | ✅ passed | ✅ passed |
| /internal fetches an endpoint from a universal load | ✅ passed | ✅ passed |
| /stats › shares module state with the custom Worker | ✅ passed | ✅ passed |
| /stats › counts runs of the scheduled handler | ✅ passed | ➖ skipped |
| /instrumented runs instrumentation.server.ts in workerd | ✅ passed | ✅ passed |
| /boom shows an expected error | ✅ passed | ✅ passed |
| /crash shows an unexpected error | ✅ passed | ✅ passed |
