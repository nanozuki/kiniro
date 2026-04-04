<script lang="ts">
	import ColorGroup from './ColorGroup.svelte';
	import { type GroupData, loadGroups, saveGroups } from '$lib/storage';

	let groups = $state<GroupData[]>(loadGroups());
	let nextId = $derived(groups.reduce((max, g) => Math.max(max, g.id), 0));

	$effect(() => {
		saveGroups($state.snapshot(groups));
	});

	function addGroup() {
		groups.push({
			id: nextId + 1,
			name: 'palette',
			lightnessMax: 0.95,
			lightnessMin: 0.16,
			colors: [{ id: 1, name: 'color', hex: '#907aa9' }]
		});
	}

	function deleteGroup(id: number) {
		groups = groups.filter((g) => g.id !== id);
	}
</script>

<main>
	<h1>OKLCH Color Palette Maker</h1>
	{#each groups as group (group.id)}
		<div class="group-wrapper">
			<ColorGroup
				bind:name={group.name}
				bind:colors={group.colors}
				bind:lightnessMax={group.lightnessMax}
				bind:lightnessMin={group.lightnessMin}
			/>
			<button class="delete-btn" onclick={() => deleteGroup(group.id)}>✕</button>
		</div>
	{/each}
	<button class="add-btn" onclick={addGroup}>+ Add group</button>
</main>

<style>
	main {
		padding: 2rem;
		font-family: sans-serif;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	h1 {
		font-size: 1.5rem;
		margin-bottom: 0.5rem;
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
</style>
