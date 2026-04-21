<script lang="ts">
	import { Tabs } from 'melt/builders';
	import { Kiniro } from '$lib/kiniro.svelte';
	import { slugifyCssIdent } from '$lib/cssVariables';
	import { loadPalettes, parsePalettesJson, savePalettes } from '$lib/storage';
	import ColorGroup from './ColorGroup.svelte';
	import ColorPlayground from './ColorPlayground.svelte';
	import CssVariablesDialog from './CssVariablesDialog.svelte';

	// The page coordinates the reactive Kiniro model with route-level import, export, and editing UI.
	let cssDialogOpen = $state(false);
	let cssVarPrefix = $state('color-');
	let kiniro = new Kiniro(loadPalettes());

	function parseTabId(value: string): number | null {
		if (value === '') return null;
		const id = Number(value);
		return Number.isFinite(id) ? id : null;
	}

	const paletteTabs = new Tabs<string>({
		value: () => String(kiniro.activePaletteId ?? ''),
		onValueChange: (value) => {
			kiniro.activePaletteId = parseTabId(value);
			kiniro.activeVariantId = kiniro.activePalette?.variants[0]?.id ?? null;
		}
	});
	const variantTabs = new Tabs<string>({
		value: () => String(kiniro.activeVariantId ?? ''),
		onValueChange: (value) => (kiniro.activeVariantId = parseTabId(value))
	});

	const activeVariableNamespace = $derived.by(() => {
		const palette = kiniro.activePalette;
		const variant = kiniro.activeVariant;
		return palette && variant
			? `${slugifyCssIdent(palette.name)}-${slugifyCssIdent(variant.name)}-`
			: '';
	});

	$effect(() => {
		// Persist the palette model, not generated swatches, so OKLCH rules can evolve
		// without locking old files to derived display colors.
		savePalettes(kiniro.snapshot());
	});

	function exportJson() {
		const json = JSON.stringify(kiniro.snapshot(), null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'kiniro-palettes.json';
		a.click();
		URL.revokeObjectURL(url);
	}

	function importJson() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'application/json,.json';
		input.onchange = () => {
			const file = input.files?.[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = () => {
				const parsed = parsePalettesJson(reader.result as string);
				if (parsed) {
					kiniro.replaceAll(parsed);
				} else {
					alert('Invalid palette file.');
				}
			};
			reader.readAsText(file);
		};
		input.click();
	}
</script>

<main>
	<div class="header">
		<h1>OKLCH Color Palette Maker</h1>
		<div class="header-actions">
			<button class="tool-btn" onclick={() => (cssDialogOpen = true)}>CSS Variables</button>
			<button class="tool-btn" onclick={exportJson}>Export JSON</button>
			<button class="tool-btn" onclick={importJson}>Import JSON</button>
		</div>
	</div>

	{#if kiniro.activePalette && kiniro.activeVariant}
		<section class="model-controls" aria-label="Palette and variant controls">
			<div class="tab-section">
				<span class="tab-label">Palette</span>
				<div class="tabs" {...paletteTabs.triggerList}>
					{#each kiniro.palettes as palette (palette.id)}
						<button type="button" class="tab-trigger" {...paletteTabs.getTrigger(String(palette.id))}>
							{palette.name}
						</button>
					{/each}
				</div>
			</div>

			{#each kiniro.palettes as palette (palette.id)}
				<div class="control-block" {...paletteTabs.getContent(String(palette.id))}>
					{#if palette.id === kiniro.activePaletteId}
						<input
							type="text"
							value={kiniro.activePalette.name}
							aria-label="Palette name"
							oninput={(e) =>
								kiniro.activePaletteId &&
								kiniro.updatePalette(kiniro.activePaletteId, { name: e.currentTarget.value })}
						/>
						<button class="tool-btn" onclick={() => kiniro.addPalette()}>+ Add palette</button>
						<button
							class="tool-btn danger"
							disabled={kiniro.palettes.length <= 1}
							onclick={() => kiniro.activePaletteId && kiniro.deletePalette(kiniro.activePaletteId)}
						>
							Delete palette
						</button>
					{/if}
				</div>
			{/each}

			<div class="tab-section">
				<span class="tab-label">Variant</span>
				<div class="tabs" {...variantTabs.triggerList}>
					{#each kiniro.activePalette.variants as variant (variant.id)}
						<button type="button" class="tab-trigger" {...variantTabs.getTrigger(String(variant.id))}>
							{variant.name}
						</button>
					{/each}
				</div>
			</div>

			{#each kiniro.activePalette.variants as variant (variant.id)}
				<div class="control-block" {...variantTabs.getContent(String(variant.id))}>
					{#if variant.id === kiniro.activeVariantId}
						<input
							type="text"
							value={kiniro.activeVariant.name}
							aria-label="Variant name"
							oninput={(e) =>
								kiniro.activeVariantId &&
								kiniro.updateVariant(kiniro.activeVariantId, { name: e.currentTarget.value })}
						/>
						<button class="tool-btn" onclick={() => kiniro.addVariant()}>+ Add variant</button>
						<button
							class="tool-btn danger"
							disabled={kiniro.activePalette.variants.length <= 1}
							onclick={() => kiniro.activeVariantId && kiniro.deleteVariant(kiniro.activeVariantId)}
						>
							Delete variant
						</button>
					{/if}
				</div>
			{/each}
		</section>

		{#each kiniro.activeGroups as group (group.id)}
			<div class="group-wrapper">
				<ColorGroup
					{group}
					onGroupChange={(patch) => kiniro.updateGroup(group.id, patch)}
					onLightnessChange={(patch) => kiniro.updateGroupLightness(group.id, patch)}
					onColorChange={(colorId, patch) => kiniro.updateColor(group.id, colorId, patch)}
					onAddColor={() => kiniro.addColor(group.id)}
					onDeleteColor={(colorId) => kiniro.deleteColor(group.id, colorId)}
				/>
				<button class="delete-btn" onclick={() => kiniro.deleteGroup(group.id)}>✕</button>
			</div>
		{/each}
		<button class="add-btn" onclick={() => kiniro.addGroup()}>+ Add group</button>
		<ColorPlayground
			groups={kiniro.activeGroups}
			prefix={cssVarPrefix}
			variableNamespace={activeVariableNamespace}
		/>
	{/if}
</main>

<CssVariablesDialog palettes={kiniro.palettes} bind:open={cssDialogOpen} bind:prefix={cssVarPrefix} />

<style>
	main {
		padding: 2rem;
		font-family: sans-serif;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	h1 {
		font-size: 1.5rem;
		flex: 1;
	}

	.header-actions,
	.control-block,
	.tabs {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.model-controls {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
	}

	.control-block {
		align-items: center;
	}

	.control-block input {
		padding: 0.25rem 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.tab-section {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.tab-label {
		width: 4rem;
		font-size: 0.875rem;
		font-weight: 600;
		color: #555;
	}

	.tabs {
		align-items: center;
	}

	.tab-trigger {
		padding: 0.35rem 0.7rem;
		background: #fff;
		border: 1px solid #d1d5db;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		color: #555;
	}

	.tab-trigger:hover {
		border-color: #907aa9;
		color: #4f3d61;
	}

	.tab-trigger[data-active] {
		background: #f3f0f7;
		border-color: #907aa9;
		color: #4f3d61;
	}

	.group-wrapper {
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

	.tool-btn {
		padding: 0.4rem 0.8rem;
		background: none;
		border: 1px solid #aaa;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		color: #555;
	}

	.tool-btn:hover:not(:disabled) {
		border-color: #555;
		color: #111;
	}

	.tool-btn:disabled {
		cursor: not-allowed;
		opacity: 0.45;
	}

	.tool-btn.danger:hover:not(:disabled) {
		border-color: #e55;
		color: #e55;
	}
</style>
