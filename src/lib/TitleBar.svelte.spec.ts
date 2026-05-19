import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TitleBar from './TitleBar.svelte';

describe('TitleBar', () => {
	it('renders landing controls without undo/export/gamut', async () => {
		const onaddtheme = vi.fn();
		render(TitleBar, { hasThemes: false, onaddtheme });

		await expect.element(page.getByText(/Make OKLCH palettes/)).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Import' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Add first Theme' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Export' })).not.toBeInTheDocument();
		await page.getByRole('button', { name: 'Add first Theme' }).click();
		expect(onaddtheme).toHaveBeenCalled();
	});

	it('renders editor controls and delegates actions', async () => {
		const onexport = vi.fn();
		const ongamut = vi.fn();
		render(TitleBar, { hasThemes: true, canUndo: true, gamutPreview: 'p3', onexport, ongamut });

		await expect.element(page.getByRole('button', { name: 'Undo' })).toBeEnabled();
		await expect.element(page.getByRole('button', { name: 'Redo' })).toBeDisabled();
		await expect
			.element(page.getByRole('button', { name: 'P3' }))
			.toHaveAttribute('aria-pressed', 'true');
		await page.getByRole('button', { name: 'sRGB' }).click();
		await page.getByRole('button', { name: 'Export' }).click();
		expect(ongamut).toHaveBeenCalledWith('srgb');
		expect(onexport).toHaveBeenCalled();
	});
});
