import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createDefaultTheme, createThemeVariant } from './model';
import ThemeManager from './ThemeManager.svelte';

function themes() {
	const first = createDefaultTheme({
		id: 'theme-1',
		name: 'Rose Pine',
		variantId: 'main',
		variantName: 'Main'
	});
	first.variants.push(createThemeVariant(first.structure, { id: 'moon', name: 'Moon' }));
	const second = createDefaultTheme({
		id: 'theme-2',
		name: 'Gruvbox',
		variantId: 'dark',
		variantName: 'Dark'
	});
	return [first, second];
}

describe('ThemeManager', () => {
	it('renders theme and variant navigation and selection callbacks', async () => {
		const onselecttheme = vi.fn();
		const onselectvariant = vi.fn();
		render(ThemeManager, {
			themes: themes(),
			selectedThemeId: 'theme-1',
			selectedVariantId: 'main',
			onselecttheme,
			onselectvariant
		});

		await expect
			.element(page.getByRole('button', { name: 'Rose Pine' }))
			.toHaveAttribute('aria-current', 'true');
		await page.getByRole('button', { name: 'Gruvbox' }).click();
		await page.getByRole('button', { name: 'Moon' }).click();
		expect(onselecttheme).toHaveBeenCalledWith('theme-2');
		expect(onselectvariant).toHaveBeenCalledWith('moon');
	});

	it('delegates create actions', async () => {
		const onaddtheme = vi.fn();
		const onaddvariant = vi.fn();
		render(ThemeManager, {
			themes: themes(),
			selectedThemeId: 'theme-1',
			selectedVariantId: 'main',
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
		render(ThemeManager, {
			themes: themes(),
			selectedThemeId: 'theme-1',
			selectedVariantId: 'main',
			onrenametheme,
			onrenamevariant,
			ondeletetheme,
			ondeletevariant
		});

		await page.getByRole('button', { name: 'Rename theme' }).click();
		await page.getByLabelText('Theme name').fill('Rosé');
		await page.getByRole('button', { name: 'Rename variant' }).click();
		await page.getByLabelText('Variant name').fill('Dawn');
		await page.getByRole('button', { name: 'Delete theme' }).click();
		await page.getByRole('button', { name: 'Delete variant' }).click();

		expect(onrenametheme).toHaveBeenCalledWith('theme-1', 'Rosé');
		expect(onrenamevariant).toHaveBeenCalledWith('main', 'Dawn');
		expect(ondeletetheme).toHaveBeenCalledWith('theme-1');
		expect(ondeletevariant).toHaveBeenCalledWith('main');
	});
});
