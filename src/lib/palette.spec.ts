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
			oklch: { lightness: 0.95, hue: 40 }
		});
		expect(palette.families[0].ramps[0].swatches[0].oklch.chroma).toBeLessThan(0.2);
	});

	it('uses step lightness with hue and relative chroma from the source color', () => {
		const theme = createDefaultTheme();
		const family = theme.structure.families[0];
		family.stepScale.stepCount = 5;
		family.ramps.push({ id: 'base', name: 'base' });
		const variant = theme.variants[0];
		variant.values.families[family.id].stepScale.lightnessStart = 0.9;
		variant.values.families[family.id].stepScale.lightnessEnd = 0.1;
		variant.values.families[family.id].ramps.base = createDefaultRampValues({
			format: 'oklch',
			serialized: 'oklch(0.7 0.12 210)',
			oklch: { lightness: 0.7, chroma: 0.12, hue: 210 }
		});

		const swatches = generateVariantPalette(theme, variant).families[0].ramps[0].swatches;

		expect(swatches.map((swatch) => swatch.stepIndex)).toEqual(['100', '200', '300', '400', '500']);
		expect(swatches[2].oklch.hue).toBe(210);
		expect(swatches[2].oklch.lightness).toBe(0.5);
		expect(swatches[2].oklch.chroma).toBeLessThan(0.12);
		expect(new Set(swatches.map((swatch) => swatch.oklch.chroma)).size).toBeGreaterThan(1);
		expect(swatches.every((swatch) => swatch.oklch.hue === 210)).toBe(true);
	});

	it('uses source lightness to preserve the source chroma ratio', () => {
		const theme = createDefaultTheme();
		const family = theme.structure.families[0];
		family.stepScale.stepCount = 5;
		family.ramps.push({ id: 'base', name: 'base' });
		const variant = theme.variants[0];
		variant.values.families[family.id].stepScale.lightnessStart = 0.9;
		variant.values.families[family.id].stepScale.lightnessEnd = 0.1;
		variant.values.families[family.id].ramps.base = createDefaultRampValues({
			format: 'oklch',
			serialized: 'oklch(0.7 0.12 210)',
			oklch: { lightness: 0.7, chroma: 0.12, hue: 210 }
		});
		const sourceMid = generateVariantPalette(theme, variant).families[0].ramps[0].swatches[1];

		variant.values.families[family.id].ramps.base = createDefaultRampValues({
			format: 'oklch',
			serialized: 'oklch(0.4 0.12 210)',
			oklch: { lightness: 0.4, chroma: 0.12, hue: 210 }
		});
		const sourceDark = generateVariantPalette(theme, variant).families[0].ramps[0].swatches[1];

		expect(sourceMid.oklch.chroma).toBeCloseTo(0.12, 3);
		expect(sourceDark.oklch.chroma).not.toBe(sourceMid.oklch.chroma);
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

		expect(swatch.generated).toMatchObject({ lightness: 0.725, hue: 40 });
		expect(swatch.generated.chroma).toBeLessThan(0.2);
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
