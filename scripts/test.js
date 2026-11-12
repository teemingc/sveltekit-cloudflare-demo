// Runs the tests against `vite dev`, builds, then runs them against `vite preview`, and writes
// RESULTS.md. Each step runs even if an earlier one failed, so that the results cover all of them
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { pinned_sha, pull_request } from './packages.js';

const root = new URL('..', import.meta.url);
const report_dir = new URL('.test-report/', root);

/** @typedef {'passed' | 'failed' | 'skipped' | 'not run'} Status */

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

const icons = { passed: '✅', failed: '❌', skipped: '➖', 'not run': '⚪' };

/** @param {Status} status */
const cell = (status) => `${icons[status]} ${status}`;

const sha = pinned_sha();
const titles = new Set([...(dev?.keys() ?? []), ...(preview?.keys() ?? [])]);

const lines = [
	'# Test results',
	'',
	`SvelteKit and \`@sveltejs/adapter-cloudflare\` built from [\`${sha.slice(0, 9)}\`](https://github.com/sveltejs/kit/commit/${sha}), the tip of https://github.com/sveltejs/kit/pull/${pull_request} when this ran.`,
	'',
	'`pnpm test` writes this file.',
	'',
	'| Step | Result |',
	'| --- | --- |',
	`| \`vite dev\` starts | ${cell(dev ? 'passed' : 'failed')} |`,
	`| \`vite build\` | ${cell(built ? 'passed' : 'failed')} |`,
	`| \`vite preview\` starts | ${cell(preview ? 'passed' : built ? 'failed' : 'not run')} |`,
	'',
	'| Test | `vite dev` | `vite preview` |',
	'| --- | --- | --- |',
	...Array.from(
		titles,
		(title) =>
			`| ${title} | ${cell(dev?.get(title) ?? 'not run')} | ${cell(preview?.get(title) ?? 'not run')} |`
	)
];

if (!built) {
	// the paths in the output differ between machines, and the errors come last
	const error = build_output
		.slice(build_output.indexOf('error during build'))
		.replaceAll(/\x1b\[[0-9;]*m/g, '')
		.replaceAll(/(file:\/\/)?\/\S*\/node_modules\//g, 'node_modules/')
		.replaceAll(/\?[0-9a-f-]{36}/g, '')
		.replaceAll(new URL('.', root).pathname, '')
		.trim();

	lines.push(
		'',
		'## Build error',
		'',
		'The tests against `vite preview` did not run, because the build failed:',
		'',
		'```',
		...error.split('\n').slice(0, 12),
		'```'
	);
}

fs.writeFileSync(new URL('RESULTS.md', root), lines.join('\n') + '\n');

const statuses = [...(dev?.values() ?? []), ...(preview?.values() ?? [])];
const ok = dev && built && preview && !statuses.includes('failed');
console.log(`\nWrote RESULTS.md: ${ok ? 'everything passed' : 'there are failures'}`);
process.exit(ok ? 0 : 1);
