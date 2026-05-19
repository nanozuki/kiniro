import type { ColorFamilyStructure, ColorRampStructure, Theme, ThemeVariant } from './model';

export type NamedItem = { name: string };

export type NameValidationError =
	| 'empty-display-name'
	| 'empty-css-name'
	| 'duplicate-name'
	| 'duplicate-css-name';

export type NameValidationResult = {
	valid: boolean;
	name: string;
	cssName: string;
	error: NameValidationError | null;
};

export type UniqueNameOptions = {
	exclude?: NamedItem | ((item: NamedItem) => boolean);
	fallbackBase?: string;
};

// Naming helpers centralize the display-name and CSS-name rules shared by dialogs,
// inline editors, default-name generation, and future import conflict handling.
export function normalizeDisplayName(name: string): string {
	return name.trim();
}

export function sanitizeCssName(name: string): string {
	const sanitized = normalizeDisplayName(name)
		.toLowerCase()
		.replace(/[\s_]+/g, '-')
		.replace(/[^a-z0-9-]/g, '')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');

	return /[a-z0-9]/.test(sanitized) ? sanitized : '';
}

export function validateName(
	name: string,
	existingNames: readonly NamedItem[] = [],
	options: UniqueNameOptions = {}
): NameValidationResult {
	const normalizedName = normalizeDisplayName(name);
	const cssName = sanitizeCssName(normalizedName);
	let error: NameValidationError | null = null;

	if (normalizedName.length === 0) error = 'empty-display-name';
	else if (cssName.length === 0) error = 'empty-css-name';
	else if (hasDisplayNameCollision(normalizedName, existingNames, options.exclude))
		error = 'duplicate-name';
	else if (hasCssNameCollision(cssName, existingNames, options.exclude))
		error = 'duplicate-css-name';

	return {
		valid: error == null,
		name: normalizedName,
		cssName,
		error
	};
}

export function hasDisplayNameCollision(
	name: string,
	existingNames: readonly NamedItem[],
	exclude?: UniqueNameOptions['exclude']
): boolean {
	const normalizedName = normalizeDisplayName(name);
	return comparableNames(existingNames, exclude).some((existing) => existing === normalizedName);
}

export function hasCssNameCollision(
	cssName: string,
	existingNames: readonly NamedItem[],
	exclude?: UniqueNameOptions['exclude']
): boolean {
	return comparableCssNames(existingNames, exclude).some((existing) => existing === cssName);
}

export function ensureUniqueName(
	name: string,
	existingNames: readonly NamedItem[],
	options: UniqueNameOptions = {}
): string {
	const fallbackBase = options.fallbackBase ?? 'Name';
	const normalizedName = normalizeDisplayName(name);
	const baseName =
		normalizedName.length > 0 && sanitizeCssName(normalizedName).length > 0
			? normalizedName
			: fallbackBase;

	if (validateName(baseName, existingNames, options).valid) return baseName;

	return findNumberedName(baseName, existingNames, options, 2);
}

export function nextAvailableName(
	baseName: string,
	existingNames: readonly NamedItem[],
	options: UniqueNameOptions = {}
): string {
	return findNumberedName(baseName, existingNames, options, 1);
}

function findNumberedName(
	baseName: string,
	existingNames: readonly NamedItem[],
	options: UniqueNameOptions,
	start: number
): string {
	const normalizedBase = normalizeDisplayName(baseName) || options.fallbackBase || 'Name';
	const usableBase =
		sanitizeCssName(normalizedBase).length > 0 ? normalizedBase : options.fallbackBase || 'Name';

	for (let suffix = start; suffix < Number.MAX_SAFE_INTEGER; suffix++) {
		const candidate = `${usableBase} ${suffix}`;
		if (validateName(candidate, existingNames, options).valid) return candidate;
	}

	throw new Error(`Unable to create a unique name for ${usableBase}`);
}

export function defaultThemeName(themes: readonly Theme[]): string {
	return nextAvailableName('Theme', themes);
}

export function defaultVariantName(variants: readonly ThemeVariant[]): string {
	return ensureUniqueName('default', variants, { fallbackBase: 'Variant' });
}

export function defaultFamilyName(families: readonly ColorFamilyStructure[]): string {
	return nextAvailableName('Family', families);
}

export function defaultRampName(ramps: readonly ColorRampStructure[]): string {
	return nextAvailableName('Ramp', ramps);
}

export function themeNames(themes: readonly Theme[]): readonly Theme[] {
	return themes;
}

export function variantNames(theme: Theme): readonly ThemeVariant[] {
	return theme.variants;
}

export function familyNames(theme: Theme): readonly ColorFamilyStructure[] {
	return theme.structure.families;
}

export function rampNames(theme: Theme): readonly ColorRampStructure[] {
	return theme.structure.families.flatMap((family) => family.ramps);
}

function comparableNames(
	items: readonly NamedItem[],
	exclude: UniqueNameOptions['exclude']
): string[] {
	return items
		.filter((item) => !isExcluded(item, exclude))
		.map((item) => normalizeDisplayName(item.name));
}

function comparableCssNames(
	items: readonly NamedItem[],
	exclude: UniqueNameOptions['exclude']
): string[] {
	return items
		.filter((item) => !isExcluded(item, exclude))
		.map((item) => sanitizeCssName(item.name));
}

function isExcluded(item: NamedItem, exclude: UniqueNameOptions['exclude']): boolean {
	if (!exclude) return false;
	return typeof exclude === 'function' ? exclude(item) : item === exclude;
}
