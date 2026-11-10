<script lang="ts">
	import { add, build_info, get_count, greet, greeting, runtime } from './data.remote';
</script>

<p>runtime: <span id="runtime">{await runtime()}</span></p>
<p>greeting: <span id="greeting">{await greeting()}</span></p>
<p>count: <span id="count">{await get_count()}</span></p>
<p>prerender: <span id="prerendered">{await build_info()}</span></p>

<button id="add" onclick={() => add(1)}>add</button>

<form {...greet}>
	<input {...greet.fields.name.as('text')} />
	<button id="greet">greet</button>
</form>

<p id="greet-result">{greet.result}</p>
