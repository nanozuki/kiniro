import { describe, expect, it } from 'vitest';
import type { StepScaleStructure } from './model';
import {
	buildSteps,
	cleanLightnessOverrides,
	computeStepLightness,
	createIndexStyleStructure,
	getStepIndexes,
	mapLightnessOverridesForIndexStyle,
	mapOverridesToReversedIndexes,
	reverseStepScaleValues,
	reverseSwatchOverrides
} from './lightness';

const scale: StepScaleStructure = {
	stepCount: 5,
	indexStyle: 'scale',
	halfStepStart: false,
	halfStepEnd: false
};

describe('getStepIndexes', () => {
	it('builds scale indexes with optional half steps', () => {
		expect(getStepIndexes(scale)).toEqual(['100', '200', '300', '400', '500']);
		expect(getStepIndexes({ ...scale, stepCount: 3, halfStepStart: true, halfStepEnd: true })).toEqual([
			'50',
			'100',
			'200',
			'300',
			'350'
		]);
	});

	it('builds ordinal indexes and ignores half-step settings', () => {
		expect(
			getStepIndexes({ stepCount: 4, indexStyle: 'ordinal', halfStepStart: true, halfStepEnd: true })
		).toEqual(['1', '2', '3', '4']);
	});
});

describe('computeStepLightness', () => {
	it('interpolates piecewise between controlled lightness values', () => {
		expect(
			computeStepLightness(scale, {
				lightnessStart: 0.95,
				lightnessEnd: 0.15,
				lightnessOverrides: { '200': 0.8 },
				reversed: false
			}).map((value) => Number(value.toFixed(3)))
		).toEqual([0.95, 0.8, 0.583, 0.367, 0.15]);
	});

	it('uses half-step distances during interpolation', () => {
		const structure: StepScaleStructure = {
			stepCount: 3,
			indexStyle: 'scale',
			halfStepStart: true,
			halfStepEnd: true
		};

		expect(
			computeStepLightness(structure, {
				lightnessStart: 1,
				lightnessEnd: 0,
				lightnessOverrides: { '100': 0.75, '300': 0.25 },
				reversed: false
			})
		).toEqual([1, 0.75, 0.5, 0.25, 0]);
	});

	it('reverses generated output without reversing index labels', () => {
		expect(
			computeStepLightness(scale, {
				lightnessStart: 0.95,
				lightnessEnd: 0.15,
				lightnessOverrides: { '200': 0.8 },
				reversed: true
			}).map((value) => Number(value.toFixed(3)))
		).toEqual([0.15, 0.367, 0.583, 0.8, 0.95]);
	});
});

describe('buildSteps', () => {
	it('marks endpoints and overridden intermediate steps as controlled', () => {
		expect(
			buildSteps(scale, {
				lightnessStart: 0.95,
				lightnessEnd: 0.15,
				lightnessOverrides: { '200': 0.8 },
				reversed: false
			}).map(({ index, controlled }) => ({ index, controlled }))
		).toEqual([
			{ index: '100', controlled: true },
			{ index: '200', controlled: true },
			{ index: '300', controlled: false },
			{ index: '400', controlled: false },
			{ index: '500', controlled: true }
		]);
	});
});

describe('cleanLightnessOverrides', () => {
	it('keeps only finite intermediate-step overrides', () => {
		expect(
			cleanLightnessOverrides(
				{ '50': 0.99, '100': 0.95, '200': 0.8, '400': Number.NaN, '500': 0.1 },
				['100', '200', '300', '400', '500']
			)
		).toEqual({ '200': 0.8 });
	});
});

describe('index-style mapping', () => {
	it('hides half-step settings when switching to ordinal style', () => {
		expect(createIndexStyleStructure({ ...scale, halfStepStart: true, halfStepEnd: true }, 'ordinal')).toEqual({
			stepCount: 5,
			indexStyle: 'ordinal',
			halfStepStart: false,
			halfStepEnd: false
		});
	});

	it('maps regular scale-step overrides to ordinal positions and drops half steps', () => {
		const from: StepScaleStructure = { stepCount: 4, indexStyle: 'scale', halfStepStart: true, halfStepEnd: true };
		const to = createIndexStyleStructure(from, 'ordinal');

		expect(mapLightnessOverridesForIndexStyle(from, to, { '50': 1, '100': 0.9, '200': 0.7, '400': 0.2 })).toEqual({
			'1': 0.9,
			'2': 0.7,
			'4': 0.2
		});
	});

	it('maps ordinal-step overrides back to scale positions', () => {
		const from: StepScaleStructure = { stepCount: 4, indexStyle: 'ordinal', halfStepStart: false, halfStepEnd: false };
		const to: StepScaleStructure = { ...from, indexStyle: 'scale' };

		expect(mapLightnessOverridesForIndexStyle(from, to, { '2': 0.7, '3': 0.4, '4': 0.2 })).toEqual({
			'200': 0.7,
			'300': 0.4
		});
	});
});

describe('reverse helpers', () => {
	it('maps overrides to opposite indexes', () => {
		expect(mapOverridesToReversedIndexes(scale, { '100': 'first', '200': 'second', '500': 'last' })).toEqual({
			'100': 'last',
			'400': 'second',
			'500': 'first'
		});
	});

	it('reverses step-scale endpoints and controlled lightness overrides', () => {
		expect(
			reverseStepScaleValues(scale, {
				lightnessStart: 0.95,
				lightnessEnd: 0.15,
				lightnessOverrides: { '200': 0.8, '500': 0.15 },
				reversed: false
			})
		).toEqual({
			lightnessStart: 0.15,
			lightnessEnd: 0.95,
			lightnessOverrides: { '400': 0.8 },
			reversed: false
		});
	});

	it('reverses swatch override indexes for ramp operations', () => {
		expect(reverseSwatchOverrides(scale, { '200': { chroma: 0.1 }, '400': { hue: 20 } })).toEqual({
			'200': { hue: 20 },
			'400': { chroma: 0.1 }
		});
	});
});
