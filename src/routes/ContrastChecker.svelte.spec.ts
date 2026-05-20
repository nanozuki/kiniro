import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ContrastChecker from './ContrastChecker.svelte';
import { createSourceColor } from '$lib/color';
import { createDefaultTheme } from '$lib/model';
import { generateVariantPalette } from '$lib/palette';

function palette() {
	const theme = createDefaultTheme();
	const family = theme.structure.families[0];
	family.ramps.push({ id: 'ramp-1', name: 'Neutral' }, { id: 'ramp-2', name: 'Accent' });
	theme.variants[0].values.families[family.id].ramps['ramp-1'] = {
		sourceColor: createSourceColor({ lightness: 0.6, chroma: 0, hue: 0 }),
		swatchOverrides: {}
	};
	theme.variants[0].values.families[family.id].ramps['ramp-2'] = {
		sourceColor: createSourceColor({ lightness: 0.7, chroma: 0.12, hue: 210 }),
		swatchOverrides: {}
	};
	return generateVariantPalette(theme, theme.variants[0]);
}

describe('ContrastChecker', () => {
	it('selects default foreground and background from generated swatches', async () => {
		render(ContrastChecker, { palette: palette() });

		await expect.element(page.getByText('Neutral 200 on Accent 800')).toBeInTheDocument();
		await expect.element(page.getByLabelText('Contrast ratio')).toHaveTextContent(/:1/);
	});

	it('updates target selections and swaps colors', async () => {
		render(ContrastChecker, { palette: palette() });

		await page.getByLabelText('Foreground color').selectOptions('family-1:ramp-2:100');
		await page.getByLabelText('Background color').selectOptions('family-1:ramp-1:900');
		await expect.element(page.getByText('Accent 100 on Neutral 900')).toBeInTheDocument();
		await page.getByRole('button', { name: 'Swap colors' }).click();
		await expect
			.element(page.getByLabelText('Foreground color'))
			.toHaveValue('family-1:ramp-1:900');
		await expect
			.element(page.getByLabelText('Background color'))
			.toHaveValue('family-1:ramp-2:100');
	});

	it('renders pass and fail results', async () => {
		render(ContrastChecker, { palette: palette() });

		await expect.element(page.getByRole('cell', { name: 'Pass (7:1)' })).toBeInTheDocument();
		await expect.element(page.getByRole('cell', { name: 'N/A' })).toBeInTheDocument();
	});
});
