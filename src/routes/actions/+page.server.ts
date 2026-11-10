import { fail, redirect } from '@sveltejs/kit';

export function load({ url }) {
	return { name: url.searchParams.get('name') };
}

export const actions = {
	default: async ({ request }) => {
		const name = (await request.formData()).get('name');
		if (!name) return fail(400, { missing: true });
		redirect(303, `/actions?name=${encodeURIComponent(String(name))}`);
	}
};
