<script lang="ts">
	import { exportCssVariables } from './cssVariables';
	import type { Theme, ThemeVariant } from './model';

	let {
		theme,
		variant,
		onprefix = (_prefix: string) => {},
		copyText = async (text: string) => navigator.clipboard.writeText(text)
	} = $props<{
		theme: Theme;
		variant: ThemeVariant;
		onprefix?: (prefix: string) => void;
		copyText?: (text: string) => Promise<void>;
	}>();

	let prefixDraft = $state('');
	let message = $state('');
	let output = $derived(exportCssVariables(theme, variant));

	// Keep the prefix draft in sync when the active theme changes externally.
	$effect.pre(() => {
		prefixDraft = theme.cssPrefix;
	});

	function commitPrefix() {
		onprefix(prefixDraft);
		prefixDraft = output.prefix;
	}

	async function copyCss() {
		try {
			await copyText(output.css);
			message = 'CSS copied.';
		} catch {
			message = 'Could not copy CSS.';
		}
	}
</script>

<section aria-label="CSS Variables" class="css-variables">
	<header>
		<h2>CSS Variables</h2>
		<label>
			<span>Variable prefix</span>
			<input value={prefixDraft} oninput={(event) => (prefixDraft = event.currentTarget.value)} onblur={commitPrefix} />
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

<style>
	.css-variables { display: grid; gap: 1rem; }
	header { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
	label { display: grid; gap: 0.25rem; }
	pre { overflow: auto; padding: 1rem; border: 1px solid currentColor; border-radius: 0.5rem; }
</style>
