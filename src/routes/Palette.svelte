<!--
@component
- The main palette editor for the selected variant.
- Renders color families as separate work sections.
- With no families, it keeps only the add action visible.
-->

<script lang="ts">
	import ColorFamily from '$lib/ui/ColorFamily.svelte';
	import { getAppManagerContext } from '$lib/state/appContext';

	const app = getAppManagerContext();
	let theme = $derived(app.selectedTheme);
	let variant = $derived(app.selectedVariant);
	let families = $derived(theme?.structure.families ?? []);
	let targetGamut = $derived(theme?.targetGamut ?? 'srgb');
	let variantCount = $derived(theme?.variants.length ?? 1);
</script>

<section aria-label="Palette" class="palette">
	<header>
		<h2>Palette</h2>
		<button type="button" onclick={() => void app.addFamily()}>Add Color Family</button>
	</header>

	{#if !theme || !variant}
		<p>No theme selected.</p>
	{:else if families.length === 0}
		<p>No color families yet.</p>
	{:else}
		<div class="families">
			{#each families as family (family.id)}
				<ColorFamily {family} {variant} gamut={targetGamut} {variantCount} />
			{/each}
		</div>
	{/if}
</section>

<style>
	.palette,
	.families {
		display: grid;
		gap: 1rem;
	}
	header {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: center;
	}
</style>
