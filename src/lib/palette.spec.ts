import { describe, expect, it } from 'vitest';
import { createDefaultRampValues, createDefaultTheme } from './model';
import { generateVariantPalette } from './palette';

describe('generateVariantPalette', () => {
	it('generates families, ramps, and swatches in palette order', () => {
		const theme = createDefaultTheme();
		const family = theme.structure.families[0];
		family.ramps.push({ id: 'base', name: 'base' }, { id: 'accent', name: 'accent' });
		const variant = theme.variants[0];
		variant.values.families[family.id].ramps.base = createDefaultRampValues({
			format: 'oklch',
			serialized: 'oklch(0.7 0.2 40)',
			oklch: { lightness: 0.7, chroma: 0.2, hue: 40 }
		});
		variant.values.families[family.id].ramps.accent = createDefaultRampValues({
			format: 'oklch',
			serialized: 'oklch(0.6 0.1 280)',
			oklch: { lightness: 0.6, chroma: 0.1, hue: 280 }
		});

		const palette = generateVariantPalette(theme, variant);

		expect(palette.families).toHaveLength(1);
		expect(palette.families[0].ramps.map((ramp) => ramp.name)).toEqual(['base', 'accent']);
		expect(palette.families[0].ramps[0].swatches).toHaveLength(9);
		expect(palette.families[0].ramps[0].swatches[0]).toMatchObject({
			name: 'base-100',
			stepIndex: '100',
			oklch: { lightness: 0.95, chroma: 0.2, hue: 40 }
		});
	});

	it('uses step lightness with ramp source chroma and hue', () => {
		const theme = createDefaultTheme();
		const family = theme.structure.families[0];
		family.stepScale.stepCount = 5;
		family.ramps.push({ id: 'base', name: 'base' });
		const variant = theme.variants[0];
		variant.values.families[family.id].stepScale.lightnessStart = 0.9;
		variant.values.families[family.id].stepScale.lightnessEnd = 0.1;
		variant.values.families[family.id].ramps.base = createDefaultRampValues({
			format: 'oklch',
			serialized: 'oklch(0.4 0.12 210)',
			oklch: { lightness: 0.4, chroma: 0.12, hue: 210 }
		});

		const swatches = generateVariantPalette(theme, variant).families[0].ramps[0].swatches;

		expect(swatches.map((swatch) => swatch.stepIndex)).toEqual(['100', '200', '300', '400', '500']);
		expect(swatches[2].oklch).toEqual({ lightness: 0.5, chroma: 0.12, hue: 210 });
	});

	it('applies swatch channel overrides over generated values', () => {
		const theme = createDefaultTheme();
		const family = theme.structure.families[0];
		family.ramps.push({ id: 'base', name: 'base' });
		const variant = theme.variants[0];
		variant.values.families[family.id].ramps.base = createDefaultRampValues({
			format: 'oklch',
			serialized: 'oklch(0.7 0.2 40)',
			oklch: { lightness: 0.7, chroma: 0.2, hue: 40 }
		});
		variant.values.families[family.id].ramps.base.swatchOverrides['300'] = {
			chroma: 0.05,
			hue: 120
		};

		const swatch = generateVariantPalette(theme, variant).families[0].ramps[0].swatches[2];

		expect(swatch.generated).toEqual({ lightness: 0.725, chroma: 0.2, hue: 40 });
		expect(swatch.oklch).toEqual({ lightness: 0.725, chroma: 0.05, hue: 120 });
		expect(swatch.overrides).toEqual({ chroma: 0.05, hue: 120 });
	});

	it('does not mutate or add generated values to theme data', () => {
		const theme = createDefaultTheme();
		const before = structuredClone(theme);

		generateVariantPalette(theme, theme.variants[0]);

		expect(theme).toEqual(before);
	});
});
