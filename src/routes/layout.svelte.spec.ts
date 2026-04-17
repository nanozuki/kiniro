import { createRawSnippet } from 'svelte';
import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Layout from './+layout.svelte';

describe('+layout.svelte', () => {
	it('renders route content and installs the favicon link', async () => {
		const children = createRawSnippet(() => ({
			render: () => '<main>Palette content</main>'
		}));

		render(Layout, { children });

		await expect.element(page.getByText('Palette content')).toBeInTheDocument();
		expect(document.querySelector('link[rel="icon"]')).not.toBeNull();
	});
});
