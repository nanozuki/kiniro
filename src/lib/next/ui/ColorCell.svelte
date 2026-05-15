<script lang="ts">
	let { label, hex, warning = '' } = $props<{ label: string; hex: string; warning?: string }>();
</script>

<div class="cell" title={warning} style:background-color={hex}>
	<span>{label}</span>
	<span>{hex}</span>
	{#if warning}<span aria-label="Gamut warning">!</span>{/if}
</div>

<style>
	.cell { border: 1px solid currentColor; min-width: 5rem; padding: 0.5rem; }
</style>
