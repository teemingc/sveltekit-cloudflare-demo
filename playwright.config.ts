import { defineConfig } from '@playwright/test';

// `dev` tests `vite dev`, `preview` tests the built Worker with `vite preview`
const mode = process.env.MODE === 'preview' ? 'preview' : 'dev';
const port = mode === 'dev' ? 5173 : 4173;

export default defineConfig({
	testDir: 'tests',
	// the tests share counters, cookies and module state on the one server
	workers: 1,
	forbidOnly: !!process.env.CI,
	reporter: [['list'], ['json', { outputFile: `.test-report/${mode}.json` }]],
	use: { baseURL: `http://localhost:${port}` },
	webServer: {
		command: `pnpm ${mode} --port ${port} --strictPort`,
		port,
		reuseExistingServer: !process.env.CI,
		// lets the dev server remove itself from the local registry of Workers. A stale entry
		// stops the next dev server from running the scheduled handler
		gracefulShutdown: { signal: 'SIGINT', timeout: 5000 }
	}
});
