import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CssVariablesDialog from './CssVariablesDialog.svelte';
import type { GroupData } from '$lib/storage';

const groups: GroupData[] = [
	{
		id: 1,
		name: 'brand',
		lightnessMax: 0.95,
		lightnessMin: 0.15,
		controlledLightness: { 200: 0.8 },
		reversed: false,
		stepsCount: 3,
		halfStepBefore: false,
		halfStepAfter: false,
		colors: [{ id: 1, name: 'primary', hex: '#907aa9' }]
	}
];

describe('CssVariablesDialog.svelte', () => {
	it('previews CSS variables using the current prefix and lightness settings', async () => {
		render(CssVariablesDialog, { groups, open: true, prefix: 'color-' });

		await expect.element(page.getByRole('heading', { name: 'CSS Variables' })).toBeVisible();
		await expect.element(page.getByText(/--color-primary-100: 0\.950/)).toBeInTheDocument();
		await expect.element(page.getByText(/--color-primary-200: 0\.800/)).toBeInTheDocument();

		await page.getByLabelText('Prefix').fill('tone-');
		await expect.element(page.getByText(/--tone-primary-200: 0\.800/)).toBeInTheDocument();
	});
});
