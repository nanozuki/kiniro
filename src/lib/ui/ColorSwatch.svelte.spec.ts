import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ColorSwatch from './ColorSwatch.svelte';
import type { GeneratedSwatch } from '../palette';

function swatch(overrides = {}): GeneratedSwatch {
	return {
		stepIndex: '100',
		name: 'Accent-100',
		generated: { lightness: 0.8, chroma: 0.1, hue: 210 },
		overrides,
		oklch: { lightness: 0.8, chroma: 0.1, hue: 210, ...overrides }
	};
}

describe('ColorSwatch', () => {
	it('renders displayed values and override indicators', async () => {
		render(ColorSwatch, { swatch: swatch({ chroma: 0.2 }) });

		await expect
			.element(page.getByRole('button', { name: /Accent-100 .* overridden/ }))
			.toBeInTheDocument();
		await expect.element(page.getByLabelText('Has overrides')).toBeInTheDocument();
	});

	it('delegates channel overrides and resets from the modal', async () => {
		const onoverride = vi.fn();
		const onreset = vi.fn();
		const onresetall = vi.fn();
		render(ColorSwatch, { swatch: swatch({ chroma: 0.2 }), onoverride, onreset, onresetall });

		await page.getByRole('button', { name: /Accent-100/ }).click();
		await page.getByLabelText(/Hue/).fill('180');
		await page.getByRole('button', { name: 'Reset Chroma' }).click();
		await page.getByRole('button', { name: 'Reset all channels' }).click();

		expect(onoverride).toHaveBeenCalledWith('100', 'hue', 180);
		expect(onreset).toHaveBeenCalledWith('100', 'chroma');
		expect(onresetall).toHaveBeenCalledWith('100');
	});

	it('marks colors outside the selected gamut', async () => {
		render(ColorSwatch, { swatch: swatch({ chroma: 0.37 }), gamutPreview: 'srgb' });

		await expect.element(page.getByText('⚠')).toBeInTheDocument();
	});
});
