<!--
@component
- A swatch preview cell that also opens the per-swatch override editor.
- Stores overrides per OKLCH channel.
- Gamut warnings reflect the current preview space rather than the raw authored color.
-->

<script lang="ts">
	import { getAppManagerContext } from '$lib/state/appContext';
	import Dialog from './Dialog.svelte';
	import { formatChannelValue, getPreviewColor, normalizeChannelValue } from '../color';
	import type { Gamut, OklchChannel, OklchColor, SwatchChannelOverrides } from '../model';
	import type { GeneratedSwatch } from '../palette';

	type ColorSwatchProps = {
		familyId: string;
		rampId: string;
		swatch: GeneratedSwatch;
		gamut: Gamut;
	};

	let { familyId, rampId, swatch, gamut }: ColorSwatchProps = $props();

	const app = getAppManagerContext();
	const channels: { key: OklchChannel; label: string; step: string }[] = [
		{ key: 'lightness', label: 'Lightness', step: '0.01' },
		{ key: 'chroma', label: 'Chroma', step: '0.01' },
		{ key: 'hue', label: 'Hue', step: '1' }
	];

	let editing = $state(false);
	let drafts = $state<Record<OklchChannel, string>>(
		draftsFrom({ lightness: 0, chroma: 0, hue: 0 })
	);
	let preview = $derived(getPreviewColor(swatch.oklch, gamut));
	let hasOverrides = $derived(Object.keys(swatch.overrides).length > 0);
	let draftColor = $derived(draftOklch());
	let draftPreview = $derived(getPreviewColor(draftColor, gamut));
	let hasDraftErrors = $derived(channels.some((channel) => channelError(channel.key) != null));
	let draftOverrides = $derived({
		lightness:
			normalizedDraftValue('lightness', drafts.lightness, swatch.oklch.lightness) !==
			normalizedGenerated('lightness'),
		chroma:
			normalizedDraftValue('chroma', drafts.chroma, swatch.oklch.chroma) !==
			normalizedGenerated('chroma'),
		hue: normalizedDraftValue('hue', drafts.hue, swatch.oklch.hue) !== normalizedGenerated('hue')
	});
	let hasDraftChanges = $derived(
		normalizedDraftValue('lightness', drafts.lightness, swatch.oklch.lightness) !==
			normalizedCurrent('lightness') ||
			normalizedDraftValue('chroma', drafts.chroma, swatch.oklch.chroma) !==
				normalizedCurrent('chroma') ||
			normalizedDraftValue('hue', drafts.hue, swatch.oklch.hue) !== normalizedCurrent('hue')
	);
	let hasDraftOverrides = $derived(Object.values(draftOverrides).some(Boolean));

	function draftsFrom(oklch: OklchColor): Record<OklchChannel, string> {
		return {
			lightness: formatChannelValue('lightness', oklch.lightness),
			chroma: formatChannelValue('chroma', oklch.chroma),
			hue: formatChannelValue('hue', oklch.hue)
		};
	}

	function finiteNumber(draft: string): number | null {
		if (draft.trim().length === 0) return null;
		const value = Number(draft);
		return Number.isFinite(value) ? value : null;
	}

	function normalizeDraft(channel: OklchChannel): number {
		const parsed = finiteNumber(drafts[channel]);
		return normalizeChannelValue(channel, parsed ?? swatch.oklch[channel]);
	}

	function normalizedDraftValue(channel: OklchChannel, draft: string, fallback: number): string {
		const parsed = finiteNumber(draft);
		return formatChannelValue(channel, normalizeChannelValue(channel, parsed ?? fallback));
	}

	function normalizedCurrent(channel: OklchChannel): string {
		return formatChannelValue(channel, swatch.oklch[channel]);
	}

	function normalizedGenerated(channel: OklchChannel): string {
		return formatChannelValue(channel, swatch.generated[channel]);
	}

	function draftOklch(): OklchColor {
		return {
			lightness: normalizeDraft('lightness'),
			chroma: normalizeDraft('chroma'),
			hue: normalizeDraft('hue')
		};
	}

	function channelError(channel: OklchChannel): string | null {
		const parsed = finiteNumber(drafts[channel]);
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

		if (parsed == null)
			return `${formattedChannelName(channel)} must be a number from ${limits[channel]}.`;
		if (parsed < ranges[channel].min || parsed > ranges[channel].max)
			return `${formattedChannelName(channel)} must be between ${limits[channel]}.`;
		return null;
	}

	function openEditor() {
		drafts = draftsFrom(swatch.oklch);
		editing = true;
	}

	function closeEditor() {
		drafts = draftsFrom(swatch.oklch);
		editing = false;
	}

	function syncDialogOpen(open: boolean) {
		if (!open) closeEditor();
	}

	function setDraft(channel: OklchChannel, draft: string) {
		drafts = { ...drafts, [channel]: draft };
	}

	function resetDraftChannel(channel: OklchChannel) {
		setDraft(channel, formatChannelValue(channel, swatch.generated[channel]));
	}

	function resetDraftColor() {
		drafts = draftsFrom(swatch.generated);
	}

	function draftOverrideFor(channel: OklchChannel): boolean {
		if (channel === 'lightness') return draftOverrides.lightness;
		if (channel === 'chroma') return draftOverrides.chroma;
		return draftOverrides.hue;
	}

	function applyDraft() {
		if (hasDraftErrors) return;
		const nextOverrides: SwatchChannelOverrides = {};
		for (const channel of channels) {
			const value = normalizeDraft(channel.key);
			if (formatChannelValue(channel.key, value) !== normalizedGenerated(channel.key)) {
				nextOverrides[channel.key] = value;
			}
		}
		app.setSwatchOverrides(familyId, rampId, swatch.stepIndex, nextOverrides);
		editing = false;
	}

	function formattedChannelName(channel: OklchChannel): string {
		return channel[0].toUpperCase() + channel.slice(1);
	}
</script>

<button
	type="button"
	class="swatch-button"
	class:warning={preview.outOfSelectedGamut}
	class:overridden={hasOverrides}
	style={`background: ${preview.css}`}
	aria-label={`${swatch.name} ${preview.hex}${hasOverrides ? ' overridden' : ''}${preview.warning ? ` ${preview.warning}` : ''}`}
	onclick={openEditor}
>
	<strong>{swatch.stepIndex}</strong>
	<span>{preview.hex}</span>
	{#if hasOverrides}<span aria-label="Has overrides">●</span>{/if}
	{#if preview.warning}<span aria-label={preview.warning}>⚠</span>{/if}
</button>

<Dialog
	bind:open={editing}
	title={swatch.name}
	closeLabel="Close swatch editor"
	onopenchange={syncDialogOpen}
>
	<div class="editor-preview">
		<span
			class:warning={draftPreview.outOfSelectedGamut}
			class="preview-chip"
			style={`background: ${draftPreview.css}`}
		></span>
		<p>{draftPreview.hex}{draftPreview.warning ? ` — ${draftPreview.warning}` : ''}</p>
	</div>
	{#each channels as channel}
		<label>
			<span>{channel.label} ({formatChannelValue(channel.key, swatch.generated[channel.key])})</span
			>
			<input
				type="text"
				aria-label={channel.label}
				inputmode="decimal"
				aria-invalid={channelError(channel.key) ? 'true' : undefined}
				value={drafts[channel.key]}
				oninput={(event) => setDraft(channel.key, event.currentTarget.value)}
			/>
			{#if channelError(channel.key)}
				<span class="error">{channelError(channel.key)}</span>
			{/if}
		</label>
		<button
			type="button"
			disabled={!draftOverrideFor(channel.key)}
			onclick={() => resetDraftChannel(channel.key)}
		>
			Reset {channel.label}
		</button>
	{/each}
	{#snippet actions()}
		<button type="button" disabled={!hasDraftOverrides} onclick={resetDraftColor}
			>Reset all channels</button
		>
		<button type="button" onclick={closeEditor}>Cancel</button>
		<button type="button" disabled={hasDraftErrors || !hasDraftChanges} onclick={applyDraft}
			>Apply changes</button
		>
	{/snippet}
</Dialog>

<style>
	.swatch-button {
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
	.editor-preview {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.preview-chip {
		inline-size: 4rem;
		block-size: 4rem;
		border: 1px solid color-mix(in srgb, currentColor 40%, transparent);
		border-radius: 0.25rem;
		flex: none;
	}
	.editor-preview p {
		margin: 0;
	}
	label {
		display: grid;
		gap: 0.25rem;
	}
	input {
		inline-size: 100%;
	}
	.error {
		color: LinkText;
		font-size: 0.9rem;
	}
</style>
