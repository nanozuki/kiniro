import { describe, expect, it } from 'vitest';
import { createSourceColor } from '../color';
import { exportThemes, validateThemeImport } from '../importExport';
import { createDefaultPersistedState, STORAGE_KEY, type StorageLike } from '../storage';
import { createDefaultTheme } from '../model';
import { createAppManager } from './state.svelte';

const source = createSourceColor({ lightness: 0.7, chroma: 0.1, hue: 40 }, 'oklch');

function memoryStorage(
	initial: Record<string, string> = {}
): StorageLike & { readonly writes: number } {
	const data = { ...initial };
	let writes = 0;
	return {
		getItem: (key) => data[key] ?? null,
		setItem: (key, value) => {
			writes += 1;
			data[key] = value;
		},
		removeItem: (key) => delete data[key],
		get writes() {
			return writes;
		}
	};
}

describe('AppManager selection and persistence', () => {
	it('repairs invalid selection to a valid screen', () => {
		const theme = createDefaultTheme();
		const variant = theme.variants[0];
		const manager = createAppManager({
			data: { themes: [theme] },
			ui: { selection: { themeId: 'missing', variantId: 'missing' }, workspaceTab: 'cssVariables' }
		});

		expect(manager.ui.selection).toEqual({ themeId: theme.id, variantId: variant.id });
		expect(manager.ui.workspaceTab).toBe('palette');
	});

	it('rejects invalid loaded state before components read it', () => {
		const state = createDefaultPersistedState();
		const theme = createDefaultTheme();
		theme.variants = [];
		state.data.themes = [theme];
		state.ui = {
			selectedThemeId: 'missing',
			selectedVariantId: 'missing',
			workspaceTab: 'cssVariables'
		};
		const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify(state) });

		const manager = createAppManager({ storage });
		const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');

		expect(manager.selectedTheme?.id).toBe(theme.id);
		expect(manager.selectedVariant).not.toBeNull();
		expect(manager.ui.workspaceTab).toBe('palette');
		expect(saved.ui.selectedThemeId).toBe(theme.id);
		expect(saved.ui.selectedVariantId).toBe(manager.selectedVariant?.id);
	});

	it('writes localStorage after commit mutations but not during preview mutations', () => {
		const theme = createDefaultTheme();
		const storage = memoryStorage();
		const state = createDefaultPersistedState();
		state.data.themes = [theme];
		state.ui = {
			selectedThemeId: theme.id,
			selectedVariantId: theme.variants[0].id,
			workspaceTab: 'palette'
		};
		const manager = createAppManager({ persistedState: state, storage });

		manager.previewThemeName(theme.id, 'Preview');
		expect(storage.getItem(STORAGE_KEY)).toBeNull();

		manager.renameTheme(theme.id, 'Preview');
		const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');

		expect(manager.history.past).toHaveLength(1);
		expect(saved.data.themes[0].name).toBe('Preview');
	});

	it('previews inline theme names without persistence or history until submit', () => {
		const theme = createDefaultTheme({ name: 'Theme' });
		const other = createDefaultTheme({ name: 'Existing' });
		const storage = memoryStorage();
		const state = createDefaultPersistedState();
		state.data.themes = [theme, other];
		state.ui = {
			selectedThemeId: theme.id,
			selectedVariantId: theme.variants[0].id,
			workspaceTab: 'palette'
		};
		const manager = createAppManager({ persistedState: state, storage });
		const edit = manager.editThemeName(theme.id);

		edit.preview('Existing');
		expect(manager.data.themes[0].name).toBe('Existing');
		expect(manager.history.past).toHaveLength(0);
		expect(storage.getItem(STORAGE_KEY)).toBeNull();

		const result = edit.submit('Existing');
		const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');

		expect(result).toMatchObject({
			value: 'Existing 2',
			error: 'Theme name already exists; using "Existing 2".'
		});
		expect(manager.data.themes[0].name).toBe('Existing 2');
		expect(manager.history.past).toHaveLength(1);
		expect(saved.data.themes[0].name).toBe('Existing 2');
		expect(storage.writes).toBe(1);
	});

	it('uses the captured previous variant name when submitting an invalid draft', () => {
		const theme = createDefaultTheme({ variantName: 'Default' });
		const manager = createAppManager({ data: { themes: [theme] } });
		const variant = theme.variants[0];
		const edit = manager.editVariantName(variant.id);

		edit.preview('');
		const result = edit.submit('');

		expect(result).toMatchObject({
			value: 'Default',
			error: 'Variant name cannot be empty; restored "Default".'
		});
		expect(manager.selectedVariant?.name).toBe('Default');
		expect(manager.history.past).toHaveLength(0);
	});

	it('previews inline family and ramp names without persistence or history until submit', () => {
		const theme = createDefaultTheme({ familyName: 'Neutral' });
		const familyId = theme.structure.families[0].id;
		const storage = memoryStorage();
		const state = createDefaultPersistedState();
		state.data.themes = [theme];
		state.ui = {
			selectedThemeId: theme.id,
			selectedVariantId: theme.variants[0].id,
			workspaceTab: 'palette'
		};
		const manager = createAppManager({ persistedState: state, storage });
		const ramp = manager.addRamp(familyId, source, 'Accent');
		manager.addRamp(familyId, source, 'Existing');
		const initialHistoryLength = manager.history.past.length;
		const familyEdit = manager.editFamilyName(familyId);
		const rampEdit = manager.editRampName(ramp!.id);

		familyEdit.preview('Accent');
		rampEdit.preview('Existing');
		expect(manager.selectedTheme?.structure.families[0].name).toBe('Accent');
		expect(manager.selectedTheme?.structure.families[0].ramps[0].name).toBe('Existing');
		expect(manager.history.past).toHaveLength(initialHistoryLength);

		expect(familyEdit.submit('Accent')).toMatchObject({ value: 'Accent' });
		expect(rampEdit.submit('Existing')).toMatchObject({
			value: 'Existing 2',
			error: 'Ramp name already exists; using "Existing 2".'
		});
		expect(manager.history.past).toHaveLength(initialHistoryLength + 2);
		expect(storage.writes).toBe(4);
	});

	it('undoes and redoes names while restoring selected theme, variant, and workspace tab', () => {
		const first = createDefaultTheme({ name: 'One' });
		const second = createDefaultTheme({ name: 'Two' });
		const manager = createAppManager({ data: { themes: [first, second] } });

		manager.selectTheme(second.id);
		manager.addRamp(second.structure.families[0].id, source, 'Ramp');
		manager.setWorkspaceTab('cssVariables');
		manager.renameTheme(second.id, 'Renamed');
		manager.selectTheme(first.id);
		manager.setWorkspaceTab('palette');

		manager.undo();
		expect(manager.data.themes[1].name).toBe('Two');
		expect(manager.ui.selection.themeId).toBe(second.id);
		expect(manager.ui.selection.variantId).toBe(second.variants[0].id);
		expect(manager.ui.workspaceTab).toBe('cssVariables');

		manager.redo();
		expect(manager.data.themes[1].name).toBe('Renamed');
		expect(manager.ui.selection.themeId).toBe(second.id);
		expect(manager.ui.selection.variantId).toBe(second.variants[0].id);
		expect(manager.ui.workspaceTab).toBe('cssVariables');
	});

	it('clears redo history after a new commit', () => {
		const theme = createDefaultTheme();
		const manager = createAppManager({ data: { themes: [theme] } });

		manager.renameTheme(theme.id, 'One');
		manager.undo();
		expect(manager.canRedo).toBe(true);
		manager.setThemeCssPrefix(theme.id, 'brand');
		expect(manager.canRedo).toBe(false);
	});

	it('imports themes through AppManager, creates history entries, and persists', () => {
		const existing = createDefaultTheme({ name: 'Existing' });
		const imported = createDefaultTheme({ name: 'Imported' });
		const storage = memoryStorage();
		const manager = createAppManager({ data: { themes: [existing] }, storage });
		const validated = validateThemeImport(exportThemes([imported]));
		if (!validated.ok) throw new Error('expected valid import');

		manager.importThemes(validated.file, [{ importKey: '0' }]);
		const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? 'null');

		expect(manager.history.past.at(-1)?.label).toBe('Import themes');
		expect(manager.selectedTheme?.name).toBe('Imported');
		expect(saved.data.themes.map((theme: { name: string }) => theme.name)).toContain('Imported');
	});
});

describe('AppManager theme and variant operations', () => {
	it('adds, renames, and deletes themes with selection repair', () => {
		const manager = createAppManager();

		const first = manager.addTheme('Theme');
		const second = manager.addTheme('Theme');
		manager.renameTheme(second.id, 'Theme');

		expect(manager.data.themes.map((theme) => theme.name)).toEqual(['Theme', 'Theme 2']);
		expect(manager.ui.selection.themeId).toBe(second.id);

		manager.deleteTheme(second.id);
		expect(manager.ui.selection.themeId).toBe(first.id);
		manager.deleteTheme(first.id);
		expect(manager.ui.selection).toEqual({ themeId: null, variantId: null });
	});

	it('generates IDs that do not reuse restored theme IDs', () => {
		const restoredThemes = [createDefaultTheme(), createDefaultTheme()];
		const manager = createAppManager({
			data: { themes: restoredThemes }
		});

		const theme = manager.addTheme();

		expect(theme.id).not.toBe(restoredThemes[0].id);
		expect(theme.id).not.toBe(restoredThemes[1].id);
		expect(new Set(manager.data.themes.map((item) => item.id))).toHaveProperty('size', 3);
		expect(manager.ui.selection.themeId).toBe(theme.id);
	});

	it('copies variant values and keeps shared structure', () => {
		const theme = createDefaultTheme();
		const initialVariant = theme.variants[0];
		const manager = createAppManager({
			data: { themes: [theme] }
		});
		const familyId = manager.selectedTheme!.structure.families[0].id;
		manager.overrideLightness(familyId, '300', 0.6);

		const variant = manager.addVariant('Dawn');

		expect(variant?.values.families[familyId].stepScale.lightnessOverrides).toEqual({ '300': 0.6 });
		expect(manager.selectedTheme?.structure.families).toHaveLength(1);
		expect(manager.ui.selection.variantId).toBe(variant?.id);

		manager.renameVariant(variant!.id, 'default');
		expect(manager.selectedVariant?.name).toBe('default 2');
		manager.deleteVariant(variant!.id);
		expect(manager.ui.selection.variantId).toBe(initialVariant.id);
	});
});

describe('AppManager family and step operations', () => {
	it('adds and deletes shared families across variants', () => {
		const theme = createDefaultTheme();
		const firstFamilyId = theme.structure.families[0].id;
		const manager = createAppManager({
			data: { themes: [theme] }
		});
		manager.addVariant('Dawn');
		const family = manager.addFamily();

		expect(family?.name).toBe('Family 2');
		expect(
			manager.selectedTheme?.variants.every((variant) =>
				Boolean(variant.values.families[family!.id])
			)
		).toBe(true);

		manager.deleteFamily(family!.id);
		expect(manager.selectedTheme?.structure.families.map((item) => item.id)).toEqual([
			firstFamilyId
		]);
		expect(
			manager.selectedTheme?.variants.every(
				(variant) => variant.values.families[family!.id] == null
			)
		).toBe(true);
	});

	it('updates step structure globally and step values for the selected variant only', () => {
		const theme = createDefaultTheme();
		const initialVariant = theme.variants[0];
		const familyId = theme.structure.families[0].id;
		const manager = createAppManager({
			data: { themes: [theme] }
		});
		const variant = manager.addVariant('Dawn');
		manager.selectVariant(initialVariant.id);

		manager.overrideLightness(familyId, '300', 0.6);
		manager.setIndexStyle(familyId, 'ordinal');
		manager.setStepCount(familyId, 5);
		manager.setLightnessRange(familyId, 0.8, 0.2);

		expect(manager.selectedTheme?.structure.families[0].stepScale).toMatchObject({
			indexStyle: 'ordinal',
			stepCount: 5
		});
		expect(manager.selectedVariant?.values.families[familyId].stepScale).toMatchObject({
			lightnessStart: 0.8,
			lightnessEnd: 0.2,
			lightnessOverrides: { '3': 0.6 }
		});
		manager.selectVariant(variant!.id);
		expect(manager.selectedVariant?.values.families[familyId].stepScale.lightnessStart).toBe(0.95);
	});
});

describe('AppManager ramp and swatch operations', () => {
	it('adds, edits, and deletes ramps across shared structure and variant values', () => {
		const theme = createDefaultTheme();
		const initialVariant = theme.variants[0];
		const familyId = theme.structure.families[0].id;
		const manager = createAppManager({
			data: { themes: [theme] }
		});
		manager.addVariant('Dawn');
		manager.selectVariant(initialVariant.id);

		const ramp = manager.addRamp(familyId, source, 'Ramp');
		manager.renameRamp(ramp!.id, 'Ramp');
		manager.setRampSourceColor(
			familyId,
			ramp!.id,
			createSourceColor({ lightness: 0.4, chroma: 0.2, hue: 120 }, 'hex')
		);

		expect(ramp?.name).toBe('Ramp');
		expect(
			manager.selectedTheme?.variants.every((variant) =>
				Boolean(variant.values.families[familyId].ramps[ramp!.id])
			)
		).toBe(true);
		expect(
			manager.selectedVariant?.values.families[familyId].ramps[ramp!.id].sourceColor.format
		).toBe('hex');

		manager.deleteRamp(familyId, ramp!.id);
		expect(manager.selectedTheme?.structure.families[0].ramps).toEqual([]);
		expect(manager.ui.workspaceTab).toBe('palette');
	});

	it('moves ramps within their shared family order', () => {
		const theme = createDefaultTheme();
		const familyId = theme.structure.families[0].id;
		const manager = createAppManager({
			data: { themes: [theme] }
		});
		const first = manager.addRamp(familyId, source, 'First');
		const second = manager.addRamp(familyId, source, 'Second');

		manager.moveRamp(familyId, second!.id, -1);
		expect(manager.selectedTheme?.structure.families[0].ramps.map((ramp) => ramp.id)).toEqual([
			second!.id,
			first!.id
		]);

		manager.moveRamp(familyId, second!.id, -1);
		expect(manager.selectedTheme?.structure.families[0].ramps.map((ramp) => ramp.id)).toEqual([
			second!.id,
			first!.id
		]);
	});

	it('sets and resets swatch overrides and reverses selected variant overrides only', () => {
		const theme = createDefaultTheme();
		const familyId = theme.structure.families[0].id;
		const manager = createAppManager({
			data: { themes: [theme] }
		});
		const ramp = manager.addRamp(familyId, source, 'Ramp');
		const rampId = ramp!.id;

		manager.overrideSwatchChannel(familyId, rampId, '300', 'chroma', 0.2);
		manager.overrideSwatchChannel(familyId, rampId, '300', 'hue', 120);
		manager.resetSwatchChannel(familyId, rampId, '300', 'hue');
		expect(
			manager.selectedVariant?.values.families[familyId].ramps[rampId].swatchOverrides
		).toEqual({
			'300': { chroma: 0.2 }
		});

		manager.reverseFamilyLightness(familyId);
		expect(
			manager.selectedVariant?.values.families[familyId].ramps[rampId].swatchOverrides
		).toEqual({
			'700': { chroma: 0.2 }
		});
		manager.resetSwatchColor(familyId, rampId, '700');
		expect(
			manager.selectedVariant?.values.families[familyId].ramps[rampId].swatchOverrides
		).toEqual({});
	});
});
