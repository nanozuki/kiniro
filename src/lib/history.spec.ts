import { describe, expect, it } from 'vitest';
import { createHistoryState, History, INITIAL_HISTORY_LABEL, capHistoryState } from './history';

describe('History', () => {
	it('moves through a linear timeline and clears redo entries on push', () => {
		const state = createHistoryState(0);
		const history = new History(state);

		expect(history.entries[0]).toEqual({ label: INITIAL_HISTORY_LABEL, value: 0 });
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

	it('replaces the current baseline without creating an undo entry', () => {
		const state = createHistoryState({ name: 'One' });
		const history = new History(state);

		history.replaceCurrent({ name: 'Preview baseline' });
		history.push('Rename', { name: 'Two' });

		expect(history.undo()).toEqual({
			label: INITIAL_HISTORY_LABEL,
			value: { name: 'Preview baseline' }
		});
	});

	it('caps persisted history while preserving the current entry', () => {
		const state = createHistoryState(0);
		const history = new History(state);
		for (let index = 1; index <= 105; index++) history.push(`Set ${index}`, index);

		history.undo();
		history.undo();
		const capped = capHistoryState(state, 100);

		expect(capped.entries).toHaveLength(100);
		expect(capped.entries[capped.current].value).toBe(103);
	});
});
