// Renders RESULTS.md from the results of `scripts/test.js`.
//
// The workflow runs `node scripts/render.js <results.json>` in its commit job, which can write to
// the repository. The results come from the job that ran the packages' code, so nothing in them is
// trusted: only known statuses and plain test titles reach the Markdown, and the build error
// stays inside a code block that it cannot close
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pinned_sha, pull_request } from './packages.js';

/** @typedef {'passed' | 'failed' | 'skipped' | 'not run'} Status */

/**
 * @typedef {{
 *   steps: { dev: Status, build: Status, preview: Status },
 *   tests: Array<{ title: string, dev: Status, preview: Status }>,
 *   build_error: string | null
 * }} Results
 */

const icons = { passed: '✅', failed: '❌', skipped: '➖', 'not run': '⚪' };

/** @param {unknown} status */
function cell(status) {
	if (typeof status !== 'string' || !Object.hasOwn(icons, status)) {
		throw new Error(`Not a status: ${status}`);
	}
	return `${icons[/** @type {Status} */ (status)]} ${status}`;
}

/** @param {unknown} title */
function plain(title) {
	// no characters that Markdown or HTML give a meaning to
	if (typeof title !== 'string' || !/^[\w /›:.,'-]{1,150}$/.test(title)) {
		throw new Error(`Not a plain test title: ${title}`);
	}
	return title;
}

/** @param {unknown} error */
function code(error) {
	if (typeof error !== 'string') throw new Error('The build error is not a string');

	return (
		error
			.replaceAll(/\x1b\[[0-9;]*m/g, '')
			// the paths differ between machines
			.replaceAll(/(file:\/\/)?\/\S*\/node_modules\//g, 'node_modules/')
			.replaceAll(/\?[0-9a-f-]{36}/g, '')
			.replaceAll(fileURLToPath(new URL('..', import.meta.url)), '')
			// a run of backticks or tildes would end the code block
			.replaceAll(/[^\x20-\x7e\n]|[`~]/g, '')
			.trim()
			.split('\n')
			.slice(0, 12)
			.map((line) => line.slice(0, 400))
	);
}

/**
 * @param {Results} results
 * @returns {string}
 */
export function render(results) {
	if (!Array.isArray(results?.tests) || results.tests.length > 200) {
		throw new Error('Expected a list of at most 200 tests');
	}

	const sha = pinned_sha();

	const lines = [
		'# Test results',
		'',
		`SvelteKit and \`@sveltejs/adapter-cloudflare\` built from [\`${sha.slice(0, 9)}\`](https://github.com/sveltejs/kit/commit/${sha}), the tip of https://github.com/sveltejs/kit/pull/${pull_request} when this ran.`,
		'',
		'`pnpm test` writes this file.',
		'',
		'| Step | Result |',
		'| --- | --- |',
		`| \`vite dev\` starts | ${cell(results.steps?.dev)} |`,
		`| \`vite build\` | ${cell(results.steps?.build)} |`,
		`| \`vite preview\` starts | ${cell(results.steps?.preview)} |`,
		'',
		'| Test | `vite dev` | `vite preview` |',
		'| --- | --- | --- |',
		...results.tests.map(
			(test) => `| ${plain(test?.title)} | ${cell(test?.dev)} | ${cell(test?.preview)} |`
		)
	];

	if (results.build_error != null) {
		lines.push(
			'',
			'## Build error',
			'',
			'The tests against `vite preview` did not run, because the build failed:',
			'',
			'```',
			...code(results.build_error),
			'```'
		);
	}

	return lines.join('\n') + '\n';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const results = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
	fs.writeFileSync(new URL('../RESULTS.md', import.meta.url), render(results));
}
