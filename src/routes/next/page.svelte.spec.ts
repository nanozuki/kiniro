import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import NextPage from './+page.svelte';

describe('/next shell', () => {
	it('renders the empty landing state', async () => {
		render(NextPage);

		await expect.element(page.getByRole('heading', { name: 'Kiniro' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Import' })).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Add first Theme' })).toBeInTheDocument();
	});

	it('creates a placeholder editor state', async () => {
		render(NextPage);
		await page.getByRole('button', { name: 'Add first Theme' }).click();

		await expect.element(page.getByLabelText('ThemeManager')).toBeInTheDocument();
		await expect.element(page.getByLabelText('WorkspaceTabs')).toBeInTheDocument();
		await expect.element(page.getByRole('heading', { name: 'Palette' })).toBeInTheDocument();
	});
});
