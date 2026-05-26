import {
	createColorFamily,
	createColorRamp,
	createDefaultRampValues,
	createDefaultTheme,
	createDefaultStepScaleValues,
	createThemeVariant,
	type ColorFamilyValues,
	type Theme,
	type ThemeStructure,
	type ThemeVariant,
	type VariantValues
} from './model';
import { ensureUniqueName } from './naming';
import {
	EXPORT_FILE_VERSION,
	exportFileSchema,
	type ExportFile,
	type ExportTheme
} from './schemas';

export const EXPORT_VERSION = EXPORT_FILE_VERSION;

export type ThemeExportFile = ExportFile;

export type ImportConflictChoice = 'overwrite' | 'rename';

export type ImportThemeChoice = {
	importKey: string;
	conflict?: ImportConflictChoice;
};

export type ImportValidationResult =
	| { ok: true; file: ThemeExportFile }
	| { ok: false; summary: string; details: string };

export type ImportApplyResult = {
	themes: Theme[];
	selectedThemeId: string | null;
	importedThemeIds: string[];
};

// JSON import/export is a public, ID-free theme format. Generated palette values,
// history, UI state, and internal model IDs stay outside this file format.
export function exportThemes(themes: readonly Theme[]): string {
	return JSON.stringify({ version: EXPORT_VERSION, themes: themes.map(themeToExportDto) });
}

export function validateThemeImport(json: string): ImportValidationResult {
	try {
		const value: unknown = JSON.parse(json);
		if (!isRecord(value) || value.version !== EXPORT_VERSION) {
			return {
				ok: false,
				summary: 'Unsupported Kiniro export version.',
				details: 'Expected version: 1.'
			};
		}
		const parsed = exportFileSchema.safeParse(value);
		if (!parsed.success) {
			return {
				ok: false,
				summary: 'Invalid theme export file.',
				details: 'The file must contain ID-free theme payloads with valid nested data.'
			};
		}
		return { ok: true, file: clone(parsed.data) };
	} catch (error) {
		return {
			ok: false,
			summary: 'Invalid JSON file.',
			details: error instanceof Error ? error.message : 'Unable to parse JSON.'
		};
	}
}

export function applyThemeImport(
	existingThemes: readonly Theme[],
	importedThemes: readonly ExportTheme[],
	choices: readonly ImportThemeChoice[]
): ImportApplyResult {
	const nextThemes: Theme[] = clone([...existingThemes]);
	const importedThemeIds: string[] = [];

	for (const choice of choices) {
		const index = Number(choice.importKey);
		const imported = Number.isInteger(index) ? importedThemes[index] : undefined;
		if (!imported) continue;
		const existingIndex = nextThemes.findIndex((theme) => theme.name === imported.name);
		const theme = exportDtoToTheme(imported);

		if (existingIndex >= 0 && choice.conflict !== 'rename') {
			nextThemes[existingIndex] = theme;
			importedThemeIds.push(theme.id);
		} else {
			theme.name = ensureUniqueName(theme.name, nextThemes, { fallbackBase: 'Theme' });
			nextThemes.push(theme);
			importedThemeIds.push(theme.id);
		}
	}

	return { themes: nextThemes, selectedThemeId: importedThemeIds[0] ?? null, importedThemeIds };
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function themeToExportDto(theme: Theme): ExportTheme {
	return {
		name: theme.name,
		cssPrefix: theme.cssPrefix,
		targetGamut: theme.targetGamut,
		structure: {
			families: theme.structure.families.map((family) => ({
				name: family.name,
				stepScale: clone(family.stepScale),
				ramps: family.ramps.map((ramp) => ({ name: ramp.name }))
			}))
		},
		variants: theme.variants.map((variant) => ({
			name: variant.name,
			values: {
				families: theme.structure.families.map((family) => {
					const familyValues = variant.values.families[family.id];
					return {
						stepScale: clone(familyValues?.stepScale ?? createDefaultStepScaleValues()),
						ramps: family.ramps.map((ramp) =>
							clone(familyValues?.ramps[ramp.id] ?? createDefaultRampValues())
						)
					};
				})
			}
		}))
	};
}

function exportDtoToTheme(theme: ExportTheme): Theme {
	const structure: ThemeStructure = {
		families: theme.structure.families.map((family) => ({
			...createColorFamily({ name: family.name }),
			stepScale: clone(family.stepScale),
			ramps: family.ramps.map((ramp) => createColorRamp({ name: ramp.name }))
		}))
	};

	return {
		...theme,
		id: createDefaultTheme().id,
		structure,
		variants: theme.variants.map((variant) => exportDtoToVariant(variant, structure))
	};
}

function exportDtoToVariant(
	variant: ExportTheme['variants'][number],
	structure: ThemeStructure
): ThemeVariant {
	return createThemeVariant(structure, {
		name: variant.name,
		values: exportDtoToVariantValues(variant.values, structure)
	});
}

function exportDtoToVariantValues(
	values: ExportTheme['variants'][number]['values'],
	structure: ThemeStructure
): VariantValues {
	const families: VariantValues['families'] = {};

	for (const [familyIndex, family] of structure.families.entries()) {
		const dtoValues = values.families[familyIndex];
		const familyValues: ColorFamilyValues = {
			stepScale: clone(dtoValues?.stepScale ?? createDefaultStepScaleValues()),
			ramps: {}
		};

		for (const [rampIndex, ramp] of family.ramps.entries()) {
			familyValues.ramps[ramp.id] = clone(dtoValues?.ramps[rampIndex] ?? createDefaultRampValues());
		}

		families[family.id] = familyValues;
	}

	return { families };
}

// Import/export payloads are plain JSON data. Clone through JSON so imported
// values remain compatible with proxy-backed Svelte state used by the dialogs.
function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}
