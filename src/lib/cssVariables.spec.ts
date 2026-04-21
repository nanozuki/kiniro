import { describe, expect, it } from 'vitest';
import { generateCssVariables, slugifyCssIdent } from './cssVariables';
import type { PaletteData } from './palette';

describe('generateCssVariables', () => {
	it('uses shared lightness settings when exporting variant OKLCH custom properties', () => {
		const palettes: PaletteData[] = [
			{
				id: 1,
				name: 'Brand',
				groups: [{ id: 1, name: 'base', colors: [{ id: 1, name: 'primary', hex: '#907aa9' }] }],
				variants: [
					{
						id: 1,
						name: 'Dark',
						groups: {
							1: {
								lightnessMax: 0.95,
								lightnessMin: 0.15,
								controlledLightness: { 200: 0.8 },
								reversed: true,
								stepsCount: 3,
								halfStepBefore: false,
								halfStepAfter: false
							}
						}
					}
				]
			}
		];

		const css = generateCssVariables(palettes, 'tone-');

		expect(css).toContain('/* Brand / Dark */');
		expect(css).toContain('--tone-brand-dark-base-primary-100: 0.150');
		expect(css).toContain('--tone-brand-dark-base-primary-200: 0.800');
		expect(css).toContain('--tone-brand-dark-base-primary-300: 0.950');
	});

	it('exports multiple variants without name collisions', () => {
		const palettes: PaletteData[] = [
			{
				id: 1,
				name: 'Brand',
				groups: [{ id: 1, name: 'base', colors: [{ id: 1, name: 'primary', hex: '#907aa9' }] }],
				variants: [
					{
						id: 1,
						name: 'Light',
						groups: {
							1: {
								lightnessMax: 0.95,
								lightnessMin: 0.15,
								controlledLightness: {},
								reversed: false,
								stepsCount: 3,
								halfStepBefore: false,
								halfStepAfter: false
							}
						}
					},
					{
						id: 2,
						name: 'Dark',
						groups: {
							1: {
								lightnessMax: 0.9,
								lightnessMin: 0.1,
								controlledLightness: {},
								reversed: true,
								stepsCount: 3,
								halfStepBefore: false,
								halfStepAfter: false
							}
						}
					}
				]
			}
		];

		const css = generateCssVariables(palettes, 'color-');

		expect(css).toContain('--color-brand-light-base-primary-100: 0.950');
		expect(css).toContain('--color-brand-dark-base-primary-100: 0.100');
	});

	it('skips invalid seed colors without dropping valid groups', () => {
		const palettes: PaletteData[] = [
			{
				id: 1,
				name: 'Mixed',
				groups: [
					{
						id: 1,
						name: 'base',
						colors: [
							{ id: 1, name: 'invalid', hex: 'not-a-color' },
							{ id: 2, name: 'valid', hex: '#000000' }
						]
					}
				],
				variants: [
					{
						id: 1,
						name: 'Light',
						groups: {
							1: {
								lightnessMax: 0.9,
								lightnessMin: 0.1,
								controlledLightness: {},
								reversed: false,
								stepsCount: 3,
								halfStepBefore: false,
								halfStepAfter: false
							}
						}
					}
				]
			}
		];

		const css = generateCssVariables(palettes, 'color-');

		expect(css).not.toContain('--color-mixed-light-base-invalid-');
		expect(css).toContain('--color-mixed-light-base-valid-100: 0.900');
		expect(css).toContain(':root {');
		expect(css.trim().endsWith('}')).toBe(true);
	});
});

describe('slugifyCssIdent', () => {
	it('normalizes user names into CSS variable name segments', () => {
		expect(slugifyCssIdent('Brand Light / Base')).toBe('brand-light-base');
		expect(slugifyCssIdent('')).toBe('item');
	});
});
