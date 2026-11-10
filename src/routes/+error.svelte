<script lang="ts">
	import { page } from '$app/state';
</script>

<h1 id="error">{page.status}: {page.error?.message}</h1>
