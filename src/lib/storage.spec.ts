import { describe, expect, it } from 'vitest';
import { createDefaultTheme } from './model';
import {
	createDefaultPersistedState,
	STORAGE_KEY,
	loadState,
	saveState,
	type StorageLike
} from './storage';

function memoryStorage(initial: Record<string, string> = {}): StorageLike {
	const data = { ...initial };
	return {
		getItem: (key) => data[key] ?? null,
		setItem: (key, value) => (data[key] = value),
		removeItem: (key) => delete data[key]
	};
}

describe('storage', () => {
	it('round trips app data, durable UI state, and capped history', () => {
		const storage = memoryStorage();
		const state = createDefaultPersistedState();
		state.data.themes = [createDefaultTheme()];
		state.ui = {
			selectedThemeId: 'theme-1',
			selectedVariantId: 'variant-1',
			workspaceTab: 'cssVariables',
			gamutPreview: 'p3'
		};
		state.history.past = Array.from({ length: 105 }, (_, index) => ({
			label: `Action ${index}`,
			data: { themes: [] }
		}));

		saveState(storage, state);
		const loaded = loadState(storage);

		expect(loaded.ok).toBe(true);
		expect(loaded.state.data.themes).toHaveLength(1);
		expect(loaded.state.ui.workspaceTab).toBe('cssVariables');
		expect(loaded.state.history.past).toHaveLength(100);
		expect(loaded.state.history.past[0].label).toBe('Action 5');
	});

	it('ignores invalid stored data safely and reports reset status', () => {
		const storage = memoryStorage({ [STORAGE_KEY]: '{bad json' });

		const loaded = loadState(storage);

		expect(loaded.ok).toBe(false);
		expect(loaded.reset).toBe(true);
		expect(loaded.state).toEqual(createDefaultPersistedState());
		expect(storage.getItem(STORAGE_KEY)).toBeNull();
	});

	it('rejects unsupported versions and invalid UI values', () => {
		const storage = memoryStorage({
			[STORAGE_KEY]: JSON.stringify({
				...createDefaultPersistedState(),
				version: 2,
				ui: { workspaceTab: 'bad' }
			})
		});

		expect(loadState(storage).ok).toBe(false);
	});

	it('omits derived data by only saving the explicit persisted shape', () => {
		const storage = memoryStorage();
		const state = createDefaultPersistedState() as ReturnType<
			typeof createDefaultPersistedState
		> & { generated?: unknown; dialogDraft?: unknown };
		state.generated = { css: ':root {}' };
		state.dialogDraft = { name: 'Draft' };

		saveState(storage, state);
		const raw = storage.getItem(STORAGE_KEY) ?? '';

		expect(raw).not.toContain('generated');
		expect(raw).not.toContain('dialogDraft');
	});
});
