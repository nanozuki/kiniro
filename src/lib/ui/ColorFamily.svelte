<!--
@component
- One color-family editing section inside the palette.
- Combines family naming, step-scale editing, ramp rendering, and family actions.
- Shows the shared-structure warning when the theme has multiple variants.
- Owns only ephemeral rename state; the AppManager edit session owns preview,
  submit, validation repair, undo history, and persistence.
-->

<script lang="ts">
	import { createSourceColor } from '$lib/color';
	import { getAppManagerContext } from '$lib/state/appContext';
	import ColorRamp from './ColorRamp.svelte';
	import InlineInput from './InlineInput.svelte';
	import { createInlineEditSession, type InlineEditSession } from './InlineInput.svelte';
	import { generateFamily } from '../palette';
	import StepScale from './StepScale.svelte';
	import type { ColorFamilyStructure, Gamut, ThemeVariant } from '../model';

	type ColorFamilyProps = {
		family: ColorFamilyStructure;
		variant: ThemeVariant;
		variantCount?: number;
		gamut: Gamut;
	};

	let { family, variant, variantCount = 1, gamut }: ColorFamilyProps = $props();

	const app = getAppManagerContext();
	let editingName = $state(false);
	let nameSession = $state<InlineEditSession | null>(null);
	let generated = $derived(generateFamily(family, variant, gamut));

	function startFamilyRename() {
		nameSession = app.editFamilyName(family.id);
		editingName = true;
	}
</script>

<section aria-label={`Color family ${family.name}`} class="color-family">
	<header class="family-header">
		<div>
			{#if editingName && nameSession}
				<InlineInput
					aria-label="Family name"
					value={family.name}
					session={createInlineEditSession({
						...nameSession,
						submit: (draft) => {
							const result = nameSession!.submit(draft);
							editingName = false;
							nameSession = null;
							return result;
						}
					})}
				/>
			{:else}
				<h3>{family.name}</h3>
			{/if}
			<StepScale
				structure={family.stepScale}
				values={variant.values.families[family.id].stepScale}
				familyId={family.id}
			/>
		</div>
		<div class="actions">
			<button type="button" onclick={startFamilyRename}>Rename family</button>
			<button type="button" onclick={() => app.deleteFamily(family.id)}>Delete family</button>
			<button
				type="button"
				onclick={() =>
					void app.addRamp(family.id, createSourceColor({ lightness: 0.7, chroma: 0.1, hue: 0 }))}
				>Add Color Ramp</button
			>
		</div>
	</header>

	{#if variantCount > 1}
		<p class="warning">Family structure is shared by all variants in this theme.</p>
	{/if}

	{#if family.ramps.length === 0}
		<p>No color ramps yet.</p>
	{:else}
		<div class="ramps">
			{#each generated.ramps as ramp, index}
				<ColorRamp
					{ramp}
					familyId={family.id}
					sourceValue={variant.values.families[family.id].ramps[ramp.id].sourceColor.serialized}
					rampIndex={index}
					rampCount={generated.ramps.length}
					{gamut}
				/>
			{/each}
		</div>
	{/if}
</section>

<style>
	.color-family {
		border: 1px solid currentColor;
		border-radius: 0.75rem;
		padding: 1rem;
		display: grid;
		gap: 1rem;
	}
	.family-header {
		position: sticky;
		top: 0;
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: start;
		background: Canvas;
		padding-block: 0.25rem;
	}
	.actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.warning {
		color: #92400e;
	}
	.ramps {
		display: grid;
		gap: 0.75rem;
	}
</style>
