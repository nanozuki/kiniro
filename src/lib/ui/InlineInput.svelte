<!--
@component
- Text-backed inline input for live-editing authored values outside dialogs.
- Keeps draft text local while callers own live mutation and final invalid-value repair.
- Enter, Escape, and blur all submit the current draft; Escape is not cancel.
-->

<script lang="ts">
	import type { AriaAttributes } from 'svelte/elements';
	import { addToast } from './Toaster.svelte';

	export type InlineInputSubmitResult = {
		value: string;
		error?: string;
	};

	type InlineInputProps = AriaAttributes & {
		value: string;
		disabled?: boolean;
		inputmode?: 'text' | 'numeric' | 'decimal';
		oninput?: (draft: string) => void;
		onsubmit?: (draft: string, previous: string) => InlineInputSubmitResult;
	};

	let {
		value,
		disabled = false,
		inputmode = 'text',
		oninput = (_draft: string) => {},
		onsubmit = (draft: string) => ({ value: draft }),
		...aria
	}: InlineInputProps = $props();

	let draft = $state('');
	let previous = $state('');
	let editing = $state(false);
	let submitted = $state(false);

	$effect.pre(() => {
		if (!editing && value !== draft) {
			draft = value;
			previous = value;
		}
	});

	function startEditing() {
		editing = true;
		previous = value;
		submitted = false;
	}

	function updateDraft(event: Event) {
		draft = event.currentTarget instanceof HTMLInputElement ? event.currentTarget.value : draft;
		submitted = false;
		oninput(draft);
	}

	function submitDraft() {
		if (submitted) return;
		const result = onsubmit(draft, previous);
		draft = result.value;
		previous = result.value;
		submitted = true;
		editing = false;
		if (result.error) {
			addToast({
				type: 'assertive',
				data: {
					title: 'Input adjusted',
					description: result.error
				}
			});
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.isComposing) return;
		if (event.key !== 'Enter' && event.key !== 'Escape') return;

		event.preventDefault();
		submitDraft();
	}
</script>

<input
	type="text"
	{disabled}
	{inputmode}
	value={draft}
	onfocus={startEditing}
	oninput={updateDraft}
	onblur={submitDraft}
	onkeydown={handleKeydown}
	{...aria}
/>
