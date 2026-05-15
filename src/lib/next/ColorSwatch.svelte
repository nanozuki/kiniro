<script lang="ts">
	import { formatChroma, formatHue, formatLightness, getPreviewColor, normalizeChannelValue } from './color';
	import type { GamutPreview, OklchChannel } from './model';
	import type { GeneratedSwatch } from './palette';

	let {
		swatch,
		gamutPreview = 'srgb',
		onoverride = (_stepIndex: string, _channel: OklchChannel, _value: number) => {},
		onreset = (_stepIndex: string, _channel: OklchChannel) => {},
		onresetall = (_stepIndex: string) => {}
	} = $props<{
		swatch: GeneratedSwatch;
		gamutPreview?: GamutPreview;
		onoverride?: (stepIndex: string, channel: OklchChannel, value: number) => void;
		onreset?: (stepIndex: string, channel: OklchChannel) => void;
		onresetall?: (stepIndex: string) => void;
	}>();

	let editing = $state(false);
	let preview = $derived(getPreviewColor(swatch.oklch, gamutPreview));
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

	function setChannel(channel: OklchChannel, event: Event) {
		const value = Number((event.currentTarget as HTMLInputElement).value);
		onoverride(swatch.stepIndex, channel, normalizeChannelValue(channel, value));
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
		<section role="dialog" aria-modal="true" aria-label={`Edit ${swatch.name}`} class="modal">
			<header>
				<h3>{swatch.name}</h3>
				<button type="button" aria-label="Close swatch editor" onclick={() => (editing = false)}>×</button>
			</header>
			<p>{preview.hex}{preview.warning ? ` — ${preview.warning}` : ''}</p>
			{#each channels as channel}
				<label>
					<span>{channel.label} ({formatted(channel.key, swatch.oklch[channel.key])})</span>
					<input type="number" step={channel.step} value={swatch.oklch[channel.key]} oninput={(event) => setChannel(channel.key, event)} />
				</label>
				<button type="button" disabled={swatch.overrides[channel.key] === undefined} onclick={() => onreset(swatch.stepIndex, channel.key)}>
					Reset {channel.label}
				</button>
			{/each}
			<button type="button" disabled={!hasOverrides} onclick={() => onresetall(swatch.stepIndex)}>Reset all channels</button>
		</section>
	</div>
{/if}

<style>
	button { border: 1px solid color-mix(in srgb, currentColor 40%, transparent); border-radius: 0.25rem; padding: 0.5rem; color: black; text-shadow: 0 1px white; display: grid; align-content: end; min-block-size: 4rem; text-align: start; }
	.overridden { outline: 3px solid Highlight; }
	.warning { box-shadow: inset 0 0 0 3px orange; }
	.backdrop { position: fixed; inset: 0; display: grid; place-items: center; background: rgb(0 0 0 / 0.35); padding: 1rem; }
	.modal { background: Canvas; color: CanvasText; border: 1px solid currentColor; border-radius: 0.5rem; padding: 1rem; display: grid; gap: 0.75rem; min-inline-size: min(26rem, 100%); }
	header { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
	label { display: grid; gap: 0.25rem; }
</style>
