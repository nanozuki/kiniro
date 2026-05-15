import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import CSSVariables from './CSSVariables.svelte';
import { createSourceColor } from './color';
import { createDefaultTheme } from './model';

function fixture() {
	const theme = createDefaultTheme();
	const family = theme.structure.families[0];
	family.name = 'Core';
	family.ramps.push({ id: 'ramp-1', name: 'Accent' });
	theme.variants[0].values.families[family.id].ramps['ramp-1'] = {
		sourceColor: createSourceColor({ lightness: 0.7, chroma: 0.12, hue: 210 }),
		swatchOverrides: {}
	};
	return { theme, variant: theme.variants[0] };
}

describe('CSSVariables', () => {
	it('renders generated output and usage example', async () => {
		render(CSSVariables, fixture());

		await expect.element(page.getByLabelText('Generated CSS')).toHaveTextContent('--color-default-accent-100');
		await expect.element(page.getByLabelText('Usage example')).toHaveTextContent('color: oklch(var(--color-default-accent-100) / 1);');
	});

	it('commits prefix changes on blur and lets the manager apply fallback normalization', async () => {
		const onprefix = vi.fn();
		render(CSSVariables, { ...fixture(), onprefix });

		await page.getByLabelText('Variable prefix').fill('');
		await page.getByRole('button', { name: 'Copy CSS' }).click();
		expect(onprefix).toHaveBeenCalledWith('');
		await expect.element(page.getByLabelText('Generated CSS')).toHaveTextContent('--color-default-accent-100');
	});

	it('reports copy success', async () => {
		const success = vi.fn().mockResolvedValue(undefined);
		const data = fixture();
		render(CSSVariables, { ...data, copyText: success });
		await page.getByRole('button', { name: 'Copy CSS' }).click();
		await expect.element(page.getByRole('status')).toHaveTextContent('CSS copied.');
		expect(success).toHaveBeenCalledWith(expect.stringContaining('--color-default-accent-100'));
	});

	it('reports copy failure', async () => {
		render(CSSVariables, { ...fixture(), copyText: vi.fn().mockRejectedValue(new Error('denied')) });
		await page.getByRole('button', { name: 'Copy CSS' }).click();
		await expect.element(page.getByRole('status')).toHaveTextContent('Could not copy CSS.');
	});
});
