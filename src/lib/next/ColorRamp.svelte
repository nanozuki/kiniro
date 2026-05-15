<script lang="ts">
	import { formatChroma, formatHue, getPreviewColor } from './color';
	import type { GamutPreview } from './model';
	import type { GeneratedColorRamp } from './palette';

	let {
		ramp,
		sourceValue,
		gamutPreview = 'srgb',
		onedit = (_id: string) => {},
		ondelete = (_id: string) => {},
		onmove = (_id: string, _direction: 'up' | 'down') => {}
	} = $props<{
		ramp: GeneratedColorRamp;
		sourceValue: string;
		gamutPreview?: GamutPreview;
		onedit?: (id: string) => void;
		ondelete?: (id: string) => void;
		onmove?: (id: string, direction: 'up' | 'down') => void;
	}>();

	let sourcePreview = $derived(getPreviewColor(ramp.sourceColor, gamutPreview));
</script>

<section aria-label={`Color ramp ${ramp.name}`} class="color-ramp">
	<div class="source-cell">
		<span class="chip" style={`background: ${sourcePreview.css}`}></span>
		<div>
			<h4>{ramp.name}</h4>
			<p>{sourceValue}</p>
			<p>C {formatChroma(ramp.sourceColor.chroma)} H {formatHue(ramp.sourceColor.hue)}</p>
		</div>
	</div>
	<div class="swatches">
		{#each ramp.swatches as swatch}
			{@const preview = getPreviewColor(swatch.oklch, gamutPreview)}
			<div class="swatch" style={`background: ${preview.css}`} aria-label={`${swatch.name} ${preview.hex}`}>
				<strong>{swatch.stepIndex}</strong>
				<span>{preview.hex}</span>
			</div>
		{/each}
	</div>
	<div class="actions">
		<button type="button" aria-label={`Move ${ramp.name} up`} onclick={() => onmove(ramp.id, 'up')}>↕ Up</button>
		<button type="button" aria-label={`Move ${ramp.name} down`} onclick={() => onmove(ramp.id, 'down')}>↕ Down</button>
		<button type="button" onclick={() => onedit(ramp.id)}>Edit Color Ramp</button>
		<button type="button" onclick={() => ondelete(ramp.id)}>Delete Color Ramp</button>
	</div>
</section>

<style>
	.color-ramp { display: grid; gap: 0.75rem; border: 1px dashed currentColor; border-radius: 0.5rem; padding: 0.75rem; }
	.source-cell, .actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
	.chip { inline-size: 2rem; block-size: 2rem; border: 1px solid currentColor; border-radius: 0.25rem; }
	.swatches { display: grid; grid-template-columns: repeat(auto-fit, minmax(5rem, 1fr)); gap: 0.25rem; }
	.swatch { min-block-size: 4rem; padding: 0.5rem; display: grid; align-content: end; color: black; text-shadow: 0 1px white; }
</style>
