<!--
@component
- Presents one source color and its generated swatches.
- Owns only ephemeral rename state; the AppManager edit session owns preview,
  submit, validation repair, undo history, and persistence.
- Reads AppManager from context for authored ramp order, name, and swatch
  mutations.
-->

<script lang="ts">
	import { getAppManagerContext } from '$lib/state/appContext';
	import ColorSwatch from './ColorSwatch.svelte';
	import InlineInput from './InlineInput.svelte';
	import { createInlineEditSession, type InlineEditSession } from './InlineInput.svelte';
	import { formatChroma, formatHue, formatLightness, getPreviewColor } from '../color';
	import type { Gamut } from '../model';
	import type { GeneratedColorRamp } from '../palette';

	type ColorRampProps = {
		familyId: string;
		ramp: GeneratedColorRamp;
		sourceValue: string;
		gamut: Gamut;
		rampIndex?: number;
		rampCount?: number;
	};

	let {
		familyId,
		ramp,
		sourceValue,
		gamut,
		rampIndex = 0,
		rampCount = 1
	}: ColorRampProps = $props();

	const app = getAppManagerContext();
	let editingName = $state(false);
	let nameSession = $state<InlineEditSession | null>(null);
	let sourcePreview = $derived(getPreviewColor(ramp.sourceColor, gamut));
	let canMoveUp = $derived(rampIndex > 0);
	let canMoveDown = $derived(rampIndex < rampCount - 1);

	function startRampRename() {
		nameSession = app.editRampName(ramp.id);
		editingName = true;
	}
</script>

<section aria-label={`Color ramp ${ramp.name}`} class="color-ramp">
	<div class="source-cell">
		<span class="chip" style={`background: ${sourcePreview.css}`}></span>
		<div>
			{#if editingName && nameSession}
				<InlineInput
					aria-label="Ramp name"
					value={ramp.name}
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
				<h4>{ramp.name}</h4>
			{/if}
			<p>{sourceValue}</p>
			<p>
				L {formatLightness(ramp.sourceColor.lightness)} C {formatChroma(ramp.sourceColor.chroma)} H
				{formatHue(ramp.sourceColor.hue)}
			</p>
		</div>
	</div>
	<div class="swatches">
		{#each ramp.swatches as swatch}
			<ColorSwatch {swatch} {familyId} rampId={ramp.id} {gamut} />
		{/each}
	</div>
	<div class="actions">
		<button
			type="button"
			aria-label={`Move ${ramp.name} up`}
			disabled={!canMoveUp}
			onclick={() => app.moveRamp(familyId, ramp.id, -1)}>Move up</button
		>
		<button
			type="button"
			aria-label={`Move ${ramp.name} down`}
			disabled={!canMoveDown}
			onclick={() => app.moveRamp(familyId, ramp.id, 1)}>Move down</button
		>
		<button type="button" onclick={startRampRename}>Rename ramp</button>
		<button type="button" onclick={() => app.deleteRamp(familyId, ramp.id)}
			>Delete Color Ramp</button
		>
	</div>
</section>

<style>
	.color-ramp {
		display: grid;
		gap: 0.75rem;
		border: 1px dashed currentColor;
		border-radius: 0.5rem;
		padding: 0.75rem;
	}
	.source-cell,
	.actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}
	.chip {
		inline-size: 2rem;
		block-size: 2rem;
		border: 1px solid currentColor;
		border-radius: 0.25rem;
	}
	.swatches {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(5rem, 1fr));
		gap: 0.25rem;
	}
</style>
