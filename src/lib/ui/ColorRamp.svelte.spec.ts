import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createDefaultTheme } from '../model';
import { createSourceColor } from '../color';
import { generateFamily } from '../palette';
import ColorRamp from './ColorRamp.svelte';

describe('ColorRamp', () => {
	function rampFixture() {
		const theme = createDefaultTheme();
		const family = theme.structure.families[0];
		family.ramps.push({ id: 'ramp-1', name: 'Accent' });
		theme.variants[0].values.families[family.id].ramps['ramp-1'] = {
			sourceColor: createSourceColor({ lightness: 0.7, chroma: 0.12, hue: 210 }),
			swatchOverrides: {}
		};
		return generateFamily(family, theme.variants[0]).ramps[0];
	}

	it('renders the source cell and generated swatches', async () => {
		render(ColorRamp, { ramp: rampFixture(), sourceValue: 'oklch(0.7000 0.1200 210.00)' });

		await expect.element(page.getByRole('heading', { name: 'Accent' })).toBeInTheDocument();
		await expect.element(page.getByText('C 0.1200 H 210.00')).toBeInTheDocument();
		await expect.element(page.getByLabelText(/Accent-100/)).toBeInTheDocument();
	});

	it('opens edit and delegates delete behavior', async () => {
		const onedit = vi.fn();
		const ondelete = vi.fn();
		render(ColorRamp, {
			ramp: rampFixture(),
			sourceValue: 'oklch(0.7000 0.1200 210.00)',
			onedit,
			ondelete
		});

		await page.getByRole('button', { name: 'Edit Color Ramp' }).click();
		await page.getByRole('button', { name: 'Delete Color Ramp' }).click();
		expect(onedit).toHaveBeenCalledWith('ramp-1');
		expect(ondelete).toHaveBeenCalledWith('ramp-1');
	});
});
