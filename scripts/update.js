// Pins package.json to the latest commit of the pull request, once pkg.svelte.dev has built it.
// Prints `changed=true` or `changed=false` and the pinned `sha`, which the workflow reads as step
// outputs. `node scripts/update.js <sha>` pins that commit instead
import { execFileSync } from 'node:child_process';
import { package_url, packages, pin, pinned_sha, pull_request } from './packages.js';

if (process.argv[2]) {
	pin(process.argv[2]);
	process.exit();
}

const ref = `refs/pull/${pull_request}/head`;
const [head] = execFileSync('git', ['ls-remote', 'https://github.com/sveltejs/kit', ref], {
	encoding: 'utf8'
}).split(/\s/);

if (!/^[0-9a-f]{40}$/.test(head)) throw new Error(`Could not resolve ${ref}`);

const current = pinned_sha();
let changed = false;

if (head === current) {
	console.error(`Already on ${head}`);
} else {
	const responses = await Promise.all(
		packages.map((name) => fetch(package_url(name, head), { method: 'HEAD' }))
	);

	if (responses.every((response) => response.ok)) {
		pin(head);
		changed = true;
		console.error(`Updated from ${current} to ${head}`);
	} else {
		// the next run picks it up
		console.error(`pkg.svelte.dev has not built ${head} yet, staying on ${current}`);
	}
}

console.log(`changed=${changed}`);
console.log(`sha=${pinned_sha()}`);
