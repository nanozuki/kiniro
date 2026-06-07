import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createDefaultTheme, type SourceColorFormat } from '../model';
import { createSourceColor } from '../color';
import { generateFamily } from '../palette';
import { AppManager } from '../state/state.svelte';
import { appManagerContextOption } from '../state/testAppContext';
import ColorRamp from './ColorRamp.svelte';

describe('ColorRamp', () => {
	function rampFixture() {
		const theme = createDefaultTheme();
		const family = theme.structure.families[0];
		family.ramps.push({ id: 'ramp-1', name: 'Accent' });
		family.ramps.push({ id: 'ramp-2', name: 'Neutral' });
		theme.variants[0].values.families[family.id].ramps['ramp-1'] = {
			sourceColor: createSourceColor({ lightness: 0.7, chroma: 0.12, hue: 210 }),
			swatchOverrides: {}
		};
		theme.variants[0].values.families[family.id].ramps['ramp-2'] = {
			sourceColor: createSourceColor({ lightness: 0.65, chroma: 0.02, hue: 90 }),
			swatchOverrides: {}
		};
		return {
			theme,
			family,
			ramp: generateFamily(family, theme.variants[0], theme.targetGamut).ramps[0]
		};
	}

	it('renders the source cell and generated swatches', async () => {
		const { theme, family, ramp } = rampFixture();
		const app = new AppManager({ data: { themes: [theme] } });
		render(ColorRamp, {
			...appManagerContextOption(app),
			props: {
				familyId: family.id,
				ramp,
				sourceValue: 'oklch(0.7000 0.1200 210.00)',
				gamut: 'srgb',
				rampIndex: 0,
				rampCount: 2
			}
		});

		await expect.element(page.getByRole('heading', { name: 'Accent' })).toBeInTheDocument();
		await expect.element(page.getByText('L 0.7000 C 0.1200 H 210.00')).toBeInTheDocument();
		await expect.element(page.getByLabelText(/Accent-100/)).toBeInTheDocument();
	});

	it('deletes the ramp through context', async () => {
		const { theme, family, ramp } = rampFixture();
		const app = new AppManager({ data: { themes: [theme] } });
		const deleteRamp = vi.spyOn(app, 'deleteRamp');
		render(ColorRamp, {
			...appManagerContextOption(app),
			props: {
				familyId: family.id,
				ramp,
				sourceValue: 'oklch(0.7000 0.1200 210.00)',
				gamut: 'srgb',
				rampIndex: 0,
				rampCount: 2
			}
		});

		await page.getByRole('button', { name: 'Delete Color Ramp' }).click();
		expect(deleteRamp).toHaveBeenCalledWith(family.id, 'ramp-1');
	});

	it.each([
		{ input: '#ff0066', format: 'hex' },
		{ input: 'rgb(255 0 102)', format: 'rgb' },
		{ input: 'hsl(336 100% 50%)', format: 'hsl' },
		{ input: 'oklch(0.7 0.12 210)', format: 'oklch' }
	] satisfies { input: string; format: SourceColorFormat }[])(
		'edits the ramp source color from $format input',
		async ({ input, format }) => {
			const { theme, family, ramp } = rampFixture();
			const app = new AppManager({ data: { themes: [theme] } });
			const setRampSourceColor = vi.spyOn(app, 'setRampSourceColor');
			render(ColorRamp, {
				...appManagerContextOption(app),
				props: {
					familyId: family.id,
					ramp,
					sourceValue: 'oklch(0.7000 0.1200 210.00)',
					gamut: 'srgb',
					rampIndex: 0,
					rampCount: 2
				}
			});

			await page.getByRole('button', { name: 'Change Accent source color' }).click();
			await page.getByRole('textbox', { name: 'Source color' }).fill(input);
			await page.getByRole('button', { name: 'Apply changes' }).click();

			expect(setRampSourceColor).toHaveBeenCalledWith(
				family.id,
				'ramp-1',
				expect.objectContaining({ format })
			);
		}
	);

	it('shows source color format controls that rewrite the input', async () => {
		const { theme, family, ramp } = rampFixture();
		const app = new AppManager({ data: { themes: [theme] } });
		render(ColorRamp, {
			...appManagerContextOption(app),
			props: {
				familyId: family.id,
				ramp,
				sourceValue: 'oklch(0.7000 0.1200 210.00)',
				gamut: 'srgb',
				rampIndex: 0,
				rampCount: 2
			}
		});

		await page.getByRole('button', { name: 'Change Accent source color' }).click();
		const sourceInput = page.getByRole('textbox', { name: 'Source color' });
		const inputValue = () => (sourceInput.element() as HTMLInputElement).value;

		await page.getByRole('tab', { name: 'RGB' }).click();
		expect(inputValue()).toMatch(/^rgb\(/);
		await page.getByRole('tab', { name: 'HSL' }).click();
		expect(inputValue()).toMatch(/^hsl\(/);
		await page.getByRole('tab', { name: 'OKLCH' }).click();
		expect(inputValue()).toMatch(/^oklch\(/);
		await page.getByRole('tab', { name: 'Hex' }).click();
		expect(inputValue()).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('keeps the source color value stable when reselecting the active format tab', async () => {
		const { theme, family, ramp } = rampFixture();
		const app = new AppManager({ data: { themes: [theme] } });
		render(ColorRamp, {
			...appManagerContextOption(app),
			props: {
				familyId: family.id,
				ramp,
				sourceValue: 'hsl(342.79 74.33% 67.49%)',
				gamut: 'srgb',
				rampIndex: 0,
				rampCount: 2
			}
		});

		await page.getByRole('button', { name: 'Change Accent source color' }).click();
		const sourceInput = page.getByRole('textbox', { name: 'Source color' });
		const inputValue = () => (sourceInput.element() as HTMLInputElement).value;
		const initialValue = inputValue();

		await page.getByRole('tab', { name: 'HSL' }).click();
		await page.getByRole('tab', { name: 'HSL' }).click();

		expect(inputValue()).toBe(initialValue);
	});

	it('renames and moves the ramp through context', async () => {
		const { theme, family, ramp } = rampFixture();
		const app = new AppManager({ data: { themes: [theme] } });
		const previewRampName = vi.spyOn(app, 'previewRampName');
		const renameRamp = vi.spyOn(app, 'renameRamp');
		const moveRamp = vi.spyOn(app, 'moveRamp');
		render(ColorRamp, {
			...appManagerContextOption(app),
			props: {
				familyId: family.id,
				ramp,
				sourceValue: 'oklch(0.7000 0.1200 210.00)',
				gamut: 'srgb',
				rampIndex: 0,
				rampCount: 2
			}
		});

		await expect.element(page.getByRole('button', { name: 'Move Accent up' })).toBeDisabled();
		await page.getByRole('button', { name: 'Move Accent down' }).click();
		await page.getByRole('button', { name: 'Rename ramp' }).click();
		await page.getByLabelText('Ramp name').fill('Primary');
		await userEvent.keyboard('{Enter}');

		expect(moveRamp).toHaveBeenCalledWith(family.id, 'ramp-1', 1);
		expect(previewRampName).toHaveBeenCalledWith('ramp-1', 'Primary');
		expect(renameRamp).toHaveBeenCalledWith('ramp-1', 'Primary');
	});
});
