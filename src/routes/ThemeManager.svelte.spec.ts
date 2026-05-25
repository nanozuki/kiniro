import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createDefaultTheme, createThemeVariant } from '$lib/model';
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
			onrenametheme,
			onrenamevariant,
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
});
