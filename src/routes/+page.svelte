<!--
@component
- The app shell for Kiniro.
- Switches between the empty landing state and the editor workspace.
- Keeps persistence, undo/redo, and import application behind AppManager.
-->

<script lang="ts">
	import { browser } from '$app/environment';
	import CSSVariables from './CSSVariables.svelte';
	import ContrastChecker from './ContrastChecker.svelte';
	import ImportExportDialogs from './ImportExportDialogs.svelte';
	import Palette from './Palette.svelte';
	import ThemeManager from './ThemeManager.svelte';
	import WorkspaceTabs from './WorkspaceTabs.svelte';
	import { generateVariantPalette } from '$lib/palette';
	import { setAppManagerContext } from '$lib/state/appContext';
	import { createAppManager } from '$lib/state/state.svelte';
	import { addToast } from '$lib/ui/Toaster.svelte';

	const app = createAppManager({ storage: browser ? localStorage : undefined });
	setAppManagerContext(app);

	let selectedTheme = $derived(app.selectedTheme);
	let selectedVariant = $derived(app.selectedVariant);
	let workspaceTab = $derived(app.ui.workspaceTab);
	let palette = $derived(
		selectedTheme && selectedVariant ? generateVariantPalette(selectedTheme, selectedVariant) : null
	);

	$effect(() => {
		if (app.storageReset) {
			addToast({
				type: 'assertive',
				data: {
					title: 'Stored data reset',
					description: 'Stored data was reset because it was invalid.'
				}
			});
		}
	});

	function addFirstTheme() {
		app.addTheme();
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
</script>

<svelte:head><title>Kiniro</title></svelte:head>

<main class="app-shell">
	<section aria-label="TitleBar" class="panel title-bar">
		<div>
			<h1>Kiniro</h1>
			<p>Make OKLCH color palettes and export CSS variables.</p>
		</div>
		<div class="actions">
			{#if selectedTheme}
				<button type="button" disabled={!app.canUndo} onclick={() => app.undo()}>Undo</button>
				<button type="button" disabled={!app.canRedo} onclick={() => app.redo()}>Redo</button>
			{/if}
			<ImportExportDialogs onexport={(filename, json) => download(filename, json)} />
			{#if !selectedTheme}<button onclick={addFirstTheme}>Add first Theme</button>{/if}
		</div>
	</section>

	{#if selectedTheme && selectedVariant}
		<section class="panel">
			<ThemeManager />
		</section>

		<section class="panel">
			<WorkspaceTabs />
		</section>

		<section aria-label="Workspace" class="panel">
			{#if workspaceTab === 'palette'}
				<Palette />
			{:else if workspaceTab === 'cssVariables'}
				<CSSVariables />
			{:else if palette}
				<ContrastChecker {palette} gamut={selectedTheme.targetGamut} />
			{/if}
		</section>
	{/if}
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
</style>
