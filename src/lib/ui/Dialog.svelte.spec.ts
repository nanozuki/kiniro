import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DialogHost from './fixture/DialogHost.svelte';

describe('Dialog', () => {
	it('keeps closed dialog content out of accessible queries', async () => {
		render(DialogHost);

		await expect.element(page.getByText('Open: no')).toBeInTheDocument();
		await expect
			.element(page.getByRole('dialog', { name: 'Dialog title' }))
			.not.toBeInTheDocument();
		await expect.element(page.getByText('Dialog body')).not.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Dialog action' }))
			.not.toBeInTheDocument();
	});

	it('renders content and actions when opened by a bound caller', async () => {
		render(DialogHost);

		await page.getByRole('button', { name: 'Open dialog' }).click();

		await expect.element(page.getByRole('dialog', { name: 'Dialog title' })).toBeInTheDocument();
		await expect.element(page.getByText('Dialog body')).toBeInTheDocument();
		await expect.element(page.getByRole('button', { name: 'Dialog action' })).toBeInTheDocument();
		await expect.element(page.getByText('Open: yes')).toBeInTheDocument();
	});

	it('notifies controlled callers when the close control closes the dialog', async () => {
		const onopenchange = vi.fn();
		render(DialogHost, { initiallyOpen: true, onopenchange });

		await expect.element(page.getByText('Dialog body')).toBeInTheDocument();
		await page.getByRole('button', { name: 'Close test dialog' }).click();

		expect(onopenchange).toHaveBeenCalledWith(false);
		await expect.element(page.getByText('Dialog body')).not.toBeInTheDocument();
		await expect.element(page.getByText('Open: no')).toBeInTheDocument();
	});
});
