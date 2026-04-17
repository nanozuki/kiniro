import { describe, expect, it } from 'vitest';
import { generateCssVariables } from './cssVariables';
import type { GroupData } from './storage';

describe('generateCssVariables', () => {
	it('uses shared lightness settings when exporting OKLCH custom properties', () => {
		const groups: GroupData[] = [
			{
				id: 1,
				name: 'brand',
				lightnessMax: 0.95,
				lightnessMin: 0.15,
				controlledLightness: { 200: 0.8 },
				reversed: true,
				stepsCount: 3,
				halfStepBefore: false,
				halfStepAfter: false,
				colors: [{ id: 1, name: 'primary', hex: '#907aa9' }]
			}
		];

		const css = generateCssVariables(groups, 'tone-');

		expect(css).toContain('/* brand */');
		expect(css).toContain('--tone-primary-100: 0.150');
		expect(css).toContain('--tone-primary-200: 0.800');
		expect(css).toContain('--tone-primary-300: 0.950');
	});

	it('skips invalid seed colors without dropping valid groups', () => {
		const groups: GroupData[] = [
			{
				id: 1,
				name: 'mixed',
				lightnessMax: 0.9,
				lightnessMin: 0.1,
				controlledLightness: {},
				reversed: false,
				stepsCount: 3,
				halfStepBefore: false,
				halfStepAfter: false,
				colors: [
					{ id: 1, name: 'invalid', hex: 'not-a-color' },
					{ id: 2, name: 'valid', hex: '#000000' }
				]
			}
		];

		const css = generateCssVariables(groups, 'color-');

		expect(css).not.toContain('--color-invalid-');
		expect(css).toContain('--color-valid-100: 0.900');
		expect(css).toContain(':root {');
		expect(css.trim().endsWith('}')).toBe(true);
	});
});
