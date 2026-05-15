import { describe, expect, it } from 'vitest';
import { applyThemeImport, exportThemes, validateThemeImport } from './importExport';
import { createDefaultTheme } from './model';

describe('theme import/export', () => {
	it('exports versioned theme data only', () => {
		const theme = createDefaultTheme({ id: 'theme', name: 'Rose Pine' });
		const json = exportThemes([theme]);
		const parsed = JSON.parse(json);

		expect(parsed).toMatchObject({ version: 1, themes: [{ id: 'theme', name: 'Rose Pine' }] });
		expect(parsed.history).toBeUndefined();
		expect(parsed.ui).toBeUndefined();
	});

	it('validates import shape and reports friendly failures', () => {
		expect(validateThemeImport('{bad').ok).toBe(false);
		expect(validateThemeImport(JSON.stringify({ version: 99, themes: [] }))).toMatchObject({ ok: false, summary: 'Unsupported Kiniro export version.' });
		expect(validateThemeImport(JSON.stringify({ version: 1, themes: [{}] }))).toMatchObject({ ok: false, summary: 'Invalid theme export file.' });
	});

	it('returns valid export payloads', () => {
		const theme = createDefaultTheme({ id: 'theme' });
		const result = validateThemeImport(exportThemes([theme]));

		expect(result.ok).toBe(true);
		if (result.ok) expect(result.file.themes[0].id).toBe('theme');
	});

	it('overwrites conflicting themes in place by default', () => {
		const existing = [createDefaultTheme({ id: 'old', name: 'Same' }), createDefaultTheme({ id: 'other', name: 'Other' })];
		const imported = [createDefaultTheme({ id: 'new', name: 'Same' })];

		const result = applyThemeImport(existing, imported, [{ themeId: 'new', conflict: 'overwrite' }]);

		expect(result.themes.map((theme) => theme.id)).toEqual(['new', 'other']);
		expect(result.selectedThemeId).toBe('new');
	});

	it('renames conflicting imports and appends them', () => {
		const existing = [createDefaultTheme({ id: 'old', name: 'Same' })];
		const imported = [createDefaultTheme({ id: 'new', name: 'Same' })];

		const result = applyThemeImport(existing, imported, [{ themeId: 'new', conflict: 'rename' }]);

		expect(result.themes.map((theme) => theme.name)).toEqual(['Same', 'Same 2']);
		expect(result.themes.map((theme) => theme.id)).toEqual(['old', 'new']);
	});
});
