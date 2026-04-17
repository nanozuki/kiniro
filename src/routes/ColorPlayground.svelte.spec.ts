import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ColorPlayground from './ColorPlayground.svelte';
import type { GroupData } from '$lib/storage';

const groups: GroupData[] = [
	{
		id: 1,
		name: 'brand',
		lightnessMax: 0.95,
		lightnessMin: 0.16,
		controlledLightness: {},
		reversed: false,
		stepsCount: 3,
		halfStepBefore: false,
		halfStepAfter: false,
		colors: [{ id: 1, name: 'primary', hex: '#907aa9' }]
	}
];

describe('ColorPlayground.svelte', () => {
	it('uses generated palette swatches as named foreground and background choices', async () => {
		render(ColorPlayground, { groups, prefix: 'tone-' });

		await page.getByRole('button', { name: 'Set foreground to primary-100' }).click();
		await expect
			.element(page.getByText('var(--tone-primary-100) on #f5f5f5'))
			.toBeInTheDocument();

		await page.getByRole('button', { name: 'Background' }).click();
		await page.getByRole('button', { name: 'Set background to primary-300' }).click();
		await expect
			.element(page.getByText('var(--tone-primary-100) on var(--tone-primary-300)'))
			.toBeInTheDocument();
	});

	it('shows an empty state when no palette rows are available', async () => {
		render(ColorPlayground, { groups: [], prefix: 'tone-' });

		await expect.element(page.getByText('Add color groups above to see the palette here.')).toBeVisible();
	});
});
