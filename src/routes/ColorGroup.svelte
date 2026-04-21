<script lang="ts">
	import ColorRow from './ColorRow.svelte';
	import { cleanControlledLightness, computeLightness, computeSteps } from '$lib/lightness';
	import type { ColorData, GroupData, GroupLightnessSettings, PaletteGroupData } from '$lib/storage';

	// ColorGroup applies one variant lightness scale to a shared palette group and its seed colors.
	let {
		group,
		onGroupChange = () => {},
		onLightnessChange = () => {},
		onColorChange = () => {},
		onAddColor = () => {},
		onDeleteColor = () => {}
	}: {
		group: GroupData;
		onGroupChange?: (patch: Partial<Pick<PaletteGroupData, 'name'>>) => void;
		onLightnessChange?: (patch: Partial<GroupLightnessSettings>) => void;
		onColorChange?: (colorId: number, patch: Partial<Pick<ColorData, 'name' | 'hex'>>) => void;
		onAddColor?: () => void;
		onDeleteColor?: (colorId: number) => void;
	} = $props();

	const lightnessSettings = $derived({
		lightnessMax: group.lightnessMax,
		lightnessMin: group.lightnessMin,
		controlledLightness: group.controlledLightness,
		reversed: group.reversed,
		stepsCount: group.stepsCount,
		halfStepBefore: group.halfStepBefore,
		halfStepAfter: group.halfStepAfter
	});

	const steps = $derived(computeSteps(lightnessSettings));
	const normalLightness = $derived(
		computeLightness({ ...lightnessSettings, reversed: false }, steps)
	);
	const lightness = $derived(computeLightness(lightnessSettings, steps));

	$effect(() => {
		// Prune anchors for step labels that disappear after step-setting changes.
		const cleaned = cleanControlledLightness(group.controlledLightness, steps);
		if (JSON.stringify(cleaned) !== JSON.stringify(group.controlledLightness)) {
			onLightnessChange({ controlledLightness: cleaned });
		}
	});

	function updateControlledLightness(step: number, value: number) {
		if (!Number.isFinite(value)) return;
		onLightnessChange({ controlledLightness: { ...group.controlledLightness, [step]: value } });
	}

	function resetControlledLightness(step: number) {
		const rest = { ...group.controlledLightness };
		delete rest[step];
		onLightnessChange({ controlledLightness: rest });
	}
</script>

<div class="color-group">
	<input
		class="group-title"
		type="text"
		value={group.name}
		placeholder="group name"
		oninput={(e) => onGroupChange({ name: e.currentTarget.value })}
	/>
	<div class="group-settings">
		<label>
			Lightness max
			<input
				type="number"
				value={group.lightnessMax}
				min="0"
				max="1"
				step="0.01"
				oninput={(e) => onLightnessChange({ lightnessMax: e.currentTarget.valueAsNumber })}
			/>
		</label>
		<span class="arrow">→</span>
		<label>
			Lightness min
			<input
				type="number"
				value={group.lightnessMin}
				min="0"
				max="1"
				step="0.01"
				oninput={(e) => onLightnessChange({ lightnessMin: e.currentTarget.valueAsNumber })}
			/>
		</label>
		<label>
			Steps
			<select
				value={group.stepsCount}
				onchange={(e) => onLightnessChange({ stepsCount: Number(e.currentTarget.value) })}
			>
				{#each [3, 4, 5, 6, 7, 8, 9] as n (n)}
					<option value={n}>{n}</option>
				{/each}
			</select>
		</label>
		<label class="checkbox-label">
			<input
				type="checkbox"
				checked={group.halfStepBefore}
				onchange={(e) => onLightnessChange({ halfStepBefore: e.currentTarget.checked })}
			/>
			Add <code>50</code> step
		</label>
		<label class="checkbox-label">
			<input
				type="checkbox"
				checked={group.halfStepAfter}
				onchange={(e) => onLightnessChange({ halfStepAfter: e.currentTarget.checked })}
			/>
			Add <code>{group.stepsCount * 100 + 50}</code> step
		</label>
		<button
			class="reverse-btn"
			class:active={group.reversed}
			onclick={() => onLightnessChange({ reversed: !group.reversed })}
			title="Reverse lightness direction (for dark mode)"
		>
			reverse
		</button>
	</div>
	<div class="lightness-controls" aria-label="Lightness steps">
		{#each steps as step, i (step)}
			{@const editable = i > 0 && i < steps.length - 1}
			{@const controlled = group.controlledLightness[step] != null}
			<label class:controlled class:fixed={!editable}>
				<span class="step-name">{step}</span>
				<input
					type="number"
					aria-label={`Lightness ${step}`}
					value={normalLightness[i]?.toFixed(3)}
					min="0"
					max="1"
					step="0.01"
					disabled={!editable}
					oninput={(e) => updateControlledLightness(step, e.currentTarget.valueAsNumber)}
				/>
				{#if controlled}
					<button
						type="button"
						class="reset-step-btn"
						aria-label={`Reset lightness ${step}`}
						onclick={() => resetControlledLightness(step)}
					>
						reset
					</button>
				{:else if editable}
					<span class="auto-label">auto</span>
				{:else}
					<span class="auto-label">fixed</span>
				{/if}
			</label>
		{/each}
	</div>
	{#each group.colors as color (color.id)}
		<div class="row-wrapper">
			<ColorRow
				name={color.name}
				hex={color.hex}
				{lightness}
				{steps}
				onNameChange={(name) => onColorChange(color.id, { name })}
				onHexChange={(hex) => onColorChange(color.id, { hex })}
			/>
			<button class="delete-btn" onclick={() => onDeleteColor(color.id)}>✕</button>
		</div>
	{/each}
	<button class="add-btn" onclick={onAddColor}>+ Add color</button>
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

	.lightness-controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e5e7eb;
		margin-bottom: 0.25rem;
	}

	.lightness-controls label {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.25rem 0.35rem;
		border: 1px solid #e5e7eb;
		border-radius: 4px;
		font-size: 0.75rem;
		color: #555;
	}

	.lightness-controls label.controlled {
		border-color: #907aa9;
		background: #f3f0f7;
		color: #4f3d61;
	}

	.lightness-controls label.fixed {
		background: #f9fafb;
	}

	.step-name {
		font-family: monospace;
		font-weight: 700;
		min-width: 2rem;
	}

	.lightness-controls input {
		width: 4.5rem;
		padding: 0.2rem 0.35rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-family: monospace;
		font-size: 0.75rem;
	}

	.lightness-controls input:disabled {
		color: #888;
		background: #f3f4f6;
	}

	.auto-label {
		min-width: 2rem;
		color: #888;
	}

	.reset-step-btn {
		padding: 0.15rem 0.35rem;
		background: none;
		border: 1px solid #907aa9;
		border-radius: 4px;
		color: #907aa9;
		cursor: pointer;
		font-size: 0.7rem;
	}

	.reset-step-btn:hover {
		background: #fff;
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
