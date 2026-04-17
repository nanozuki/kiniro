<script lang="ts">
	import ColorGroup from './ColorGroup.svelte';
	import ColorPlayground from './ColorPlayground.svelte';
	import CssVariablesDialog from './CssVariablesDialog.svelte';
	import { type GroupData, loadGroups, saveGroups, parseGroupsJson } from '$lib/storage';

	// The page owns persisted palette groups and passes the shared OKLCH model to editing tools.
	let cssDialogOpen = $state(false);
	let cssVarPrefix = $state('color-');

	let groups = $state<GroupData[]>(loadGroups());
	let nextId = $derived(groups.reduce((max, g) => Math.max(max, g.id), 0));

	$effect(() => {
		// Persist the palette model, not generated swatches, so OKLCH rules can evolve
		// without locking old files to derived display colors.
		saveGroups($state.snapshot(groups));
	});

	function addGroup() {
		groups.push({
			id: nextId + 1,
			name: 'palette',
			lightnessMax: 0.95,
			lightnessMin: 0.16,
			controlledLightness: {},
			reversed: false,
			stepsCount: 9,
			halfStepBefore: false,
			halfStepAfter: false,
			colors: [{ id: 1, name: 'color', hex: '#907aa9' }]
		});
	}

	function deleteGroup(id: number) {
		groups = groups.filter((g) => g.id !== id);
	}

	function exportJson() {
		const json = JSON.stringify($state.snapshot(groups), null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'kiniro-palettes.json';
		a.click();
		URL.revokeObjectURL(url);
	}

	function importJson() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = 'application/json,.json';
		input.onchange = () => {
			const file = input.files?.[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = () => {
				const parsed = parseGroupsJson(reader.result as string);
				if (parsed) {
					groups = parsed;
				} else {
					alert('Invalid palette file.');
				}
			};
			reader.readAsText(file);
		};
		input.click();
	}
</script>

<main>
	<div class="header">
		<h1>OKLCH Color Palette Maker</h1>
		<div class="header-actions">
			<button class="tool-btn" onclick={() => (cssDialogOpen = true)}>CSS Variables</button>
			<button class="tool-btn" onclick={exportJson}>Export JSON</button>
			<button class="tool-btn" onclick={importJson}>Import JSON</button>
		</div>
	</div>
	{#each groups as group (group.id)}
		<div class="group-wrapper">
			<ColorGroup
				bind:name={group.name}
				bind:colors={group.colors}
				bind:lightnessMax={group.lightnessMax}
				bind:lightnessMin={group.lightnessMin}
				bind:controlledLightness={group.controlledLightness}
				bind:reversed={group.reversed}
				bind:stepsCount={group.stepsCount}
				bind:halfStepBefore={group.halfStepBefore}
				bind:halfStepAfter={group.halfStepAfter}
			/>
			<button class="delete-btn" onclick={() => deleteGroup(group.id)}>✕</button>
		</div>
	{/each}
	<button class="add-btn" onclick={addGroup}>+ Add group</button>
	<ColorPlayground {groups} prefix={cssVarPrefix} />
</main>

<CssVariablesDialog {groups} bind:open={cssDialogOpen} bind:prefix={cssVarPrefix} />

<style>
	main {
		padding: 2rem;
		font-family: sans-serif;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.header {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	h1 {
		font-size: 1.5rem;
		flex: 1;
	}

	.header-actions {
		display: flex;
		gap: 0.5rem;
	}

	.group-wrapper {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.delete-btn {
		margin-top: 1rem;
		padding: 0.25rem 0.5rem;
		background: none;
		border: 1px solid #ccc;
		border-radius: 4px;
		cursor: pointer;
		color: #888;
		font-size: 0.75rem;
		line-height: 1;
	}

	.delete-btn:hover {
		border-color: #e55;
		color: #e55;
	}

	.add-btn {
		align-self: flex-start;
		padding: 0.4rem 0.8rem;
		background: none;
		border: 1px dashed #aaa;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		color: #555;
	}

	.add-btn:hover {
		border-color: #555;
		color: #111;
	}

	.tool-btn {
		padding: 0.4rem 0.8rem;
		background: none;
		border: 1px solid #aaa;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
		color: #555;
	}

	.tool-btn:hover {
		border-color: #555;
		color: #111;
	}
</style>
