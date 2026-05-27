<!--
@component
- The workspace switcher for the current variant.
- Always shows Palette, CSS Variables, and Contrast Checker.
- Disables derived workspaces until the theme has at least one color ramp.
-->

<script lang="ts">
	import type { ColorFamilyStructure } from '$lib/model';
	import { getAppManagerContext } from '$lib/state/appContext';
	import Tabs from '$lib/ui/Tabs.svelte';

	const app = getAppManagerContext();
	let theme = $derived(app.selectedTheme);
	let activeTab = $derived(app.ui.workspaceTab);
	let hasRamps = $derived(
		theme?.structure.families.some((family: ColorFamilyStructure) => family.ramps.length > 0) ??
			false
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
		if (tab === 'palette' || tab === 'cssVariables' || tab === 'contrastChecker')
			app.setWorkspaceTab(tab);
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
