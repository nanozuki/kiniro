import { describe, expect, it } from 'vitest';
import { createDefaultTheme } from './model';
import { createSnapshotHistory } from './history';

describe('SnapshotHistory', () => {
	it('creates undo entries only for changed app data and clears redo on commit', () => {
		const history = createSnapshotHistory();
		const data = { themes: [createDefaultTheme()] };

		expect(history.commit('Add theme', { themes: [] })).toBe(false);
		expect(history.commit('Add theme', data)).toBe(true);
		expect(history.canUndo).toBe(true);
		history.undo();
		expect(history.canRedo).toBe(true);
		history.commit('Add again', data);
		expect(history.canRedo).toBe(false);
	});

	it('undoes and redoes app data snapshots with labels', () => {
		const first = { themes: [createDefaultTheme({ name: 'One' })] };
		const second = { themes: [createDefaultTheme({ name: 'Two' })] };
		const history = createSnapshotHistory({ initialData: first });
		history.commit('Replace theme', second);

		expect(history.undo()).toEqual(first);
		expect(history.lastAction).toBe('Undid Replace theme');
		expect(history.redo()).toEqual(second);
		expect(history.lastAction).toBe('Redid Replace theme');
	});

	it('does not store UI state and calls restore hook for selection repair', () => {
		let repaired = false;
		const history = createSnapshotHistory({ onRestore: () => (repaired = true) });
		history.commit('Add theme', { themes: [createDefaultTheme()] });
		history.undo();

		expect(repaired).toBe(true);
		expect(history.snapshot()).not.toHaveProperty('ui');
	});

	it('caps persisted history snapshots without capping in-memory history', () => {
		const history = createSnapshotHistory();
		for (let index = 0; index < 105; index++) {
			history.commit(`Change ${index}`, { themes: [createDefaultTheme()] });
		}

		expect(history.history.past).toHaveLength(105);
		expect(history.snapshot(100).history.past).toHaveLength(100);
	});
});
