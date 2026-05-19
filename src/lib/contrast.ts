import { getPreviewColor } from './color';
import type { GamutPreview, OklchColor } from './model';
import type { GeneratedColorRamp, GeneratedSwatch, GeneratedVariantPalette } from './palette';

export type ContrastTarget = {
	familyId: string;
	rampId: string;
	rampName: string;
	stepIndex: string;
	label: string;
	color: OklchColor;
};

export type ContrastDefaults = {
	foreground: ContrastTarget;
	background: ContrastTarget;
};

export type ContrastCheck = {
	contentType: 'Body Text' | 'Large Text' | 'UI and Graphics';
	minimumAA: ContrastPassResult;
	enhancedAAA: ContrastPassResult | null;
};

export type ContrastPassResult = {
	threshold: number;
	passed: boolean;
	label: 'Pass' | 'Fail';
};

export type ContrastResult = {
	ratio: number;
	formattedRatio: string;
	checks: ContrastCheck[];
};

// Contrast helpers use clamped preview colors because the checker reports the
// contrast users actually see in the selected preview gamut.
export function calculateContrastRatio(
	foreground: OklchColor,
	background: OklchColor,
	gamut: GamutPreview
): number {
	const foregroundLuminance = relativeLuminance(toDisplayedSrgb(foreground, gamut));
	const backgroundLuminance = relativeLuminance(toDisplayedSrgb(background, gamut));
	const lighter = Math.max(foregroundLuminance, backgroundLuminance);
	const darker = Math.min(foregroundLuminance, backgroundLuminance);
	return (lighter + 0.05) / (darker + 0.05);
}

export function getContrastResult(
	foreground: OklchColor,
	background: OklchColor,
	gamut: GamutPreview
): ContrastResult {
	const ratio = calculateContrastRatio(foreground, background, gamut);
	return {
		ratio,
		formattedRatio: `${floorTo(ratio, 2).toFixed(2)}:1`,
		checks: [
			{
				contentType: 'Body Text',
				minimumAA: passFail(ratio, 4.5),
				enhancedAAA: passFail(ratio, 7)
			},
			{
				contentType: 'Large Text',
				minimumAA: passFail(ratio, 3),
				enhancedAAA: passFail(ratio, 4.5)
			},
			{
				contentType: 'UI and Graphics',
				minimumAA: passFail(ratio, 3),
				enhancedAAA: null
			}
		]
	};
}

export function getContrastTargets(palette: GeneratedVariantPalette): ContrastTarget[] {
	return palette.families.flatMap((family) =>
		family.ramps.flatMap((ramp) =>
			ramp.swatches.map((swatch) => targetFromSwatch(family.id, ramp, swatch))
		)
	);
}

export function getDefaultContrastTargets(
	palette: GeneratedVariantPalette
): ContrastDefaults | null {
	const ramps = palette.families.flatMap((family) =>
		family.ramps
			.map((ramp) => ({ familyId: family.id, ramp }))
			.filter(({ ramp }) => ramp.swatches.length > 0)
	);
	if (ramps.length === 0) return null;

	const foregroundRamp = ramps[0];
	const backgroundRamp = ramps[1] ?? ramps[0];
	const foregroundSwatch =
		foregroundRamp.ramp.swatches[Math.min(1, foregroundRamp.ramp.swatches.length - 1)];
	const backgroundSwatch =
		backgroundRamp.ramp.swatches[Math.max(0, backgroundRamp.ramp.swatches.length - 2)];

	return {
		foreground: targetFromSwatch(foregroundRamp.familyId, foregroundRamp.ramp, foregroundSwatch),
		background: targetFromSwatch(backgroundRamp.familyId, backgroundRamp.ramp, backgroundSwatch)
	};
}

function targetFromSwatch(
	familyId: string,
	ramp: GeneratedColorRamp,
	swatch: GeneratedSwatch
): ContrastTarget {
	return {
		familyId,
		rampId: ramp.id,
		rampName: ramp.name,
		stepIndex: swatch.stepIndex,
		label: `${ramp.name} ${swatch.stepIndex}`,
		color: swatch.oklch
	};
}

function passFail(ratio: number, threshold: number): ContrastPassResult {
	const passed = ratio >= threshold;
	return { threshold, passed, label: passed ? 'Pass' : 'Fail' };
}

function toDisplayedSrgb(oklch: OklchColor, gamut: GamutPreview): [number, number, number] {
	const coords = getPreviewColor(oklch, gamut).color.to('srgb').coords;
	return [clamp01(coords[0] ?? 0), clamp01(coords[1] ?? 0), clamp01(coords[2] ?? 0)];
}

function relativeLuminance([red, green, blue]: [number, number, number]): number {
	const [r, g, b] = [red, green, blue].map(linearizeSrgb);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function linearizeSrgb(value: number): number {
	return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function clamp01(value: number): number {
	return Math.min(1, Math.max(0, value));
}

function floorTo(value: number, digits: number): number {
	const scale = 10 ** digits;
	return Math.floor((value + Number.EPSILON) * scale) / scale;
}
