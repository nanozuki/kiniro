<script lang="ts">
	import { browser } from '$app/environment';
	import ColorRow from './ColorRow.svelte';

	const STORAGE_KEY = 'kiniro-palettes';

	type RowData = { id: number; name: string; hex: string };

	function loadRows(): RowData[] {
		if (!browser) return [];
		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) return JSON.parse(saved);
		} catch {}
		return [{ id: 1, name: 'primary', hex: '#3b82f6' }];
	}

	let rows = $state<RowData[]>(loadRows());
	let nextId = $derived(rows.reduce((max, r) => Math.max(max, r.id), 0));

	$effect(() => {
		localStorage.setItem(STORAGE_KEY, JSON.stringify($state.snapshot(rows)));
	});

	function addRow() {
		rows.push({ id: nextId + 1, name: 'color', hex: '#6366f1' });
	}

	function deleteRow(id: number) {
		rows = rows.filter((r) => r.id !== id);
	}
</script>

<main>
	<h1>OKLCH Color Palette Maker</h1>
	{#each rows as row (row.id)}
		<div class="row-wrapper">
			<ColorRow bind:name={row.name} bind:hex={row.hex} />
			<button class="delete-btn" onclick={() => deleteRow(row.id)}>✕</button>
		</div>
	{/each}
	<button class="add-btn" onclick={addRow}>+ Add color</button>
</main>

<style>
	main {
		padding: 2rem;
		font-family: sans-serif;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	h1 {
		font-size: 1.5rem;
		margin-bottom: 1rem;
	}

	.row-wrapper {
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
