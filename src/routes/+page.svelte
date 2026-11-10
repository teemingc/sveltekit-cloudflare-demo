<script lang="ts">
	let { data } = $props();
</script>

<h1 class="title">SvelteKit on Cloudflare</h1>

<ul>
	<li>runtime: <span id="runtime">{data.runtime}</span></li>
	<li>WebSocketPair exists: <span id="websocket">{data.has_websocket_pair}</span></li>
	<li>client address: <span id="client-address">{data.client_address}</span></li>
	<li>GREETING from <code>cloudflare:workers</code>: <span id="greeting-env">{data.greeting_env}</span></li>
	<li>GREETING from <code>$app/env/private</code>: <span id="greeting-kit">{data.greeting_kit}</span></li>
	<li>API_KEY secret set: <span id="api-key">{data.api_key_set}</span></li>
	<li>undeclared .dev.vars key: <span id="not-declared">{data.not_declared}</span></li>
	<li>state set by the custom Worker: <span id="worker-loaded">{data.worker_loaded}</span></li>
	<li>visits (cookie): <span id="visits">{data.visits}</span></li>
	<li>
		streamed:
		{#await data.slow}
			loading
		{:then value}
			<span id="slow">{value}</span>
		{/await}
	</li>
</ul>

<style>
	.title {
		color: rgb(200, 0, 0);
	}
</style>
