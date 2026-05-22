import { describe, expect, it } from 'vitest';
import { createSourceColor } from '../color';
import { createDefaultTheme } from '../model';
import { createAppManager } from './state.svelte';

const source = createSourceColor({ lightness: 0.7, chroma: 0.1, hue: 40 }, 'oklch');

describe('AppManager selection and UI state', () => {
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

	it('stores theme target gamut in app data', () => {
		const theme = createDefaultTheme();
		const manager = createAppManager({
			data: { themes: [theme] }
		});
		manager.setThemeTargetGamut(theme.id, 'p3');

		expect(manager.selectedTheme?.targetGamut).toBe('p3');
		expect(manager.ui.workspaceTab).toBe('palette');
	});

	it('repairs selection after imported themes replace app data', () => {
		const manager = createAppManager({
			data: { themes: [createDefaultTheme()] }
		});
		const imported = createDefaultTheme();
		const importedVariant = imported.variants[0];

		manager.data.themes = [imported];
		manager.ui.selection.themeId = imported.id;
		manager.ui.selection.variantId = imported.variants[0].id;
		manager.ui.workspaceTab = 'cssVariables';
		manager.repairUiState();

		expect(manager.ui.selection).toEqual({
			themeId: imported.id,
			variantId: importedVariant.id
		});
		expect(manager.selectedTheme?.id).toBe(imported.id);
		expect(manager.selectedVariant?.id).toBe(importedVariant.id);
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
		).toEqual({ '300': { chroma: 0.2 } });

		manager.reverseFamilyLightness(familyId);
		expect(
			manager.selectedVariant?.values.families[familyId].ramps[rampId].swatchOverrides
		).toEqual({ '700': { chroma: 0.2 } });
		manager.resetSwatchColor(familyId, rampId, '700');
		expect(
			manager.selectedVariant?.values.families[familyId].ramps[rampId].swatchOverrides
		).toEqual({});
	});
});
