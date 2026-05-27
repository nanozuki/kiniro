import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createDefaultTheme } from '../model';
import { createSourceColor } from '../color';
import { generateFamily } from '../palette';
import { createAppManager } from '../state/state.svelte';
import { appManagerContextOption } from '../state/testAppContext';
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
		return {
			theme,
			family,
			ramp: generateFamily(family, theme.variants[0], theme.targetGamut).ramps[0]
		};
	}

	it('renders the source cell and generated swatches', async () => {
		const { theme, family, ramp } = rampFixture();
		const app = createAppManager({ data: { themes: [theme] } });
		render(ColorRamp, {
			...appManagerContextOption(app),
			props: {
				familyId: family.id,
				ramp,
				sourceValue: 'oklch(0.7000 0.1200 210.00)',
				gamut: 'srgb'
			}
		});

		await expect.element(page.getByRole('heading', { name: 'Accent' })).toBeInTheDocument();
		await expect.element(page.getByText('L 0.7000 C 0.1200 H 210.00')).toBeInTheDocument();
		await expect.element(page.getByLabelText(/Accent-100/)).toBeInTheDocument();
	});

	it('deletes the ramp through context', async () => {
		const { theme, family, ramp } = rampFixture();
		const app = createAppManager({ data: { themes: [theme] } });
		const deleteRamp = vi.spyOn(app, 'deleteRamp');
		render(ColorRamp, {
			...appManagerContextOption(app),
			props: {
				familyId: family.id,
				ramp,
				sourceValue: 'oklch(0.7000 0.1200 210.00)',
				gamut: 'srgb'
			}
		});

		await page.getByRole('button', { name: 'Delete Color Ramp' }).click();
		expect(deleteRamp).toHaveBeenCalledWith(family.id, 'ramp-1');
	});
});
