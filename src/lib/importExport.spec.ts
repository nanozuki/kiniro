import { describe, expect, it } from 'vitest';
import { applyThemeImport, exportThemes, validateThemeImport } from './importExport';
import { createColorRamp, createDefaultRampValues, createDefaultTheme } from './model';

function containsKey(value: unknown, key: string): boolean {
	if (Array.isArray(value)) return value.some((item) => containsKey(item, key));
	if (typeof value !== 'object' || value === null) return false;
	return Object.entries(value).some(([entryKey, entryValue]) => {
		return entryKey === key || containsKey(entryValue, key);
	});
}

describe('theme import/export', () => {
	it('exports versioned public theme data without internal ids', () => {
		const theme = createDefaultTheme({ name: 'Rose Pine' });
		const ramp = createColorRamp({ name: 'Accent' });
		const family = theme.structure.families[0];
		family.ramps.push(ramp);
		theme.variants[0].values.families[family.id].ramps[ramp.id] = createDefaultRampValues();
		const json = exportThemes([theme]);
		const parsed = JSON.parse(json);

		expect(parsed).toMatchObject({ version: 1, themes: [{ name: 'Rose Pine' }] });
		expect(containsKey(parsed, 'id')).toBe(false);
		expect(parsed.themes[0].structure.families[0].ramps[0]).toEqual({ name: 'Accent' });
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
		expect(
			validateThemeImport(
				JSON.stringify({
					version: 1,
					themes: [
						{
							id: 'internal-id',
							name: 'Bad',
							cssPrefix: 'bad',
							targetGamut: 'srgb',
							structure: { families: [] },
							variants: []
						}
					]
				})
			)
		).toMatchObject({
			ok: false,
			summary: 'Invalid theme export file.'
		});
	});

	it('returns valid public export payloads', () => {
		const theme = createDefaultTheme();
		const result = validateThemeImport(exportThemes([theme]));

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.file.themes[0].name).toBe(theme.name);
			expect(containsKey(result.file, 'id')).toBe(false);
		}
	});

	it('accepts valid ID-free public export data', () => {
		const result = validateThemeImport(
			JSON.stringify({
				version: 1,
				themes: [
					{
						name: 'Public',
						cssPrefix: 'public',
						targetGamut: 'srgb',
						structure: {
							families: [
								{
									name: 'Neutrals',
									stepScale: {
										stepCount: 9,
										indexStyle: 'scale',
										halfStepStart: false,
										halfStepEnd: false
									},
									ramps: [{ name: 'Gray' }]
								}
							]
						},
						variants: [
							{
								name: 'default',
								values: {
									families: [
										{
											stepScale: {
												lightnessStart: 0.95,
												lightnessEnd: 0.05,
												lightnessOverrides: {},
												reversed: false
											},
											ramps: [
												{
													sourceColor: {
														format: 'oklch',
														oklch: { lightness: 0.7, chroma: 0.1, hue: 0 },
														serialized: 'oklch(0.7 0.1 0)'
													},
													swatchOverrides: {}
												}
											]
										}
									]
								}
							}
						]
					}
				]
			})
		);

		expect(result.ok).toBe(true);
	});

	it('rebuilds family and ramp values against regenerated ids', () => {
		const theme = createDefaultTheme({ name: 'Round Trip' });
		const warm = createColorRamp({ name: 'Warm' });
		const cool = createColorRamp({ name: 'Cool' });
		const accents = createDefaultTheme({ familyName: 'Accents' }).structure.families[0];
		accents.ramps = [cool];
		theme.structure.families[0].name = 'Neutrals';
		theme.structure.families[0].ramps = [warm];
		theme.structure.families.push(accents);
		const variant = theme.variants[0];
		variant.name = 'light';
		variant.values.families = {
			[theme.structure.families[0].id]: {
				stepScale: {
					lightnessStart: 0.98,
					lightnessEnd: 0.12,
					lightnessOverrides: { 500: 0.54 },
					reversed: false
				},
				ramps: {
					[warm.id]: {
						sourceColor: {
							format: 'oklch',
							oklch: { lightness: 0.72, chroma: 0.09, hue: 45 },
							serialized: 'oklch(0.72 0.09 45)'
						},
						swatchOverrides: { 500: { chroma: 0.04 } }
					}
				}
			},
			[accents.id]: {
				stepScale: {
					lightnessStart: 0.88,
					lightnessEnd: 0.22,
					lightnessOverrides: { 700: 0.3 },
					reversed: true
				},
				ramps: {
					[cool.id]: {
						sourceColor: {
							format: 'oklch',
							oklch: { lightness: 0.66, chroma: 0.14, hue: 280 },
							serialized: 'oklch(0.66 0.14 280)'
						},
						swatchOverrides: { 700: { hue: 300 } }
					}
				}
			}
		};
		const validated = validateThemeImport(exportThemes([theme]));
		if (!validated.ok) throw new Error('expected valid import');

		const result = applyThemeImport([], validated.file.themes, [{ importKey: '0' }]);
		const importedTheme = result.themes[0];
		const [importedNeutrals, importedAccents] = importedTheme.structure.families;
		const importedLight = importedTheme.variants[0];
		const importedNeutralsValues = importedLight.values.families[importedNeutrals.id];
		const importedAccentsValues = importedLight.values.families[importedAccents.id];
		const importedWarm = importedNeutrals.ramps[0];
		const importedCool = importedAccents.ramps[0];

		expect(importedTheme.id).not.toBe(theme.id);
		expect(importedTheme.structure.families.map((family) => family.id)).not.toEqual(
			theme.structure.families.map((family) => family.id)
		);
		expect(importedTheme.structure.families.map((family) => family.name)).toEqual([
			'Neutrals',
			'Accents'
		]);
		expect(importedNeutralsValues.stepScale).toEqual({
			lightnessStart: 0.98,
			lightnessEnd: 0.12,
			lightnessOverrides: { 500: 0.54 },
			reversed: false
		});
		expect(importedNeutralsValues.ramps[importedWarm.id]).toEqual({
			sourceColor: {
				format: 'oklch',
				oklch: { lightness: 0.72, chroma: 0.09, hue: 45 },
				serialized: 'oklch(0.72 0.09 45)'
			},
			swatchOverrides: { 500: { chroma: 0.04 } }
		});
		expect(importedAccentsValues.stepScale).toEqual({
			lightnessStart: 0.88,
			lightnessEnd: 0.22,
			lightnessOverrides: { 700: 0.3 },
			reversed: true
		});
		expect(importedAccentsValues.ramps[importedCool.id]).toEqual({
			sourceColor: {
				format: 'oklch',
				oklch: { lightness: 0.66, chroma: 0.14, hue: 280 },
				serialized: 'oklch(0.66 0.14 280)'
			},
			swatchOverrides: { 700: { hue: 300 } }
		});
	});

	it('overwrites conflicting themes in place by default', () => {
		const existing = [createDefaultTheme({ name: 'Same' }), createDefaultTheme({ name: 'Other' })];
		const imported = exportThemes([createDefaultTheme({ name: 'Same' })]);
		const validated = validateThemeImport(imported);
		if (!validated.ok) throw new Error('expected valid import');

		const result = applyThemeImport(existing, validated.file.themes, [
			{ importKey: '0', conflict: 'overwrite' }
		]);

		expect(result.themes.map((theme) => theme.name)).toEqual(['Same', 'Other']);
		expect(result.themes[0].id).not.toBe(existing[0].id);
		expect(result.themes[1].id).toBe(existing[1].id);
		expect(result.selectedThemeId).toBe(result.themes[0].id);
	});

	it('renames conflicting imports and appends them', () => {
		const existing = [createDefaultTheme({ name: 'Same' })];
		const validated = validateThemeImport(exportThemes([createDefaultTheme({ name: 'Same' })]));
		if (!validated.ok) throw new Error('expected valid import');

		const result = applyThemeImport(existing, validated.file.themes, [
			{ importKey: '0', conflict: 'rename' }
		]);

		expect(result.themes.map((theme) => theme.name)).toEqual(['Same', 'Same 2']);
		expect(result.themes[0].id).toBe(existing[0].id);
		expect(result.themes[1].id).not.toBe(existing[0].id);
	});

	it('imports themes from proxy-backed values', () => {
		const existing = [createDefaultTheme({ name: 'Existing' })];
		const validated = validateThemeImport(exportThemes([createDefaultTheme({ name: 'Imported' })]));
		if (!validated.ok) throw new Error('expected valid import');
		const importedTheme = new Proxy(validated.file.themes[0], {});
		const imported = new Proxy([importedTheme], {});
		const choices = new Proxy([{ importKey: '0' }], {});

		const result = applyThemeImport(existing, imported, choices);

		expect(result.themes.map((theme) => theme.name)).toEqual(['Existing', 'Imported']);
		expect(result.themes[0].id).toBe(existing[0].id);
		expect(result.selectedThemeId).toBe(result.themes[1].id);
	});
});
