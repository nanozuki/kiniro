<!--
@component
- Test-only host for exercising Dialog's controlled bind:open contract.
-->

<script lang="ts">
	import Dialog from '../Dialog.svelte';

	type DialogHostProps = {
		initiallyOpen?: boolean;
		onopenchange?: (open: boolean) => void;
	};

	let { initiallyOpen = false, onopenchange = (_open: boolean) => {} }: DialogHostProps = $props();

	let open = $state(initialOpen());

	function initialOpen() {
		return initiallyOpen;
	}
</script>

<button type="button" onclick={() => (open = true)}>Open dialog</button>
<p>Open: {open ? 'yes' : 'no'}</p>

<Dialog bind:open title="Dialog title" closeLabel="Close test dialog" {onopenchange}>
	<p>Dialog body</p>
	{#snippet actions()}
		<button type="button">Dialog action</button>
	{/snippet}
</Dialog>
