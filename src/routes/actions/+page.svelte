<script lang="ts">
	let { data, form } = $props();
</script>

<form method="POST">
	<input name="name" />
	<button>submit</button>
</form>

{#if form?.missing}<p id="missing">missing</p>{/if}
{#if data.name}<p id="name">{data.name}</p>{/if}
