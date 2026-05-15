import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createDefaultStepScaleStructure, createDefaultStepScaleValues } from './model';
import StepScale from './StepScale.svelte';

describe('StepScale', () => {
	it('renders compact summary and delegates structure settings', async () => {
		const onstepcount = vi.fn();
		const onindexstyle = vi.fn();
		const onhalfsteps = vi.fn();
		render(StepScale, { structure: createDefaultStepScaleStructure(), values: createDefaultStepScaleValues(), onstepcount, onindexstyle, onhalfsteps });

		await expect.element(page.getByText('100: 0.9500')).toBeInTheDocument();
		await page.getByRole('button', { name: 'Edit step scale' }).click();
		await page.getByLabelText('Step count').fill('7');
		await page.getByLabelText('Index style').selectOptions('ordinal');
		await page.getByLabelText('Half step start').click();
		expect(onstepcount).toHaveBeenCalledWith(7);
		expect(onindexstyle).toHaveBeenCalledWith('ordinal');
		expect(onhalfsteps).toHaveBeenCalledWith(true, false);
	});

	it('delegates lightness value changes, reset, and reverse', async () => {
		const onrange = vi.fn();
		const onoverride = vi.fn();
		const onreset = vi.fn();
		const onreverse = vi.fn();
		const values = createDefaultStepScaleValues();
		values.lightnessOverrides = { '500': 0.4 };
		render(StepScale, { structure: createDefaultStepScaleStructure(), values, onrange, onoverride, onreset, onreverse });

		await page.getByRole('button', { name: 'Edit step scale' }).click();
		await page.getByLabelText('Start lightness').fill('0.9');
		await page.getByLabelText('500 lightness').fill('0.45');
		await page.getByRole('button', { name: 'Reset 500' }).click();
		await page.getByRole('button', { name: 'Reverse lightness' }).click();

		expect(onrange).toHaveBeenCalledWith(0.9, 0.05);
		expect(onoverride).toHaveBeenCalledWith('500', 0.45);
		expect(onreset).toHaveBeenCalledWith('500');
		expect(onreverse).toHaveBeenCalled();
	});
});
