import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ColorGroup from './ColorGroup.svelte';

describe('ColorGroup.svelte', () => {
	it('shows controlled lightness anchors and interpolated intermediate steps', async () => {
		render(ColorGroup, {
			name: 'brand',
			colors: [{ id: 1, name: 'primary', hex: '#907aa9' }],
			lightnessMax: 0.95,
			lightnessMin: 0.15,
			controlledLightness: { 200: 0.8 },
			stepsCount: 5
		});

		await expect.element(page.getByRole('spinbutton', { name: 'Lightness 100' })).toHaveValue(0.95);
		await expect.element(page.getByRole('spinbutton', { name: 'Lightness 200' })).toHaveValue(0.8);
		await expect
			.element(page.getByRole('spinbutton', { name: 'Lightness 300' }))
			.toHaveValue(0.583);
		await expect.element(page.getByLabelText('Reset lightness 200')).toBeInTheDocument();
		await expect.element(page.getByText('primary-500')).toBeInTheDocument();
	});

	it('lets users promote and reset an auto step', async () => {
		render(ColorGroup, {
			colors: [{ id: 1, name: 'primary', hex: '#907aa9' }],
			lightnessMax: 0.9,
			lightnessMin: 0.1,
			stepsCount: 3
		});

		await page.getByRole('spinbutton', { name: 'Lightness 200' }).fill('0.33');
		await expect.element(page.getByRole('spinbutton', { name: 'Lightness 200' })).toHaveValue(0.33);
		await expect.element(page.getByLabelText('Reset lightness 200')).toBeInTheDocument();

		await page.getByLabelText('Reset lightness 200').click();
		await expect.element(page.getByRole('spinbutton', { name: 'Lightness 200' })).toHaveValue(0.5);
	});
});
