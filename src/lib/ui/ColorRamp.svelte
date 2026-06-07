<!--
@component
- Presents one source color and its generated swatches.
- Owns only ephemeral rename state; the AppManager edit session owns preview,
  submit, validation repair, undo history, and persistence.
- Reads AppManager from context for authored ramp order, name, and swatch
  mutations.
-->

<script lang="ts">
	import { getAppManagerContext } from '$lib/state/appContext';
	import ColorSwatch from './ColorSwatch.svelte';
	import Dialog from './Dialog.svelte';
	import InlineInput from './InlineInput.svelte';
	import Tabs from './Tabs.svelte';
	import { createInlineEditSession, type InlineEditSession } from './InlineInput.svelte';
	import {
		formatChroma,
		formatHue,
		formatLightness,
		getPreviewColor,
		parseSourceColor,
		serializeSourceColor
	} from '../color';
	import type { Gamut, SourceColorFormat } from '../model';
	import type { GeneratedColorRamp } from '../palette';

	type ColorRampProps = {
		familyId: string;
		ramp: GeneratedColorRamp;
		sourceValue: string;
		gamut: Gamut;
		rampIndex?: number;
		rampCount?: number;
	};

	let {
		familyId,
		ramp,
		sourceValue,
		gamut,
		rampIndex = 0,
		rampCount = 1
	}: ColorRampProps = $props();

	const app = getAppManagerContext();
	const sourceFormats: { format: SourceColorFormat; label: string }[] = [
		{ format: 'hex', label: 'Hex' },
		{ format: 'rgb', label: 'RGB' },
		{ format: 'hsl', label: 'HSL' },
		{ format: 'oklch', label: 'OKLCH' }
	];
	let editingName = $state(false);
	let editingSource = $state(false);
	let sourceDraft = $state('');
	let nameSession = $state<InlineEditSession | null>(null);
	let sourcePreview = $derived(getPreviewColor(ramp.sourceColor, gamut));
	let draftSourceColor = $derived(parseSourceColor(sourceDraft));
	let draftSourcePreview = $derived(
		draftSourceColor ? getPreviewColor(draftSourceColor.oklch, gamut) : null
	);
	let sourceFormat = $derived(
		draftSourceColor?.format ?? parseSourceColor(sourceValue)?.format ?? 'oklch'
	);
	let sourceError = $derived(
		sourceDraft.trim().length === 0
			? 'Enter a color.'
			: draftSourceColor
				? null
				: 'Enter a valid CSS color.'
	);
	let hasSourceChanges = $derived(sourceDraft.trim() !== sourceValue);
	let canMoveUp = $derived(rampIndex > 0);
	let canMoveDown = $derived(rampIndex < rampCount - 1);

	function startRampRename() {
		nameSession = app.editRampName(ramp.id);
		editingName = true;
	}

	function openSourceEditor() {
		sourceDraft = sourceValue;
		editingSource = true;
	}

	function closeSourceEditor() {
		sourceDraft = sourceValue;
		editingSource = false;
	}

	function syncSourceDialogOpen(open: boolean) {
		if (!open) closeSourceEditor();
	}

	function applySourceColor() {
		if (!draftSourceColor || sourceError) return;
		app.setRampSourceColor(familyId, ramp.id, draftSourceColor);
		editingSource = false;
	}

	function setSourceFormat(format: SourceColorFormat) {
		const sourceColor = parseSourceColor(sourceValue) ?? draftSourceColor;
		if (!sourceColor) return;
		if (sourceFormat === format) return;
		sourceDraft = serializeSourceColor(sourceColor.oklch, format);
	}
</script>

<section aria-label={`Color ramp ${ramp.name}`} class="color-ramp">
	<div class="source-cell">
		<button
			type="button"
			class="chip-button"
			aria-label={`Change ${ramp.name} source color`}
			title="Change source color"
			onclick={openSourceEditor}
		>
			<span class="chip" style={`background: ${sourcePreview.css}`}></span>
		</button>
		<div>
			{#if editingName && nameSession}
				<InlineInput
					aria-label="Ramp name"
					value={ramp.name}
					session={createInlineEditSession({
						...nameSession,
						submit: (draft) => {
							const result = nameSession!.submit(draft);
							editingName = false;
							nameSession = null;
							return result;
						}
					})}
				/>
			{:else}
				<h4>{ramp.name}</h4>
			{/if}
			<p>{sourceValue}</p>
			<p>
				L {formatLightness(ramp.sourceColor.lightness)} C {formatChroma(ramp.sourceColor.chroma)} H
				{formatHue(ramp.sourceColor.hue)}
			</p>
		</div>
	</div>
	<div class="swatches">
		{#each ramp.swatches as swatch}
			<ColorSwatch {swatch} {familyId} rampId={ramp.id} {gamut} />
		{/each}
	</div>
	<div class="actions">
		<button
			type="button"
			aria-label={`Move ${ramp.name} up`}
			disabled={!canMoveUp}
			onclick={() => app.moveRamp(familyId, ramp.id, -1)}>Move up</button
		>
		<button
			type="button"
			aria-label={`Move ${ramp.name} down`}
			disabled={!canMoveDown}
			onclick={() => app.moveRamp(familyId, ramp.id, 1)}>Move down</button
		>
		<button type="button" onclick={startRampRename}>Rename ramp</button>
		<button type="button" onclick={() => app.deleteRamp(familyId, ramp.id)}
			>Delete Color Ramp</button
		>
	</div>
</section>

<Dialog
	bind:open={editingSource}
	title={`Source color for ${ramp.name}`}
	closeLabel="Close source color editor"
	onopenchange={syncSourceDialogOpen}
>
	<div class="editor-preview">
		<span
			class:warning={draftSourcePreview?.outOfSelectedGamut}
			class="preview-chip"
			style={`background: ${draftSourcePreview?.css ?? 'transparent'}`}
		></span>
		<p>
			{draftSourcePreview?.hex ?? sourcePreview.hex}{draftSourcePreview?.warning
				? ` - ${draftSourcePreview.warning}`
				: ''}
		</p>
	</div>
	<label>
		<span>Source color</span>
		<input
			type="text"
			aria-label="Source color"
			aria-invalid={sourceError ? 'true' : undefined}
			value={sourceDraft}
			oninput={(event) => (sourceDraft = event.currentTarget.value)}
		/>
		{#if sourceError}
			<span class="error">{sourceError}</span>
		{/if}
	</label>
	<Tabs
		items={sourceFormats.map((option) => ({ id: option.format, label: option.label }))}
		value={sourceFormat}
		aria-label="Source color format"
		onchange={(format) => setSourceFormat(format as SourceColorFormat)}
	/>
	{#snippet actions()}
		<button type="button" onclick={closeSourceEditor}>Cancel</button>
		<button
			type="button"
			disabled={Boolean(sourceError) || !hasSourceChanges}
			onclick={applySourceColor}>Apply changes</button
		>
	{/snippet}
</Dialog>

<style>
	.color-ramp {
		display: grid;
		gap: 0.75rem;
		border: 1px dashed currentColor;
		border-radius: 0.5rem;
		padding: 0.75rem;
	}
	.source-cell,
	.actions {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}
	.chip-button {
		border: 0;
		padding: 0;
		background: transparent;
		color: inherit;
		cursor: pointer;
	}
	.chip {
		display: block;
		inline-size: 2rem;
		block-size: 2rem;
		border: 1px solid currentColor;
		border-radius: 0.25rem;
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
	:global([aria-label='Source color format']) {
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}
	:global([aria-label='Source color format'] [role='tab'][aria-selected='true']) {
		font-weight: 700;
		background: color-mix(in srgb, Highlight 15%, Canvas);
	}
	.warning {
		box-shadow: inset 0 0 0 3px orange;
	}
	.swatches {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(5rem, 1fr));
		gap: 0.25rem;
	}
</style>
