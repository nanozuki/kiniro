import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createDefaultStepScaleStructure, createDefaultStepScaleValues } from '../model';
import { createAppManager } from '../state/state.svelte';
import { appManagerContextOption } from '../state/testAppContext';
import StepScale from './StepScale.svelte';

describe('StepScale', () => {
	it('renders compact summary and delegates structure settings', async () => {
		const app = createAppManager();
		const setStepCount = vi.spyOn(app, 'setStepCount');
		const setIndexStyle = vi.spyOn(app, 'setIndexStyle');
		const setHalfSteps = vi.spyOn(app, 'setHalfSteps');
		render(StepScale, {
			...appManagerContextOption(app),
			props: {
				familyId: 'family-1',
				structure: createDefaultStepScaleStructure(),
				values: createDefaultStepScaleValues()
			}
		});

		await expect.element(page.getByText('100: 0.9500')).toBeInTheDocument();
		await page.getByRole('button', { name: 'Edit step scale' }).click();
		await page.getByLabelText('Step count').fill('7');
		await page.getByLabelText('Index style').selectOptions('ordinal');
		await page.getByLabelText('Half step start').click();
		expect(setStepCount).toHaveBeenCalledWith('family-1', 7);
		expect(setIndexStyle).toHaveBeenCalledWith('family-1', 'ordinal');
		expect(setHalfSteps).toHaveBeenCalledWith('family-1', true, false);
	});

	it('delegates lightness value changes, reset, and reverse', async () => {
		const app = createAppManager();
		const setLightnessRange = vi.spyOn(app, 'setLightnessRange');
		const overrideLightness = vi.spyOn(app, 'overrideLightness');
		const resetLightness = vi.spyOn(app, 'resetLightness');
		const reverseFamilyLightness = vi.spyOn(app, 'reverseFamilyLightness');
		const values = createDefaultStepScaleValues();
		values.lightnessOverrides = { '500': 0.4 };
		render(StepScale, {
			...appManagerContextOption(app),
			props: {
				familyId: 'family-1',
				structure: createDefaultStepScaleStructure(),
				values
			}
		});

		await page.getByRole('button', { name: 'Edit step scale' }).click();
		await page.getByLabelText('Start lightness').fill('0.9');
		await page.getByLabelText('500 lightness').fill('0.45');
		await page.getByRole('button', { name: 'Reset 500' }).click();
		await page.getByRole('button', { name: 'Reverse lightness' }).click();

		expect(setLightnessRange).toHaveBeenCalledWith('family-1', 0.9, 0.05);
		expect(overrideLightness).toHaveBeenCalledWith('family-1', '500', 0.45);
		expect(resetLightness).toHaveBeenCalledWith('family-1', '500');
		expect(reverseFamilyLightness).toHaveBeenCalledWith('family-1');
	});
});
