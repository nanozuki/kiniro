import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createDefaultTheme } from '../model';
import { createAppManager } from '../state/state.svelte';
import { appManagerContextOption } from '../state/testAppContext';
import ColorFamily from './ColorFamily.svelte';

describe('ColorFamily', () => {
	it('renders family actions and delegates them', async () => {
		const theme = createDefaultTheme({ familyName: 'Neutrals' });
		const family = theme.structure.families[0];
		const app = createAppManager({ data: { themes: [theme] } });
		const renameFamily = vi.spyOn(app, 'renameFamily');
		const deleteFamily = vi.spyOn(app, 'deleteFamily');
		const addRamp = vi.spyOn(app, 'addRamp');
		render(ColorFamily, {
			...appManagerContextOption(app),
			props: { family, variant: theme.variants[0], gamut: 'srgb' }
		});

		await expect.element(page.getByText('100: 0.9500')).toBeInTheDocument();
		await page.getByRole('button', { name: 'Rename family' }).click();
		await page.getByLabelText('Family name').fill('Grays');
		await page.getByRole('button', { name: 'Delete family' }).click();
		await page.getByRole('button', { name: 'Add Color Ramp' }).click();
		expect(renameFamily).toHaveBeenCalledWith(family.id, 'Grays');
		expect(deleteFamily).toHaveBeenCalledWith(family.id);
		expect(addRamp).toHaveBeenCalledWith(
			family.id,
			expect.objectContaining({ serialized: expect.any(String) })
		);
	});

	it('shows the shared-structure warning only when multiple variants exist', async () => {
		const theme = createDefaultTheme();
		const family = theme.structure.families[0];
		const app = createAppManager({ data: { themes: [theme] } });
		const { rerender } = render(ColorFamily, {
			...appManagerContextOption(app),
			props: { family, variant: theme.variants[0], gamut: 'srgb', variantCount: 1 }
		});

		await expect
			.element(page.getByText('Family structure is shared by all variants in this theme.'))
			.not.toBeInTheDocument();
		await rerender({ family, variant: theme.variants[0], gamut: 'srgb', variantCount: 2 });
		await expect
			.element(page.getByText('Family structure is shared by all variants in this theme.'))
			.toBeInTheDocument();
	});
});
