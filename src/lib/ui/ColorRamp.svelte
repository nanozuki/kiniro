<!--
@component
- Presents one source color and its generated swatches.
- Stays a pure view over derived ramp data.
- Reads AppManager from context for authored ramp and swatch mutations.
-->

<script lang="ts">
	import { getAppManagerContext } from '$lib/state/appContext';
	import ColorSwatch from './ColorSwatch.svelte';
	import { formatChroma, formatHue, formatLightness, getPreviewColor } from '../color';
	import type { Gamut } from '../model';
	import type { GeneratedColorRamp } from '../palette';

	type ColorRampProps = {
		familyId: string;
		ramp: GeneratedColorRamp;
		sourceValue: string;
		gamut: Gamut;
	};

	let { familyId, ramp, sourceValue, gamut }: ColorRampProps = $props();

	const app = getAppManagerContext();
	let sourcePreview = $derived(getPreviewColor(ramp.sourceColor, gamut));
</script>

<section aria-label={`Color ramp ${ramp.name}`} class="color-ramp">
	<div class="source-cell">
		<span class="chip" style={`background: ${sourcePreview.css}`}></span>
		<div>
			<h4>{ramp.name}</h4>
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
		<button type="button" aria-label={`Move ${ramp.name} up`} disabled>↕ Up</button>
		<button type="button" aria-label={`Move ${ramp.name} down`} disabled>↕ Down</button>
		<button type="button" disabled>Edit Color Ramp</button>
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
