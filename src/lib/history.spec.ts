import { describe, expect, it } from 'vitest';
import { createDefaultTheme } from './model';
import { createSnapshotHistory } from './history';

const initialUi = {
	selectedThemeId: null,
	selectedVariantId: null,
	workspaceTab: 'palette' as const
};

describe('SnapshotHistory', () => {
	it('creates undo entries only for changed snapshots and clears redo on commit', () => {
		const history = createSnapshotHistory();
		const data = { themes: [createDefaultTheme()] };

		expect(history.commit('Add theme', { data: { themes: [] }, ui: initialUi })).toBe(false);
		expect(history.commit('Add theme', { data, ui: initialUi })).toBe(true);
		expect(history.canUndo).toBe(true);
		history.undo();
		expect(history.canRedo).toBe(true);
		history.commit('Add again', { data, ui: initialUi });
		expect(history.canRedo).toBe(false);
	});

	it('undoes and redoes app data and durable UI snapshots with labels', () => {
		const first = { themes: [createDefaultTheme({ name: 'One' })] };
		const second = { themes: [createDefaultTheme({ name: 'Two' })] };
		const history = createSnapshotHistory({
			initialData: first,
			initialUi: initialUi
		});
		history.commit('Replace theme', {
			data: second,
			ui: { ...initialUi, workspaceTab: 'cssVariables' }
		});

		expect(history.undo()).toMatchObject({ data: first, ui: initialUi });
		expect(history.lastAction).toBe('Undid Replace theme');
		expect(history.redo()).toMatchObject({
			data: second,
			ui: { ...initialUi, workspaceTab: 'cssVariables' }
		});
		expect(history.lastAction).toBe('Redid Replace theme');
	});

	it('caps persisted history snapshots without capping in-memory history', () => {
		const history = createSnapshotHistory();
		for (let index = 0; index < 105; index++) {
			history.commit(`Change ${index}`, {
				data: { themes: [createDefaultTheme()] },
				ui: initialUi
			});
		}

		expect(history.history.past).toHaveLength(105);
		expect(history.snapshot(100).history.past).toHaveLength(100);
	});
});
