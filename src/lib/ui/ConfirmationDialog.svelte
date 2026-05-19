<script lang="ts">
	import DialogShell from './DialogShell.svelte';
	let {
		open = false,
		title = 'Confirm',
		message,
		onconfirm = () => {},
		oncancel = () => {}
	} = $props<{
		open?: boolean;
		title?: string;
		message: string;
		onconfirm?: () => void;
		oncancel?: () => void;
	}>();
</script>

<DialogShell {open} {title}>
	<p>{message}</p>
	<button type="button" onclick={oncancel}>Cancel</button>
	<button type="button" onclick={onconfirm}>Confirm</button>
</DialogShell>
