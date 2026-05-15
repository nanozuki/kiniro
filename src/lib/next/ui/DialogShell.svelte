<script lang="ts">
	import type { Snippet } from 'svelte';
	let { title, open = false, children } = $props<{ title: string; open?: boolean; children?: Snippet }>();
</script>

{#if open}
	<section role="dialog" aria-modal="true" aria-label={title}>
		<h2>{title}</h2>
		{@render children?.()}
	</section>
{/if}
