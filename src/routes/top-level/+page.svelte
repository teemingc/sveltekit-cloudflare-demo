<script lang="ts">
	let { data } = $props();
</script>

<h1>top-level access</h1>

<ul>
	<li>GREETING read at the top level: <span id="greeting">{data.greeting}</span></li>
	<li>runtime read at the top level: <span id="runtime">{data.runtime}</span></li>
	<li>classes imported from <code>cloudflare:workers</code>: <span id="classes">{data.classes.join(', ')}</span></li>
</ul>
