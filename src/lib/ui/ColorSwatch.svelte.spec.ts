import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ColorSwatch from './ColorSwatch.svelte';
import type { GeneratedSwatch } from '../palette';
import { createAppManager } from '../state/state.svelte';
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
		return appManagerContextOption(createAppManager());
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

	it('delegates channel overrides and resets from the modal', async () => {
		const app = createAppManager();
		const overrideSwatchChannel = vi.spyOn(app, 'overrideSwatchChannel');
		const resetSwatchChannel = vi.spyOn(app, 'resetSwatchChannel');
		const resetSwatchColor = vi.spyOn(app, 'resetSwatchColor');
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
		await page.getByRole('button', { name: 'Reset Chroma' }).click();
		await page.getByRole('button', { name: 'Reset all channels' }).click();

		expect(overrideSwatchChannel).toHaveBeenCalledWith('family-1', 'ramp-1', '100', 'hue', 180);
		expect(resetSwatchChannel).toHaveBeenCalledWith('family-1', 'ramp-1', '100', 'chroma');
		expect(resetSwatchColor).toHaveBeenCalledWith('family-1', 'ramp-1', '100');
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
