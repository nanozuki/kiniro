import type { Theme } from './model';
import { ensureUniqueName } from './naming';

export const EXPORT_VERSION = 1;

export type ThemeExportFile = {
	version: 1;
	themes: Theme[];
};

export type ImportConflictChoice = 'overwrite' | 'rename';

export type ImportThemeChoice = {
	themeId: string;
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

// JSON import/export works on theme payloads only. Generated palette values,
// history, and UI state stay outside this file format.
export function exportThemes(themes: readonly Theme[]): string {
	return JSON.stringify({ version: EXPORT_VERSION, themes: clone(themes) });
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
		if (!Array.isArray(value.themes) || !value.themes.every(isThemeLike)) {
			return {
				ok: false,
				summary: 'Invalid theme export file.',
				details: 'The file must contain a themes array with theme payloads.'
			};
		}
		return { ok: true, file: { version: EXPORT_VERSION, themes: clone(value.themes) } };
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
	importedThemes: readonly Theme[],
	choices: readonly ImportThemeChoice[]
): ImportApplyResult {
	const nextThemes: Theme[] = clone([...existingThemes]);
	const importedThemeIds: string[] = [];

	for (const choice of choices) {
		const imported = importedThemes.find((theme) => theme.id === choice.themeId);
		if (!imported) continue;
		const existingIndex = nextThemes.findIndex((theme) => theme.name === imported.name);
		const theme = clone(imported);

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

function isThemeLike(value: unknown): value is Theme {
	return (
		isRecord(value) &&
		typeof value.id === 'string' &&
		typeof value.name === 'string' &&
		typeof value.cssPrefix === 'string' &&
		isRecord(value.structure) &&
		Array.isArray(value.variants)
	);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}
