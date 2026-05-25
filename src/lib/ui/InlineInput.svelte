<!--
@component
- Text-backed inline input for live-editing authored values outside dialogs.
- Keeps draft text local while callers own live mutation and final invalid-value repair.
- Enter, Escape, and blur all submit the current draft; Escape is not cancel.
-->

<script lang="ts">
	import type { AriaAttributes } from 'svelte/elements';

	type InlineInputProps = AriaAttributes & {
		value: string;
		disabled?: boolean;
		inputmode?: 'text' | 'numeric' | 'decimal';
		oninput?: (draft: string) => void;
		onsubmit?: (draft: string, previous: string) => string;
	};

	let {
		value,
		disabled = false,
		inputmode = 'text',
		oninput = (_draft: string) => {},
		onsubmit = (draft: string) => draft,
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
		const resolved = onsubmit(draft, previous);
		draft = resolved;
		previous = resolved;
		submitted = true;
		editing = false;
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
