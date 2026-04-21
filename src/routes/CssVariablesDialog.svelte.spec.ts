import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CssVariablesDialog from './CssVariablesDialog.svelte';
import type { PaletteData } from '$lib/storage';

const palettes: PaletteData[] = [
	{
		id: 1,
		name: 'Brand',
		groups: [{ id: 1, name: 'base', colors: [{ id: 1, name: 'primary', hex: '#907aa9' }] }],
		variants: [
			{
				id: 1,
				name: 'Light',
				groups: {
					1: {
						lightnessMax: 0.95,
						lightnessMin: 0.15,
						controlledLightness: { 200: 0.8 },
						reversed: false,
						stepsCount: 3,
						halfStepBefore: false,
						halfStepAfter: false
					}
				}
			}
		]
	}
];

describe('CssVariablesDialog.svelte', () => {
	it('previews CSS variables using the current prefix and lightness settings', async () => {
		render(CssVariablesDialog, { palettes, open: true, prefix: 'color-' });

		await expect.element(page.getByRole('heading', { name: 'CSS Variables' })).toBeVisible();
		await expect.element(page.getByText(/--color-brand-light-base-primary-100: 0\.950/)).toBeInTheDocument();
		await expect.element(page.getByText(/--color-brand-light-base-primary-200: 0\.800/)).toBeInTheDocument();

		await page.getByLabelText('Prefix').fill('tone-');
		await expect.element(page.getByText(/--tone-brand-light-base-primary-200: 0\.800/)).toBeInTheDocument();
	});
});
