import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createDefaultTheme, createThemeVariant } from '$lib/model';
import { getAppManagerContext } from '$lib/state/appContext';
import { createAppManager } from '$lib/state/state.svelte';
import { appManagerContextOption } from '$lib/state/testAppContext';
import Toaster from '$lib/ui/Toaster.svelte';
import ThemeManager from './ThemeManager.svelte';

function themes() {
	const first = createDefaultTheme({
		name: 'Rose Pine',
		variantName: 'Main'
	});
	first.variants.push(createThemeVariant(first.structure, { name: 'Moon' }));
	const second = createDefaultTheme({
		name: 'Gruvbox',
		variantName: 'Dark'
	});
	return [first, second];
}

function manager() {
	return createAppManager({ data: { themes: themes() } });
}

describe('ThemeManager', () => {
	it('renders theme and variant navigation and updates selection through context', async () => {
		const app = manager();
		render(ThemeManager, appManagerContextOption(app));

		await expect
			.element(page.getByRole('tab', { name: 'Rose Pine' }))
			.toHaveAttribute('aria-selected', 'true');
		await page.getByRole('tab', { name: 'Gruvbox' }).click();
		expect(app.ui.selection.themeId).toBe(app.data.themes[1].id);
		await page.getByRole('tab', { name: 'Rose Pine' }).click();
		await page.getByRole('tab', { name: 'Moon' }).click();
		expect(app.ui.selection.variantId).toBe(app.data.themes[0].variants[1].id);
	});

	it('creates themes and variants through context', async () => {
		const app = manager();
		render(ThemeManager, appManagerContextOption(app));

		await page.getByLabelText('Add theme').click();
		expect(app.data.themes).toHaveLength(3);
		await page.getByLabelText('Add variant').click();
		expect(app.selectedTheme?.variants).toHaveLength(2);
	});

	it('renames and deletes selected theme and variant', async () => {
		const app = manager();
		const selectedTheme = app.selectedTheme;
		const selectedVariant = app.selectedVariant;
		render(ThemeManager, appManagerContextOption(app));

		await page.getByRole('button', { name: 'Rename theme' }).click();
		await page.getByLabelText('Theme name').fill('Rose');
		await userEvent.keyboard('{Enter}');
		expect(selectedTheme?.name).toBe('Rose');

		await page.getByRole('button', { name: 'Rename variant' }).click();
		await page.getByLabelText('Variant name').fill('Dawn');
		await userEvent.keyboard('{Enter}');
		expect(app.selectedVariant?.name).toBe('Dawn');

		await page.getByRole('button', { name: 'Delete variant' }).click();
		expect(selectedTheme?.variants.some((variant) => variant.id === selectedVariant?.id)).toBe(
			false
		);
		await page.getByRole('button', { name: 'Delete theme' }).click();
		expect(app.data.themes.some((theme) => theme.id === selectedTheme?.id)).toBe(false);
	});

	it('submits inline renames with Enter and Escape', async () => {
		const app = manager();
		render(ThemeManager, appManagerContextOption(app));

		await page.getByRole('button', { name: 'Rename theme' }).click();
		await page.getByLabelText('Theme name').fill('Rose');
		await userEvent.keyboard('{Enter}');
		await expect.element(page.getByLabelText('Theme name')).not.toBeInTheDocument();
		expect(app.data.themes[0].name).toBe('Rose');

		await page.getByRole('button', { name: 'Rename variant' }).click();
		await page.getByLabelText('Variant name').fill('Dawn');
		await userEvent.keyboard('{Escape}');
		await expect.element(page.getByLabelText('Variant name')).not.toBeInTheDocument();
		expect(app.data.themes[0].variants[0].name).toBe('Dawn');
	});

	it('shows repair toasts for duplicate theme and variant names', async () => {
		const app = manager();
		render(Toaster);
		render(ThemeManager, appManagerContextOption(app));

		await page.getByRole('button', { name: 'Rename theme' }).click();
		await page.getByLabelText('Theme name').fill('Gruvbox');
		await userEvent.keyboard('{Enter}');

		expect(app.data.themes[0].name).toBe('Gruvbox 2');
		await expect
			.element(page.getByText('Theme name already exists; using "Gruvbox 2".'))
			.toBeInTheDocument();

		await page.getByRole('button', { name: 'Rename variant' }).click();
		await page.getByLabelText('Variant name').fill('Moon');
		await userEvent.keyboard('{Enter}');

		expect(app.data.themes[0].variants[0].name).toBe('Moon 2');
		await expect
			.element(page.getByText('Variant name already exists; using "Moon 2".'))
			.toBeInTheDocument();
	});

	it('supports repeated theme rename submissions when AppManager mutates nested state in place', async () => {
		const app = manager();
		render(ThemeManager, appManagerContextOption(app));

		await expect.element(page.getByRole('heading', { level: 2 })).toHaveTextContent('Rose Pine');

		await page.getByRole('button', { name: 'Rename theme' }).click();
		await page.getByLabelText('Theme name').fill('Rose');
		await userEvent.keyboard('{Enter}');
		await expect.element(page.getByRole('heading', { level: 2 })).toHaveTextContent('Rose');

		await page.getByRole('button', { name: 'Rename theme' }).click();
		await page.getByLabelText('Theme name').fill('Aurora');
		await userEvent.keyboard('{Enter}');
		await expect.element(page.getByRole('heading', { level: 2 })).toHaveTextContent('Aurora');
		await expect.element(page.getByRole('tab', { name: 'Aurora' })).toBeInTheDocument();
	});

	it('throws clearly when rendered without AppManager context', () => {
		expect(() => getAppManagerContext()).toThrow('AppManager context is required');
	});
});
