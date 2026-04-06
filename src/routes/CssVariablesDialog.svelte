<script lang="ts">
	import { generateCssVariables } from '$lib/cssVariables';
	import type { GroupData } from '$lib/storage';

	let { groups, open = $bindable(false) }: { groups: GroupData[]; open: boolean } = $props();

	let prefix = $state('color-');
	let dialog: HTMLDialogElement;
	let copied = $state(false);

	const css = $derived(generateCssVariables(groups, prefix));

	$effect(() => {
		if (open) {
			dialog?.showModal();
		} else {
			dialog?.close();
		}
	});

	function close() {
		open = false;
	}

	async function copy() {
		await navigator.clipboard.writeText(css);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}
</script>

<dialog bind:this={dialog} onclose={close} onclick={(e) => e.target === dialog && close()}>
	<div class="dialog-content">
		<div class="dialog-header">
			<h2>CSS Variables</h2>
			<button class="close-btn" onclick={close}>✕</button>
		</div>
		<div class="prefix-row">
			<label for="prefix">Prefix</label>
			<input id="prefix" type="text" bind:value={prefix} placeholder="color-" />
			<span class="example">e.g. <code>--{prefix}primary-500</code></span>
		</div>
		<div class="code-wrapper">
			<pre>{css}</pre>
		</div>
		<div class="dialog-footer">
			<button class="copy-btn" onclick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
		</div>
	</div>
</dialog>

<style>
	dialog {
		padding: 0;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
		max-width: 640px;
		width: 90vw;
		max-height: 80vh;
		display: flex;
		flex-direction: column;
	}

	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
	}

	.dialog-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
		overflow: hidden;
		height: 100%;
	}

	.dialog-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	h2 {
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
	}

	.close-btn {
		background: none;
		border: none;
		cursor: pointer;
		color: #888;
		font-size: 0.875rem;
		padding: 0.25rem;
		line-height: 1;
	}

	.close-btn:hover {
		color: #111;
	}

	.prefix-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.875rem;
		color: #555;
	}

	.prefix-row input {
		padding: 0.25rem 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.875rem;
		width: 8rem;
	}

	.example {
		color: #888;
		font-size: 0.8rem;
	}

	code {
		font-family: monospace;
		background: #f3f4f6;
		padding: 0.1rem 0.3rem;
		border-radius: 3px;
	}

	.code-wrapper {
		overflow: auto;
		flex: 1;
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
	}

	pre {
		margin: 0;
		padding: 1rem;
		font-family: monospace;
		font-size: 0.8rem;
		line-height: 1.6;
		white-space: pre;
	}

	.dialog-footer {
		display: flex;
		justify-content: flex-end;
	}

	.copy-btn {
		padding: 0.4rem 1rem;
		background: #111;
		color: #fff;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.copy-btn:hover {
		background: #333;
	}
</style>
