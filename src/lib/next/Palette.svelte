<script lang="ts">
	import type { ColorFamilyStructure, ThemeVariant } from './model';

	let { families, variant, onaddfamily = () => {} } = $props<{
		families: ColorFamilyStructure[];
		variant: ThemeVariant;
		onaddfamily?: () => void;
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
				<section aria-label={`Color family ${family.name}`} class="family-placeholder">
					<h3>{family.name}</h3>
					<p>{variant.values.families[family.id]?.ramps ? family.ramps.length : 0} ramps</p>
				</section>
			{/each}
		</div>
	{/if}
</section>

<style>
	.palette, .families { display: grid; gap: 1rem; }
	header { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
	.family-placeholder { border: 1px solid currentColor; border-radius: 0.5rem; padding: 1rem; }
</style>
