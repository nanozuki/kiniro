<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import Toaster from '$lib/ui/Toaster.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<Toaster />
{@render children()}
