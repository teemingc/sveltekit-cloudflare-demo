// Runs the tests against `vite dev`, builds, then runs them against `vite preview`, and writes
// RESULTS.md. Each step runs even if an earlier one failed, so that the results cover all of them
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { render } from './render.js';

const root = new URL('..', import.meta.url);
const report_dir = new URL('.test-report/', root);

/** @typedef {import('./render.js').Status} Status */

/**
 * @param {'dev' | 'preview'} mode
 * @returns {Map<string, Status> | undefined} the status of each test, if the tests ran
 */
function run_tests(mode) {
	const report = new URL(`${mode}.json`, report_dir);
	fs.rmSync(report, { force: true });

	spawnSync('pnpm', ['exec', 'playwright', 'test'], {
		cwd: root,
		stdio: 'inherit',
		env: { ...process.env, MODE: mode }
	});

	if (!fs.existsSync(report)) return;

	/** @type {Array<{ line: number, title: string, status: Status }>} */
	const tests = [];

	/** @param {any} suite @param {string[]} titles */
	function collect(suite, titles) {
		for (const spec of suite.specs ?? []) {
			tests.push({
				line: spec.line,
				title: [...titles, spec.title].join(' › '),
				status: spec.tests[0]?.status === 'skipped' ? 'skipped' : spec.ok ? 'passed' : 'failed'
			});
		}
		for (const child of suite.suites ?? []) collect(child, [...titles, child.title]);
	}

	// the top-level suites are files, whose titles we leave out
	for (const file of JSON.parse(fs.readFileSync(report, 'utf8')).suites) collect(file, []);

	// in the order of the test file
	const results = new Map(tests.sort((a, b) => a.line - b.line).map((t) => [t.title, t.status]));

	return results;
}

console.log('\n# Testing vite dev\n');
const dev = run_tests('dev');

console.log('\n# Building\n');
const build = spawnSync('pnpm', ['build'], { cwd: root, encoding: 'utf8' });
const build_output = `${build.stdout}${build.stderr}`;
const built = build.status === 0;
console.log(build_output);

/** @type {Map<string, Status> | undefined} */
let preview;
if (built) {
	console.log('\n# Testing vite preview\n');
	preview = run_tests('preview');
}

const titles = new Set([...(dev?.keys() ?? []), ...(preview?.keys() ?? [])]);

/** @type {import('./render.js').Results} */
const results = {
	steps: {
		dev: dev ? 'passed' : 'failed',
		build: built ? 'passed' : 'failed',
		preview: preview ? 'passed' : built ? 'failed' : 'not run'
	},
	tests: Array.from(titles, (title) => ({
		title,
		dev: dev?.get(title) ?? 'not run',
		preview: preview?.get(title) ?? 'not run'
	})),
	// the errors come last in the output
	build_error: built ? null : build_output.slice(build_output.indexOf('error during build'))
};

// the workflow's commit job renders RESULTS.md from this file
fs.mkdirSync(report_dir, { recursive: true });
fs.writeFileSync(new URL('results.json', report_dir), JSON.stringify(results, null, '\t'));
fs.writeFileSync(new URL('RESULTS.md', root), render(results));

const statuses = results.tests.flatMap((test) => [test.dev, test.preview]);
const ok = dev && built && preview && !statuses.includes('failed');
console.log(`\nWrote RESULTS.md: ${ok ? 'everything passed' : 'there are failures'}`);
process.exit(ok ? 0 : 1);
