import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	loadPalettes,
	parsePalettesJson,
	savePalettes,
	type GroupData,
	type PaletteData
} from './storage';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('loadPalettes', () => {
	it('does not read browser storage during server-side rendering', () => {
		expect(loadPalettes()).toEqual([]);
	});
});

describe('savePalettes', () => {
	it('stores the palette model as JSON', () => {
		const setItem = vi.fn();
		vi.stubGlobal('localStorage', { setItem });
		const palettes: PaletteData[] = [
			{
				id: 1,
				name: 'Brand',
				groups: [{ id: 1, name: 'brand', colors: [{ id: 1, name: 'primary', hex: '#907aa9' }] }],
				variants: [
					{
						id: 1,
						name: 'Light',
						groups: {
							1: {
								lightnessMax: 0.95,
								lightnessMin: 0.16,
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

		savePalettes(palettes);

		expect(setItem).toHaveBeenCalledWith('kiniro-palettes', JSON.stringify(palettes));
	});
});

describe('parsePalettesJson', () => {
	it('parses the new palette shape', () => {
		const palettes: PaletteData[] = [
			{
				id: 1,
				name: 'Brand',
				groups: [{ id: 1, name: 'brand', colors: [{ id: 1, name: 'primary', hex: '#907aa9' }] }],
				variants: [
					{
						id: 1,
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

		expect(parsePalettesJson(JSON.stringify(palettes))).toEqual(palettes);
	});

	it('migrates older palette group files', () => {
		const groups: GroupData[] = [
			{
				id: 1,
				name: 'legacy',
				lightnessMax: 0.9,
				lightnessMin: 0.1,
				controlledLightness: {},
				reversed: false,
				stepsCount: 9,
				halfStepBefore: false,
				halfStepAfter: false,
				colors: [{ id: 1, name: 'primary', hex: '#907aa9' }]
			}
		];

		const parsed = parsePalettesJson(JSON.stringify(groups));

		expect(parsed?.[0]).toMatchObject({
			id: 1,
			name: 'Palette',
			groups: [{ id: 1, name: 'legacy', colors: [{ id: 1, name: 'primary', hex: '#907aa9' }] }]
		});
		expect(parsed?.[0].variants[0].groups[1]).toMatchObject({
			lightnessMax: 0.9,
			lightnessMin: 0.1,
			stepsCount: 9
		});
	});

	it('applies legacy schema defaults for older group files', () => {
		const parsed = parsePalettesJson(
			JSON.stringify([
				{
					id: 1,
					name: 'legacy',
					lightnessMax: 0.9,
					lightnessMin: 0.1,
					colors: [{ id: 1, name: 'primary', hex: '#907aa9' }]
				}
			])
		);

		expect(parsed?.[0].variants[0].groups[1]).toMatchObject({
			controlledLightness: {},
			reversed: false,
			stepsCount: 9,
			halfStepBefore: false,
			halfStepAfter: false
		});
	});

	it('normalizes palette files that are missing variants', () => {
		const parsed = parsePalettesJson(
			JSON.stringify([
				{
					id: 1,
					name: 'Brand',
					groups: [{ id: 1, name: 'brand', colors: [] }],
					variants: []
				}
			])
		);

		expect(parsed?.[0].variants[0]).toMatchObject({ id: 1, name: 'Default' });
		expect(parsed?.[0].variants[0].groups[1]).toMatchObject({
			lightnessMax: 0.95,
			lightnessMin: 0.16
		});
	});

	it('rejects invalid JSON and invalid palette shape', () => {
		expect(parsePalettesJson('not-json')).toBeNull();
		expect(parsePalettesJson(JSON.stringify([{ id: 'bad' }]))).toBeNull();
	});
});
