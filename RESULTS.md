# Test results

SvelteKit and `@sveltejs/adapter-cloudflare` built from [`d23089250`](https://github.com/sveltejs/kit/commit/d23089250798c65388f5c7f2b6af15661f00269b), the tip of https://github.com/sveltejs/kit/pull/17708 when this ran.

`pnpm test` writes this file.

**❌ `vite build` failed, `vite preview` did not run.**

| Step | Result |
| --- | --- |
| `vite dev` starts | ✅ passed |
| `vite build` | ❌ failed |
| `vite preview` starts | ⚪ not run |

## Build error

The tests against `vite preview` did not run, because the build failed:

```
error during build:
Error: Cannot access cloudflare:workers in a prerenderable route
    at Object.unavailable (node_modules/@sveltejs/adapter-cloudflare/src/virtual-cloudflare-workers.js:8:8)
    at .svelte-kit/output/server/entries/pages/top-level/_page.server.ts.js:3:20
    at ModuleJob.run (node:internal/modules/esm/module_job:343:25)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:681:26)
    at async Promise.all (index 11)
    at async analyse (node_modules/@sveltejs/kit/src/core/postbuild/analyse.js:69:16)
    at async MessagePort.<anonymous> (node_modules/@sveltejs/kit/src/utils/fork.js:21:22)
ELIFECYCLE Command failed with exit code 1.
```

## All tests

| Test | `vite dev` | `vite preview` |
| --- | --- | --- |
| / › renders in workerd | ✅ passed | ⚪ not run |
| / › reads bindings and secrets | ✅ passed | ⚪ not run |
| / › shares module state with the custom Worker | ✅ passed | ⚪ not run |
| / › sets cookies and streams | ✅ passed | ⚪ not run |
| /remote › runs queries on a full page load | ✅ passed | ⚪ not run |
| /remote › runs a command and a form after navigating | ✅ passed | ⚪ not run |
| /chat sends messages through a Durable Object | ✅ passed | ⚪ not run |
| /ws echoes over a WebSocket | ✅ passed | ⚪ not run |
| /lib styles a library component without JavaScript | ✅ passed | ⚪ not run |
| /read reads a file | ✅ passed | ⚪ not run |
| /kv uses a KV binding | ✅ passed | ⚪ not run |
| /counter calls a Durable Object over RPC | ✅ passed | ⚪ not run |
| /about is prerendered | ✅ passed | ⚪ not run |
| /top-level uses cloudflare:workers at the top level | ✅ passed | ⚪ not run |
| /actions › redirects after a form action | ✅ passed | ⚪ not run |
| /actions › fails without a name | ✅ passed | ⚪ not run |
| /internal fetches an endpoint from a universal load | ✅ passed | ⚪ not run |
| /stats › shares module state with the custom Worker | ✅ passed | ⚪ not run |
| /stats › counts runs of the scheduled handler | ✅ passed | ⚪ not run |
| /instrumented runs instrumentation.server.ts in workerd | ✅ passed | ⚪ not run |
| /boom shows an expected error | ✅ passed | ⚪ not run |
| /crash shows an unexpected error | ✅ passed | ⚪ not run |
