import { nanoid } from 'nanoid';
import type { z } from 'zod';
import { clone } from './clone';
import type {
	appStateSchema,
	colorFamilyStructureSchema,
	colorFamilyValuesSchema,
	colorRampStructureSchema,
	colorRampValuesSchema,
	gamutPreviewSchema,
	gamutSchema,
	idSchema,
	oklchChannelSchema,
	oklchColorSchema,
	sourceColorFormatSchema,
	sourceColorSchema,
	stepIndexStyleSchema,
	stepScaleStructureSchema,
	stepScaleValuesSchema,
	swatchChannelOverridesSchema,
	themeSchema,
	themeStructureSchema,
	themeVariantSchema,
	variantValuesSchema,
	workspaceTabSchema
} from './schemas';

export type Id = z.infer<typeof idSchema>;

export type WorkspaceTab = z.infer<typeof workspaceTabSchema>;
export type Gamut = z.infer<typeof gamutSchema>;
export type GamutPreview = z.infer<typeof gamutPreviewSchema>;
export type StepIndexStyle = z.infer<typeof stepIndexStyleSchema>;
export type SourceColorFormat = z.infer<typeof sourceColorFormatSchema>;
export type OklchChannel = z.infer<typeof oklchChannelSchema>;

export type OklchColor = z.infer<typeof oklchColorSchema>;
export type SourceColor = z.infer<typeof sourceColorSchema>;
export type SwatchChannelOverrides = z.infer<typeof swatchChannelOverridesSchema>;
export type StepScaleStructure = z.infer<typeof stepScaleStructureSchema>;
export type StepScaleValues = z.infer<typeof stepScaleValuesSchema>;
export type ColorRampStructure = z.infer<typeof colorRampStructureSchema>;
export type ColorRampValues = z.infer<typeof colorRampValuesSchema>;
export type ColorFamilyStructure = z.infer<typeof colorFamilyStructureSchema>;
export type ColorFamilyValues = z.infer<typeof colorFamilyValuesSchema>;
export type ThemeStructure = z.infer<typeof themeStructureSchema>;
export type VariantValues = z.infer<typeof variantValuesSchema>;
export type ThemeVariant = z.infer<typeof themeVariantSchema>;
export type Theme = z.infer<typeof themeSchema>;
export type AppState = z.infer<typeof appStateSchema>;

export type DefaultThemeOptions = {
	name?: string;
	variantName?: string;
	familyName?: string;
};

const DEFAULT_SOURCE_COLOR: SourceColor = {
	format: 'oklch',
	oklch: { lightness: 0.7, chroma: 0.1, hue: 0 },
	serialized: 'oklch(0.7 0.1 0)'
};

// The app model stores user-authored data only. Shared structure lives on the
// theme, while each variant owns only color and lightness values for that structure.
export function createEmptyAppState(): AppState {
	return { themes: [] };
}

// Creates the starter theme described by the prototype: one variant, one empty
// family with a 9-step scale, and no generated palette data.
export function createDefaultTheme(options: DefaultThemeOptions = {}): Theme {
	const family = createColorFamily({ name: options.familyName });
	const structure: ThemeStructure = { families: [family] };

	return {
		id: generateId(),
		name: options.name ?? 'Theme 1',
		cssPrefix: 'color',
		targetGamut: 'srgb',
		structure,
		variants: [
			createThemeVariant(structure, {
				name: options.variantName ?? 'default'
			})
		]
	};
}

export function createColorFamily(options: { name?: string } = {}): ColorFamilyStructure {
	return {
		id: generateId(),
		name: options.name ?? 'Family 1',
		stepScale: createDefaultStepScaleStructure(),
		ramps: []
	};
}

export function createColorRamp(options: { name?: string } = {}): ColorRampStructure {
	return {
		id: generateId(),
		name: options.name ?? 'Ramp'
	};
}

export function createDefaultStepScaleStructure(): StepScaleStructure {
	return {
		stepCount: 9,
		indexStyle: 'scale',
		halfStepStart: false,
		halfStepEnd: false
	};
}

export function createDefaultStepScaleValues(): StepScaleValues {
	return {
		lightnessStart: 0.95,
		lightnessEnd: 0.05,
		lightnessOverrides: {},
		reversed: false
	};
}

export function createDefaultRampValues(
	sourceColor: SourceColor = DEFAULT_SOURCE_COLOR
): ColorRampValues {
	return {
		sourceColor: clone(sourceColor),
		swatchOverrides: {}
	};
}

export function createThemeVariant(
	structure: ThemeStructure,
	options: { name?: string; values?: Partial<VariantValues> } = {}
): ThemeVariant {
	return {
		id: generateId(),
		name: options.name ?? 'default',
		values: createVariantValues(structure, options.values)
	};
}

// Builds variant-owned values for every shared family and ramp, preserving supplied
// values only when their IDs still exist in the theme structure.
export function createVariantValues(
	structure: ThemeStructure,
	values: Partial<VariantValues> = {}
): VariantValues {
	const families: Record<Id, ColorFamilyValues> = {};

	for (const family of structure.families) {
		const existingFamily = values.families?.[family.id];
		const ramps: Record<Id, ColorRampValues> = {};

		for (const ramp of family.ramps) {
			ramps[ramp.id] = existingFamily?.ramps[ramp.id]
				? clone(existingFamily.ramps[ramp.id])
				: createDefaultRampValues();
		}

		families[family.id] = {
			stepScale: existingFamily?.stepScale
				? clone(existingFamily.stepScale)
				: createDefaultStepScaleValues(),
			ramps
		};
	}

	return { families };
}

// Realigns all variants with the theme's shared structure after imports or structural edits.
export function syncThemeVariantValues(theme: Theme): Theme {
	return {
		...theme,
		targetGamut: theme.targetGamut === 'p3' ? 'p3' : 'srgb',
		structure: clone(theme.structure),
		variants: theme.variants.map((variant) => ({
			...variant,
			values: createVariantValues(theme.structure, variant.values)
		}))
	};
}

export function generateId(): Id {
	return nanoid();
}
