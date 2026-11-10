import { defineEnvVars } from '@sveltejs/kit/env';
import * as v from 'valibot';

export const variables = defineEnvVars({
	// optional so that the app still starts if you deploy without uploading the secret
	API_KEY: { schema: v.optional(v.string()) },
	GREETING: {}
});
