import { describe, expect, it } from 'vitest';
import { applyThemeImport, exportThemes, validateThemeImport } from './importExport';
import { createDefaultTheme } from './model';

describe('theme import/export', () => {
	it('exports versioned theme data only', () => {
		const theme = createDefaultTheme({ name: 'Rose Pine' });
		const json = exportThemes([theme]);
		const parsed = JSON.parse(json);

		expect(parsed).toMatchObject({ version: 1, themes: [{ id: theme.id, name: 'Rose Pine' }] });
		expect(parsed.history).toBeUndefined();
		expect(parsed.ui).toBeUndefined();
	});

	it('validates import shape and reports friendly failures', () => {
		expect(validateThemeImport('{bad').ok).toBe(false);
		expect(validateThemeImport(JSON.stringify({ version: 99, themes: [] }))).toMatchObject({
			ok: false,
			summary: 'Unsupported Kiniro export version.'
		});
		expect(validateThemeImport(JSON.stringify({ version: 1, themes: [{}] }))).toMatchObject({
			ok: false,
			summary: 'Invalid theme export file.'
		});
	});

	it('returns valid export payloads', () => {
		const theme = createDefaultTheme();
		const result = validateThemeImport(exportThemes([theme]));

		expect(result.ok).toBe(true);
		if (result.ok) expect(result.file.themes[0].id).toBe(theme.id);
	});

	it('overwrites conflicting themes in place by default', () => {
		const existing = [createDefaultTheme({ name: 'Same' }), createDefaultTheme({ name: 'Other' })];
		const imported = [createDefaultTheme({ name: 'Same' })];

		const result = applyThemeImport(existing, imported, [
			{ themeId: imported[0].id, conflict: 'overwrite' }
		]);

		expect(result.themes.map((theme) => theme.id)).toEqual([imported[0].id, existing[1].id]);
		expect(result.selectedThemeId).toBe(imported[0].id);
	});

	it('renames conflicting imports and appends them', () => {
		const existing = [createDefaultTheme({ name: 'Same' })];
		const imported = [createDefaultTheme({ name: 'Same' })];

		const result = applyThemeImport(existing, imported, [
			{ themeId: imported[0].id, conflict: 'rename' }
		]);

		expect(result.themes.map((theme) => theme.name)).toEqual(['Same', 'Same 2']);
		expect(result.themes.map((theme) => theme.id)).toEqual([existing[0].id, imported[0].id]);
	});

	it('imports themes from proxy-backed values', () => {
		const existing = [createDefaultTheme({ name: 'Existing' })];
		const importedTheme = new Proxy(createDefaultTheme({ name: 'Imported' }), {});
		const imported = new Proxy([importedTheme], {});
		const choices = new Proxy([{ themeId: importedTheme.id }], {});

		const result = applyThemeImport(existing, imported, choices);

		expect(result.themes.map((theme) => theme.id)).toEqual([existing[0].id, importedTheme.id]);
		expect(result.selectedThemeId).toBe(importedTheme.id);
	});
});
