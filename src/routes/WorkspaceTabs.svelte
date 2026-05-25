<!--
@component
- The workspace switcher for the current variant.
- Always shows Palette, CSS Variables, and Contrast Checker.
- Disables derived workspaces until the theme has at least one color ramp.
-->

<script lang="ts">
	import type { ColorFamilyStructure, Theme, WorkspaceTab } from '$lib/model';
	import Tabs from '$lib/ui/Tabs.svelte';

	type WorkspaceTabsProps = {
		theme: Theme;
		activeTab: WorkspaceTab;
		onselect?: (tab: WorkspaceTab) => void;
	};

	let { theme, activeTab, onselect = (_tab: WorkspaceTab) => {} }: WorkspaceTabsProps = $props();

	let hasRamps = $derived(
		theme.structure.families.some((family: ColorFamilyStructure) => family.ramps.length > 0)
	);
	const dependentTabTitle = 'A color ramp is required before this workspace is available.';
	let workspaceTabs = $derived([
		{ id: 'palette', label: 'Palette' },
		{
			id: 'cssVariables',
			label: 'CSS Variables',
			disabled: !hasRamps,
			title: !hasRamps ? dependentTabTitle : undefined
		},
		{
			id: 'contrastChecker',
			label: 'Contrast Checker',
			disabled: !hasRamps,
			title: !hasRamps ? dependentTabTitle : undefined
		}
	]);

	function selectWorkspace(tab: string) {
		if (tab === 'palette' || tab === 'cssVariables' || tab === 'contrastChecker') onselect(tab);
	}
</script>

<nav class="workspace-tabs">
	<Tabs
		items={workspaceTabs}
		value={activeTab}
		aria-label="Workspace tabs"
		onchange={selectWorkspace}
	/>
</nav>

<style>
	.workspace-tabs :global([role='tablist']) {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.workspace-tabs :global([role='tab'][aria-selected='true']) {
		font-weight: 700;
	}
</style>
