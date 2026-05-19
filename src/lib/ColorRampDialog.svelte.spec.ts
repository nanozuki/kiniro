import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createSourceColor } from './color';
import ColorRampDialog from './ColorRampDialog.svelte';

describe('ColorRampDialog', () => {
	it('validates name and hex source drafts in real time', async () => {
		render(ColorRampDialog, { open: true, initialName: '', existingNames: ['Accent'] });

		await expect.element(page.getByText('Ramp name is required.')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Confirm' })).toBeDisabled();
		await page.getByLabelText('Ramp name').fill('Accent');
		await expect.element(page.getByText('Ramp name must be unique.')).toBeInTheDocument();
		await page.getByLabelText('Ramp name').fill('Accent 2');
		await page.getByRole('button', { name: 'HEX' }).click();
		await page.getByLabelText('Hex').fill('not-a-color');
		await expect.element(page.getByText('Enter a valid source color.')).toBeInTheDocument();
	});

	it('switches formats and confirms one complete draft', async () => {
		const onconfirm = vi.fn();
		render(ColorRampDialog, {
			open: true,
			initialName: 'Accent',
			initialSourceColor: createSourceColor({ lightness: 0.7, chroma: 0.1, hue: 0 }),
			onconfirm
		});

		await page.getByRole('button', { name: 'RGB' }).click();
		await page.getByLabelText('Red').fill('144');
		await page.getByRole('button', { name: 'Confirm' }).click();
		expect(onconfirm).toHaveBeenCalledOnce();
		expect(onconfirm.mock.calls[0][0]).toBe('Accent');
		expect(onconfirm.mock.calls[0][1].format).toBe('rgb');
	});

	it('cancels without confirming the draft', async () => {
		const onconfirm = vi.fn();
		const oncancel = vi.fn();
		render(ColorRampDialog, { open: true, initialName: 'Accent', onconfirm, oncancel });

		await page.getByLabelText('Ramp name').fill('Changed');
		await page.getByRole('button', { name: 'Cancel' }).click();
		expect(oncancel).toHaveBeenCalled();
		expect(onconfirm).not.toHaveBeenCalled();
	});
});
