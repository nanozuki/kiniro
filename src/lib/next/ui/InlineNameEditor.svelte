<script lang="ts">
	let { value, editing = false, oncommit = (_value: string) => {}, onedit = () => {} } = $props<{
		value: string;
		editing?: boolean;
		oncommit?: (value: string) => void;
		onedit?: () => void;
	}>();
	let draft = $state(value);
</script>

{#if editing}
	<input aria-label="Name" bind:value={draft} oninput={() => oncommit(draft)} onblur={() => oncommit(draft)} />
{:else}
	<span>{value}</span> <button type="button" onclick={onedit}>Rename</button>
{/if}
