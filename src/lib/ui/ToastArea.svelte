<script lang="ts">
	let { messages = [] } = $props<{ messages?: string[] }>();
</script>

<div aria-label="Toasts" role="status">
	{#each messages as message}
		<p>{message}</p>
	{/each}
</div>
