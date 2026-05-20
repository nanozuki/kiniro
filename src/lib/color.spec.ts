import { describe, expect, it } from 'vitest';
import {
	createSourceColor,
	formatChroma,
	formatHue,
	formatLightness,
	getGamutStatus,
	getMaxChroma,
	getPreviewColor,
	getRelativeChroma,
	getRelativeChromaRatio,
	normalizeChannelValue,
	parseSourceColor,
	serializeSourceColor,
	sourceColorFromHsl,
	sourceColorFromRgb
} from './color';

const closeTo = (value: number, expected: number) => expect(value).toBeCloseTo(expected, 3);

describe('source color parsing and conversion', () => {
	it('parses hex, RGB, HSL, and OKLCH source formats into OKLCH', () => {
		const hex = parseSourceColor('#907aa9');
		const rgb = parseSourceColor('rgb(144 122 169)');
		const hsl = parseSourceColor('hsl(267 22% 57%)');
		const oklch = parseSourceColor('oklch(0.6 0.1 270)');

		expect(hex?.format).toBe('hex');
		expect(rgb?.format).toBe('rgb');
		expect(hsl?.format).toBe('hsl');
		expect(oklch?.format).toBe('oklch');
		closeTo(hex?.oklch.lightness ?? 0, 0.617);
		closeTo(rgb?.oklch.chroma ?? 0, hex?.oklch.chroma ?? 0);
		closeTo(oklch?.oklch.hue ?? 0, 270);
	});

	it('returns null for invalid source color text', () => {
		expect(parseSourceColor('not a color')).toBeNull();
	});

	it('creates source colors from structured RGB and HSL inputs', () => {
		const rgb = sourceColorFromRgb({ red: 144, green: 122, blue: 169 });
		const hsl = sourceColorFromHsl({ hue: 267, saturation: 22, lightness: 57 });

		expect(rgb.serialized).toBe('rgb(144 122 169)');
		expect(hsl.serialized).toMatch(/^hsl\(/);
		closeTo(rgb.oklch.lightness, 0.617);
	});

	it('serializes OKLCH sources to the selected source format', () => {
		const source = createSourceColor({ lightness: 0.6171, chroma: 0.0737, hue: 305.69 }, 'hex');

		expect(source.serialized).toMatch(/^#[0-9a-f]{6}$/);
		expect(serializeSourceColor(source.oklch, 'oklch')).toBe('oklch(0.6171 0.0737 305.69)');
	});
});

describe('preview gamut conversion', () => {
	it('returns unclipped status for colors inside sRGB', () => {
		const status = getGamutStatus({ lightness: 0.6, chroma: 0.05, hue: 280 }, 'srgb');

		expect(status.inSrgb).toBe(true);
		expect(status.outOfSelectedGamut).toBe(false);
		expect(status.warning).toBeNull();
	});

	it('detects colors outside sRGB and clamps preview colors', () => {
		const preview = getPreviewColor({ lightness: 0.7, chroma: 0.6, hue: 40 }, 'srgb');

		expect(preview.inSrgb).toBe(false);
		expect(preview.outOfSelectedGamut).toBe(true);
		expect(preview.warning).toBe('Outside sRGB and P3. Preview is clamped.');
		expect(preview.hex).toMatch(/^#[0-9a-f]{6}$/);
		expect(preview.color.inGamut('srgb')).toBe(true);
	});

	it('generates Display P3 CSS for P3 previews', () => {
		const preview = getPreviewColor({ lightness: 0.7, chroma: 0.1, hue: 40 }, 'p3');

		expect(preview.gamut).toBe('p3');
		expect(preview.css).toMatch(/^color\(display-p3 /);
		expect(preview.hex).toMatch(/^#[0-9a-f]{6}$/);
	});
});

describe('relative chroma helpers', () => {
	it('finds the maximum in-gamut chroma for a lightness and hue', () => {
		const max = getMaxChroma(0.7, 210, 'srgb');

		expect(max).toBeGreaterThan(0.11);
		expect(max).toBeLessThan(0.13);
	});

	it('preserves source chroma at the source lightness and scales other swatches by ratio', () => {
		const source = { lightness: 0.7, chroma: 0.12, hue: 210 };
		const ratio = getRelativeChromaRatio(source, 'srgb');

		expect(ratio).toBeGreaterThan(0.9);
		expect(ratio).toBeLessThanOrEqual(1);
		expect(getRelativeChroma(0.7, 210, ratio, 'srgb')).toBeCloseTo(0.12, 3);
		expect(getRelativeChroma(0.95, 210, ratio, 'srgb')).toBeLessThan(0.12);
	});

	it('caps out-of-gamut source chroma ratios at 1', () => {
		expect(getRelativeChromaRatio({ lightness: 0.7, chroma: 0.37, hue: 210 }, 'srgb')).toBe(1);
	});
});

describe('numeric formatting', () => {
	it('floors lightness and chroma to four decimals and hue to two decimals', () => {
		expect(formatLightness(0.12349)).toBe('0.1234');
		expect(formatChroma(0.98765)).toBe('0.9876');
		expect(formatHue(291.139)).toBe('291.13');
	});

	it('normalizes input values by clamping to channel ranges before flooring', () => {
		expect(normalizeChannelValue('lightness', 1.2)).toBe(1);
		expect(normalizeChannelValue('chroma', 0.37999)).toBe(0.37);
		expect(normalizeChannelValue('hue', -4)).toBe(0);
	});
});
