import { describe, expect, it } from 'vitest';
import { exportCssVariables, normalizeCssPrefix } from './cssVariables';
import { createDefaultRampValues, createDefaultTheme } from './model';

describe('exportCssVariables', () => {
	it('exports current variant swatches as OKLCH channel triples', () => {
		const theme = createDefaultTheme({ variantName: 'Main' });
		const familyId = theme.structure.families[0].id;
		theme.structure.families[0].ramps.push({ id: 'base', name: 'Base Color' });
		const variant = theme.variants[0];
		variant.values.families[familyId].ramps.base = createDefaultRampValues({
			format: 'oklch',
			serialized: 'oklch(0.7 0.02555 291.139)',
			oklch: { lightness: 0.7, chroma: 0.02555, hue: 291.139 }
		});

		const css = exportCssVariables(theme, variant);

		expect(css.css).toContain('--color-main-base-color-100: 0.9500 0.0038 291.13;');
		expect(css.css).toContain('--color-main-base-color-900: 0.0500 0.0043 291.13;');
		expect(css.usageExample).toBe('color: oklch(var(--color-main-base-color-100) / 1);');
	});

	it('uses theme prefix and sanitized variant and ramp names', () => {
		const theme = createDefaultTheme({ variantName: 'Dawn Light' });
		const familyId = theme.structure.families[0].id;
		theme.cssPrefix = 'Brand_Color!';
		theme.structure.families[0].ramps.push({ id: 'rose', name: 'Rose_Pine!!' });
		theme.variants[0].values.families[familyId].ramps.rose = createDefaultRampValues();

		const css = exportCssVariables(theme, theme.variants[0]);

		expect(css.prefix).toBe('brand-color');
		expect(css.groups[0].variables[0].name).toBe('--brand-color-dawn-light-rose-pine-100');
	});

	it('preserves family, ramp, and step order', () => {
		const theme = createDefaultTheme();
		const familyId = theme.structure.families[0].id;
		theme.structure.families.push({
			id: 'family-2',
			name: 'Accent',
			stepScale: { stepCount: 5, indexStyle: 'ordinal', halfStepStart: false, halfStepEnd: false },
			ramps: [{ id: 'accent', name: 'accent' }]
		});
		theme.structure.families[0].ramps.push(
			{ id: 'base', name: 'base' },
			{ id: 'text', name: 'text' }
		);
		const variant = theme.variants[0];
		variant.values.families[familyId].ramps.base = createDefaultRampValues();
		variant.values.families[familyId].ramps.text = createDefaultRampValues();
		variant.values.families['family-2'] = {
			stepScale: { lightnessStart: 1, lightnessEnd: 0, lightnessOverrides: {}, reversed: false },
			ramps: { accent: createDefaultRampValues() }
		};

		const names = exportCssVariables(theme, variant).groups.flatMap((group) =>
			group.variables.map((variable) => variable.name)
		);

		expect(names[0]).toBe('--color-default-base-100');
		expect(names[9]).toBe('--color-default-text-100');
		expect(names[18]).toBe('--color-default-accent-1');
	});

	it('includes comments for empty families and blank lines between groups', () => {
		const theme = createDefaultTheme();
		theme.structure.families.push({
			id: 'empty',
			name: 'Empty Family',
			stepScale: { stepCount: 5, indexStyle: 'scale', halfStepStart: false, halfStepEnd: false },
			ramps: []
		});
		theme.variants[0].values.families.empty = {
			stepScale: {
				lightnessStart: 0.9,
				lightnessEnd: 0.1,
				lightnessOverrides: {},
				reversed: false
			},
			ramps: {}
		};

		const css = exportCssVariables(theme, theme.variants[0]).css;

		expect(css).toContain('  /* Family 1 */\n\n  /* Empty Family */');
	});
});

describe('normalizeCssPrefix', () => {
	it('falls back to color when prefix cannot produce a CSS name', () => {
		expect(normalizeCssPrefix('---')).toBe('color');
	});
});
