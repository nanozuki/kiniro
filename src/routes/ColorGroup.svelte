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

	let {
		name = $bindable('palette'),
		colors = $bindable<ColorData[]>([{ id: 1, name: 'primary', hex: '#907aa9' }]),
		lightnessMax = $bindable(0.95),
		lightnessMin = $bindable(0.16),
		reversed = $bindable(false),
		stepsCount = $bindable(9),
		halfStepBefore = $bindable(false),
		halfStepAfter = $bindable(false)
	} = $props();

	const steps = $derived.by((): number[] => {
		const arr: number[] = [];
		if (halfStepBefore) arr.push(50);
		for (let k = 1; k <= stepsCount; k++) arr.push(k * 100);
		if (halfStepAfter) arr.push(stepsCount * 100 + 50);
		return arr;
	});

	const lightness = $derived.by((): number[] => {
		const totalSteps =
			stepsCount - 1 + 0.5 * (halfStepBefore ? 1 : 0) + 0.5 * (halfStepAfter ? 1 : 0);
		const stepSize = (lightnessMax - lightnessMin) / totalSteps;
		const arr = steps.map((step) => {
			let pos: number;
			if (step === 50) {
				pos = 0;
			} else if (step === stepsCount * 100 + 50) {
				pos = totalSteps;
			} else {
				const k = step / 100;
				pos = halfStepBefore ? k - 0.5 : k - 1;
			}
			return lightnessMax - pos * stepSize;
		});
		return reversed ? [...arr].reverse() : arr;
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
		<label>
			Steps
			<select bind:value={stepsCount}>
				{#each [3, 4, 5, 6, 7, 8, 9] as n (n)}
					<option value={n}>{n}</option>
				{/each}
			</select>
		</label>
		<label class="checkbox-label">
			<input type="checkbox" bind:checked={halfStepBefore} />
			Add <code>50</code> step
		</label>
		<label class="checkbox-label">
			<input type="checkbox" bind:checked={halfStepAfter} />
			Add <code>{stepsCount * 100 + 50}</code> step
		</label>
		<button class="reverse-btn" class:active={reversed} onclick={() => (reversed = !reversed)} title="Reverse lightness direction (for dark mode)">
			reverse
		</button>
	</div>
	{#each colors as color (color.id)}
		<div class="row-wrapper">
			<ColorRow bind:name={color.name} bind:hex={color.hex} {lightness} {steps} />
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

	.group-settings select {
		padding: 0.25rem 0.4rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.875rem;
		background: white;
	}

	.checkbox-label {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		cursor: pointer;
	}

	.checkbox-label code {
		font-family: monospace;
		font-size: 0.8rem;
		background: #f3f4f6;
		padding: 0.05rem 0.3rem;
		border-radius: 3px;
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
