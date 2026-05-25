import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import InlineInput from './InlineInput.svelte';

describe('InlineInput', () => {
	it('emits live draft changes and submits resolved values with Enter', async () => {
		const oninput = vi.fn();
		const onsubmit = vi.fn();
		render(InlineInput, {
			value: 'Theme',
			'aria-label': 'Name',
			oninput,
			onsubmit: (draft, previous) => {
				const resolved = draft.trim() || previous;
				onsubmit(resolved);
				return resolved;
			}
		});

		const input = page.getByLabelText('Name');
		await input.fill('  Dawn  ');
		await userEvent.keyboard('{Enter}');

		expect(oninput).toHaveBeenCalledWith('  Dawn  ');
		expect(onsubmit).toHaveBeenCalledWith('Dawn');
	});

	it('submits Escape like Enter instead of cancelling', async () => {
		const onsubmit = vi.fn();
		render(InlineInput, {
			value: 'Theme',
			'aria-label': 'Name',
			onsubmit: (draft, previous) => {
				const resolved = draft.trim() || previous;
				onsubmit(resolved);
				return resolved;
			}
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
			onsubmit: (draft, previous) => {
				const resolved = draft.trim() || previous;
				onsubmit(resolved);
				return resolved;
			}
		});

		const input = page.getByLabelText('Name');
		await input.fill('');
		input.element().blur();

		expect(onsubmit).toHaveBeenCalledWith('Theme');
	});

	it('ignores Enter while composing text', async () => {
		const onsubmit = vi.fn();
		render(InlineInput, { value: 'Theme', 'aria-label': 'Name', onsubmit });

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
});
