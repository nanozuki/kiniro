<!--
@component
- Text-backed inline input for live-editing authored values outside dialogs.
- Accepts an edit session so callers own preview mutation and final invalid-value
  repair while the component owns only draft text and keyboard/blur behavior.
- Sends live draft changes to `session.preview`, then calls `session.submit`
  exactly once when editing finishes.
- Enter, Escape, and blur all submit the current draft; Escape is not cancel
  because undo/redo handles reversion.
- App-owned sessions should keep previews non-durable, then repair and commit
  once on submit.
-->

<script module lang="ts">
	export type InlineEditSubmitResult = {
		value: string;
		error?: string;
	};

	export type InlineEditSession = {
		preview: (draft: string) => void;
		submit: (draft: string) => InlineEditSubmitResult;
	};

	export function createInlineEditSession(options: {
		preview?: (draft: string) => void;
		submit?: (draft: string) => InlineEditSubmitResult;
	}): InlineEditSession {
		return {
			preview: options.preview ?? (() => {}),
			submit: options.submit ?? ((draft) => ({ value: draft }))
		};
	}
</script>

<script lang="ts">
	import type { AriaAttributes } from 'svelte/elements';
	import { addToast } from './Toaster.svelte';

	type InlineInputProps = AriaAttributes & {
		value: string;
		disabled?: boolean;
		inputmode?: 'text' | 'numeric' | 'decimal';
		session?: InlineEditSession;
	};

	let {
		value,
		disabled = false,
		inputmode = 'text',
		session = {
			preview: () => {},
			submit: (draft: string) => ({ value: draft })
		},
		...aria
	}: InlineInputProps = $props();

	let input: HTMLInputElement | null = $state(null);
	let activeSession: InlineEditSession | null = $state(null);
	let draft = $state('');
	let editing = $state(false);
	let submitted = $state(false);

	$effect.pre(() => {
		if (!editing && value !== draft) {
			draft = value;
			submitted = false;
		}
	});

	function startEditing() {
		if (editing) return;
		editing = true;
		submitted = false;
		draft = value;
		activeSession = session;
	}

	function updateDraft(event: Event) {
		draft = event.currentTarget instanceof HTMLInputElement ? event.currentTarget.value : draft;
		submitted = false;
		activeSession?.preview(draft);
	}

	function submitDraft() {
		if (submitted) return;
		const result = activeSession?.submit(draft) ?? { value: draft };
		draft = result.value;
		submitted = true;
		editing = false;
		activeSession = null;
		input?.blur();
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
	bind:this={input}
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
