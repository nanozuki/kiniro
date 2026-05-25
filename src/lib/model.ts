import { nanoid } from 'nanoid';
import { clone } from './clone';

export type Id = string;

export type WorkspaceTab = 'palette' | 'cssVariables' | 'contrastChecker';
export type Gamut = 'srgb' | 'p3';
export type GamutPreview = Gamut;
export type StepIndexStyle = 'scale' | 'ordinal';
export type SourceColorFormat = 'oklch' | 'hex' | 'rgb' | 'hsl';
export type OklchChannel = 'lightness' | 'chroma' | 'hue';

export type OklchColor = {
	lightness: number;
	chroma: number;
	hue: number;
};

export type SourceColor = {
	format: SourceColorFormat;
	oklch: OklchColor;
	serialized: string;
};

export type SwatchChannelOverrides = Partial<Record<OklchChannel, number>>;

export type StepScaleStructure = {
	stepCount: number;
	indexStyle: StepIndexStyle;
	halfStepStart: boolean;
	halfStepEnd: boolean;
};

export type StepScaleValues = {
	lightnessStart: number;
	lightnessEnd: number;
	lightnessOverrides: Record<string, number>;
	reversed: boolean;
};

export type ColorRampStructure = {
	id: Id;
	name: string;
};

export type ColorRampValues = {
	sourceColor: SourceColor;
	swatchOverrides: Record<string, SwatchChannelOverrides>;
};

export type ColorFamilyStructure = {
	id: Id;
	name: string;
	stepScale: StepScaleStructure;
	ramps: ColorRampStructure[];
};

export type ColorFamilyValues = {
	stepScale: StepScaleValues;
	ramps: Record<Id, ColorRampValues>;
};

export type ThemeStructure = {
	families: ColorFamilyStructure[];
};

export type VariantValues = {
	families: Record<Id, ColorFamilyValues>;
};

export type ThemeVariant = {
	id: Id;
	name: string;
	values: VariantValues;
};

export type Theme = {
	id: Id;
	name: string;
	cssPrefix: string;
	targetGamut: Gamut;
	structure: ThemeStructure;
	variants: ThemeVariant[];
};

export type AppState = {
	themes: Theme[];
};

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

function generateId(): Id {
	return nanoid();
}
