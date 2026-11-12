export const prerender = true;

export function load() {
	return {
		// workerd during dev, and wherever SvelteKit prerenders during the build
		runtime: navigator.userAgent,
		rendered_at: new Date().toISOString()
	};
}
