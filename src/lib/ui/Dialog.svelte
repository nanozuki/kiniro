<!--
@component
- Project modal dialog wrapper around Melt UI's native dialog builder.
- Callers own the open state through bind:open and provide body/actions snippets.
- The wrapper supplies labeling, backdrop, close control, focus trapping, and scroll lock.
-->

<script lang="ts">
	import { Dialog as MeltDialog } from 'melt/builders';
	import type { Snippet } from 'svelte';
	import type { HTMLDialogAttributes } from 'svelte/elements';

	type DialogProps = Omit<HTMLDialogAttributes, 'open'> & {
		open?: boolean;
		title: string;
		closeLabel?: string;
		onopenchange?: (open: boolean) => void;
		children: Snippet;
		actions?: Snippet;
	};

	let {
		open = $bindable(false),
		title,
		closeLabel = 'Close dialog',
		onopenchange = (_open: boolean) => {},
		children,
		actions,
		class: className = '',
		...dialogAttributes
	}: DialogProps = $props();

	const titleId = $props.id();
	const dialog = new MeltDialog({
		open: () => open,
		onOpenChange: (value) => {
			open = value;
			onopenchange(value);
		}
	});

	$effect(() => {
		dialog.open = open;
	});
</script>

<div {...dialog.overlay} class="dialog-overlay"></div>
<dialog
	{...dialog.content}
	{...dialogAttributes}
	aria-labelledby={open ? titleId : undefined}
	class={`dialog-content ${className}`.trim()}
>
	{#if open}
		<header>
			<h2 id={titleId}>{title}</h2>
			<button
				type="button"
				class="close"
				aria-label={closeLabel}
				onclick={() => (dialog.open = false)}>Close</button
			>
		</header>
		<div class="body">
			{@render children()}
		</div>
		{#if actions}
			<footer>
				{@render actions()}
			</footer>
		{/if}
	{/if}
</dialog>

<style>
	.dialog-overlay {
		position: fixed;
		inset: 0;
		z-index: 40;
		background: rgb(0 0 0 / 0.42);
		opacity: 0;
		transition: opacity 140ms ease;
	}
	.dialog-overlay[data-open] {
		opacity: 1;
	}
	.dialog-content {
		inline-size: min(32rem, calc(100vw - 2rem));
		max-block-size: min(42rem, calc(100dvh - 2rem));
		border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
		border-radius: 0.5rem;
		padding: 0;
		background: Canvas;
		color: CanvasText;
		box-shadow: 0 1rem 3rem rgb(0 0 0 / 0.22);
		opacity: 0;
		scale: 0.98;
		transition:
			opacity 140ms ease,
			scale 140ms ease;
	}
	.dialog-content::backdrop {
		display: none;
	}
	.dialog-content[data-open] {
		opacity: 1;
		scale: 1;
	}
	header,
	.body,
	footer {
		padding: 1rem;
	}
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		border-block-end: 1px solid color-mix(in srgb, currentColor 15%, transparent);
	}
	h2 {
		margin: 0;
		font-size: 1.1rem;
		line-height: 1.2;
	}
	.close {
		border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
		border-radius: 0.35rem;
		padding: 0.35rem 0.55rem;
		background: transparent;
		color: inherit;
		font: inherit;
		line-height: 1;
		cursor: pointer;
	}
	.body {
		display: grid;
		gap: 0.75rem;
		overflow: auto;
	}
	footer {
		display: flex;
		justify-content: end;
		gap: 0.5rem;
		flex-wrap: wrap;
		border-block-start: 1px solid color-mix(in srgb, currentColor 15%, transparent);
	}
</style>
