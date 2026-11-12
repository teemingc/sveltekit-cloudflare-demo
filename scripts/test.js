// Runs the tests against `vite dev`, builds, then runs them against `vite preview`, and writes
// RESULTS.md. Each step runs even if an earlier one failed, so that the results cover all of them.
//
// `node scripts/test.js` runs every step. The workflow runs them one at a time, so that the step
// that failed is the one marked as failed:
//
//   node scripts/test.js dev       tests `vite dev`
//   node scripts/test.js build     runs `vite build`
//   node scripts/test.js preview   tests `vite preview`
//   node scripts/test.js report    writes RESULTS.md from what the steps left in .test-report
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { render, tidy } from './render.js';

const root = new URL('..', import.meta.url);
const report_dir = new URL('.test-report/', root);

/** @typedef {import('./render.js').Status} Status */
/** @typedef {import('./render.js').Failure} Failure */
/** @typedef {'dev' | 'preview'} Mode */

/**
 * @param {Mode} mode
 * @returns {boolean} whether every test passed
 */
function run_tests(mode) {
	fs.rmSync(new URL(`${mode}.json`, report_dir), { force: true });

	const { status } = spawnSync('pnpm', ['exec', 'playwright', 'test'], {
		cwd: root,
		stdio: 'inherit',
		env: { ...process.env, MODE: mode }
	});

	return status === 0;
}

/** @returns {Promise<boolean>} whether the build succeeded */
async function build() {
	const file = new URL('build.json', report_dir);
	fs.rmSync(file, { force: true });

	// streams the output as it comes, and keeps it for the build error in RESULTS.md
	let output = '';
	const child = spawn('pnpm', ['build'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
	child.stdout.on('data', (chunk) => (process.stdout.write(chunk), (output += chunk)));
	child.stderr.on('data', (chunk) => (process.stderr.write(chunk), (output += chunk)));
	const code = await new Promise((fulfil) => child.on('close', fulfil));
	const ok = code === 0;
	// the errors come last in the output
	const error = ok ? null : output.slice(Math.max(0, output.indexOf('error during build')));

	fs.mkdirSync(report_dir, { recursive: true });
	fs.writeFileSync(file, JSON.stringify({ ok, error }));

	if (error !== null && process.env.GITHUB_ACTIONS) {
		// an annotation on the run, like the ones for failed tests. Its message is one line, so
		// the line breaks are escaped
		const message = tidy(error)
			.trim()
			.split('\n')
			.slice(0, 15)
			.join('\n')
			.replaceAll('%', '%25')
			.replaceAll('\r', '%0D')
			.replaceAll('\n', '%0A');
		console.log(`::error title=vite build failed::${message}`);
	}

	return ok;
}

/**
 * @param {Mode} mode
 * @returns {{ statuses: Map<string, Status>, failures: Failure[] } | undefined} the results of
 * the tests, if they ran
 */
function read_tests(mode) {
	const file = new URL(`${mode}.json`, report_dir);
	if (!fs.existsSync(file)) return;

	/** @type {Array<{ line: number, title: string, status: Status, error: string | null }>} */
	const tests = [];

	/** @param {any} suite @param {string[]} titles */
	function collect(suite, titles) {
		for (const spec of suite.specs ?? []) {
			const test = spec.tests[0];
			const status = test?.status === 'skipped' ? 'skipped' : spec.ok ? 'passed' : 'failed';
			const result = test?.results?.at(-1);
			tests.push({
				line: spec.line,
				title: [...titles, spec.title].join(' › '),
				status,
				error:
					status === 'failed'
						? (result?.error?.message ?? result?.errors?.[0]?.message ?? 'Failed').slice(0, 1500)
						: null
			});
		}
		for (const child of suite.suites ?? []) collect(child, [...titles, child.title]);
	}

	// the top-level suites are files, whose titles we leave out
	for (const suite of JSON.parse(fs.readFileSync(file, 'utf8')).suites) collect(suite, []);

	// in the order of the test file
	tests.sort((a, b) => a.line - b.line);

	return {
		statuses: new Map(tests.map((t) => [t.title, t.status])),
		failures: tests
			.filter((t) => t.status === 'failed')
			.map((t) => ({ title: t.title, mode, error: /** @type {string} */ (t.error) }))
	};
}

/** @returns {boolean} whether everything passed */
function report() {
	const dev = read_tests('dev');
	const preview = read_tests('preview');

	const build_file = new URL('build.json', report_dir);
	/** @type {{ ok: boolean, error: string | null } | undefined} */
	const build = fs.existsSync(build_file)
		? JSON.parse(fs.readFileSync(build_file, 'utf8'))
		: undefined;

	const titles = new Set([...(dev?.statuses.keys() ?? []), ...(preview?.statuses.keys() ?? [])]);

	/** @type {import('./render.js').Results} */
	const results = {
		steps: {
			// a missing report means that the server did not start
			dev: dev ? 'passed' : 'failed',
			build: build ? (build.ok ? 'passed' : 'failed') : 'not run',
			preview: preview ? 'passed' : build?.ok ? 'failed' : 'not run'
		},
		tests: Array.from(titles, (title) => ({
			title,
			dev: dev?.statuses.get(title) ?? 'not run',
			preview: preview?.statuses.get(title) ?? 'not run'
		})),
		failures: [...(dev?.failures ?? []), ...(preview?.failures ?? [])].slice(0, 50),
		build_error: build?.ok === false ? build.error : null
	};

	// the workflow's commit job renders RESULTS.md from this file
	fs.mkdirSync(report_dir, { recursive: true });
	fs.writeFileSync(new URL('results.json', report_dir), JSON.stringify(results, null, '\t'));
	fs.writeFileSync(new URL('RESULTS.md', root), render(results));

	const problems = [
		...(['dev', 'build', 'preview'] /** @type {const} */)
			.filter((step) => results.steps[step] !== 'passed')
			.map((step) => `vite ${step}: ${results.steps[step]}`),
		...results.failures.map((f) => `vite ${f.mode} › ${f.title}`)
	];

	if (problems.length === 0) {
		console.log('\nWrote RESULTS.md: everything passed');
		return true;
	}

	console.log(`\nWrote RESULTS.md: there are failures\n\n${problems.map((p) => `  ✘ ${p}`).join('\n')}`);
	return false;
}

const command = process.argv[2];

if (command === 'dev' || command === 'preview') {
	process.exit(run_tests(command) ? 0 : 1);
} else if (command === 'build') {
	process.exit((await build()) ? 0 : 1);
} else if (command === 'report') {
	// the steps before it already failed if something failed
	report();
} else if (command === undefined) {
	fs.rmSync(report_dir, { recursive: true, force: true });

	console.log('\n# Testing vite dev\n');
	run_tests('dev');

	console.log('\n# Building\n');
	if (await build()) {
		console.log('\n# Testing vite preview\n');
		run_tests('preview');
	}

	process.exit(report() ? 0 : 1);
} else {
	throw new Error(`Unknown command: ${command}`);
}
