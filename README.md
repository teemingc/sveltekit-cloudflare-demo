# SvelteKit on Cloudflare demo

A SvelteKit app that runs in Cloudflare's `workerd` runtime during `vite dev`, using SvelteKit and `@sveltejs/adapter-cloudflare` built from these unreleased PRs:

- https://github.com/sveltejs/kit/pull/17706 lets adapters render dev requests in their platform's runtime, then https://github.com/sveltejs/kit/pull/17712 (CSS), https://github.com/sveltejs/kit/pull/17709 (`read`), https://github.com/sveltejs/kit/pull/17710 (remote functions) and https://github.com/sveltejs/kit/pull/17711 (`adapter.supports`)
- https://github.com/sveltejs/kit/pull/17707 runs dev in workerd and https://github.com/sveltejs/kit/pull/17708 adds the custom Worker entrypoint

`package.json` installs both packages from [pkg.svelte.dev](https://pkg.svelte.dev), pinned to a commit of https://github.com/sveltejs/kit/pull/17708, which is the tip of the stack. [RESULTS.md](./RESULTS.md) shows which tests pass with that commit.

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
| `/about` | a prerendered page with a server `load`, which shows the runtime that rendered it and when |
| `/top-level` | `cloudflare:workers` used at the top level of a server module |
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

## Test it

```sh
pnpm exec playwright install chromium
pnpm test
```

This runs `tests/demo.test.ts` against `vite dev`, builds the app, runs the tests again against `vite preview` and writes [RESULTS.md](./RESULTS.md). A failing build doesn't stop the `vite dev` results from being reported, but the tests against `vite preview` can't run without one.

To run the tests against one of them, use `MODE=dev pnpm exec playwright test` or `pnpm build && MODE=preview pnpm exec playwright test`.

`RESULTS.md` starts with what failed, then the error of each failed test and of the build. In the `Test` workflow, each of `vite dev`, `vite build` and `vite preview` is its own step, so the step marked as failed is the stage that failed, failed tests appear as annotations on the run, and the run's summary shows `RESULTS.md`. When something fails, the run uploads the Playwright reports, with a trace of each failed test, as the `playwright-report` artifact. Open one with `pnpm exec playwright show-report <folder>`.

## Updating SvelteKit

`pnpm update-kit` pins `package.json` to the latest commit of the pull request, once pkg.svelte.dev has built it. Then run `pnpm install`.

The `Test` workflow does this every hour, and on every push. It only runs the tests if the pull request or this repository changed since the tests last ran, then commits the update along with the new `RESULTS.md`. To run the tests regardless, run the workflow by hand with `force` ticked. To follow a different pull request, change `pull_request` in `scripts/packages.js`.

The job that runs the tests can't write to this repository, because it runs code from a pull request that nobody reviewed for it. A second job commits the results, which `scripts/render.js` checks before writing them into `RESULTS.md`.
