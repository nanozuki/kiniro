import { describe, expect, it } from 'vitest';
import {
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
		const theme = createDefaultTheme({ id: 'theme-7', name: 'Brand' });

		expect(theme).toMatchObject({
			id: 'theme-7',
			name: 'Brand',
			cssPrefix: 'color'
		});
		expect(theme.structure.families).toEqual([
			{
				id: 'family-1',
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
		expect(theme.variants[0]).toMatchObject({ id: 'variant-1', name: 'default' });
		expect(theme.variants[0].values.families['family-1']).toEqual({
			stepScale: {
				lightnessStart: 0.95,
				lightnessEnd: 0.05,
				lightnessOverrides: {},
				reversed: false
			},
			ramps: {}
		});
	});
});

describe('createThemeVariant', () => {
	it('creates variant-specific values for every shared family and ramp', () => {
		const theme = createDefaultTheme();
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

		const variant = createThemeVariant(theme.structure, { id: 'variant-2', name: 'Moon' });

		expect(Object.keys(variant.values.families)).toEqual(['family-1', 'family-2']);
		expect(Object.keys(variant.values.families['family-1'].ramps)).toEqual(['ramp-1']);
		expect(Object.keys(variant.values.families['family-2'].ramps)).toEqual(['ramp-2']);
	});
});

describe('createVariantValues', () => {
	it('preserves values by shared IDs and drops values for stale structure', () => {
		const theme = createDefaultTheme();
		theme.structure.families[0].ramps.push({ id: 'ramp-1', name: 'base' });
		const existingRamp = createDefaultRampValues({
			format: 'hex',
			oklch: { lightness: 0.4, chroma: 0.2, hue: 30 },
			serialized: '#884422'
		});

		const values = createVariantValues(theme.structure, {
			families: {
				'family-1': {
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

		expect(values.families['family-1'].stepScale).toMatchObject({
			lightnessStart: 0.9,
			lightnessEnd: 0.1,
			reversed: true
		});
		expect(values.families['family-1'].ramps).toEqual({ 'ramp-1': existingRamp });
		expect(values.families.stale).toBeUndefined();
	});
});

describe('syncThemeVariantValues', () => {
	it('keeps every variant aligned with shared families and ramps', () => {
		const theme: Theme = createDefaultTheme();
		theme.structure.families[0].ramps.push({ id: 'base', name: 'base' });
		theme.variants[0].values.families['family-1'].ramps.stale = createDefaultRampValues();
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

		expect(Object.keys(synced.variants[0].values.families)).toEqual(['family-1']);
		expect(Object.keys(synced.variants[0].values.families['family-1'].ramps)).toEqual(['base']);
		expect(synced.variants[0].values.families['family-1'].ramps.stale).toBeUndefined();
	});
});
