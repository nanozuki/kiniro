import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createDefaultTheme } from '$lib/model';
import Palette from './Palette.svelte';

describe('Palette', () => {
	it('shows an empty palette with an add action', async () => {
		const theme = createDefaultTheme();
		theme.structure.families = [];
		theme.variants[0].values.families = {};
		const onaddfamily = vi.fn();
		render(Palette, {
			families: theme.structure.families,
			variant: theme.variants[0],
			onaddfamily
		});

		await expect.element(page.getByText('No color families yet.')).toBeInTheDocument();
		await page.getByRole('button', { name: 'Add Color Family' }).click();
		expect(onaddfamily).toHaveBeenCalled();
	});

	it('renders the current family list', async () => {
		const theme = createDefaultTheme({ familyName: 'Neutrals' });
		render(Palette, { families: theme.structure.families, variant: theme.variants[0] });

		await expect.element(page.getByRole('heading', { name: 'Neutrals' })).toBeInTheDocument();
		await expect.element(page.getByText('No color ramps yet.')).toBeInTheDocument();
	});
});
