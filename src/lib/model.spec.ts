import { describe, expect, it } from 'vitest';
import {
	createColorFamily,
	createColorRamp,
	createDefaultRampValues,
	createDefaultTheme,
	createEmptyAppState,
	createThemeVariant,
	createVariantValues,
	syncThemeVariantValues,
	type Theme
} from './model';

describe('createEmptyAppState', () => {
	it('starts without themes', () => {
		expect(createEmptyAppState()).toEqual({ themes: [] });
	});
});

describe('createDefaultTheme', () => {
	it('creates the starter theme without generated palette data', () => {
		const theme = createDefaultTheme({ name: 'Brand' });
		const family = theme.structure.families[0];
		const variant = theme.variants[0];

		expect(theme).toMatchObject({
			id: expect.any(String),
			name: 'Brand',
			cssPrefix: 'color',
			targetGamut: 'srgb'
		});
		expect(theme.structure.families).toEqual([
			{
				id: family.id,
				name: 'Family 1',
				stepScale: {
					stepCount: 9,
					indexStyle: 'scale',
					halfStepStart: false,
					halfStepEnd: false
				},
				ramps: []
			}
		]);
		expect(theme.variants).toHaveLength(1);
		expect(variant).toMatchObject({ id: expect.any(String), name: 'default' });
		expect(variant.values.families[family.id]).toEqual({
			stepScale: {
				lightnessStart: 0.95,
				lightnessEnd: 0.05,
				lightnessOverrides: {},
				reversed: false
			},
			ramps: {}
		});
	});

	it('generates IDs for default theme entities', () => {
		const theme = createDefaultTheme();
		const family = theme.structure.families[0];
		const variant = theme.variants[0];

		expect(theme.id).toEqual(expect.any(String));
		expect(family.id).toEqual(expect.any(String));
		expect(variant.id).toEqual(expect.any(String));
		expect(new Set([theme.id, family.id, variant.id])).toHaveProperty('size', 3);
	});
});

describe('color structures', () => {
	it('creates color families with a default step scale', () => {
		const family = createColorFamily({ name: 'Accent' });

		expect(family).toEqual({
			id: expect.any(String),
			name: 'Accent',
			stepScale: {
				stepCount: 9,
				indexStyle: 'scale',
				halfStepStart: false,
				halfStepEnd: false
			},
			ramps: []
		});
	});

	it('creates color ramps with generated IDs', () => {
		expect(createColorRamp({ name: 'Base' })).toEqual({
			id: expect.any(String),
			name: 'Base'
		});
	});
});

describe('createThemeVariant', () => {
	it('creates variant-specific values for every shared family and ramp', () => {
		const theme = createDefaultTheme();
		const familyId = theme.structure.families[0].id;
		theme.structure.families[0].ramps.push({ id: 'ramp-1', name: 'base' });
		theme.structure.families.push({
			id: 'family-2',
			name: 'Accent',
			stepScale: {
				stepCount: 7,
				indexStyle: 'ordinal',
				halfStepStart: false,
				halfStepEnd: false
			},
			ramps: [{ id: 'ramp-2', name: 'rose' }]
		});

		const variant = createThemeVariant(theme.structure, { name: 'Moon' });

		expect(Object.keys(variant.values.families)).toEqual([familyId, 'family-2']);
		expect(Object.keys(variant.values.families[familyId].ramps)).toEqual(['ramp-1']);
		expect(Object.keys(variant.values.families['family-2'].ramps)).toEqual(['ramp-2']);
	});
});

describe('createVariantValues', () => {
	it('preserves values by shared IDs and drops values for stale structure', () => {
		const theme = createDefaultTheme();
		const familyId = theme.structure.families[0].id;
		theme.structure.families[0].ramps.push({ id: 'ramp-1', name: 'base' });
		const existingRamp = createDefaultRampValues({
			format: 'hex',
			oklch: { lightness: 0.4, chroma: 0.2, hue: 30 },
			serialized: '#884422'
		});

		const values = createVariantValues(theme.structure, {
			families: {
				[familyId]: {
					stepScale: {
						lightnessStart: 0.9,
						lightnessEnd: 0.1,
						lightnessOverrides: { '200': 0.7 },
						reversed: true
					},
					ramps: {
						'ramp-1': existingRamp,
						stale: createDefaultRampValues()
					}
				},
				stale: {
					stepScale: {
						lightnessStart: 0,
						lightnessEnd: 0,
						lightnessOverrides: {},
						reversed: false
					},
					ramps: {}
				}
			}
		});

		expect(values.families[familyId].stepScale).toMatchObject({
			lightnessStart: 0.9,
			lightnessEnd: 0.1,
			reversed: true
		});
		expect(values.families[familyId].ramps).toEqual({ 'ramp-1': existingRamp });
		expect(values.families.stale).toBeUndefined();
	});
});

describe('syncThemeVariantValues', () => {
	it('keeps every variant aligned with shared families and ramps', () => {
		const theme: Theme = createDefaultTheme();
		const familyId = theme.structure.families[0].id;
		theme.structure.families[0].ramps.push({ id: 'base', name: 'base' });
		theme.variants[0].values.families[familyId].ramps.stale = createDefaultRampValues();
		theme.variants[0].values.families.stale = {
			stepScale: {
				lightnessStart: 0,
				lightnessEnd: 0,
				lightnessOverrides: {},
				reversed: false
			},
			ramps: {}
		};

		const synced = syncThemeVariantValues(theme);

		expect(Object.keys(synced.variants[0].values.families)).toEqual([familyId]);
		expect(Object.keys(synced.variants[0].values.families[familyId].ramps)).toEqual(['base']);
		expect(synced.variants[0].values.families[familyId].ramps.stale).toBeUndefined();
	});
});
