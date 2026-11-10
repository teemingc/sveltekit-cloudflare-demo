export async function load({ fetch }) {
	const response = await fetch('/stats');
	return { stats: (await response.json()) as { requests: number } };
}
