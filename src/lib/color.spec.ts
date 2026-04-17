import Color from 'colorjs.io';
import { describe, expect, it } from 'vitest';
import { parseBaseOklch, toDisplayHex } from './color';

describe('toDisplayHex', () => {
	it('converts displayable colors to lowercase six-digit hex', () => {
		expect(toDisplayHex(new Color('srgb', [0.5, 0, 1]))).toBe('#8000ff');
	});

	it('gamut maps OKLCH colors before converting to sRGB hex', () => {
		expect(toDisplayHex(new Color('oklch', [0.7, 0.6, 40]))).toMatch(/^#[0-9a-f]{6}$/);
	});
});

describe('parseBaseOklch', () => {
	it('returns OKLCH coordinates for a valid seed color', () => {
		const parsed = parseBaseOklch('#907aa9');

		expect(parsed).not.toBeNull();
		expect(parsed?.l).toBeGreaterThan(0);
		expect(parsed?.c).toBeGreaterThan(0);
		expect(parsed?.h).toBeGreaterThanOrEqual(0);
	});

	it('returns null for invalid color input', () => {
		expect(parseBaseOklch('not-a-color')).toBeNull();
	});
});
