import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ColorGroup from './ColorGroup.svelte';
import type { GroupData } from '$lib/storage';

const group: GroupData = {
	id: 1,
	name: 'brand',
	colors: [{ id: 1, name: 'primary', hex: '#907aa9' }],
	lightnessMax: 0.95,
	lightnessMin: 0.15,
	controlledLightness: { 200: 0.8 },
	reversed: false,
	stepsCount: 5,
	halfStepBefore: false,
	halfStepAfter: false
};

describe('ColorGroup.svelte', () => {
	it('shows controlled lightness anchors and interpolated intermediate steps', async () => {
		render(ColorGroup, { group });

		await expect.element(page.getByRole('spinbutton', { name: 'Lightness 100' })).toHaveValue(0.95);
		await expect.element(page.getByRole('spinbutton', { name: 'Lightness 200' })).toHaveValue(0.8);
		await expect
			.element(page.getByRole('spinbutton', { name: 'Lightness 300' }))
			.toHaveValue(0.583);
		await expect.element(page.getByLabelText('Reset lightness 200')).toBeInTheDocument();
		await expect.element(page.getByText('primary-500')).toBeInTheDocument();
	});

	it('reports lightness and color updates through callbacks', async () => {
		const onLightnessChange = vi.fn();
		const onColorChange = vi.fn();
		render(ColorGroup, {
			group: { ...group, controlledLightness: {}, stepsCount: 3 },
			onLightnessChange,
			onColorChange
		});

		await page.getByRole('spinbutton', { name: 'Lightness 200' }).fill('0.33');
		expect(onLightnessChange).toHaveBeenCalledWith({ controlledLightness: { 200: 0.33 } });

		await page.getByPlaceholder('color name').fill('accent');
		expect(onColorChange).toHaveBeenCalledWith(1, { name: 'accent' });
	});

	it('ignores empty lightness bounds and clamps finite values', async () => {
		const onLightnessChange = vi.fn();
		render(ColorGroup, {
			group: { ...group, controlledLightness: {} },
			onLightnessChange
		});

		await page.getByRole('spinbutton', { name: 'Lightness max' }).fill('');
		expect(onLightnessChange).not.toHaveBeenCalled();

		await page.getByRole('spinbutton', { name: 'Lightness max' }).fill('1.25');
		expect(onLightnessChange).toHaveBeenCalledWith({ lightnessMax: 1 });

		await page.getByRole('spinbutton', { name: 'Lightness min' }).fill('-0.25');
		expect(onLightnessChange).toHaveBeenCalledWith({ lightnessMin: 0 });
	});

	it('reports controlled step resets through callbacks', async () => {
		const onLightnessChange = vi.fn();
		render(ColorGroup, { group, onLightnessChange });

		await page.getByLabelText('Reset lightness 200').click();

		expect(onLightnessChange).toHaveBeenCalledWith({ controlledLightness: {} });
	});
});
