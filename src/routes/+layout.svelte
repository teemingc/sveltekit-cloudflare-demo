<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<nav>
	<a href="/">home</a>
	<a href="/remote">remote functions</a>
	<a href="/chat">websocket chat</a>
	<a href="/actions">form actions</a>
	<a href="/about">prerendered</a>
	<a href="/top-level">top-level access</a>
	<a href="/lib">library css</a>
	<a href="/internal">internal fetch</a>
	<a href="/boom">expected error</a>
	<a href="/crash">unexpected error</a>
</nav>

{@render children()}
