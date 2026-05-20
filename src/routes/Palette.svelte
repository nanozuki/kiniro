<!--
@component
- The main palette editor for the selected variant.
- Renders color families as separate work sections.
- With no families, it keeps only the add action visible.
-->

<script lang="ts">
	import ColorFamily from '$lib/ui/ColorFamily.svelte';
	import type { ColorFamilyStructure, ThemeVariant } from '$lib/model';

	let {
		families,
		variant,
		variantCount = 1,
		onaddfamily = () => {},
		onrenamefamily = (_id: string, _name: string) => {},
		ondeletefamily = (_id: string) => {},
		onaddramp = (_familyId: string) => {}
	} = $props<{
		families: ColorFamilyStructure[];
		variant: ThemeVariant;
		variantCount?: number;
		onaddfamily?: () => void;
		onrenamefamily?: (id: string, name: string) => void;
		ondeletefamily?: (id: string) => void;
		onaddramp?: (familyId: string) => void;
	}>();
</script>

<section aria-label="Palette" class="palette">
	<header>
		<h2>Palette</h2>
		<button type="button" onclick={onaddfamily}>Add Color Family</button>
	</header>

	{#if families.length === 0}
		<p>No color families yet.</p>
	{:else}
		<div class="families">
			{#each families as family (family.id)}
				<ColorFamily
					{family}
					{variant}
					{variantCount}
					onrename={onrenamefamily}
					ondelete={ondeletefamily}
					{onaddramp}
				/>
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
