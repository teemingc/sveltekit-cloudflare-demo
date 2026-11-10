# SvelteKit on Cloudflare demo

A SvelteKit app that runs in Cloudflare's `workerd` runtime during `vite dev`, using SvelteKit and `@sveltejs/adapter-cloudflare` packed from the tips of these unreleased PRs:

- https://github.com/sveltejs/kit/pull/17706 lets adapters render dev requests in their platform's runtime, then https://github.com/sveltejs/kit/pull/17712 (CSS), https://github.com/sveltejs/kit/pull/17709 (`read`), https://github.com/sveltejs/kit/pull/17710 (remote functions) and https://github.com/sveltejs/kit/pull/17711 (`adapter.supports`)
- https://github.com/sveltejs/kit/pull/17707 runs dev in workerd and https://github.com/sveltejs/kit/pull/17708 adds the custom Worker entrypoint

The tarballs in `vendor/` were packed from `claude/cloudflare-custom-worker-entrypoint` at `fdd9cb0a7`.

## Run it

Use pnpm, since `pnpm-workspace.yaml` allows the packed SvelteKit version and workerd's install script.

```sh
pnpm install
cp .dev.vars.example .dev.vars
pnpm dev
```

`pnpm build` then `pnpm preview` runs the built Worker in workerd.

## Deploy it

```sh
pnpm exec cf auth login
printf 'API_KEY=change-me\n' > .secrets
pnpm exec cf deploy --secrets-file .secrets
```

This builds the app and creates the Worker, a KV namespace and the `Counter` and `Room` Durable Objects on your account. `--secrets-file` uploads every key in the file, so don't pass `.dev.vars`: its `NOT_DECLARED` key is there to show that undeclared keys don't reach the Worker during dev. If your login has more than one account, set `CLOUDFLARE_ACCOUNT_ID` to pick one.

Once deployed, a full page load of `/remote` returns 500 because of https://github.com/sveltejs/kit/issues/15035. Navigating to it from another page works.

## What to look at

| Route | Shows |
| --- | --- |
| `/` | the page rendering in workerd, bindings from `cloudflare:workers` and `$app/env/private`, the secret from `.dev.vars`, cookies, streaming and state set by the custom Worker |
| `/remote` | remote functions: a query, a command that refreshes it, a form and a prerender function |
| `/chat` | WebSockets through a Durable Object, open it in two tabs |
| `/ws` | a WebSocket echo created in a `+server.ts` |
| `/lib` | CSS from a component library, inlined during dev |
| `/read` | `read` from `$app/server` |
| `/kv`, `POST /counter` | a KV binding and Durable Object RPC |
| `/about` | a prerendered page |
| `/actions` | a form action that redirects |
| `/internal` | `fetch` to an endpoint from a universal `load` |
| `/stats` | module state shared by `src/worker.ts` and SvelteKit |
| `/instrumented` | `instrumentation.server.ts` running in workerd |
| `/boom`, `/crash` | expected and unexpected errors |

`src/worker.ts` is the custom Worker. It exports the Durable Objects and a `scheduled` handler, and passes requests to SvelteKit. To run the `scheduled` handler during `vite dev`:

```sh
curl -X POST 'http://localhost:5173/cdn-cgi/local/explorer/api/local/scheduled?worker=sveltekit-cloudflare-demo' \
	-H 'content-type: application/json' -d '{"cron":"* * * * *"}'
```

`/stats` then shows `scheduled_runs: 1`.

## Updating the tarballs

From a sveltejs/kit checkout of the branch:

```sh
pnpm -F @sveltejs/kit prepublishOnly
(cd packages/kit && pnpm pack --pack-destination /path/to/this/repo/vendor)
(cd packages/adapter-cloudflare && pnpm pack --pack-destination /path/to/this/repo/vendor)
```

Then run `pnpm install` here.
