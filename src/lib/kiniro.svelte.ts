import {
	buildVariantGroups,
	createDefaultLightnessSettings,
	createDefaultPalette,
	createDefaultVariant,
	syncVariantGroups,
	type ColorData,
	type GroupData,
	type GroupLightnessSettings,
	type PaletteData,
	type PaletteGroupData,
	type PaletteVariantData
} from './palette';

function nextId(items: { id: number }[]): number {
	return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function clonePalettes(palettes: PaletteData[]): PaletteData[] {
	return structuredClone(palettes);
}

// Kiniro owns the app's reactive palette state and enforces palette/variant invariants.
export class Kiniro {
	palettes = $state<PaletteData[]>([]);
	activePaletteId = $state<number | null>(null);
	activeVariantId = $state<number | null>(null);

	constructor(initialPalettes: PaletteData[]) {
		this.replaceAll(initialPalettes);
	}

	get activePalette(): PaletteData | null {
		return this.palettes.find((palette) => palette.id === this.activePaletteId) ?? null;
	}

	get activeVariant(): PaletteVariantData | null {
		const palette = this.activePalette;
		return palette?.variants.find((variant) => variant.id === this.activeVariantId) ?? null;
	}

	get activeGroups(): GroupData[] {
		const palette = this.activePalette;
		const variant = this.activeVariant;
		return palette && variant ? buildVariantGroups(palette, variant) : [];
	}

	addPalette(): void {
		const palette = createDefaultPalette(nextId(this.palettes), 'Palette');
		this.palettes.push(palette);
		this.activePaletteId = palette.id;
		this.activeVariantId = palette.variants[0]?.id ?? null;
	}

	deletePalette(id: number): void {
		if (this.palettes.length <= 1) return;
		this.palettes = this.palettes.filter((palette) => palette.id !== id);
		this.ensureActiveIds();
	}

	updatePalette(id: number, patch: Partial<Pick<PaletteData, 'name'>>): void {
		const palette = this.palettes.find((item) => item.id === id);
		if (!palette) return;
		Object.assign(palette, patch);
	}

	addVariant(paletteId = this.activePaletteId): void {
		const palette = this.findPalette(paletteId);
		if (!palette) return;
		const variant = createDefaultVariant(palette.groups, nextId(palette.variants), 'Variant');
		palette.variants.push(variant);
		this.activePaletteId = palette.id;
		this.activeVariantId = variant.id;
	}

	deleteVariant(variantId: number, paletteId = this.activePaletteId): void {
		const palette = this.findPalette(paletteId);
		if (!palette || palette.variants.length <= 1) return;
		palette.variants = palette.variants.filter((variant) => variant.id !== variantId);
		this.ensureActiveIds();
	}

	updateVariant(
		variantId: number,
		patch: Partial<Pick<PaletteVariantData, 'name'>>,
		paletteId = this.activePaletteId
	): void {
		const variant = this.findVariant(paletteId, variantId);
		if (!variant) return;
		Object.assign(variant, patch);
	}

	addGroup(paletteId = this.activePaletteId): void {
		const palette = this.findPalette(paletteId);
		if (!palette) return;
		const group: PaletteGroupData = {
			id: nextId(palette.groups),
			name: 'palette',
			colors: [{ id: 1, name: 'color', hex: '#907aa9' }]
		};
		palette.groups.push(group);
		for (const variant of palette.variants) {
			variant.groups[group.id] = createDefaultLightnessSettings();
		}
	}

	deleteGroup(groupId: number, paletteId = this.activePaletteId): void {
		const palette = this.findPalette(paletteId);
		if (!palette) return;
		palette.groups = palette.groups.filter((group) => group.id !== groupId);
		for (const variant of palette.variants) {
			delete variant.groups[groupId];
		}
	}

	updateGroup(
		groupId: number,
		patch: Partial<Pick<PaletteGroupData, 'name'>>,
		paletteId = this.activePaletteId
	): void {
		const group = this.findGroup(paletteId, groupId);
		if (!group) return;
		Object.assign(group, patch);
	}

	addColor(groupId: number, paletteId = this.activePaletteId): void {
		const group = this.findGroup(paletteId, groupId);
		if (!group) return;
		group.colors.push({ id: nextId(group.colors), name: 'color', hex: '#907aa9' });
	}

	deleteColor(groupId: number, colorId: number, paletteId = this.activePaletteId): void {
		const group = this.findGroup(paletteId, groupId);
		if (!group) return;
		group.colors = group.colors.filter((color) => color.id !== colorId);
	}

	updateColor(
		groupId: number,
		colorId: number,
		patch: Partial<Pick<ColorData, 'name' | 'hex'>>,
		paletteId = this.activePaletteId
	): void {
		const color = this.findColor(paletteId, groupId, colorId);
		if (!color) return;
		Object.assign(color, patch);
	}

	updateGroupLightness(
		groupId: number,
		patch: Partial<GroupLightnessSettings>,
		paletteId = this.activePaletteId,
		variantId = this.activeVariantId
	): void {
		const variant = this.findVariant(paletteId, variantId);
		if (!variant) return;
		variant.groups[groupId] = {
			...(variant.groups[groupId] ?? createDefaultLightnessSettings()),
			...patch
		};
	}

	snapshot(): PaletteData[] {
		return clonePalettes(this.palettes.map(syncVariantGroups));
	}

	replaceAll(palettes: PaletteData[]): void {
		this.palettes = clonePalettes(palettes.length > 0 ? palettes.map(syncVariantGroups) : [createDefaultPalette()]);
		this.activePaletteId = this.palettes[0]?.id ?? null;
		this.activeVariantId = this.palettes[0]?.variants[0]?.id ?? null;
	}

	private ensureActiveIds(): void {
		if (!this.activePalette || !this.activeVariant) {
			this.activePaletteId = this.palettes[0]?.id ?? null;
			this.activeVariantId = this.palettes[0]?.variants[0]?.id ?? null;
		}
	}

	private findPalette(paletteId: number | null): PaletteData | null {
		return this.palettes.find((palette) => palette.id === paletteId) ?? null;
	}

	private findVariant(paletteId: number | null, variantId: number | null): PaletteVariantData | null {
		const palette = this.findPalette(paletteId);
		return palette?.variants.find((variant) => variant.id === variantId) ?? null;
	}

	private findGroup(paletteId: number | null, groupId: number): PaletteGroupData | null {
		const palette = this.findPalette(paletteId);
		return palette?.groups.find((group) => group.id === groupId) ?? null;
	}

	private findColor(paletteId: number | null, groupId: number, colorId: number): ColorData | null {
		const group = this.findGroup(paletteId, groupId);
		return group?.colors.find((color) => color.id === colorId) ?? null;
	}
}
