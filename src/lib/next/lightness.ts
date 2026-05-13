import type { StepIndexStyle, StepScaleStructure, StepScaleValues, SwatchChannelOverrides } from './model';

export type Step = {
	index: string;
	lightness: number;
	controlled: boolean;
};

type StepAnchor = {
	arrayIndex: number;
	position: number;
	value: number;
};

// Step-scale helpers keep label generation, controlled-lightness interpolation,
// and index remapping in one place so UI and state operations share the same rules.
export function getStepIndexes(structure: StepScaleStructure): string[] {
	if (structure.indexStyle === 'ordinal') {
		return Array.from({ length: structure.stepCount }, (_, index) => String(index + 1));
	}

	const indexes: string[] = [];
	if (structure.halfStepStart) indexes.push('50');
	for (let step = 1; step <= structure.stepCount; step++) indexes.push(String(step * 100));
	if (structure.halfStepEnd) indexes.push(String(structure.stepCount * 100 + 50));
	return indexes;
}

export function computeStepLightness(structure: StepScaleStructure, values: StepScaleValues): number[] {
	const indexes = getStepIndexes(structure);
	if (indexes.length === 0) return [];
	if (indexes.length === 1) return [values.lightnessStart];

	const cleanOverrides = cleanLightnessOverrides(values.lightnessOverrides, indexes);
	const positions = indexes.map((index) => stepPosition(index, structure));
	const anchors: StepAnchor[] = [
		{ arrayIndex: 0, position: positions[0], value: values.lightnessStart },
		...indexes.slice(1, -1).flatMap((index, offset) => {
			const value = cleanOverrides[index];
			return value == null ? [] : [{ arrayIndex: offset + 1, position: positions[offset + 1], value }];
		}),
		{ arrayIndex: indexes.length - 1, position: positions[indexes.length - 1], value: values.lightnessEnd }
	];
	const lightness = new Array<number>(indexes.length);

	for (let anchorIndex = 0; anchorIndex < anchors.length - 1; anchorIndex++) {
		const left = anchors[anchorIndex];
		const right = anchors[anchorIndex + 1];
		const span = right.position - left.position;

		for (let index = left.arrayIndex; index <= right.arrayIndex; index++) {
			const ratio = span === 0 ? 0 : (positions[index] - left.position) / span;
			lightness[index] = left.value + (right.value - left.value) * ratio;
		}
	}

	return values.reversed ? [...lightness].reverse() : lightness;
}

export function buildSteps(structure: StepScaleStructure, values: StepScaleValues): Step[] {
	const indexes = getStepIndexes(structure);
	const lightness = computeStepLightness(structure, values);
	const cleanOverrides = cleanLightnessOverrides(values.lightnessOverrides, indexes);

	return indexes.map((index, arrayIndex) => ({
		index,
		lightness: lightness[arrayIndex],
		controlled: arrayIndex === 0 || arrayIndex === indexes.length - 1 || cleanOverrides[index] != null
	}));
}

export function cleanLightnessOverrides(
	overrides: Record<string, number> | undefined,
	indexes: readonly string[]
): Record<string, number> {
	if (!overrides || indexes.length < 3) return {};

	const intermediateIndexes = new Set(indexes.slice(1, -1));
	const clean: Record<string, number> = {};

	for (const [index, value] of Object.entries(overrides)) {
		if (intermediateIndexes.has(index) && Number.isFinite(value)) clean[index] = value;
	}

	return clean;
}

export function mapLightnessOverridesForIndexStyle(
	from: StepScaleStructure,
	to: StepScaleStructure,
	overrides: Record<string, number>
): Record<string, number> {
	const fromIndexes = getStepIndexes(from);
	const toIndexes = getStepIndexes(to);
	const mapped: Record<string, number> = {};

	for (const [index, value] of Object.entries(cleanLightnessOverrides(overrides, fromIndexes))) {
		const regularPosition = regularStepPosition(index, from);
		if (regularPosition == null) continue;
		const mappedIndex = regularStepIndexAtPosition(regularPosition, to);
		if (mappedIndex && toIndexes.includes(mappedIndex)) mapped[mappedIndex] = value;
	}

	return mapped;
}

export function createIndexStyleStructure(
	structure: StepScaleStructure,
	indexStyle: StepIndexStyle
): StepScaleStructure {
	return indexStyle === 'ordinal'
		? { ...structure, indexStyle, halfStepStart: false, halfStepEnd: false }
		: { ...structure, indexStyle };
}

export function mapOverridesToReversedIndexes<T>(
	structure: StepScaleStructure,
	overrides: Record<string, T>
): Record<string, T> {
	const indexes = getStepIndexes(structure);
	const reversed = [...indexes].reverse();
	const mapped: Record<string, T> = {};

	for (const [index, value] of Object.entries(overrides)) {
		const position = indexes.indexOf(index);
		if (position >= 0) mapped[reversed[position]] = value;
	}

	return mapped;
}

export function reverseStepScaleValues(structure: StepScaleStructure, values: StepScaleValues): StepScaleValues {
	return {
		lightnessStart: values.lightnessEnd,
		lightnessEnd: values.lightnessStart,
		lightnessOverrides: cleanLightnessOverrides(
			mapOverridesToReversedIndexes(structure, values.lightnessOverrides),
			getStepIndexes(structure)
		),
		reversed: values.reversed
	};
}

export function reverseSwatchOverrides(
	structure: StepScaleStructure,
	overrides: Record<string, SwatchChannelOverrides>
): Record<string, SwatchChannelOverrides> {
	return mapOverridesToReversedIndexes(structure, overrides);
}

function stepPosition(index: string, structure: StepScaleStructure): number {
	if (structure.indexStyle === 'ordinal') return Number(index) - 1;

	const numericIndex = Number(index);
	if (numericIndex === 50) return 0;
	if (numericIndex === structure.stepCount * 100 + 50) {
		return structure.stepCount - 1 + (structure.halfStepStart ? 0.5 : 0) + 0.5;
	}

	const regularPosition = numericIndex / 100 - 1;
	return structure.halfStepStart ? regularPosition + 0.5 : regularPosition;
}

function regularStepPosition(index: string, structure: StepScaleStructure): number | null {
	const numericIndex = Number(index);
	if (structure.indexStyle === 'ordinal') return numericIndex >= 1 && numericIndex <= structure.stepCount ? numericIndex - 1 : null;
	if (numericIndex % 100 !== 0) return null;
	const position = numericIndex / 100 - 1;
	return position >= 0 && position < structure.stepCount ? position : null;
}

function regularStepIndexAtPosition(position: number, structure: StepScaleStructure): string | null {
	if (position < 0 || position >= structure.stepCount) return null;
	return structure.indexStyle === 'ordinal' ? String(position + 1) : String((position + 1) * 100);
}
