import { describe, expect, it } from 'vitest';
import { createSourceColor } from '../color';
import { createDefaultTheme } from '../model';
import { createAppManager } from './state.svelte';

const source = createSourceColor({ lightness: 0.7, chroma: 0.1, hue: 40 }, 'oklch');
const ids = (...values: string[]) => {
	let index = 0;
	return () => values[index++] ?? `extra-${index}`;
};

describe('AppManager selection and UI state', () => {
	it('repairs invalid selection to a valid screen', () => {
		const theme = createDefaultTheme({ id: 'theme', variantId: 'variant' });
		const manager = createAppManager({
			data: { themes: [theme] },
			ui: { selection: { themeId: 'missing', variantId: 'missing' }, workspaceTab: 'cssVariables' }
		});

		expect(manager.ui.selection).toEqual({ themeId: 'theme', variantId: 'variant' });
		expect(manager.ui.workspaceTab).toBe('palette');
	});

	it('stores theme target gamut in app data', () => {
		const manager = createAppManager({
			data: { themes: [createDefaultTheme({ id: 'theme', variantId: 'variant' })] }
		});
		manager.setThemeTargetGamut('theme', 'p3');

		expect(manager.selectedTheme?.targetGamut).toBe('p3');
		expect(manager.ui.workspaceTab).toBe('palette');
	});

	it('repairs selection after imported themes replace app data', () => {
		const manager = createAppManager({
			data: { themes: [createDefaultTheme({ id: 'old-theme', variantId: 'old-variant' })] }
		});
		const imported = createDefaultTheme({ id: 'new-theme', variantId: 'new-variant' });

		manager.data.themes = [imported];
		manager.ui.selection.themeId = imported.id;
		manager.ui.selection.variantId = imported.variants[0].id;
		manager.ui.workspaceTab = 'cssVariables';
		manager.repairUiState();

		expect(manager.ui.selection).toEqual({
			themeId: 'new-theme',
			variantId: 'new-variant'
		});
		expect(manager.selectedTheme?.id).toBe('new-theme');
		expect(manager.selectedVariant?.id).toBe('new-variant');
	});
});

describe('AppManager theme and variant operations', () => {
	it('adds, renames, and deletes themes with selection repair', () => {
		const manager = createAppManager({
			idFactory: ids('theme-1', 'variant-1', 'family-1', 'theme-2', 'variant-2', 'family-2')
		});

		manager.addTheme('Theme');
		manager.addTheme('Theme');
		manager.renameTheme('theme-2', 'Theme');

		expect(manager.data.themes.map((theme) => theme.name)).toEqual(['Theme', 'Theme 2']);
		expect(manager.ui.selection.themeId).toBe('theme-2');

		manager.deleteTheme('theme-2');
		expect(manager.ui.selection.themeId).toBe('theme-1');
		manager.deleteTheme('theme-1');
		expect(manager.ui.selection).toEqual({ themeId: null, variantId: null });
	});

	it('continues generated IDs from restored data to avoid duplicate selected tabs', () => {
		const manager = createAppManager({
			data: {
				themes: [
					createDefaultTheme({ id: 'id-1', variantId: 'id-2', familyId: 'id-3' }),
					createDefaultTheme({ id: 'id-4', variantId: 'id-5', familyId: 'id-6' })
				]
			}
		});

		const theme = manager.addTheme();

		expect(theme.id).toBe('id-7');
		expect(manager.data.themes.map((item) => item.id)).toEqual(['id-1', 'id-4', 'id-7']);
		expect(manager.ui.selection.themeId).toBe('id-7');
	});

	it('copies variant values and keeps shared structure', () => {
		const manager = createAppManager({
			data: { themes: [createDefaultTheme({ id: 'theme', variantId: 'main' })] },
			idFactory: ids('variant-2')
		});
		const familyId = manager.selectedTheme!.structure.families[0].id;
		manager.overrideLightness(familyId, '300', 0.6);

		const variant = manager.addVariant('Dawn');

		expect(variant?.values.families[familyId].stepScale.lightnessOverrides).toEqual({ '300': 0.6 });
		expect(manager.selectedTheme?.structure.families).toHaveLength(1);
		expect(manager.ui.selection.variantId).toBe('variant-2');

		manager.renameVariant('variant-2', 'default');
		expect(manager.selectedVariant?.name).toBe('default 2');
		manager.deleteVariant('variant-2');
		expect(manager.ui.selection.variantId).toBe('main');
	});
});

describe('AppManager family and step operations', () => {
	it('adds and deletes shared families across variants', () => {
		const manager = createAppManager({
			data: { themes: [createDefaultTheme({ id: 'theme', variantId: 'main' })] },
			idFactory: ids('variant-2', 'family-2')
		});
		manager.addVariant('Dawn');
		const family = manager.addFamily();

		expect(family?.name).toBe('Family 2');
		expect(
			manager.selectedTheme?.variants.every((variant) =>
				Boolean(variant.values.families['family-2'])
			)
		).toBe(true);

		manager.deleteFamily('family-2');
		expect(manager.selectedTheme?.structure.families.map((item) => item.id)).toEqual(['family-1']);
		expect(
			manager.selectedTheme?.variants.every(
				(variant) => variant.values.families['family-2'] == null
			)
		).toBe(true);
	});

	it('updates step structure globally and step values for the selected variant only', () => {
		const manager = createAppManager({
			data: { themes: [createDefaultTheme({ id: 'theme', variantId: 'main' })] },
			idFactory: ids('variant-2')
		});
		manager.addVariant('Dawn');
		manager.selectVariant('main');
		const familyId = 'family-1';

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
		manager.selectVariant('variant-2');
		expect(manager.selectedVariant?.values.families[familyId].stepScale.lightnessStart).toBe(0.95);
	});
});

describe('AppManager ramp and swatch operations', () => {
	it('adds, edits, and deletes ramps across shared structure and variant values', () => {
		const manager = createAppManager({
			data: { themes: [createDefaultTheme({ id: 'theme', variantId: 'main' })] },
			idFactory: ids('variant-2', 'ramp-1')
		});
		manager.addVariant('Dawn');
		manager.selectVariant('main');

		const ramp = manager.addRamp('family-1', source, 'Ramp');
		manager.renameRamp('ramp-1', 'Ramp');
		manager.setRampSourceColor(
			'family-1',
			'ramp-1',
			createSourceColor({ lightness: 0.4, chroma: 0.2, hue: 120 }, 'hex')
		);

		expect(ramp?.name).toBe('Ramp');
		expect(
			manager.selectedTheme?.variants.every((variant) =>
				Boolean(variant.values.families['family-1'].ramps['ramp-1'])
			)
		).toBe(true);
		expect(
			manager.selectedVariant?.values.families['family-1'].ramps['ramp-1'].sourceColor.format
		).toBe('hex');

		manager.deleteRamp('family-1', 'ramp-1');
		expect(manager.selectedTheme?.structure.families[0].ramps).toEqual([]);
		expect(manager.ui.workspaceTab).toBe('palette');
	});

	it('sets and resets swatch overrides and reverses selected variant overrides only', () => {
		const manager = createAppManager({
			data: { themes: [createDefaultTheme({ id: 'theme', variantId: 'main' })] },
			idFactory: ids('ramp-1')
		});
		manager.addRamp('family-1', source, 'Ramp');

		manager.overrideSwatchChannel('family-1', 'ramp-1', '300', 'chroma', 0.2);
		manager.overrideSwatchChannel('family-1', 'ramp-1', '300', 'hue', 120);
		manager.resetSwatchChannel('family-1', 'ramp-1', '300', 'hue');
		expect(
			manager.selectedVariant?.values.families['family-1'].ramps['ramp-1'].swatchOverrides
		).toEqual({ '300': { chroma: 0.2 } });

		manager.reverseFamilyLightness('family-1');
		expect(
			manager.selectedVariant?.values.families['family-1'].ramps['ramp-1'].swatchOverrides
		).toEqual({ '700': { chroma: 0.2 } });
		manager.resetSwatchColor('family-1', 'ramp-1', '700');
		expect(
			manager.selectedVariant?.values.families['family-1'].ramps['ramp-1'].swatchOverrides
		).toEqual({});
	});
});
