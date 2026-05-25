<!--
@component
- Global toast renderer backed by Melt UI's toaster builder.
- Exposes addToast from module context so validation and persistence code can report transient messages.
- Mount once near the application root; callers should not create their own toaster instances.
-->

<script lang="ts" module>
	import { Toaster as MeltToaster } from 'melt/builders';

	type ToastData = {
		title: string;
		description?: string;
	};

	const toaster = new MeltToaster<ToastData>();

	export const addToast = toaster.addToast;
</script>

<div {...toaster.root} class="toaster">
	{#each toaster.toasts as toast (toast.id)}
		<div {...toast.content} class="toast">
			<div class="content">
				<strong {...toast.title}>{toast.data.title}</strong>
				{#if toast.data.description}
					<p {...toast.description}>{toast.data.description}</p>
				{/if}
			</div>
			<button {...toast.close} type="button" aria-label="Dismiss notification">×</button>
		</div>
	{/each}
</div>

<style>
	.toaster {
		position: fixed;
		inset: unset;
		inset-block-start: 1rem;
		inset-inline-end: 1rem;
		z-index: 100;
		display: grid;
		gap: 0.5rem;
		inline-size: min(24rem, calc(100vw - 2rem));
		pointer-events: none;
	}
	.toast {
		display: flex;
		align-items: start;
		justify-content: space-between;
		gap: 1rem;
		border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
		border-radius: 0.5rem;
		padding: 0.75rem;
		background: Canvas;
		color: CanvasText;
		box-shadow: 0 0.5rem 1.5rem rgb(0 0 0 / 0.18);
		pointer-events: auto;
	}
	.content {
		display: grid;
		gap: 0.25rem;
	}
	p {
		margin: 0;
	}
	button {
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		line-height: 1;
		cursor: pointer;
	}
</style>
