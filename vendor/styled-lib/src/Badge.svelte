<script>
	let { children } = $props();
</script>

<span class="badge">{@render children()}</span>

<style>
	.badge {
		color: rgb(1, 2, 3);
		border: 1px solid rgb(4, 5, 6);
	}
</style>
