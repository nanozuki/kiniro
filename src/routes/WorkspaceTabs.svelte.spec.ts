import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createDefaultTheme } from '$lib/model';
import { createAppManager } from '$lib/state/state.svelte';
import { appManagerContextOption } from '$lib/state/testAppContext';
import WorkspaceTabs from './WorkspaceTabs.svelte';

describe('WorkspaceTabs', () => {
	it('disables dependent tabs when the theme has no ramps', async () => {
		const app = createAppManager({ data: { themes: [createDefaultTheme()] } });
		render(WorkspaceTabs, appManagerContextOption(app));

		await expect
			.element(page.getByRole('tab', { name: 'Palette' }))
			.toHaveAttribute('aria-selected', 'true');
		await expect.element(page.getByRole('tab', { name: 'CSS Variables' })).toBeDisabled();
		await expect.element(page.getByRole('tab', { name: 'Contrast Checker' })).toBeDisabled();
		await page.getByRole('tab', { name: 'CSS Variables' }).click({ force: true });
		expect(app.ui.workspaceTab).toBe('palette');
	});

	it('enables all tabs after a ramp exists', async () => {
		const theme = createDefaultTheme();
		theme.structure.families[0].ramps.push({ id: 'ramp-1', name: 'Accent' });
		const app = createAppManager({
			data: { themes: [theme] },
			ui: { workspaceTab: 'cssVariables' }
		});
		render(WorkspaceTabs, appManagerContextOption(app));

		await expect.element(page.getByRole('tab', { name: 'CSS Variables' })).toBeEnabled();
		await expect
			.element(page.getByRole('tab', { name: 'CSS Variables' }))
			.toHaveAttribute('aria-selected', 'true');
		await page.getByRole('tab', { name: 'Contrast Checker' }).click();
		expect(app.ui.workspaceTab).toBe('contrastChecker');
	});
});
