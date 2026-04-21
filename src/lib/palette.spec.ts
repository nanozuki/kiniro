import { describe, expect, it } from 'vitest';
import {
	buildVariantGroups,
	createDefaultPalette,
	createDefaultVariant,
	migrateGroupsToPalettes,
	syncVariantGroups,
	type GroupData,
	type PaletteData
} from './palette';

describe('createDefaultPalette', () => {
	it('creates one palette with shared groups and one initialized variant', () => {
		const palette = createDefaultPalette(7, 'Brand');

		expect(palette.id).toBe(7);
		expect(palette.name).toBe('Brand');
		expect(palette.groups).toHaveLength(1);
		expect(palette.variants).toHaveLength(1);
		expect(palette.variants[0].groups[palette.groups[0].id]).toMatchObject({
			lightnessMax: 0.95,
			lightnessMin: 0.16
		});
	});
});

describe('createDefaultVariant', () => {
	it('creates lightness settings for every supplied group', () => {
		const variant = createDefaultVariant(
			[
				{ id: 2, name: 'brand', colors: [] },
				{ id: 4, name: 'neutral', colors: [] }
			],
			3,
			'Dark'
		);

		expect(variant).toMatchObject({ id: 3, name: 'Dark' });
		expect(Object.keys(variant.groups)).toEqual(['2', '4']);
	});
});

describe('buildVariantGroups', () => {
	it('merges palette-level groups with variant-owned lightness settings', () => {
		const palette: PaletteData = {
			id: 1,
			name: 'Brand',
			groups: [
				{
					id: 10,
					name: 'accent',
					colors: [{ id: 1, name: 'primary', hex: '#907aa9' }]
				}
			],
			variants: [
				{
					id: 1,
					name: 'Dark',
					groups: {
						10: {
							lightnessMax: 0.8,
							lightnessMin: 0.12,
							controlledLightness: { 200: 0.7 },
							reversed: true,
							stepsCount: 3,
							halfStepBefore: false,
							halfStepAfter: true
						}
					}
				}
			]
		};

		expect(buildVariantGroups(palette, palette.variants[0])).toEqual([
			{
				id: 10,
				name: 'accent',
				colors: [{ id: 1, name: 'primary', hex: '#907aa9' }],
				lightnessMax: 0.8,
				lightnessMin: 0.12,
				controlledLightness: { 200: 0.7 },
				reversed: true,
				stepsCount: 3,
				halfStepBefore: false,
				halfStepAfter: true
			}
		]);
	});
});

describe('syncVariantGroups', () => {
	it('adds missing settings and removes stale settings for every variant', () => {
		const synced = syncVariantGroups({
			id: 1,
			name: 'Brand',
			groups: [{ id: 2, name: 'brand', colors: [] }],
			variants: [
				{
					id: 1,
					name: 'Light',
					groups: {
						99: {
							lightnessMax: 0.1,
							lightnessMin: 0.2,
							controlledLightness: {},
							reversed: false,
							stepsCount: 3,
							halfStepBefore: false,
							halfStepAfter: false
						}
					}
				}
			]
		});

		expect(synced.variants[0].groups[2]).toMatchObject({
			lightnessMax: 0.95,
			lightnessMin: 0.16
		});
		expect(synced.variants[0].groups[99]).toBeUndefined();
	});
});

describe('migrateGroupsToPalettes', () => {
	it('preserves legacy groups as shared structure and variant lightness settings', () => {
		const groups: GroupData[] = [
			{
				id: 5,
				name: 'legacy',
				lightnessMax: 0.9,
				lightnessMin: 0.2,
				controlledLightness: { 200: 0.65 },
				reversed: true,
				stepsCount: 3,
				halfStepBefore: true,
				halfStepAfter: false,
				colors: [{ id: 1, name: 'primary', hex: '#907aa9' }]
			}
		];

		const [palette] = migrateGroupsToPalettes(groups);

		expect(palette.groups).toEqual([
			{ id: 5, name: 'legacy', colors: [{ id: 1, name: 'primary', hex: '#907aa9' }] }
		]);
		expect(palette.variants[0].groups[5]).toMatchObject({
			lightnessMax: 0.9,
			lightnessMin: 0.2,
			controlledLightness: { 200: 0.65 },
			reversed: true
		});
	});
});
