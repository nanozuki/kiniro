<!--
@component
- Temporary contrast-checking workspace built from generated swatches.
- Selections are intentionally ephemeral.
- Contrast is evaluated after gamut clamping so the result matches the visible preview.
-->

<script lang="ts">
	import {
		getContrastResult,
		getContrastTargets,
		getDefaultContrastTargets,
		type ContrastTarget
	} from '$lib/contrast';
	import { getPreviewColor } from '$lib/color';
	import type { GamutPreview } from '$lib/model';
	import type { GeneratedVariantPalette } from '$lib/palette';

	let { palette, gamutPreview = 'srgb' } = $props<{
		palette: GeneratedVariantPalette;
		gamutPreview?: GamutPreview;
	}>();

	let targets = $derived(getContrastTargets(palette));
	let defaults = $derived(getDefaultContrastTargets(palette));
	let foregroundKey = $state<string | null>(null);
	let backgroundKey = $state<string | null>(null);
	let foreground = $derived(findTarget(targets, foregroundKey) ?? defaults?.foreground ?? null);
	let background = $derived(findTarget(targets, backgroundKey) ?? defaults?.background ?? null);
	let result = $derived(
		foreground && background
			? getContrastResult(foreground.color, background.color, gamutPreview)
			: null
	);

	function key(target: ContrastTarget) {
		return `${target.familyId}:${target.rampId}:${target.stepIndex}`;
	}

	function findTarget(items: readonly ContrastTarget[], value: string | null) {
		return items.find((target) => key(target) === value) ?? null;
	}

	function swap() {
		if (!foreground || !background) return;
		const previousForeground = key(foreground);
		const previousBackground = key(background);
		foregroundKey = previousBackground;
		backgroundKey = previousForeground;
	}
</script>

<section aria-label="Contrast Checker" class="contrast-checker">
	<h2>Contrast Checker</h2>
	{#if foreground && background && result}
		<div
			class="showcase"
			style={`color: ${getPreviewColor(foreground.color, gamutPreview).css}; background: ${getPreviewColor(background.color, gamutPreview).css}`}
		>
			<strong>Showcase text</strong>
			<span>{foreground.label} on {background.label}</span>
		</div>
		<div class="controls">
			<label
				>Foreground
				<select
					value={key(foreground)}
					onchange={(event) => (foregroundKey = event.currentTarget.value)}
					aria-label="Foreground color"
				>
					{#each targets as target}<option value={key(target)}>{target.label}</option>{/each}
				</select>
			</label>
			<label
				>Background
				<select
					value={key(background)}
					onchange={(event) => (backgroundKey = event.currentTarget.value)}
					aria-label="Background color"
				>
					{#each targets as target}<option value={key(target)}>{target.label}</option>{/each}
				</select>
			</label>
			<button type="button" onclick={swap}>Swap colors</button>
		</div>
		<p aria-label="Contrast ratio">{result.formattedRatio}</p>
		<table>
			<thead><tr><th>Target</th><th>AA</th><th>AAA</th></tr></thead>
			<tbody>
				{#each result.checks as check}
					<tr>
						<th>{check.contentType}</th>
						<td>{check.minimumAA.label} ({check.minimumAA.threshold}:1)</td>
						<td
							>{check.enhancedAAA
								? `${check.enhancedAAA.label} (${check.enhancedAAA.threshold}:1)`
								: 'N/A'}</td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	{:else}
		<p>Add generated swatches to check contrast.</p>
	{/if}
</section>

<style>
	.contrast-checker {
		display: grid;
		gap: 1rem;
	}
	.showcase {
		border: 1px solid currentColor;
		border-radius: 0.5rem;
		min-block-size: 8rem;
		padding: 1rem;
		display: grid;
		align-content: center;
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		align-items: end;
	}
	label {
		display: grid;
		gap: 0.25rem;
	}
	table {
		border-collapse: collapse;
	}
	th,
	td {
		border: 1px solid currentColor;
		padding: 0.5rem;
	}
</style>
