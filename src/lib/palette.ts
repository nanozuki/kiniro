export type ColorData = {
	id: number;
	name: string;
	hex: string;
};

export type GroupLightnessSettings = {
	lightnessMax: number;
	lightnessMin: number;
	controlledLightness: Record<number, number>;
	reversed: boolean;
	stepsCount: number;
	halfStepBefore: boolean;
	halfStepAfter: boolean;
};

export type PaletteGroupData = {
	id: number;
	name: string;
	colors: ColorData[];
};

export type PaletteVariantData = {
	id: number;
	name: string;
	groups: Record<number, GroupLightnessSettings>;
};

export type PaletteData = {
	id: number;
	name: string;
	groups: PaletteGroupData[];
	variants: PaletteVariantData[];
};

export type GroupData = PaletteGroupData & GroupLightnessSettings;

// Creates the default lightness settings used when a variant receives a new group.
export function createDefaultLightnessSettings(
	overrides: Partial<GroupLightnessSettings> = {}
): GroupLightnessSettings {
	return {
		lightnessMax: 0.95,
		lightnessMin: 0.16,
		controlledLightness: {},
		reversed: false,
		stepsCount: 9,
		halfStepBefore: false,
		halfStepAfter: false,
		...overrides
	};
}

// Creates a starter palette with one variant, one group, and one seed color.
export function createDefaultPalette(id = 1, name = 'Palette'): PaletteData {
	const groups: PaletteGroupData[] = [
		{
			id: 1,
			name: 'palette',
			colors: [{ id: 1, name: 'primary', hex: '#907aa9' }]
		}
	];

	return {
		id,
		name,
		groups,
		variants: [createDefaultVariant(groups, 1, 'Default')]
	};
}

// Creates a variant with lightness settings for every shared palette group.
export function createDefaultVariant(
	groups: PaletteGroupData[],
	id = 1,
	name = 'Variant'
): PaletteVariantData {
	return {
		id,
		name,
		groups: Object.fromEntries(groups.map((group) => [group.id, createDefaultLightnessSettings()]))
	};
}

// Merges shared groups with one variant's lightness settings for rendering and exports.
export function buildVariantGroups(palette: PaletteData, variant: PaletteVariantData): GroupData[] {
	return palette.groups.map((group) => ({
		...group,
		...variant.groups[group.id],
		colors: group.colors.map((color) => ({ ...color }))
	}));
}

// Keeps variant group settings aligned with the palette's shared group structure.
export function syncVariantGroups(palette: PaletteData): PaletteData {
	const groupIds = new Set(palette.groups.map((group) => group.id));
	return {
		...palette,
		groups: palette.groups.map((group) => ({
			...group,
			colors: group.colors.map((color) => ({ ...color }))
		})),
		variants: palette.variants.map((variant) => {
			const groups: Record<number, GroupLightnessSettings> = {};
			for (const group of palette.groups) {
				groups[group.id] = variant.groups[group.id] ?? createDefaultLightnessSettings();
			}
			for (const [key, settings] of Object.entries(variant.groups)) {
				const groupId = Number(key);
				if (groupIds.has(groupId)) groups[groupId] = settings;
			}
			return { ...variant, groups };
		})
	};
}

// Converts legacy top-level groups into one palette with one default variant.
export function migrateGroupsToPalettes(groups: GroupData[]): PaletteData[] {
	const paletteGroups: PaletteGroupData[] = groups.map((group) => ({
		id: group.id,
		name: group.name,
		colors: group.colors.map((color) => ({ ...color }))
	}));

	const variantGroups = Object.fromEntries(
		groups.map((group) => [
			group.id,
			createDefaultLightnessSettings({
				lightnessMax: group.lightnessMax,
				lightnessMin: group.lightnessMin,
				controlledLightness: { ...group.controlledLightness },
				reversed: group.reversed,
				stepsCount: group.stepsCount,
				halfStepBefore: group.halfStepBefore,
				halfStepAfter: group.halfStepAfter
			})
		])
	);

	return [
		{
			id: 1,
			name: 'Palette',
			groups: paletteGroups,
			variants: [{ id: 1, name: 'Default', groups: variantGroups }]
		}
	];
}
