// The SvelteKit packages under test and the pull request they are built from
import fs from 'node:fs';

/** the pull request at the tip of the stack, see the README */
export const pull_request = 17708;

export const packages = ['@sveltejs/kit', '@sveltejs/adapter-cloudflare'];

const package_json = new URL('../package.json', import.meta.url);

/** @param {string} name @param {string} sha */
export function package_url(name, sha) {
	return `https://pkg.svelte.dev/${name}/c/${sha}`;
}

/** @returns {string} the commit of sveltejs/kit that package.json installs */
export function pinned_sha() {
	const { devDependencies } = JSON.parse(fs.readFileSync(package_json, 'utf8'));
	const shas = new Set(packages.map((name) => devDependencies[name].split('/').pop()));
	if (shas.size !== 1) throw new Error(`${packages.join(' and ')} are pinned to different commits`);
	return [...shas][0];
}

/** @param {string} sha */
export function pin(sha) {
	let contents = fs.readFileSync(package_json, 'utf8');
	const from = pinned_sha();
	for (const name of packages) {
		contents = contents.replace(package_url(name, from), package_url(name, sha));
	}
	fs.writeFileSync(package_json, contents);
}
