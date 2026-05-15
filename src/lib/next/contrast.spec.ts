import { describe, expect, it } from 'vitest';
import { calculateContrastRatio, getContrastResult, getContrastTargets, getDefaultContrastTargets } from './contrast';
import { createDefaultRampValues, createDefaultTheme } from './model';
import { generateVariantPalette } from './palette';

function paletteWithRamps() {
	const theme = createDefaultTheme();
	const family = theme.structure.families[0];
	family.ramps.push({ id: 'base', name: 'base' }, { id: 'text', name: 'text' });
	const variant = theme.variants[0];
	variant.values.families[family.id].ramps.base = createDefaultRampValues({
		format: 'oklch',
		serialized: 'oklch(0.7 0 0)',
		oklch: { lightness: 0.7, chroma: 0, hue: 0 }
	});
	variant.values.families[family.id].ramps.text = createDefaultRampValues({
		format: 'oklch',
		serialized: 'oklch(0.7 0 0)',
		oklch: { lightness: 0.7, chroma: 0, hue: 0 }
	});
	return generateVariantPalette(theme, variant);
}

describe('calculateContrastRatio', () => {
	it('calculates WCAG contrast from clamped preview colors', () => {
		const black = { lightness: 0, chroma: 0, hue: 0 };
		const white = { lightness: 1, chroma: 0, hue: 0 };

		expect(calculateContrastRatio(black, white, 'srgb')).toBeCloseTo(21, 1);
	});

	it('uses the selected gamut preview before measuring contrast', () => {
		const foreground = { lightness: 0.7, chroma: 0.6, hue: 40 };
		const background = { lightness: 0.2, chroma: 0.05, hue: 260 };

		expect(calculateContrastRatio(foreground, background, 'srgb')).toBeGreaterThan(1);
		expect(Number.isFinite(calculateContrastRatio(foreground, background, 'p3'))).toBe(true);
	});
});

describe('contrast defaults and targets', () => {
	it('selects the first ramp second swatch and second ramp second-to-last swatch by default', () => {
		const defaults = getDefaultContrastTargets(paletteWithRamps());

		expect(defaults?.foreground.label).toBe('base 200');
		expect(defaults?.background.label).toBe('text 800');
	});

	it('uses one ramp for both defaults when only one ramp exists', () => {
		const palette = paletteWithRamps();
		palette.families[0].ramps = [palette.families[0].ramps[0]];

		const defaults = getDefaultContrastTargets(palette);

		expect(defaults?.foreground.label).toBe('base 200');
		expect(defaults?.background.label).toBe('base 800');
	});

	it('returns selectable swatch targets without source colors', () => {
		const targets = getContrastTargets(paletteWithRamps());

		expect(targets).toHaveLength(18);
		expect(targets[0]).toMatchObject({ rampName: 'base', stepIndex: '100', label: 'base 100' });
	});
});

describe('getContrastResult', () => {
	it('returns pass/fail threshold results', () => {
		const result = getContrastResult(
			{ lightness: 0, chroma: 0, hue: 0 },
			{ lightness: 1, chroma: 0, hue: 0 },
			'srgb'
		);

		expect(result.formattedRatio).toBe('20.99:1');
		expect(result.checks[0].minimumAA).toMatchObject({ threshold: 4.5, passed: true, label: 'Pass' });
		expect(result.checks[0].enhancedAAA).toMatchObject({ threshold: 7, passed: true, label: 'Pass' });
		expect(result.checks[2].enhancedAAA).toBeNull();
	});

	it('marks failing results', () => {
		const result = getContrastResult(
			{ lightness: 0.5, chroma: 0, hue: 0 },
			{ lightness: 0.5, chroma: 0, hue: 0 },
			'srgb'
		);

		expect(result.formattedRatio).toBe('1.00:1');
		expect(result.checks[0].minimumAA.label).toBe('Fail');
	});
});
