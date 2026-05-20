<!--
@component
- One color-family editing section inside the palette.
- Combines family naming, step-scale editing, ramp rendering, and family actions.
- Shows the shared-structure warning when the theme has multiple variants.
-->

<script lang="ts">
	import ColorRamp from './ColorRamp.svelte';
	import { generateFamily } from '../palette';
	import StepScale from './StepScale.svelte';
	import type { ColorFamilyStructure, StepIndexStyle, ThemeVariant } from '../model';

	let {
		family,
		variant,
		variantCount = 1,
		onrename = (_id: string, _name: string) => {},
		ondelete = (_id: string) => {},
		onaddramp = (_familyId: string) => {},
		onstepcount = (_familyId: string, _count: number) => {},
		onindexstyle = (_familyId: string, _style: StepIndexStyle) => {},
		onhalfsteps = (_familyId: string, _start: boolean, _end: boolean) => {},
		onrange = (_familyId: string, _start: number, _end: number) => {},
		onoverride = (_familyId: string, _index: string, _lightness: number) => {},
		onreset = (_familyId: string, _index: string) => {},
		onreverse = (_familyId: string) => {},
		oneditramp = (_familyId: string, _rampId: string) => {},
		ondeleteramp = (_familyId: string, _rampId: string) => {},
		onmoveramp = (_familyId: string, _rampId: string, _direction: 'up' | 'down') => {},
		gamutPreview = 'srgb'
	} = $props<{
		family: ColorFamilyStructure;
		variant: ThemeVariant;
		variantCount?: number;
		onrename?: (id: string, name: string) => void;
		ondelete?: (id: string) => void;
		onaddramp?: (familyId: string) => void;
		onstepcount?: (familyId: string, count: number) => void;
		onindexstyle?: (familyId: string, style: StepIndexStyle) => void;
		onhalfsteps?: (familyId: string, start: boolean, end: boolean) => void;
		onrange?: (familyId: string, start: number, end: number) => void;
		onoverride?: (familyId: string, index: string, lightness: number) => void;
		onreset?: (familyId: string, index: string) => void;
		onreverse?: (familyId: string) => void;
		oneditramp?: (familyId: string, rampId: string) => void;
		ondeleteramp?: (familyId: string, rampId: string) => void;
		onmoveramp?: (familyId: string, rampId: string, direction: 'up' | 'down') => void;
		gamutPreview?: 'srgb' | 'p3';
	}>();

	let editingName = $state(false);
	let nameDraft = $state('');
	let generated = $derived(generateFamily(family, variant));
</script>

<section aria-label={`Color family ${family.name}`} class="color-family">
	<header class="family-header">
		<div>
			{#if editingName}
				<input
					aria-label="Family name"
					bind:value={nameDraft}
					oninput={() => onrename(family.id, nameDraft)}
					onblur={() => {
						onrename(family.id, nameDraft);
						editingName = false;
					}}
				/>
			{:else}
				<h3>{family.name}</h3>
			{/if}
			<StepScale
				structure={family.stepScale}
				values={variant.values.families[family.id].stepScale}
				onstepcount={(count) => onstepcount(family.id, count)}
				onindexstyle={(style) => onindexstyle(family.id, style)}
				onhalfsteps={(start, end) => onhalfsteps(family.id, start, end)}
				onrange={(start, end) => onrange(family.id, start, end)}
				onoverride={(index, lightness) => onoverride(family.id, index, lightness)}
				onreset={(index) => onreset(family.id, index)}
				onreverse={() => onreverse(family.id)}
			/>
		</div>
		<div class="actions">
			<button
				type="button"
				onclick={() => {
					nameDraft = family.name;
					editingName = true;
				}}>Rename family</button
			>
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
				<ColorRamp
					{ramp}
					sourceValue={variant.values.families[family.id].ramps[ramp.id].sourceColor.serialized}
					{gamutPreview}
					onedit={(rampId) => oneditramp(family.id, rampId)}
					ondelete={(rampId) => ondeleteramp(family.id, rampId)}
					onmove={(rampId, direction) => onmoveramp(family.id, rampId, direction)}
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
