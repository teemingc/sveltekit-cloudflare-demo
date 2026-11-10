<script lang="ts">
	let messages: string[] = $state([]);
	let text = $state('');
	let socket: WebSocket | undefined;

	$effect(() => {
		const ws = new WebSocket(location.origin.replace(/^http/, 'ws') + '/room');
		ws.onmessage = (event) => messages.push(String(event.data));
		socket = ws;
		return () => ws.close();
	});

	function send(event: SubmitEvent) {
		event.preventDefault();
		socket?.send(text);
		text = '';
	}
</script>

<p>Messages go through a Durable Object to everyone with this page open.</p>

<form onsubmit={send}>
	<input bind:value={text} placeholder="say something" />
	<button>send</button>
</form>

<ul id="messages">
	{#each messages as message, i (i)}
		<li>{message}</li>
	{/each}
</ul>
