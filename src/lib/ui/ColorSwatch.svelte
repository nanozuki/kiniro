<!--
@component
- A swatch preview cell that also opens the per-swatch override editor.
- Stores overrides per OKLCH channel.
- Gamut warnings reflect the current preview space rather than the raw authored color.
-->

<script lang="ts">
	import InlineInput from './InlineInput.svelte';
	import type { InlineInputSubmitResult } from './InlineInput.svelte';
	import {
		formatChroma,
		formatHue,
		formatLightness,
		getPreviewColor,
		normalizeChannelValue
	} from '../color';
	import type { Gamut, OklchChannel } from '../model';
	import type { GeneratedSwatch } from '../palette';

	type ColorSwatchProps = {
		swatch: GeneratedSwatch;
		gamut: Gamut;
		onoverride?: (stepIndex: string, channel: OklchChannel, value: number) => void;
		onreset?: (stepIndex: string, channel: OklchChannel) => void;
		onresetall?: (stepIndex: string) => void;
	};

	let {
		swatch,
		gamut,
		onoverride = (_stepIndex: string, _channel: OklchChannel, _value: number) => {},
		onreset = (_stepIndex: string, _channel: OklchChannel) => {},
		onresetall = (_stepIndex: string) => {}
	}: ColorSwatchProps = $props();

	let editing = $state(false);
	let preview = $derived(getPreviewColor(swatch.oklch, gamut));
	let hasOverrides = $derived(Object.keys(swatch.overrides).length > 0);

	const channels: { key: OklchChannel; label: string; step: string }[] = [
		{ key: 'lightness', label: 'Lightness', step: '0.01' },
		{ key: 'chroma', label: 'Chroma', step: '0.01' },
		{ key: 'hue', label: 'Hue', step: '1' }
	];

	function formatted(channel: OklchChannel, value: number) {
		if (channel === 'lightness') return formatLightness(value);
		if (channel === 'chroma') return formatChroma(value);
		return formatHue(value);
	}

	function finiteNumber(draft: string): number | null {
		if (draft.trim().length === 0) return null;
		const value = Number(draft);
		return Number.isFinite(value) ? value : null;
	}

	function resolveChannel(
		channel: OklchChannel,
		draft: string,
		previous: string
	): InlineInputSubmitResult {
		const parsed = finiteNumber(draft);
		const value = parsed ?? Number(previous);
		const resolved = String(normalizeChannelValue(channel, value));
		const limits = {
			lightness: '0 to 1',
			chroma: '0 to 0.37',
			hue: '0 to 360'
		} satisfies Record<OklchChannel, string>;
		const ranges = {
			lightness: { min: 0, max: 1 },
			chroma: { min: 0, max: 0.37 },
			hue: { min: 0, max: 360 }
		} satisfies Record<OklchChannel, { min: number; max: number }>;

		if (parsed == null) {
			return {
				value: resolved,
				error: `${formattedChannelName(channel)} must be a number from ${limits[channel]}; restored the previous value.`
			};
		}
		if (parsed < ranges[channel].min || parsed > ranges[channel].max) {
			return {
				value: resolved,
				error: `${formattedChannelName(channel)} must be between ${limits[channel]}; adjusted to ${resolved}.`
			};
		}
		return { value: resolved };
	}

	function setChannel(channel: OklchChannel, draft: string) {
		const value = finiteNumber(draft);
		if (value != null) onoverride(swatch.stepIndex, channel, normalizeChannelValue(channel, value));
	}

	function formattedChannelName(channel: OklchChannel): string {
		return channel[0].toUpperCase() + channel.slice(1);
	}
</script>

<button
	type="button"
	class:warning={preview.outOfSelectedGamut}
	class:overridden={hasOverrides}
	style={`background: ${preview.css}`}
	aria-label={`${swatch.name} ${preview.hex}${hasOverrides ? ' overridden' : ''}${preview.warning ? ` ${preview.warning}` : ''}`}
	onclick={() => (editing = true)}
>
	<strong>{swatch.stepIndex}</strong>
	<span>{preview.hex}</span>
	{#if hasOverrides}<span aria-label="Has overrides">●</span>{/if}
	{#if preview.warning}<span aria-label={preview.warning}>⚠</span>{/if}
</button>

{#if editing}
	<div class="backdrop" role="presentation">
		<div
			role="dialog"
			aria-modal="true"
			aria-label={`Edit ${swatch.name}`}
			tabindex="-1"
			class="modal"
		>
			<header>
				<h3>{swatch.name}</h3>
				<button type="button" aria-label="Close swatch editor" onclick={() => (editing = false)}
					>×</button
				>
			</header>
			<p>{preview.hex}{preview.warning ? ` — ${preview.warning}` : ''}</p>
			{#each channels as channel}
				<label>
					<span>{channel.label} ({formatted(channel.key, swatch.oklch[channel.key])})</span>
					<InlineInput
						aria-label={channel.label}
						inputmode="decimal"
						value={String(swatch.oklch[channel.key])}
						oninput={(draft) => setChannel(channel.key, draft)}
						onsubmit={(draft, previous) => {
							const result = resolveChannel(channel.key, draft, previous);
							onoverride(swatch.stepIndex, channel.key, Number(result.value));
							return result;
						}}
					/>
				</label>
				<button
					type="button"
					disabled={swatch.overrides[channel.key] === undefined}
					onclick={() => onreset(swatch.stepIndex, channel.key)}
				>
					Reset {channel.label}
				</button>
			{/each}
			<button type="button" disabled={!hasOverrides} onclick={() => onresetall(swatch.stepIndex)}
				>Reset all channels</button
			>
		</div>
	</div>
{/if}

<style>
	button {
		border: 1px solid color-mix(in srgb, currentColor 40%, transparent);
		border-radius: 0.25rem;
		padding: 0.5rem;
		color: black;
		text-shadow: 0 1px white;
		display: grid;
		align-content: end;
		min-block-size: 4rem;
		text-align: start;
	}
	.overridden {
		outline: 3px solid Highlight;
	}
	.warning {
		box-shadow: inset 0 0 0 3px orange;
	}
	.backdrop {
		position: fixed;
		inset: 0;
		display: grid;
		place-items: center;
		background: rgb(0 0 0 / 0.35);
		padding: 1rem;
	}
	.modal {
		background: Canvas;
		color: CanvasText;
		border: 1px solid currentColor;
		border-radius: 0.5rem;
		padding: 1rem;
		display: grid;
		gap: 0.75rem;
		min-inline-size: min(26rem, 100%);
	}
	header {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: center;
	}
	label {
		display: grid;
		gap: 0.25rem;
	}
</style>
