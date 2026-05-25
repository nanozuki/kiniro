import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createDefaultTheme } from '$lib/model';
import WorkspaceTabs from './WorkspaceTabs.svelte';

describe('WorkspaceTabs', () => {
	it('disables dependent tabs when the theme has no ramps', async () => {
		const onselect = vi.fn();
		render(WorkspaceTabs, { theme: createDefaultTheme(), activeTab: 'palette', onselect });

		await expect
			.element(page.getByRole('tab', { name: 'Palette' }))
			.toHaveAttribute('aria-selected', 'true');
		await expect.element(page.getByRole('tab', { name: 'CSS Variables' })).toBeDisabled();
		await expect.element(page.getByRole('tab', { name: 'Contrast Checker' })).toBeDisabled();
		await page.getByRole('tab', { name: 'CSS Variables' }).click({ force: true });
		expect(onselect).not.toHaveBeenCalledWith('cssVariables');
	});

	it('enables all tabs after a ramp exists', async () => {
		const theme = createDefaultTheme();
		theme.structure.families[0].ramps.push({ id: 'ramp-1', name: 'Accent' });
		const onselect = vi.fn();
		render(WorkspaceTabs, { theme, activeTab: 'cssVariables', onselect });

		await expect.element(page.getByRole('tab', { name: 'CSS Variables' })).toBeEnabled();
		await expect
			.element(page.getByRole('tab', { name: 'CSS Variables' }))
			.toHaveAttribute('aria-selected', 'true');
		await page.getByRole('tab', { name: 'Contrast Checker' }).click();
		expect(onselect).toHaveBeenCalledWith('contrastChecker');
	});
});
