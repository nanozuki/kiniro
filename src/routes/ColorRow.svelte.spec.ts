import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ColorRow from './ColorRow.svelte';

describe('ColorRow.svelte', () => {
	it('renders one gamut-mapped swatch for each supplied lightness step', async () => {
		render(ColorRow, {
			name: 'brand',
			hex: '#907aa9',
			steps: [100, 200, 300],
			lightness: [0.95, 0.5, 0.16]
		});

		await expect.element(page.getByText('brand-100')).toBeInTheDocument();
		await expect.element(page.getByText('brand-200')).toBeInTheDocument();
		await expect.element(page.getByText('brand-300')).toBeInTheDocument();
		await expect.element(page.getByText('L 0.95')).toBeInTheDocument();
		await expect.element(page.getByText('L 0.50')).toBeInTheDocument();
		await expect.element(page.getByText('L 0.16')).toBeInTheDocument();
		await expect.element(page.getByText(/^oklch\(/)).toBeInTheDocument();
	});
});
