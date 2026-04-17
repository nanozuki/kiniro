<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	// The root layout installs app metadata while rendering each route's content.
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
