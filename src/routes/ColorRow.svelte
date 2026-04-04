<!--
  ColorRow — one row in the OKLCH palette maker.

  Motivation:
    OKLCH is perceptually uniform: equal L steps look equally spaced to the eye,
    and hue stays visually stable across lightness levels (unlike HSL). This makes
    it ideal for generating design-system palettes from a single seed color.

  Design:
    The user picks a name and a seed hex color. We extract Chroma (C) and Hue (H)
    from the seed, then produce 9 swatches by sweeping Lightness across preset
    values (100 = lightest, 900 = darkest). C and H are held constant; each swatch
    is gamut-mapped back to sRGB so all output colors are displayable.

    C and H are the same for every swatch in a row, so they are shown only once
    (on swatch 100) to avoid redundancy.

  Usage:
    <ColorRow bind:name bind:hex />
    Both props are bindable so the parent can own and persist the state.
-->
<script lang="ts">
	import Color from 'colorjs.io';

	const STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900];
	const LIGHTNESS = [0.95, 0.87, 0.78, 0.68, 0.57, 0.46, 0.36, 0.26, 0.16];

	let { name = $bindable('primary'), hex = $bindable('#3b82f6') } = $props();

	type Swatch = { step: number; hex: string; lightness: number };
	type BaseOklch = { c: number; h: number };

	function toHex(color: Color): string {
		const srgb = color.to('srgb').toGamut();
		const [r, g, b] = srgb.coords.map((v) => Math.round(Math.min(1, Math.max(0, v ?? 0)) * 255));
		return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
	}

	function parseBase(hex: string): BaseOklch | null {
		try {
			const oklch = new Color(hex).to('oklch');
			const [, chroma, hue] = oklch.coords;
			const c = chroma == null || isNaN(chroma) ? 0 : chroma;
			const h = hue == null || isNaN(hue) ? 0 : hue;
			return { c, h };
		} catch {
			return null;
		}
	}

	const base = $derived(parseBase(hex));

	const palette = $derived.by((): Swatch[] => {
		if (!base) return [];
		return STEPS.map((step, i) => {
			const l = LIGHTNESS[i];
			return { step, hex: toHex(new Color('oklch', [l, base.c, base.h])), lightness: l };
		});
	});
</script>

<div class="color-row">
	<div class="inputs">
		<input type="text" bind:value={name} placeholder="color name" />
		<input type="color" bind:value={hex} />
		<input type="text" bind:value={hex} placeholder="#rrggbb" />
	</div>
	<div class="swatches">
		{#each palette as swatch, i (swatch.step)}
			{@const isLight = swatch.lightness >= 0.5}
			{@const dimColor = isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.6)'}
			{@const fullColor = isLight ? 'rgba(0,0,0,0.88)' : 'rgba(255,255,255,0.95)'}
			<div class="swatch" style:background-color={swatch.hex}>
				<div class="values" style:color={dimColor}>
					<span>{swatch.hex}</span>
					{#if i === 0 && base}
						<span>C {base.c.toFixed(3)}</span>
						<span>H {base.h.toFixed(1)}°</span>
					{/if}
					<span>L {swatch.lightness.toFixed(2)}</span>
				</div>
				<span class="step-label" style:color={fullColor}>{name}-{swatch.step}</span>
			</div>
		{/each}
	</div>
</div>

<style>
	.color-row {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
	}

	.inputs {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.inputs input[type='text'] {
		padding: 0.25rem 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.inputs input[type='color'] {
		width: 2.5rem;
		height: 2rem;
		padding: 0;
		border: 1px solid #ccc;
		border-radius: 4px;
		cursor: pointer;
	}

	.swatches {
		display: flex;
		gap: 0.25rem;
	}

	.swatch {
		width: 5.5rem;
		height: 6rem;
		border-radius: 4px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 0.4rem 0.5rem;
		font-family: monospace;
		font-size: 0.6rem;
	}

	.values {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.step-label {
		font-size: 0.65rem;
		font-weight: 700;
		white-space: nowrap;
	}
</style>
