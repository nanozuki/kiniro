import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ImportExportDialogs from './ImportExportDialogs.svelte';
import { exportThemes } from '$lib/importExport';
import { createDefaultTheme } from '$lib/model';

function themes() {
	return [createDefaultTheme({ id: 'theme-1', name: 'Theme 1' })];
}

async function uploadJson(name: string, json: string) {
	const input = page.getByLabelText('Import file').element() as HTMLInputElement;
	const file = new File([json], name, { type: 'application/json' });
	const transfer = new DataTransfer();
	transfer.items.add(file);
	input.files = transfer.files;
	input.dispatchEvent(new Event('change', { bubbles: true }));
}

describe('ImportExportDialogs', () => {
	it('keeps export confirm disabled until a theme is selected and exports filename payload', async () => {
		const onexport = vi.fn();
		render(ImportExportDialogs, { themes: themes(), onexport });

		await page.getByRole('button', { name: 'Export themes' }).click();
		await page.getByLabelText('Theme 1').click();
		await expect.element(page.getByRole('button', { name: 'Confirm export' })).toBeDisabled();
		await page.getByLabelText('Theme 1').click();
		await page.getByLabelText('Filename').fill('palette.json');
		await page.getByRole('button', { name: 'Confirm export' }).click();
		expect(onexport).toHaveBeenCalledWith('palette.json', expect.stringContaining('Theme 1'));
	});

	it('shows import validation summary and disables confirm for invalid files', async () => {
		render(ImportExportDialogs, { themes: themes() });

		await page.getByRole('button', { name: 'Import themes' }).click();
		await uploadJson('bad.json', '{ nope');
		await expect.element(page.getByRole('status')).toHaveTextContent('Invalid JSON file.');
		await expect.element(page.getByRole('button', { name: 'Confirm import' })).toBeDisabled();
	});

	it('supports conflict choices and successful import callback', async () => {
		const onimport = vi.fn();
		render(ImportExportDialogs, { themes: themes(), onimport });
		const imported = createDefaultTheme({ id: 'theme-2', name: 'Theme 1' });

		await page.getByRole('button', { name: 'Import themes' }).click();
		await uploadJson('themes.json', exportThemes([imported]));
		await page.getByLabelText('Conflict choice for Theme 1').selectOptions('overwrite');
		await page.getByRole('button', { name: 'Confirm import' }).click();
		expect(onimport).toHaveBeenCalledWith(
			expect.objectContaining({ themes: [expect.objectContaining({ id: 'theme-2' })] }),
			[{ themeId: 'theme-2', conflict: 'overwrite' }]
		);
	});
});
