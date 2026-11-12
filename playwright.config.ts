import { defineConfig } from '@playwright/test';

// `dev` tests `vite dev`, `preview` tests the built Worker with `vite preview`
const mode = process.env.MODE === 'preview' ? 'preview' : 'dev';
const port = mode === 'dev' ? 5173 : 4173;

export default defineConfig({
	testDir: 'tests',
	// the tests share counters, cookies and module state on the one server
	workers: 1,
	forbidOnly: !!process.env.CI,
	// names the mode in the output, and in the annotations on GitHub
	projects: [{ name: mode }],
	reporter: [
		['list'],
		['json', { outputFile: `.test-report/${mode}.json` }],
		// keeps the trace of each failed test, which the workflow uploads
		['html', { outputFolder: `.test-report/html-${mode}`, open: 'never' }],
		...(process.env.GITHUB_ACTIONS ? [['github'] as const] : [])
	],
	outputDir: `test-results/${mode}`,
	use: { baseURL: `http://localhost:${port}`, trace: 'retain-on-failure' },
	webServer: {
		command: `pnpm ${mode} --port ${port} --strictPort`,
		port,
		reuseExistingServer: !process.env.CI,
		// lets the dev server remove itself from the local registry of Workers. A stale entry
		// stops the next dev server from running the scheduled handler
		gracefulShutdown: { signal: 'SIGINT', timeout: 5000 }
	}
});
