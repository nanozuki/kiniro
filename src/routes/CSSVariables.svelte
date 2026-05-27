<!--
@component
- Read-only CSS export workspace for the selected variant.
- The editable prefix belongs to the theme.
- Copy feedback stays local because copying does not mutate authored data.
-->

<script lang="ts">
	import { exportCssVariables, normalizeCssPrefix } from '$lib/cssVariables';
	import { getAppManagerContext } from '$lib/state/appContext';
	import { createInlineEditSession, type InlineEditSubmitResult } from '$lib/ui/InlineInput.svelte';
	import InlineInput from '$lib/ui/InlineInput.svelte';

	type CSSVariablesProps = {
		copyText?: (text: string) => Promise<void>;
	};

	let {
		copyText = async (text: string) => navigator.clipboard.writeText(text)
	}: CSSVariablesProps = $props();

	const app = getAppManagerContext();
	let prefixDraft = $state('');
	let lastThemeId = $state('');
	let message = $state('');
	let theme = $derived(app.selectedTheme);
	let variant = $derived(app.selectedVariant);
	let output = $derived(theme && variant ? exportCssVariables(theme, variant) : null);

	// Sync the prefix draft only when switching to a different theme.
	$effect.pre(() => {
		if (theme && theme.id !== lastThemeId) {
			prefixDraft = theme.cssPrefix;
			lastThemeId = theme.id;
		}
	});

	async function copyCss() {
		if (!output) return;
		try {
			await copyText(output.css);
			message = 'CSS copied.';
		} catch {
			message = 'Could not copy CSS.';
		}
	}

	function resolvePrefix(draft: string): InlineEditSubmitResult {
		const prefix = normalizeCssPrefix(draft);
		if (prefix === draft) return { value: prefix };

		return {
			value: prefix,
			error:
				prefix === 'color'
					? 'Variable prefix must contain a letter or number; using color.'
					: `Variable prefix was normalized to "${prefix}" for CSS variable names.`
		};
	}
</script>

{#if theme && variant && output}
	<section aria-label="CSS Variables" class="css-variables">
		<header>
			<h2>CSS Variables</h2>
			<label>
				<span>Variable prefix</span>
				<InlineInput
					aria-label="Variable prefix"
					value={prefixDraft}
					session={createInlineEditSession({
						submit: (draft) => {
							const result = resolvePrefix(draft);
							app.setThemeCssPrefix(theme.id, result.value);
							prefixDraft = result.value;
							return result;
						}
					})}
				/>
			</label>
		</header>

		<p>Export note: CSS variables are generated from the selected variant only.</p>
		<pre aria-label="Generated CSS"><code>{output.css}</code></pre>
		{#if output.usageExample}
			<pre aria-label="Usage example"><code>{output.usageExample}</code></pre>
		{/if}
		<button type="button" onclick={copyCss}>Copy CSS</button>
		{#if message}<p role="status">{message}</p>{/if}
	</section>
{/if}

<style>
	.css-variables {
		display: grid;
		gap: 1rem;
	}
	header {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}
	label {
		display: grid;
		gap: 0.25rem;
	}
	pre {
		overflow: auto;
		padding: 1rem;
		border: 1px solid currentColor;
		border-radius: 0.5rem;
	}
</style>
