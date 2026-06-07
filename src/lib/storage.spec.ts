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
	it('round trips history containing app data and durable UI state', () => {
		const storage = memoryStorage();
		const state = createDefaultPersistedState();
		const snapshot = state.history.entries[state.history.current].value;
		snapshot.data.themes = [createDefaultTheme()];
		const theme = snapshot.data.themes[0];
		theme.targetGamut = 'p3';
		snapshot.ui = {
			selectedThemeId: theme.id,
			selectedVariantId: theme.variants[0].id,
			workspaceTab: 'cssVariables'
		};
		state.history.entries = Array.from({ length: 205 }, (_, index) => ({
			label: `Action ${index}`,
			value: {
				data: index === 204 ? snapshot.data : { themes: [] },
				ui:
					index === 204
						? snapshot.ui
						: {
								selectedThemeId: null,
								selectedVariantId: null,
								workspaceTab: 'palette'
							}
			}
		}));
		state.history.current = 204;

		saveState(storage, state);
		const loaded = loadState(storage);

		expect(loaded.ok).toBe(true);
		expect(loaded.state.history.entries[204].value.data.themes).toHaveLength(1);
		expect(loaded.state.history.entries[204].value.ui.workspaceTab).toBe('cssVariables');
		expect(loaded.state.history.entries[204].value.data.themes[0].targetGamut).toBe('p3');
		expect(loaded.state.history.entries).toHaveLength(205);
		expect(loaded.state.history.entries[0].label).toBe('Action 0');
		expect(loaded.state.history.current).toBe(204);
	});

	it('rejects invalid nested theme, variant, family, and ramp data', () => {
		const state = createDefaultPersistedState();
		const theme = createDefaultTheme();
		const family = theme.structure.families[0];
		const variant = theme.variants[0];
		const invalidState = {
			...state,
			history: {
				entries: [
					{
						label: 'Invalid',
						value: {
							data: {
								themes: [
									{
										...theme,
										structure: {
											families: [{ ...family, ramps: [{ id: 'ramp-id' }] }]
										},
										variants: [
											{
												...variant,
												values: {
													families: {
														[family.id]: {
															stepScale: { ...variant.values.families[family.id].stepScale },
															ramps: {
																'ramp-id': {
																	sourceColor: {
																		format: 'bad',
																		oklch: { lightness: 0.5, chroma: 0.1, hue: 0 },
																		serialized: 'bad'
																	},
																	swatchOverrides: {}
																}
															}
														}
													}
												}
											}
										]
									}
								]
							},
							ui: state.history.entries[state.history.current].value.ui
						}
					}
				],
				current: 0
			}
		};
		const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify(invalidState) });

		const loaded = loadState(storage);

		expect(loaded.ok).toBe(false);
		expect(storage.getItem(STORAGE_KEY)).toBeNull();
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
				version: 1,
				history: {
					entries: [
						{
							label: 'Invalid',
							value: {
								data: { themes: [] },
								ui: { selectedThemeId: null, selectedVariantId: null, workspaceTab: 'bad' }
							}
						}
					],
					current: 0
				}
			})
		});

		expect(loadState(storage).ok).toBe(false);
	});

	it('saves the passed persisted state as the serialized shape', () => {
		const storage = memoryStorage();
		const state = createDefaultPersistedState();

		saveState(storage, state);
		const raw = storage.getItem(STORAGE_KEY) ?? '';

		expect(JSON.parse(raw)).toEqual(state);
	});
});
