<!--
  ColorGroup — a named collection of ColorRows sharing the same lightness range.

  Motivation:
    Different design contexts call for different lightness ranges. A group lets the
    user define one lightness scale (max → min) and apply it uniformly to every
    color in the collection, so all colors feel visually consistent with each other
    while remaining independent of other groups.

  Design:
    The user sets lightnessMax (lightest swatch, step 100) and lightnessMin
    (darkest swatch, step 900). The 9 intermediate values are computed by linear
    interpolation, which looks perceptually even in OKLCH because its L axis is
    designed to be perceptually uniform.

    Each ColorRow only receives the computed lightness array; C and H come from
    the row's own seed color, so hue and chroma stay per-color while lightness
    steps stay per-group.

  Usage:
    <ColorGroup bind:name bind:colors bind:lightnessMax bind:lightnessMin />
    All props are bindable so the parent can own and persist the state.
-->
<script lang="ts">
	import ColorRow from './ColorRow.svelte';
	import { type ColorData } from '$lib/storage';

	const STEPS_COUNT = 9;

	let {
		name = $bindable('palette'),
		colors = $bindable<ColorData[]>([{ id: 1, name: 'primary', hex: '#907aa9' }]),
		lightnessMax = $bindable(0.95),
		lightnessMin = $bindable(0.16),
		reversed = $bindable(false)
	} = $props();

	const lightness = $derived.by(() => {
		const arr = Array.from(
			{ length: STEPS_COUNT },
			(_, i) => lightnessMax - (lightnessMax - lightnessMin) * (i / (STEPS_COUNT - 1))
		);
		return reversed ? arr.reverse() : arr;
	});

	const nextId = $derived(colors.reduce((max, c) => Math.max(max, c.id), 0));

	function addColor() {
		colors.push({ id: nextId + 1, name: 'color', hex: '#907aa9' });
	}

	function deleteColor(id: number) {
		colors = colors.filter((c) => c.id !== id);
	}
</script>

<div class="color-group">
	<input class="group-title" type="text" bind:value={name} placeholder="group name" />
	<div class="group-settings">
		<label>
			Lightness max
			<input type="number" bind:value={lightnessMax} min="0" max="1" step="0.01" />
		</label>
		<span class="arrow">→</span>
		<label>
			Lightness min
			<input type="number" bind:value={lightnessMin} min="0" max="1" step="0.01" />
		</label>
		<button class="reverse-btn" class:active={reversed} onclick={() => (reversed = !reversed)} title="Reverse lightness direction (for dark mode)">
			reverse
		</button>
	</div>
	{#each colors as color (color.id)}
		<div class="row-wrapper">
			<ColorRow bind:name={color.name} bind:hex={color.hex} {lightness} />
			<button class="delete-btn" onclick={() => deleteColor(color.id)}>✕</button>
		</div>
	{/each}
	<button class="add-btn" onclick={addColor}>+ Add color</button>
</div>

<style>
	.color-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
	}

	.group-title {
		font-size: 1rem;
		font-weight: 600;
		border: none;
		border-bottom: 1px solid transparent;
		padding: 0.1rem 0;
		background: transparent;
		width: 100%;
		outline: none;
	}

	.group-title:hover,
	.group-title:focus {
		border-bottom-color: #ccc;
	}

	.group-settings {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e5e7eb;
		margin-bottom: 0.25rem;
	}

	.group-settings label {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.875rem;
		color: #555;
	}

	.group-settings input[type='number'] {
		width: 5rem;
		padding: 0.25rem 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.875rem;
		font-family: monospace;
	}

	.reverse-btn {
		margin-left: auto;
		padding: 0.2rem 0.6rem;
		font-size: 0.8rem;
		background: none;
		border: 1px solid #ccc;
		border-radius: 4px;
		cursor: pointer;
		color: #888;
	}

	.reverse-btn.active {
		background: #f3f0f7;
		border-color: #907aa9;
		color: #907aa9;
	}

	.arrow {
		color: #aaa;
		font-size: 0.875rem;
	}

	.row-wrapper {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.delete-btn {
		margin-top: 1rem;
		padding: 0.25rem 0.5rem;
		background: none;
		border: 1px solid #ccc;
		border-radius: 4px;
		cursor: pointer;
		color: #888;
		font-size: 0.75rem;
		line-height: 1;
	}

	.delete-btn:hover {
		border-color: #e55;
		color: #e55;
	}

	.add-btn {
		align-self: flex-start;
		padding: 0.4rem 0.8rem;
		background: none;
		border: 1px dashed #aaa;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		color: #555;
	}

	.add-btn:hover {
		border-color: #555;
		color: #111;
	}
</style>
