import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createInlineEditSession } from './InlineInput.svelte';
import InlineInput from './InlineInput.svelte';
import Toaster from './Toaster.svelte';

describe('InlineInput', () => {
	it('emits live draft changes and submits resolved values with Enter', async () => {
		const preview = vi.fn();
		const onsubmit = vi.fn();
		render(InlineInput, {
			value: 'Theme',
			'aria-label': 'Name',
			session: createInlineEditSession({
				preview,
				submit: (draft) => {
					const resolved = draft.trim() || 'Theme';
					onsubmit(resolved);
					return { value: resolved };
				}
			})
		});

		const input = page.getByLabelText('Name');
		await input.fill('  Dawn  ');
		await userEvent.keyboard('{Enter}');

		expect(preview).toHaveBeenCalledWith('  Dawn  ');
		expect(onsubmit).toHaveBeenCalledWith('Dawn');
	});

	it('submits Escape like Enter instead of cancelling', async () => {
		const onsubmit = vi.fn();
		render(InlineInput, {
			value: 'Theme',
			'aria-label': 'Name',
			session: createInlineEditSession({
				submit: (draft) => {
					const resolved = draft.trim() || 'Theme';
					onsubmit(resolved);
					return { value: resolved };
				}
			})
		});

		const input = page.getByLabelText('Name');
		await input.fill('Moon');
		await userEvent.keyboard('{Escape}');

		expect(onsubmit).toHaveBeenCalledWith('Moon');
	});

	it('uses the start-of-edit value as the resolver fallback on blur', async () => {
		const onsubmit = vi.fn();
		render(InlineInput, {
			value: 'Theme',
			'aria-label': 'Name',
			session: createInlineEditSession({
				submit: (draft) => {
					const resolved = draft.trim() || 'Theme';
					onsubmit(resolved);
					return { value: resolved };
				}
			})
		});

		const input = page.getByLabelText('Name');
		await input.fill('');
		input.element().blur();

		expect(onsubmit).toHaveBeenCalledWith('Theme');
	});

	it('submits the current draft once when Enter also blurs the input', async () => {
		const onsubmit = vi.fn((draft: string) => ({ value: draft }));
		render(InlineInput, {
			value: 'Theme',
			'aria-label': 'Name',
			session: createInlineEditSession({ submit: onsubmit })
		});

		const input = page.getByLabelText('Name');
		await input.fill('Dawn');
		await userEvent.keyboard('{Enter}');
		input.element().blur();

		expect(onsubmit).toHaveBeenCalledTimes(1);
		expect(onsubmit).toHaveBeenCalledWith('Dawn');
	});

	it('ignores Enter while composing text', async () => {
		const onsubmit = vi.fn(() => ({ value: 'Theme' }));
		render(InlineInput, {
			value: 'Theme',
			'aria-label': 'Name',
			session: createInlineEditSession({ submit: onsubmit })
		});

		const input = page.getByLabelText('Name');
		await input.click();
		await input.element().dispatchEvent(
			new KeyboardEvent('keydown', {
				key: 'Enter',
				isComposing: true,
				bubbles: true
			})
		);

		expect(onsubmit).not.toHaveBeenCalled();
	});

	it('shows a toast when submit returns an error message', async () => {
		render(Toaster);
		render(InlineInput, {
			value: '0.5',
			'aria-label': 'Lightness',
			session: createInlineEditSession({
				submit: () => ({
					value: '1',
					error: 'Lightness must be between 0 and 1; adjusted to 1.'
				})
			})
		});

		const input = page.getByLabelText('Lightness');
		await input.fill('2');
		await userEvent.keyboard('{Enter}');

		await expect
			.element(page.getByText('Lightness must be between 0 and 1; adjusted to 1.'))
			.toBeInTheDocument();
	});
});
