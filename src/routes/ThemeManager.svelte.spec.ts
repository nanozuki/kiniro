import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createInlineEditSession, type InlineEditSubmitResult } from '$lib/ui/InlineInput.svelte';
import { createDefaultTheme, createThemeVariant } from '$lib/model';
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

function editSession(
	callback: (id: string, name: string) => void,
	resolve: (draft: string, previous: string) => InlineEditSubmitResult = (draft) => ({
		value: draft
	})
) {
	return (id: string) =>
		createInlineEditSession({
			preview: (draft) => callback(id, draft),
			submit: (draft) => {
				const result = resolve(draft, '');
				callback(id, result.value);
				return result;
			}
		});
}

describe('ThemeManager', () => {
	it('renders theme and variant navigation and selection callbacks', async () => {
		const onselecttheme = vi.fn();
		const onselectvariant = vi.fn();
		const renderedThemes = themes();
		render(ThemeManager, {
			themes: renderedThemes,
			selectedThemeId: renderedThemes[0].id,
			selectedVariantId: renderedThemes[0].variants[0].id,
			onselecttheme,
			onselectvariant
		});

		await expect
			.element(page.getByRole('tab', { name: 'Rose Pine' }))
			.toHaveAttribute('aria-selected', 'true');
		await page.getByRole('tab', { name: 'Gruvbox' }).click();
		await page.getByRole('tab', { name: 'Moon' }).click();
		expect(onselecttheme).toHaveBeenCalledWith(renderedThemes[1].id);
		expect(onselectvariant).toHaveBeenCalledWith(renderedThemes[0].variants[1].id);
	});

	it('delegates create actions', async () => {
		const onaddtheme = vi.fn();
		const onaddvariant = vi.fn();
		const renderedThemes = themes();
		render(ThemeManager, {
			themes: renderedThemes,
			selectedThemeId: renderedThemes[0].id,
			selectedVariantId: renderedThemes[0].variants[0].id,
			onaddtheme,
			onaddvariant
		});

		await page.getByLabelText('Add theme').click();
		await page.getByLabelText('Add variant').click();
		expect(onaddtheme).toHaveBeenCalled();
		expect(onaddvariant).toHaveBeenCalled();
	});

	it('renames and deletes selected theme and variant', async () => {
		const onrenametheme = vi.fn();
		const onrenamevariant = vi.fn();
		const ondeletetheme = vi.fn();
		const ondeletevariant = vi.fn();
		const renderedThemes = themes();
		const selectedTheme = renderedThemes[0];
		const selectedVariant = selectedTheme.variants[0];
		render(ThemeManager, {
			themes: renderedThemes,
			selectedThemeId: selectedTheme.id,
			selectedVariantId: selectedVariant.id,
			onedittheme: editSession(onrenametheme),
			oneditvariant: editSession(onrenamevariant),
			ondeletetheme,
			ondeletevariant
		});

		await page.getByRole('button', { name: 'Rename theme' }).click();
		await page.getByLabelText('Theme name').fill('Rosé');
		await page.getByRole('button', { name: 'Delete theme' }).click();
		await page.getByRole('button', { name: 'Rename variant' }).click();
		await page.getByLabelText('Variant name').fill('Dawn');
		await page.getByRole('button', { name: 'Delete theme' }).click();
		await page.getByRole('button', { name: 'Delete variant' }).click();

		expect(onrenametheme).toHaveBeenCalledWith(selectedTheme.id, 'Rosé');
		expect(onrenamevariant).toHaveBeenCalledWith(selectedVariant.id, 'Dawn');
		expect(ondeletetheme).toHaveBeenCalledWith(selectedTheme.id);
		expect(ondeletevariant).toHaveBeenCalledWith(selectedVariant.id);
	});

	it('submits inline renames with Enter and Escape', async () => {
		const onrenametheme = vi.fn();
		const onrenamevariant = vi.fn();
		const renderedThemes = themes();
		const selectedTheme = renderedThemes[0];
		const selectedVariant = selectedTheme.variants[0];
		render(ThemeManager, {
			themes: renderedThemes,
			selectedThemeId: selectedTheme.id,
			selectedVariantId: selectedVariant.id,
			onedittheme: editSession(onrenametheme),
			oneditvariant: editSession(onrenamevariant)
		});

		await page.getByRole('button', { name: 'Rename theme' }).click();
		await page.getByLabelText('Theme name').fill('Rosé');
		await userEvent.keyboard('{Enter}');
		await expect.element(page.getByLabelText('Theme name')).not.toBeInTheDocument();
		expect(onrenametheme).toHaveBeenLastCalledWith(selectedTheme.id, 'Rosé');

		await page.getByRole('button', { name: 'Rename variant' }).click();
		await page.getByLabelText('Variant name').fill('Dawn');
		await userEvent.keyboard('{Escape}');
		await expect.element(page.getByLabelText('Variant name')).not.toBeInTheDocument();
		expect(onrenamevariant).toHaveBeenLastCalledWith(selectedVariant.id, 'Dawn');
	});

	it('shows repair toasts for duplicate theme and variant names', async () => {
		const onrenametheme = vi.fn();
		const onrenamevariant = vi.fn();
		const renderedThemes = themes();
		const selectedTheme = renderedThemes[0];
		const selectedVariant = selectedTheme.variants[0];
		render(Toaster);
		render(ThemeManager, {
			themes: renderedThemes,
			selectedThemeId: selectedTheme.id,
			selectedVariantId: selectedVariant.id,
			onedittheme: editSession(onrenametheme, (draft) =>
				draft === 'Gruvbox'
					? {
							value: 'Gruvbox 2',
							error: 'Theme name already exists; using "Gruvbox 2".'
						}
					: { value: draft }
			),
			oneditvariant: editSession(onrenamevariant, (draft) =>
				draft === 'Moon'
					? {
							value: 'Moon 2',
							error: 'Variant name already exists; using "Moon 2".'
						}
					: { value: draft }
			)
		});

		await page.getByRole('button', { name: 'Rename theme' }).click();
		await page.getByLabelText('Theme name').fill('Gruvbox');
		await userEvent.keyboard('{Enter}');

		expect(onrenametheme).toHaveBeenLastCalledWith(selectedTheme.id, 'Gruvbox 2');
		await expect
			.element(page.getByText('Theme name already exists; using "Gruvbox 2".'))
			.toBeInTheDocument();

		await page.getByRole('button', { name: 'Rename variant' }).click();
		await page.getByLabelText('Variant name').fill('Moon');
		await userEvent.keyboard('{Enter}');

		expect(onrenamevariant).toHaveBeenLastCalledWith(selectedVariant.id, 'Moon 2');
		await expect
			.element(page.getByText('Variant name already exists; using "Moon 2".'))
			.toBeInTheDocument();
	});

	it('supports repeated theme rename submissions when the parent mutates nested state in place', async () => {
		const renderedThemes = themes();
		const selectedTheme = renderedThemes[0];
		const selectedVariant = selectedTheme.variants[0];
		const { rerender } = render(ThemeManager, {
			themes: renderedThemes,
			selectedThemeId: selectedTheme.id,
			selectedVariantId: selectedVariant.id,
			onedittheme: editSession((id, name) => {
				const theme = renderedThemes.find((item) => item.id === id);
				if (theme) theme.name = name;
			})
		});

		await expect.element(page.getByRole('heading', { level: 2 })).toHaveTextContent('Rose Pine');

		await page.getByRole('button', { name: 'Rename theme' }).click();
		await page.getByLabelText('Theme name').fill('Rosé');
		await userEvent.keyboard('{Enter}');
		await rerender({
			themes: renderedThemes,
			selectedThemeId: selectedTheme.id,
			selectedVariantId: selectedVariant.id,
			onedittheme: editSession((id, name) => {
				const theme = renderedThemes.find((item) => item.id === id);
				if (theme) theme.name = name;
			})
		});
		await expect.element(page.getByRole('heading', { level: 2 })).toHaveTextContent('Rosé');

		await page.getByRole('button', { name: 'Rename theme' }).click();
		await page.getByLabelText('Theme name').fill('Aurora');
		await userEvent.keyboard('{Enter}');
		await rerender({
			themes: renderedThemes,
			selectedThemeId: selectedTheme.id,
			selectedVariantId: selectedVariant.id,
			onedittheme: editSession((id, name) => {
				const theme = renderedThemes.find((item) => item.id === id);
				if (theme) theme.name = name;
			})
		});
		await expect.element(page.getByRole('heading', { level: 2 })).toHaveTextContent('Aurora');
		await expect.element(page.getByRole('tab', { name: 'Aurora' })).toBeInTheDocument();
	});
});
