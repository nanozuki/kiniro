import { page } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import InlineNameEditor from './InlineNameEditor.svelte';
import NumericOklchInput from './NumericOklchInput.svelte';
import ConfirmationDialog from './ConfirmationDialog.svelte';
import ToastArea from './ToastArea.svelte';
import TabButton from './TabButton.svelte';
import ColorCell from './ColorCell.svelte';

describe('next UI primitives', () => {
	it('commits inline names on blur', async () => {
		const oncommit = vi.fn();
		render(InlineNameEditor, { value: 'Theme', editing: true, oncommit });
		const input = page.getByLabelText('Name');
		await input.fill('New Theme');
		expect(oncommit).toHaveBeenCalledWith('New Theme');
	});

	it('normalizes numeric OKLCH input on blur', async () => {
		const oncommit = vi.fn();
		render(NumericOklchInput, { channel: 'chroma', value: 0.1, oncommit });
		const input = page.getByLabelText('Chroma');
		await input.fill('0.999');
		expect(oncommit).toHaveBeenCalledWith(0.37);
	});

	it('renders confirmation dialogs and callbacks', async () => {
		const onconfirm = vi.fn();
		render(ConfirmationDialog, { open: true, message: 'Delete family?', onconfirm });
		await page.getByRole('button', { name: 'Confirm' }).click();
		expect(onconfirm).toHaveBeenCalled();
	});

	it('renders tabs, toasts, and color cells', async () => {
		render(ToastArea, { messages: ['Saved'] });
		await expect.element(page.getByText('Saved')).toBeInTheDocument();
		render(TabButton, { label: 'Palette', selected: true });
		await expect.element(page.getByRole('button', { name: 'Palette' })).toHaveAttribute('aria-current', 'true');
		render(ColorCell, { label: 'base-100', hex: '#ffffff', warning: 'Outside sRGB. Preview is clamped.' });
		await expect.element(page.getByLabelText('Gamut warning')).toBeInTheDocument();
	});
});
