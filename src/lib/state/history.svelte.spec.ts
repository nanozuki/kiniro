import { describe, expect, it } from 'vitest';
import { History } from './history.svelte';

describe('History', () => {
	it('moves through a linear timeline and clears redo entries on push', () => {
		const history = new History({ entries: [{ label: 'Initial', value: 0 }], current: 0 });

		expect(history.entries[0]).toEqual({ label: 'Initial', value: 0 });
		history.push('Set one', 1);
		history.push('Set two', 2);

		expect(history.canUndo).toBe(true);
		expect(history.undo()).toEqual({ label: 'Set one', value: 1 });
		expect(history.canRedo).toBe(true);

		history.push('Set three', 3);

		expect(history.canRedo).toBe(false);
		expect(history.entries.map((entry) => entry.value)).toEqual([0, 1, 3]);
		expect(history.current).toBe(2);
	});

	it('caps long history while preserving the current entry', () => {
		const history = new History({ entries: [{ label: 'Set 0', value: 0 }], current: 0 });
		for (let index = 1; index <= 205; index++) history.push(`Set ${index}`, index);

		expect(history.entries).toHaveLength(105);
		expect(history.current).toBe(104);
		expect(history.entries[0].value).toBe(101);
	});

	it('keeps history uncapped until it exceeds the threshold', () => {
		const history = new History({ entries: [{ label: 'Set 0', value: 0 }], current: 0 });
		for (let index = 1; index <= 199; index++) history.push(`Set ${index}`, index);

		expect(history.entries).toHaveLength(200);
		expect(history.current).toBe(199);
	});
});
