<!--
@component
- Flattens theme and variant navigation into one panel.
- Renders tabs plus inline rename drafts for the current selection.
- Parents own normalization, deletion policy, and selection repair.
-->

<script lang="ts">
	import type { Gamut, Theme, ThemeVariant } from '$lib/model';
	let {
		themes,
		selectedThemeId,
		selectedVariantId,
		onselecttheme = (_id: string) => {},
		onselectvariant = (_id: string) => {},
		onaddtheme = () => {},
		onaddvariant = () => {},
		onrenametheme = (_id: string, _name: string) => {},
		onrenamevariant = (_id: string, _name: string) => {},
		ondeletetheme = (_id: string) => {},
		ondeletevariant = (_id: string) => {},
		onthemegamut = (_id: string, _gamut: Gamut) => {}
	} = $props<{
		themes: Theme[];
		selectedThemeId: string | null;
		selectedVariantId: string | null;
		onselecttheme?: (id: string) => void;
		onselectvariant?: (id: string) => void;
		onaddtheme?: () => void;
		onaddvariant?: () => void;
		onrenametheme?: (id: string, name: string) => void;
		onrenamevariant?: (id: string, name: string) => void;
		ondeletetheme?: (id: string) => void;
		ondeletevariant?: (id: string) => void;
		onthemegamut?: (id: string, gamut: Gamut) => void;
	}>();

	let editingTheme = $state(false);
	let editingVariant = $state(false);
	let themeDraft = $state('');
	let variantDraft = $state('');
	let selectedTheme = $derived(themes.find((theme: Theme) => theme.id === selectedThemeId) ?? null);
	let selectedVariant = $derived(
		selectedTheme?.variants.find((variant: ThemeVariant) => variant.id === selectedVariantId) ??
			null
	);
</script>

<section aria-label="Theme manager" class="theme-manager">
	<nav aria-label="Themes">
		<span>Themes:</span>
		{#each themes as theme}
			<button aria-current={theme.id === selectedThemeId} onclick={() => onselecttheme(theme.id)}
				>{theme.name}</button
			>
		{/each}
		<button aria-label="Add theme" onclick={onaddtheme}>+</button>
	</nav>

	{#if selectedTheme}
		<nav aria-label="Variants">
			<span>Variants:</span>
			{#each selectedTheme.variants as variant}
				<button
					aria-current={variant.id === selectedVariantId}
					onclick={() => onselectvariant(variant.id)}>{variant.name}</button
				>
			{/each}
			<button aria-label="Add variant" onclick={onaddvariant}>+</button>
		</nav>

		<div class="titles">
			{#if editingTheme}
				<input
					aria-label="Theme name"
					bind:value={themeDraft}
					oninput={() => onrenametheme(selectedTheme.id, themeDraft)}
					onblur={() => {
						onrenametheme(selectedTheme.id, themeDraft);
						editingTheme = false;
					}}
				/>
			{:else}
				<h2>{selectedTheme.name}</h2>
				<button
					onclick={() => {
						themeDraft = selectedTheme.name;
						editingTheme = true;
					}}>Rename theme</button
				>
			{/if}
			<button onclick={() => ondeletetheme(selectedTheme.id)}>Delete theme</button>
			<label>
				Target gamut
				<select
					value={selectedTheme.targetGamut}
					onchange={(event) => onthemegamut(selectedTheme.id, event.currentTarget.value as Gamut)}
				>
					<option value="srgb">sRGB</option>
					<option value="p3">Display P3</option>
				</select>
			</label>

			{#if selectedVariant}
				{#if editingVariant}
					<input
						aria-label="Variant name"
						bind:value={variantDraft}
						oninput={() => onrenamevariant(selectedVariant.id, variantDraft)}
						onblur={() => {
							onrenamevariant(selectedVariant.id, variantDraft);
							editingVariant = false;
						}}
					/>
				{:else}
					<h3>{selectedVariant.name}</h3>
					<button
						onclick={() => {
							variantDraft = selectedVariant.name;
							editingVariant = true;
						}}>Rename variant</button
					>
				{/if}
				{#if selectedTheme.variants.length > 1}<button
						onclick={() => ondeletevariant(selectedVariant.id)}>Delete variant</button
					>{/if}
			{/if}
		</div>
	{/if}
</section>

<style>
	.theme-manager,
	nav,
	.titles {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		align-items: center;
	}
	.theme-manager {
		flex-direction: column;
		align-items: stretch;
	}
	[aria-current='true'] {
		font-weight: 700;
	}
</style>
