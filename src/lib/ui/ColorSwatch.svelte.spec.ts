import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ColorSwatch from './ColorSwatch.svelte';
import type { GeneratedSwatch } from '../palette';
import { AppManager } from '../state/state.svelte';
import { appManagerContextOption } from '../state/testAppContext';

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
	function context() {
		return appManagerContextOption(new AppManager());
	}

	it('renders displayed values and override indicators', async () => {
		render(ColorSwatch, {
			...context(),
			props: {
				familyId: 'family-1',
				rampId: 'ramp-1',
				swatch: swatch({ chroma: 0.2 }),
				gamut: 'srgb'
			}
		});

		await expect
			.element(page.getByRole('button', { name: /Accent-100 .* overridden/ }))
			.toBeInTheDocument();
		await expect.element(page.getByLabelText('Has overrides')).toBeInTheDocument();
	});

	it('commits draft channel overrides only after applying the modal', async () => {
		const app = new AppManager();
		const setSwatchOverrides = vi.spyOn(app, 'setSwatchOverrides');
		render(ColorSwatch, {
			...appManagerContextOption(app),
			props: {
				familyId: 'family-1',
				rampId: 'ramp-1',
				swatch: swatch({ chroma: 0.2 }),
				gamut: 'srgb'
			}
		});

		await page.getByRole('button', { name: /Accent-100/ }).click();
		await page.getByLabelText(/Hue/).fill('180');
		expect(setSwatchOverrides).not.toHaveBeenCalled();
		await page.getByRole('button', { name: 'Apply changes' }).click();

		expect(setSwatchOverrides).toHaveBeenCalledWith('family-1', 'ramp-1', '100', {
			chroma: 0.2,
			hue: 180
		});
	});

	it('keeps reset and apply disabled for unchanged generated values with extra precision', async () => {
		render(ColorSwatch, {
			...context(),
			props: {
				familyId: 'family-1',
				rampId: 'ramp-1',
				swatch: {
					stepIndex: '200',
					name: 'Base-200',
					generated: { lightness: 0.84375, chroma: 0.0178901, hue: 291.139 },
					overrides: {},
					oklch: { lightness: 0.84375, chroma: 0.0178901, hue: 291.139 }
				},
				gamut: 'srgb'
			}
		});

		await page.getByRole('button', { name: /Base-200/ }).click();

		await expect.element(page.getByRole('button', { name: 'Reset Lightness' })).toBeDisabled();
		await expect.element(page.getByRole('button', { name: 'Reset Chroma' })).toBeDisabled();
		await expect.element(page.getByRole('button', { name: 'Reset Hue' })).toBeDisabled();
		await expect.element(page.getByRole('button', { name: 'Reset all channels' })).toBeDisabled();
		await expect.element(page.getByRole('button', { name: 'Apply changes' })).toBeDisabled();
	});

	it('keeps reset and apply disabled for equivalent imported override values', async () => {
		render(ColorSwatch, {
			...context(),
			props: {
				familyId: 'family-1',
				rampId: 'ramp-1',
				swatch: {
					stepIndex: '200',
					name: 'Gold-200',
					generated: { lightness: 0.8375, chroma: 0.1142, hue: 74.60185343028667 },
					overrides: { hue: 74.609 },
					oklch: { lightness: 0.8375, chroma: 0.1142, hue: 74.609 }
				},
				gamut: 'srgb'
			}
		});

		await page.getByRole('button', { name: /Gold-200/ }).click();

		await expect.element(page.getByLabelText('Hue')).toHaveValue('74.60');
		await expect.element(page.getByRole('button', { name: 'Reset Hue' })).toBeDisabled();
		await expect.element(page.getByRole('button', { name: 'Reset all channels' })).toBeDisabled();
		await expect.element(page.getByRole('button', { name: 'Apply changes' })).toBeDisabled();
	});

	it('resets and cancels modal drafts without committing app state', async () => {
		const app = new AppManager();
		const setSwatchOverrides = vi.spyOn(app, 'setSwatchOverrides');
		render(ColorSwatch, {
			...appManagerContextOption(app),
			props: {
				familyId: 'family-1',
				rampId: 'ramp-1',
				swatch: swatch({ chroma: 0.2 }),
				gamut: 'srgb'
			}
		});

		await page.getByRole('button', { name: /Accent-100/ }).click();
		await page.getByRole('button', { name: 'Reset Chroma' }).click();
		await page.getByLabelText(/Hue/).fill('180');
		await page.getByRole('button', { name: 'Reset all channels' }).click();
		await page.getByRole('button', { name: 'Cancel' }).click();

		expect(setSwatchOverrides).not.toHaveBeenCalled();
	});

	it('marks colors outside the selected gamut', async () => {
		render(ColorSwatch, {
			...context(),
			props: {
				familyId: 'family-1',
				rampId: 'ramp-1',
				swatch: swatch({ chroma: 0.37 }),
				gamut: 'srgb'
			}
		});

		await expect.element(page.getByText('⚠')).toBeInTheDocument();
	});
});
