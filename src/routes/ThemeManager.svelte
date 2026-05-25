<!--
@component
- Flattens theme and variant navigation into one panel.
- Renders tabs plus inline rename drafts for the current selection.
- Parents own normalization, deletion policy, and selection repair.
-->

<script lang="ts">
	import type { Gamut, Theme, ThemeVariant } from '$lib/model';
	import {
		ensureUniqueName,
		themeNames,
		validateName,
		variantNames,
		type NamedItem
	} from '$lib/naming';
	import InlineInput from '$lib/ui/InlineInput.svelte';
	import type { InlineInputSubmitResult } from '$lib/ui/InlineInput.svelte';
	import Tabs from '$lib/ui/Tabs.svelte';

	type ThemeManagerProps = {
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
	};

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
	}: ThemeManagerProps = $props();

	let editingTheme = $state(false);
	let editingVariant = $state(false);
	let themeDraft = $state('');
	let variantDraft = $state('');
	let selectedTheme = $derived(themes.find((theme: Theme) => theme.id === selectedThemeId) ?? null);
	let selectedVariant = $derived(
		selectedTheme?.variants.find((variant: ThemeVariant) => variant.id === selectedVariantId) ??
			null
	);
	let themeTabs = $derived(themes.map((theme: Theme) => ({ id: theme.id, label: theme.name })));
	let variantTabs = $derived(
		selectedTheme?.variants.map((variant: ThemeVariant) => ({
			id: variant.id,
			label: variant.name
		})) ?? []
	);

	function resolveName(
		draft: string,
		existingNames: readonly NamedItem[],
		exclude: NamedItem,
		fallbackBase: string,
		label: 'Theme' | 'Variant'
	): InlineInputSubmitResult {
		const options = { exclude, fallbackBase };
		const validation = validateName(draft, existingNames, options);
		const value = ensureUniqueName(draft, existingNames, options);
		if (validation.valid && value === draft) return { value };

		const error =
			validation.error === 'empty-display-name'
				? `${label} name cannot be empty; using "${value}".`
				: validation.error === 'empty-css-name'
					? `${label} name must contain a letter or number; using "${value}".`
					: validation.error === 'duplicate-name'
						? `${label} name already exists; using "${value}".`
						: validation.error === 'duplicate-css-name'
							? `${label} name would create the same CSS name as another ${label.toLowerCase()}; using "${value}".`
							: `${label} name was adjusted to "${value}".`;

		return { value, error };
	}
</script>

<section aria-label="Theme manager" class="theme-manager">
	<nav aria-label="Themes">
		<span>Themes:</span>
		{#if selectedThemeId}
			<Tabs
				items={themeTabs}
				value={selectedThemeId}
				aria-label="Themes"
				onchange={onselecttheme}
			/>
		{/if}
		<button aria-label="Add theme" onclick={onaddtheme}>+</button>
	</nav>

	{#if selectedTheme}
		<nav aria-label="Variants">
			<span>Variants:</span>
			{#if selectedVariantId}
				<Tabs
					items={variantTabs}
					value={selectedVariantId}
					aria-label="Variants"
					onchange={onselectvariant}
				/>
			{/if}
			<button aria-label="Add variant" onclick={onaddvariant}>+</button>
		</nav>

		<div class="titles">
			{#if editingTheme}
				<InlineInput
					aria-label="Theme name"
					value={themeDraft}
					oninput={(draft) => {
						themeDraft = draft;
						onrenametheme(selectedTheme.id, draft);
					}}
					onsubmit={(draft) => {
						const result = resolveName(draft, themeNames(themes), selectedTheme, 'Theme', 'Theme');
						onrenametheme(selectedTheme.id, result.value);
						editingTheme = false;
						return result;
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
					<InlineInput
						aria-label="Variant name"
						value={variantDraft}
						oninput={(draft) => {
							variantDraft = draft;
							onrenamevariant(selectedVariant.id, draft);
						}}
						onsubmit={(draft) => {
							const result = resolveName(
								draft,
								variantNames(selectedTheme),
								selectedVariant,
								'Variant',
								'Variant'
							);
							onrenamevariant(selectedVariant.id, result.value);
							editingVariant = false;
							return result;
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
	nav :global([role='tablist']),
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
	nav :global([role='tab'][aria-selected='true']) {
		font-weight: 700;
	}
</style>
