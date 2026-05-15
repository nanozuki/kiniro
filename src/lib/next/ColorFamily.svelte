<script lang="ts">
	import { formatLightness } from './color';
	import { generateFamily } from './palette';
	import type { ColorFamilyStructure, ThemeVariant } from './model';

	let {
		family,
		variant,
		variantCount = 1,
		onrename = (_id: string, _name: string) => {},
		ondelete = (_id: string) => {},
		onaddramp = (_familyId: string) => {}
	} = $props<{
		family: ColorFamilyStructure;
		variant: ThemeVariant;
		variantCount?: number;
		onrename?: (id: string, name: string) => void;
		ondelete?: (id: string) => void;
		onaddramp?: (familyId: string) => void;
	}>();

	let editingName = $state(false);
	let nameDraft = $state('');
	let generated = $derived(generateFamily(family, variant));
</script>

<section aria-label={`Color family ${family.name}`} class="color-family">
	<header class="family-header">
		<div>
			{#if editingName}
				<input aria-label="Family name" bind:value={nameDraft} oninput={() => onrename(family.id, nameDraft)} onblur={() => { onrename(family.id, nameDraft); editingName = false; }} />
			{:else}
				<h3>{family.name}</h3>
			{/if}
			<div aria-label="Step scale summary" class="step-summary">
				{#each generated.steps as step}
					<span>{step.index}: {formatLightness(step.lightness)}</span>
				{/each}
			</div>
		</div>
		<div class="actions">
			<button type="button" onclick={() => { nameDraft = family.name; editingName = true; }}>Rename family</button>
			<button type="button" onclick={() => ondelete(family.id)}>Delete family</button>
			<button type="button" onclick={() => onaddramp(family.id)}>Add Color Ramp</button>
		</div>
	</header>

	{#if variantCount > 1}
		<p class="warning">Family structure is shared by all variants in this theme.</p>
	{/if}

	{#if family.ramps.length === 0}
		<p>No color ramps yet.</p>
	{:else}
		<div class="ramps">
			{#each generated.ramps as ramp}
				<section aria-label={`Color ramp ${ramp.name}`} class="ramp-placeholder">
					<h4>{ramp.name}</h4>
					<p>{ramp.swatches.length} swatches</p>
				</section>
			{/each}
		</div>
	{/if}
</section>

<style>
	.color-family { border: 1px solid currentColor; border-radius: 0.75rem; padding: 1rem; display: grid; gap: 1rem; }
	.family-header { position: sticky; top: 0; display: flex; justify-content: space-between; gap: 1rem; align-items: start; background: Canvas; padding-block: 0.25rem; }
	.step-summary, .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
	.warning { color: #92400e; }
	.ramps { display: grid; gap: 0.75rem; }
	.ramp-placeholder { border: 1px dashed currentColor; border-radius: 0.5rem; padding: 0.75rem; }
</style>
