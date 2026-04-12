export type LightnessGroup = {
	lightnessMax: number;
	lightnessMin: number;
	reversed?: boolean;
	stepsCount?: number;
	halfStepBefore?: boolean;
	halfStepAfter?: boolean;
	controlledLightness?: Record<number, number>;
};

type StepAnchor = {
	index: number;
	position: number;
	value: number;
};

export function computeSteps(
	group: Pick<LightnessGroup, 'stepsCount' | 'halfStepBefore' | 'halfStepAfter'>
): number[] {
	const { stepsCount = 9, halfStepBefore = false, halfStepAfter = false } = group;
	const steps: number[] = [];
	if (halfStepBefore) steps.push(50);
	for (let k = 1; k <= stepsCount; k++) steps.push(k * 100);
	if (halfStepAfter) steps.push(stepsCount * 100 + 50);
	return steps;
}

function stepPosition(
	step: number,
	group: Pick<LightnessGroup, 'stepsCount' | 'halfStepBefore' | 'halfStepAfter'>
): number {
	const { stepsCount = 9, halfStepBefore = false } = group;
	if (step === 50) return 0;
	if (step === stepsCount * 100 + 50) {
		return stepsCount - 1 + 0.5 * (halfStepBefore ? 1 : 0) + 0.5;
	}

	const k = step / 100;
	return halfStepBefore ? k - 0.5 : k - 1;
}

export function cleanControlledLightness(
	controlledLightness: Record<number, number> | undefined,
	steps: number[]
): Record<number, number> {
	if (!controlledLightness || steps.length < 3) return {};

	const editableSteps = new Set(steps.slice(1, -1));
	const cleaned: Record<number, number> = {};

	for (const [key, value] of Object.entries(controlledLightness)) {
		const step = Number(key);
		if (editableSteps.has(step) && Number.isFinite(value)) {
			cleaned[step] = value;
		}
	}

	return cleaned;
}

export function computeLightness(group: LightnessGroup, steps = computeSteps(group)): number[] {
	const { lightnessMax, lightnessMin, reversed = false } = group;
	const controlledLightness = cleanControlledLightness(group.controlledLightness, steps);

	if (steps.length === 0) return [];
	if (steps.length === 1) return [lightnessMax];

	const positions = steps.map((step) => stepPosition(step, group));
	const anchors: StepAnchor[] = [
		{ index: 0, position: positions[0], value: lightnessMax },
		...steps.slice(1, -1).flatMap((step, offset) => {
			const value = controlledLightness[step];
			return value == null ? [] : [{ index: offset + 1, position: positions[offset + 1], value }];
		}),
		{
			index: steps.length - 1,
			position: positions[steps.length - 1],
			value: lightnessMin
		}
	];

	const lightness = new Array<number>(steps.length);

	for (let i = 0; i < anchors.length - 1; i++) {
		const left = anchors[i];
		const right = anchors[i + 1];
		const span = right.position - left.position;

		for (let index = left.index; index <= right.index; index++) {
			const ratio = span === 0 ? 0 : (positions[index] - left.position) / span;
			lightness[index] = left.value + (right.value - left.value) * ratio;
		}
	}

	return reversed ? [...lightness].reverse() : lightness;
}
