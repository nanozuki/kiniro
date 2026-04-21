<script lang="ts">
	import Color from 'colorjs.io';
	import { parseBaseOklch, toDisplayHex } from '$lib/color';

	// ColorRow preserves a seed color's OKLCH chroma and hue across parent-provided lightness steps.
	const STEPS_DEFAULT = [100, 200, 300, 400, 500, 600, 700, 800, 900];
	const LIGHTNESS_DEFAULT = [0.95, 0.87, 0.78, 0.68, 0.57, 0.46, 0.36, 0.26, 0.16];

	let {
		name = 'primary',
		hex = '#907aa9',
		lightness = LIGHTNESS_DEFAULT,
		steps = STEPS_DEFAULT,
		onNameChange = () => {},
		onHexChange = () => {}
	}: {
		name?: string;
		hex?: string;
		lightness?: number[];
		steps?: number[];
		onNameChange?: (name: string) => void;
		onHexChange?: (hex: string) => void;
	} = $props();

	type Swatch = { step: number; hex: string; lightness: number };

	const base = $derived(parseBaseOklch(hex));

	const palette = $derived.by((): Swatch[] => {
		if (!base) return [];
		return steps.map((step, i) => {
			const l = lightness[i];
			return { step, hex: toDisplayHex(new Color('oklch', [l, base.c, base.h])), lightness: l };
		});
	});
</script>

<div class="color-row">
	<div class="inputs">
		<input
			type="text"
			value={name}
			placeholder="color name"
			oninput={(e) => onNameChange(e.currentTarget.value)}
		/>
		<input type="color" value={hex} oninput={(e) => onHexChange(e.currentTarget.value)} />
		<input
			type="text"
			value={hex}
			placeholder="#rrggbb"
			oninput={(e) => onHexChange(e.currentTarget.value)}
		/>
		{#if base}
			<span class="oklch-label">oklch({base.l.toFixed(2)} {base.c.toFixed(3)} {base.h.toFixed(1)}°)</span>
		{/if}
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

	.oklch-label {
		font-family: monospace;
		font-size: 0.875rem;
		color: #555;
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
