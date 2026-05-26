<!--
@component
- Flattens theme and variant navigation into one panel.
- Renders tabs plus inline rename drafts for the current selection.
- Parents own normalization, deletion policy, and selection repair.
-->

<script lang="ts">
	import type { InlineEditSession } from '$lib/ui/InlineInput.svelte';
	import type { Gamut, Theme, ThemeVariant } from '$lib/model';
	import InlineInput from '$lib/ui/InlineInput.svelte';
	import Tabs from '$lib/ui/Tabs.svelte';

	type ThemeManagerProps = {
		themes: Theme[];
		selectedThemeId: string | null;
		selectedVariantId: string | null;
		onselecttheme?: (id: string) => void;
		onselectvariant?: (id: string) => void;
		onaddtheme?: () => void;
		onaddvariant?: () => void;
		onedittheme?: (id: string) => InlineEditSession;
		oneditvariant?: (id: string) => InlineEditSession;
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
		onedittheme = () => ({
			preview: () => {},
			submit: (draft) => ({ value: draft })
		}),
		oneditvariant = () => ({
			preview: () => {},
			submit: (draft) => ({ value: draft })
		}),
		ondeletetheme = (_id: string) => {},
		ondeletevariant = (_id: string) => {},
		onthemegamut = (_id: string, _gamut: Gamut) => {}
	}: ThemeManagerProps = $props();

	let editingTheme = $state(false);
	let editingVariant = $state(false);
	let themeEditSession = $state(0);
	let variantEditSession = $state(0);
	let themeHeading: HTMLHeadingElement | null = $state(null);
	let variantHeading: HTMLHeadingElement | null = $state(null);
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

	function withThemeCompletion(session: InlineEditSession): InlineEditSession {
		return {
			preview: session.preview,
			submit: (draft) => {
				const result = session.submit(draft);
				editingTheme = false;
				queueMicrotask(() => themeHeading?.focus());
				return result;
			}
		};
	}

	function withVariantCompletion(session: InlineEditSession): InlineEditSession {
		return {
			preview: session.preview,
			submit: (draft) => {
				const result = session.submit(draft);
				editingVariant = false;
				queueMicrotask(() => variantHeading?.focus());
				return result;
			}
		};
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
				{#key themeEditSession}
					<InlineInput
						aria-label="Theme name"
						value={selectedTheme.name}
						session={withThemeCompletion(onedittheme(selectedTheme.id))}
					/>
				{/key}
			{:else}
				<h2 bind:this={themeHeading} tabindex="-1">{selectedTheme.name}</h2>
				<button
					onclick={() => {
						themeEditSession += 1;
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
					{#key variantEditSession}
						<InlineInput
							aria-label="Variant name"
							value={selectedVariant.name}
							session={withVariantCompletion(oneditvariant(selectedVariant.id))}
						/>
					{/key}
				{:else}
					<h3 bind:this={variantHeading} tabindex="-1">{selectedVariant.name}</h3>
					<button
						onclick={() => {
							variantEditSession += 1;
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
