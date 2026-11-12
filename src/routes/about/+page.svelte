<script lang="ts">
	let { data } = $props();
</script>

<h1 id="about">about</h1>

<ul>
	<li>rendered in: <span id="runtime">{data.runtime}</span></li>
	<li>rendered at: <span id="rendered-at">{data.rendered_at}</span></li>
</ul>

<style>
	h1 {
		color: rgb(0, 0, 200);
	}
</style>
