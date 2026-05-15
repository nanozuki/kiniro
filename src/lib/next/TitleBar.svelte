<script lang="ts">
	import type { GamutPreview } from './model';
	let {
		hasThemes,
		canUndo = false,
		canRedo = false,
		gamutPreview = 'srgb',
		onaddtheme = () => {},
		onimport = () => {},
		onexport = () => {},
		onundo = () => {},
		onredo = () => {},
		ongamut = (_gamut: GamutPreview) => {}
	} = $props<{
		hasThemes: boolean;
		canUndo?: boolean;
		canRedo?: boolean;
		gamutPreview?: GamutPreview;
		onaddtheme?: () => void;
		onimport?: () => void;
		onexport?: () => void;
		onundo?: () => void;
		onredo?: () => void;
		ongamut?: (gamut: GamutPreview) => void;
	}>();
</script>

<header class="title-bar">
	<div>
		<h1>Kiniro</h1>
		{#if !hasThemes}<p>Make OKLCH palettes from colors you like and export them as CSS variables.</p>{/if}
	</div>
	<nav aria-label="Title actions">
		{#if hasThemes}
			<button disabled={!canUndo} onclick={onundo}>Undo</button>
			<button disabled={!canRedo} onclick={onredo}>Redo</button>
			<button aria-pressed={gamutPreview === 'srgb'} onclick={() => ongamut('srgb')}>sRGB</button>
			<button aria-pressed={gamutPreview === 'p3'} onclick={() => ongamut('p3')}>P3</button>
			<button onclick={onexport}>Export</button>
		{/if}
		<button onclick={onimport}>Import</button>
		{#if !hasThemes}<button onclick={onaddtheme}>Add first Theme</button>{/if}
	</nav>
</header>

<style>
	.title-bar { display: flex; justify-content: space-between; gap: 1rem; }
	nav { display: flex; gap: 0.5rem; flex-wrap: wrap; }
</style>
