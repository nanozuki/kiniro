<!--
@component
- The app shell for Kiniro.
- Switches between the empty landing state and the editor workspace.
- Wires AppManager mutations to persistence while keeping generated palette data ephemeral.
-->

<script lang="ts">
	import { browser } from '$app/environment';
	import CSSVariables from './CSSVariables.svelte';
	import ContrastChecker from './ContrastChecker.svelte';
	import ImportExportDialogs from './ImportExportDialogs.svelte';
	import Palette from './Palette.svelte';
	import ThemeManager from './ThemeManager.svelte';
	import WorkspaceTabs from './WorkspaceTabs.svelte';
	import { createSourceColor } from '$lib/color';
	import {
		applyThemeImport,
		type ImportThemeChoice,
		type ThemeExportFile
	} from '$lib/importExport';
	import { generateVariantPalette } from '$lib/palette';
	import { createAppManager } from '$lib/state/state';
	import { createDefaultPersistedState, loadState, saveState } from '$lib/storage';

	const loaded = browser
		? loadState(localStorage)
		: { ok: true, state: createDefaultPersistedState(), reset: false, error: null };
	const manager = createAppManager({
		data: loaded.state.data,
		ui: {
			selection: {
				themeId: loaded.state.ui.selectedThemeId,
				variantId: loaded.state.ui.selectedVariantId
			},
			workspaceTab: loaded.state.ui.workspaceTab,
			gamutPreview: loaded.state.ui.gamutPreview
		}
	});

	let app = manager;
	let revision = $state(0);
	let toast = $state(loaded.reset ? 'Stored data was reset because it was invalid.' : '');
	let selectedTheme = $derived.by(() => {
		const _revision = revision;
		return app.selectedTheme;
	});
	let selectedVariant = $derived.by(() => {
		const _revision = revision;
		return app.selectedVariant;
	});
	let palette = $derived(
		selectedTheme && selectedVariant ? generateVariantPalette(selectedTheme, selectedVariant) : null
	);

	function mutate(change: () => void) {
		change();
		revision += 1;
		syncStorage();
	}
	function addFirstTheme() {
		mutate(() => void app.addTheme());
	}
	function download(filename: string, json: string) {
		if (!browser) return;
		const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);
	}
	function importThemes(file: ThemeExportFile, choices: ImportThemeChoice[]) {
		mutate(() => {
			const result = applyThemeImport(app.data.themes, file.themes, choices);
			app.data.themes = result.themes;

			const importedTheme =
				result.themes.find((theme) => theme.id === result.selectedThemeId) ??
				result.themes[0] ??
				null;

			app.ui.selection.themeId = importedTheme?.id ?? null;
			app.ui.selection.variantId = importedTheme?.variants[0]?.id ?? null;
			app.ui.workspaceTab = 'palette';
			app.repairUiState();
		});
	}
	function syncStorage() {
		if (!browser) return;
		try {
			saveState(localStorage, {
				version: 1,
				data: app.data,
				ui: {
					selectedThemeId: app.ui.selection.themeId,
					selectedVariantId: app.ui.selection.variantId,
					workspaceTab: app.ui.workspaceTab,
					gamutPreview: app.ui.gamutPreview
				},
				history: { past: [], future: [] }
			});
		} catch {
			toast = 'Autosave failed. Kiniro will retry later.';
		}
	}
</script>

<svelte:head><title>Kiniro</title></svelte:head>

<main class="app-shell" data-revision={revision}>
	<section aria-label="TitleBar" class="panel title-bar">
		<div>
			<h1>Kiniro</h1>
			<p>Make OKLCH color palettes and export CSS variables.</p>
		</div>
		<div class="actions">
			{#if selectedTheme}
				<button disabled>Undo</button><button disabled>Redo</button>
				<button
					aria-pressed={app.ui.gamutPreview === 'srgb'}
					onclick={() => mutate(() => app.setGamutPreview('srgb'))}>sRGB</button
				>
				<button
					aria-pressed={app.ui.gamutPreview === 'p3'}
					onclick={() => mutate(() => app.setGamutPreview('p3'))}>P3</button
				>
			{/if}
			<ImportExportDialogs themes={app.data.themes} onexport={download} onimport={importThemes} />
			{#if !selectedTheme}<button onclick={addFirstTheme}>Add first Theme</button>{/if}
		</div>
	</section>

	{#if selectedTheme && selectedVariant}
		<section class="panel">
			<ThemeManager
				themes={app.data.themes}
				selectedThemeId={app.ui.selection.themeId}
				selectedVariantId={app.ui.selection.variantId}
				onselecttheme={(id) => mutate(() => app.selectTheme(id))}
				onselectvariant={(id) => mutate(() => app.selectVariant(id))}
				onaddtheme={() => mutate(() => void app.addTheme())}
				onaddvariant={() => mutate(() => void app.addVariant())}
				onrenametheme={(id, name) => mutate(() => app.renameTheme(id, name))}
				onrenamevariant={(id, name) => mutate(() => app.renameVariant(id, name))}
				ondeletetheme={(id) => mutate(() => app.deleteTheme(id))}
				ondeletevariant={(id) => mutate(() => app.deleteVariant(id))}
			/>
		</section>

		<section class="panel">
			<WorkspaceTabs
				theme={selectedTheme}
				activeTab={app.ui.workspaceTab}
				onselect={(tab) => mutate(() => app.setWorkspaceTab(tab))}
			/>
		</section>

		<section aria-label="Workspace" class="panel">
			{#if app.ui.workspaceTab === 'palette'}
				<Palette
					families={selectedTheme.structure.families}
					variant={selectedVariant}
					variantCount={selectedTheme.variants.length}
					onaddfamily={() => mutate(() => void app.addFamily())}
					onrenamefamily={(id, name) => mutate(() => app.renameFamily(id, name))}
					ondeletefamily={(id) => mutate(() => app.deleteFamily(id))}
					onaddramp={(familyId) =>
						mutate(
							() =>
								void app.addRamp(
									familyId,
									createSourceColor({ lightness: 0.7, chroma: 0.1, hue: 0 })
								)
						)}
				/>
			{:else if app.ui.workspaceTab === 'cssVariables'}
				<CSSVariables
					theme={selectedTheme}
					variant={selectedVariant}
					onprefix={(prefix) => mutate(() => app.setThemeCssPrefix(selectedTheme.id, prefix))}
				/>
			{:else if palette}
				<ContrastChecker {palette} gamutPreview={app.ui.gamutPreview} />
			{/if}
		</section>
	{/if}

	{#if toast}<aside aria-label="Toasts">{toast}</aside>{/if}
</main>

<style>
	.app-shell {
		display: grid;
		gap: 1rem;
		padding: 1rem;
	}
	.panel {
		border: 1px solid currentColor;
		border-radius: 0.5rem;
		padding: 1rem;
	}
	.title-bar {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}
	.actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		align-items: start;
	}
	[aria-pressed='true'] {
		font-weight: 700;
	}
</style>
