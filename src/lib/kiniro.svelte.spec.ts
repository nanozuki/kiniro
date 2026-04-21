import { describe, expect, it } from 'vitest';
import { Kiniro } from './kiniro.svelte';
import { createDefaultPalette } from './palette';

describe('Kiniro', () => {
	it('initializes active palette and variant IDs', () => {
		const kiniro = new Kiniro([createDefaultPalette(4, 'Brand')]);

		expect(kiniro.activePalette?.name).toBe('Brand');
		expect(kiniro.activeVariant?.name).toBe('Default');
		expect(kiniro.activeGroups).toHaveLength(1);
	});

	it('keeps variants synchronized when groups are added and deleted', () => {
		const kiniro = new Kiniro([createDefaultPalette()]);
		kiniro.addVariant();
		const variantIds = kiniro.activePalette?.variants.map((variant) => variant.id) ?? [];

		kiniro.addGroup();
		const groupId = kiniro.activePalette?.groups.at(-1)?.id;

		expect(groupId).toBeDefined();
		for (const variantId of variantIds) {
			expect(kiniro.activePalette?.variants.find((variant) => variant.id === variantId)?.groups[groupId!])
				.toBeDefined();
		}

		kiniro.deleteGroup(groupId!);

		for (const variantId of variantIds) {
			expect(kiniro.activePalette?.variants.find((variant) => variant.id === variantId)?.groups[groupId!])
				.toBeUndefined();
		}
	});

	it('shares group and color data across variants while keeping lightness variant-specific', () => {
		const kiniro = new Kiniro([createDefaultPalette()]);
		const palette = kiniro.activePalette!;
		const groupId = palette.groups[0].id;
		const colorId = palette.groups[0].colors[0].id;

		kiniro.addVariant();
		const darkVariantId = kiniro.activeVariantId!;
		kiniro.updateColor(groupId, colorId, { name: 'accent', hex: '#000000' });
		kiniro.updateGroupLightness(groupId, { reversed: true, lightnessMin: 0.05 });

		kiniro.activeVariantId = 1;
		expect(kiniro.activeGroups[0].colors[0]).toMatchObject({ name: 'accent', hex: '#000000' });
		expect(kiniro.activeGroups[0].reversed).toBe(false);

		kiniro.activeVariantId = darkVariantId;
		expect(kiniro.activeGroups[0].colors[0]).toMatchObject({ name: 'accent', hex: '#000000' });
		expect(kiniro.activeGroups[0]).toMatchObject({ reversed: true, lightnessMin: 0.05 });
	});

	it('keeps a valid active selection after deleting active records', () => {
		const kiniro = new Kiniro([createDefaultPalette()]);
		kiniro.addPalette();
		const secondPaletteId = kiniro.activePaletteId!;

		kiniro.deletePalette(secondPaletteId);

		expect(kiniro.activePaletteId).toBe(1);
		expect(kiniro.activeVariantId).toBe(1);
	});
});
