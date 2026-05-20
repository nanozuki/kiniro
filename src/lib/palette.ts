import { getRelativeChroma, getRelativeChromaRatio } from './color';
import { buildSteps } from './lightness';
import type {
	ColorFamilyStructure,
	ColorRampStructure,
	ColorRampValues,
	Gamut,
	OklchColor,
	SwatchChannelOverrides,
	Theme,
	ThemeVariant
} from './model';

export type GeneratedStep = {
	index: string;
	lightness: number;
	controlled: boolean;
};

export type GeneratedSwatch = {
	stepIndex: string;
	name: string;
	oklch: OklchColor;
	generated: OklchColor;
	overrides: SwatchChannelOverrides;
};

export type GeneratedColorRamp = {
	id: string;
	name: string;
	sourceColor: OklchColor;
	swatches: GeneratedSwatch[];
};

export type GeneratedColorFamily = {
	id: string;
	name: string;
	steps: GeneratedStep[];
	ramps: GeneratedColorRamp[];
};

export type GeneratedVariantPalette = {
	themeId: string;
	variantId: string;
	families: GeneratedColorFamily[];
};

// Generated palette values are derived at read time from shared structure and the
// selected variant's authored values. Callers should render or export these
// objects, not persist them back into App data.
export function generateVariantPalette(
	theme: Theme,
	variant: ThemeVariant
): GeneratedVariantPalette {
	return {
		themeId: theme.id,
		variantId: variant.id,
		families: theme.structure.families.map((family) =>
			generateFamily(family, variant, theme.targetGamut)
		)
	};
}

export function generateFamily(
	family: ColorFamilyStructure,
	variant: ThemeVariant,
	gamut: Gamut
): GeneratedColorFamily {
	const familyValues = variant.values.families[family.id];
	const steps = familyValues ? buildSteps(family.stepScale, familyValues.stepScale) : [];

	return {
		id: family.id,
		name: family.name,
		steps,
		ramps: family.ramps.map((ramp) =>
			generateRamp(ramp, familyValues?.ramps[ramp.id], steps, gamut)
		)
	};
}

export function generateRamp(
	ramp: ColorRampStructure,
	values: ColorRampValues | undefined,
	steps: readonly GeneratedStep[],
	gamut: Gamut
): GeneratedColorRamp {
	const sourceColor = values?.sourceColor.oklch ?? { lightness: 0.7, chroma: 0.1, hue: 0 };
	const chromaRatio = getRelativeChromaRatio(sourceColor, gamut);

	return {
		id: ramp.id,
		name: ramp.name,
		sourceColor,
		swatches: steps.map((step) =>
			generateSwatch(
				ramp.name,
				step,
				sourceColor,
				chromaRatio,
				gamut,
				values?.swatchOverrides[step.index]
			)
		)
	};
}

export function generateSwatch(
	rampName: string,
	step: GeneratedStep,
	sourceColor: OklchColor,
	chromaRatio: number,
	gamut: Gamut,
	overrides: SwatchChannelOverrides = {}
): GeneratedSwatch {
	const generated: OklchColor = {
		lightness: step.lightness,
		chroma: getRelativeChroma(step.lightness, sourceColor.hue, chromaRatio, gamut),
		hue: sourceColor.hue
	};

	return {
		stepIndex: step.index,
		name: `${rampName}-${step.index}`,
		generated,
		overrides: { ...overrides },
		oklch: {
			lightness: overrides.lightness ?? generated.lightness,
			chroma: overrides.chroma ?? generated.chroma,
			hue: overrides.hue ?? generated.hue
		}
	};
}
