import { describe, expect, it } from 'vitest';
import { cleanControlledLightness, computeLightness, computeSteps } from './lightness';

describe('computeLightness', () => {
	it('interpolates piecewise between controlled lightness anchors', () => {
		const steps = [100, 200, 300, 400, 500];

		expect(
			computeLightness(
				{
					stepsCount: 5,
					lightnessMax: 0.95,
					lightnessMin: 0.15,
					controlledLightness: { 200: 0.8 }
				},
				steps
			).map((value) => Number(value.toFixed(3)))
		).toEqual([0.95, 0.8, 0.583, 0.367, 0.15]);
	});

	it('reverses the final lightness array after normal interpolation', () => {
		const steps = [100, 200, 300, 400, 500];

		expect(
			computeLightness(
				{
					stepsCount: 5,
					lightnessMax: 0.95,
					lightnessMin: 0.15,
					controlledLightness: { 200: 0.8 },
					reversed: true
				},
				steps
			).map((value) => Number(value.toFixed(3)))
		).toEqual([0.15, 0.367, 0.583, 0.8, 0.95]);
	});

	it('uses half-step positions when interpolating', () => {
		const group = {
			stepsCount: 3,
			halfStepBefore: true,
			halfStepAfter: true,
			lightnessMax: 1,
			lightnessMin: 0,
			controlledLightness: { 100: 0.75, 300: 0.25 }
		};
		const steps = computeSteps(group);

		expect(steps).toEqual([50, 100, 200, 300, 350]);
		expect(computeLightness(group, steps)).toEqual([1, 0.75, 0.5, 0.25, 0]);
	});
});

describe('cleanControlledLightness', () => {
	it('keeps only finite controlled values for intermediate steps', () => {
		expect(
			cleanControlledLightness(
				{
					50: 0.99,
					100: 0.95,
					200: 0.8,
					400: Number.NaN,
					900: 0.1
				},
				[100, 200, 300]
			)
		).toEqual({ 200: 0.8 });
	});
});
