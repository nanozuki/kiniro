<script lang="ts">
	let { value, editing = false, oncommit = (_value: string) => {}, onedit = () => {} } = $props<{
		value: string;
		editing?: boolean;
		oncommit?: (value: string) => void;
		onedit?: () => void;
	}>();
	let draft = $state('');

	// Re-seed the draft when the owning component swaps the value (e.g. switching items).
	$effect.pre(() => {
		draft = value;
	});
</script>

{#if editing}
	<input aria-label="Name" bind:value={draft} oninput={() => oncommit(draft)} onblur={() => oncommit(draft)} />
{:else}
	<span>{value}</span> <button type="button" onclick={onedit}>Rename</button>
{/if}
