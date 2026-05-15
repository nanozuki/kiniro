<script lang="ts">
	import { browser } from '$app/environment';
	import { createNextAppManager } from '$lib/next/state';
	import { createDefaultPersistedState, loadNextState, saveNextState } from '$lib/next/storage';

	const loaded = browser ? loadNextState(localStorage) : { ok: true, state: createDefaultPersistedState(), reset: false, error: null };
	const manager = createNextAppManager({
		data: loaded.state.data,
		ui: {
			selection: { themeId: loaded.state.ui.selectedThemeId, variantId: loaded.state.ui.selectedVariantId },
			workspaceTab: loaded.state.ui.workspaceTab,
			gamutPreview: loaded.state.ui.gamutPreview
		}
	});

	let app = manager;
	let revision = $state(0);
	let toast = $state(loaded.reset ? 'Stored data was reset because it was invalid.' : '');

	function addFirstTheme() {
		app.addTheme();
		revision += 1;
		syncStorage();
	}

	function setTab(tab: 'palette' | 'cssVariables' | 'contrastChecker') {
		app.setWorkspaceTab(tab);
		revision += 1;
		syncStorage();
	}

	function setGamut(gamut: 'srgb' | 'p3') {
		app.setGamutPreview(gamut);
		revision += 1;
		syncStorage();
	}

	function hasThemes(_revision: number) {
		return app.data.themes.length > 0;
	}

	function syncStorage() {
		if (!browser) return;
		try {
			saveNextState(localStorage, {
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

<svelte:head>
	<title>Kiniro Next</title>
</svelte:head>

<main class="next-shell" data-revision={revision}>
	<section aria-label="TitleBar" class="panel title-bar">
		<div>
			<h1>Kiniro</h1>
			<p>Make OKLCH color palettes and export CSS variables.</p>
		</div>
		<div class="actions">
			{#if hasThemes(revision)}
				<button disabled>Undo</button>
				<button disabled>Redo</button>
				<button aria-pressed={app.ui.gamutPreview === 'srgb'} onclick={() => setGamut('srgb')}>sRGB</button>
				<button aria-pressed={app.ui.gamutPreview === 'p3'} onclick={() => setGamut('p3')}>P3</button>
				<button>Export</button>
			{/if}
			<button>Import</button>
			{#if !hasThemes(revision)}
				<button onclick={addFirstTheme}>Add first Theme</button>
			{/if}
		</div>
	</section>

	{#if hasThemes(revision)}
		<section aria-label="ThemeManager" class="panel">
			<p>Themes: {app.selectedTheme?.name}</p>
			<p>Variants: {app.selectedVariant?.name}</p>
		</section>

		<nav aria-label="WorkspaceTabs" class="panel tabs">
			<button aria-current={app.ui.workspaceTab === 'palette'} onclick={() => setTab('palette')}>Palette</button>
			<button aria-current={app.ui.workspaceTab === 'cssVariables'} onclick={() => setTab('cssVariables')}>CSS Variables</button>
			<button aria-current={app.ui.workspaceTab === 'contrastChecker'} onclick={() => setTab('contrastChecker')}>Contrast Checker</button>
		</nav>

		<section aria-label="Workspace" class="panel">
			{#if app.ui.workspaceTab === 'palette'}
				<h2>Palette</h2>
				<p>Palette workspace placeholder</p>
			{:else if app.ui.workspaceTab === 'cssVariables'}
				<h2>CSS Variables</h2>
				<p>CSS Variables workspace placeholder</p>
			{:else}
				<h2>Contrast Checker</h2>
				<p>Contrast Checker workspace placeholder</p>
			{/if}
		</section>
	{/if}

	<section aria-label="Dialogs" hidden>Dialogs placeholder</section>
	{#if toast}<aside aria-label="Toasts">{toast}</aside>{/if}
</main>

<style>
	.next-shell { display: grid; gap: 1rem; padding: 1rem; }
	.panel { border: 1px solid currentColor; border-radius: 0.5rem; padding: 1rem; }
	.title-bar { display: flex; justify-content: space-between; gap: 1rem; }
	.actions, .tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; }
	[aria-current='true'], [aria-pressed='true'] { font-weight: 700; }
</style>
