import { describe, expect, it } from 'vitest';
import { createDefaultTheme, type Theme } from './model';
import {
	defaultFamilyName,
	defaultRampName,
	defaultThemeName,
	defaultVariantName,
	ensureUniqueName,
	familyNames,
	rampNames,
	sanitizeCssName,
	themeNames,
	validateName,
	variantNames
} from './naming';

describe('normalize and sanitize names', () => {
	it('trims display names for validation', () => {
		expect(validateName('  Rose Pine  ')).toMatchObject({
			valid: true,
			name: 'Rose Pine',
			cssName: 'rose-pine'
		});
	});

	it('sanitizes CSS names with the shared rules', () => {
		expect(sanitizeCssName(' Rose_Pine  Moon!! ')).toBe('rose-pine-moon');
		expect(sanitizeCssName('base---muted')).toBe('base-muted');
		expect(sanitizeCssName('---Accent---')).toBe('accent');
	});

	it('returns an empty CSS name when no letters or numbers remain', () => {
		expect(sanitizeCssName('___ --- !!!')).toBe('');
		expect(validateName('___')).toMatchObject({
			valid: false,
			error: 'empty-css-name'
		});
	});
});

describe('validateName', () => {
	it('rejects empty display names', () => {
		expect(validateName('   ')).toMatchObject({
			valid: false,
			error: 'empty-display-name'
		});
	});

	it('rejects duplicate display names after trimming', () => {
		expect(validateName(' Brand ', [{ name: 'Brand' }])).toMatchObject({
			valid: false,
			error: 'duplicate-name'
		});
	});

	it('rejects sanitized CSS-name collisions', () => {
		expect(validateName('Rose_Pine', [{ name: 'Rose Pine' }])).toMatchObject({
			valid: false,
			error: 'duplicate-css-name',
			cssName: 'rose-pine'
		});
	});

	it('can exclude the item being renamed', () => {
		const item = { name: 'Brand' };
		expect(validateName(' Brand ', [item], { exclude: item })).toMatchObject({
			valid: true,
			name: 'Brand'
		});
	});
});

describe('unique fallback names', () => {
	it('fixes invalid inline names with a default fallback', () => {
		expect(ensureUniqueName('---', [{ name: 'Name' }], { fallbackBase: 'Name' })).toBe('Name 2');
	});

	it('fixes duplicate names by appending a number', () => {
		expect(ensureUniqueName('Name', [{ name: 'Name' }, { name: 'Name 2' }])).toBe('Name 3');
	});

	it('fixes sanitized-name collisions by appending a number to the display name', () => {
		expect(ensureUniqueName('Rose_Pine', [{ name: 'Rose Pine' }])).toBe('Rose_Pine 2');
	});

	it('creates the next default names for themes, variants, families, and ramps', () => {
		const theme = createDefaultTheme();
		theme.variants.push({ ...theme.variants[0], id: 'variant-2', name: 'default 2' });
		theme.structure.families.push({
			id: 'family-2',
			name: 'Family 2',
			stepScale: {
				stepCount: 9,
				indexStyle: 'scale',
				halfStepStart: false,
				halfStepEnd: false
			},
			ramps: [
				{ id: 'ramp-1', name: 'Ramp 1' },
				{ id: 'ramp-2', name: 'Ramp 2' }
			]
		});
		const themes: Theme[] = [theme, createDefaultTheme({ name: 'Theme 2' })];

		expect(defaultThemeName(themes)).toBe('Theme 3');
		expect(defaultVariantName(theme.variants)).toBe('default 3');
		expect(defaultFamilyName(theme.structure.families)).toBe('Family 3');
		expect(defaultRampName(rampNames(theme))).toBe('Ramp 3');
	});
});

describe('scope helpers', () => {
	it('returns the naming scopes used by app operations', () => {
		const theme = createDefaultTheme();
		theme.structure.families[0].ramps.push({ id: 'ramp-1', name: 'base' });

		expect(themeNames([theme])).toEqual([theme]);
		expect(variantNames(theme)).toEqual(theme.variants);
		expect(familyNames(theme)).toEqual(theme.structure.families);
		expect(rampNames(theme)).toEqual([{ id: 'ramp-1', name: 'base' }]);
	});
});
