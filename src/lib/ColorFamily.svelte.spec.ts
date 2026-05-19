import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createDefaultTheme } from './model';
import ColorFamily from './ColorFamily.svelte';

describe('ColorFamily', () => {
	it('renders family actions and delegates them', async () => {
		const theme = createDefaultTheme({ familyName: 'Neutrals' });
		const family = theme.structure.families[0];
		const onrename = vi.fn();
		const ondelete = vi.fn();
		const onaddramp = vi.fn();
		render(ColorFamily, { family, variant: theme.variants[0], onrename, ondelete, onaddramp });

		await expect.element(page.getByText('100: 0.9500')).toBeInTheDocument();
		await page.getByRole('button', { name: 'Rename family' }).click();
		await page.getByLabelText('Family name').fill('Grays');
		await page.getByRole('button', { name: 'Delete family' }).click();
		await page.getByRole('button', { name: 'Add Color Ramp' }).click();
		expect(onrename).toHaveBeenCalledWith(family.id, 'Grays');
		expect(ondelete).toHaveBeenCalledWith(family.id);
		expect(onaddramp).toHaveBeenCalledWith(family.id);
	});

	it('shows the shared-structure warning only when multiple variants exist', async () => {
		const theme = createDefaultTheme();
		const family = theme.structure.families[0];
		const { rerender } = render(ColorFamily, {
			family,
			variant: theme.variants[0],
			variantCount: 1
		});

		await expect
			.element(page.getByText('Family structure is shared by all variants in this theme.'))
			.not.toBeInTheDocument();
		await rerender({ family, variant: theme.variants[0], variantCount: 2 });
		await expect
			.element(page.getByText('Family structure is shared by all variants in this theme.'))
			.toBeInTheDocument();
	});
});
