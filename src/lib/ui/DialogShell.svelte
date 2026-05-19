<script lang="ts">
	import type { Snippet } from 'svelte';
	let {
		title,
		open = false,
		children
	} = $props<{ title: string; open?: boolean; children?: Snippet }>();
</script>

{#if open}
	<div role="dialog" aria-modal="true" aria-label={title} tabindex="-1">
		<h2>{title}</h2>
		{@render children?.()}
	</div>
{/if}
