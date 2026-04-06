import Color from 'colorjs.io';
import type { GroupData } from './storage';

function computeSteps(group: GroupData): number[] {
	const { stepsCount = 9, halfStepBefore = false, halfStepAfter = false } = group;
	const arr: number[] = [];
	if (halfStepBefore) arr.push(50);
	for (let k = 1; k <= stepsCount; k++) arr.push(k * 100);
	if (halfStepAfter) arr.push(stepsCount * 100 + 50);
	return arr;
}

function computeLightness(group: GroupData, steps: number[]): number[] {
	const { lightnessMax, lightnessMin, reversed = false, stepsCount = 9, halfStepBefore = false, halfStepAfter = false } = group;
	const totalSteps = stepsCount - 1 + 0.5 * (halfStepBefore ? 1 : 0) + 0.5 * (halfStepAfter ? 1 : 0);
	const stepSize = (lightnessMax - lightnessMin) / totalSteps;
	const arr = steps.map((step) => {
		let pos: number;
		if (step === 50) {
			pos = 0;
		} else if (step === stepsCount * 100 + 50) {
			pos = totalSteps;
		} else {
			const k = step / 100;
			pos = halfStepBefore ? k - 0.5 : k - 1;
		}
		return lightnessMax - pos * stepSize;
	});
	return reversed ? [...arr].reverse() : arr;
}

export function generateCssVariables(groups: GroupData[], prefix: string): string {
	const lines: string[] = [
		'/* Usage: color: oklch(var(--your-var) / 0.5); */',
		':root {'
	];

	for (const group of groups) {
		lines.push(`  /* ${group.name} */`);

		const steps = computeSteps(group);
		const lightness = computeLightness(group, steps);

		for (const color of group.colors) {
			try {
				const oklch = new Color(color.hex).to('oklch');
				const [, c, h] = oklch.coords;
				const C = c == null || isNaN(c) ? 0 : c;
				const H = h == null || isNaN(h) ? 0 : h;

				for (let i = 0; i < steps.length; i++) {
					const L = lightness[i];
					lines.push(
						`  --${prefix}${color.name}-${steps[i]}: ${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)};`
					);
				}
			} catch {
				// skip invalid colors
			}
		}

		lines.push('');
	}

	lines.push('}');
	return lines.join('\n');
}
