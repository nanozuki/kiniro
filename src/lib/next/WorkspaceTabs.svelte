<script lang="ts">
	import type { ColorFamilyStructure, Theme, WorkspaceTab } from './model';

	let { theme, activeTab, onselect = (_tab: WorkspaceTab) => {} } = $props<{
		theme: Theme;
		activeTab: WorkspaceTab;
		onselect?: (tab: WorkspaceTab) => void;
	}>();

	let hasRamps = $derived(theme.structure.families.some((family: ColorFamilyStructure) => family.ramps.length > 0));
	const dependentTabTitle = 'A color ramp is required before this workspace is available.';
</script>

<nav aria-label="Workspace tabs" class="workspace-tabs">
	<button type="button" aria-current={activeTab === 'palette'} onclick={() => onselect('palette')}>Palette</button>
	<button
		type="button"
		aria-current={activeTab === 'cssVariables'}
		disabled={!hasRamps}
		title={!hasRamps ? dependentTabTitle : undefined}
		onclick={() => hasRamps && onselect('cssVariables')}
	>
		CSS Variables
	</button>
	<button
		type="button"
		aria-current={activeTab === 'contrastChecker'}
		disabled={!hasRamps}
		title={!hasRamps ? dependentTabTitle : undefined}
		onclick={() => hasRamps && onselect('contrastChecker')}
	>
		Contrast Checker
	</button>
</nav>

<style>
	.workspace-tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; }
	[aria-current='true'] { font-weight: 700; }
</style>
