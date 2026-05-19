<script lang="ts" module>
	import type { HslColor, RgbColor } from './color';

	function validateName(value: string, existingNames: string[]) {
		const trimmed = value.trim();
		if (!trimmed) return 'Ramp name is required.';
		if (existingNames.some((name) => name.toLowerCase() === trimmed.toLowerCase()))
			return 'Ramp name must be unique.';
		return '';
	}

	function parseRgbDraft(value: string): RgbColor {
		const matches = value.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
		return { red: matches[0] ?? 0, green: matches[1] ?? 0, blue: matches[2] ?? 0 };
	}

	function parseHslDraft(value: string): HslColor {
		const matches = value.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
		return { hue: matches[0] ?? 0, saturation: matches[1] ?? 0, lightness: matches[2] ?? 0 };
	}
</script>

<script lang="ts">
	import {
		createSourceColor,
		parseSourceColor,
		sourceColorFromHsl,
		sourceColorFromRgb
	} from './color';
	import type { SourceColor, SourceColorFormat } from './model';
	import DialogShell from './ui/DialogShell.svelte';

	let {
		open,
		title = 'Add Color Ramp',
		initialName = '',
		initialSourceColor = createSourceColor({ lightness: 0.7, chroma: 0.1, hue: 0 }),
		existingNames = [],
		onconfirm = (_name: string, _sourceColor: SourceColor) => {},
		oncancel = () => {}
	} = $props<{
		open: boolean;
		title?: string;
		initialName?: string;
		initialSourceColor?: SourceColor;
		existingNames?: string[];
		onconfirm?: (name: string, sourceColor: SourceColor) => void;
		oncancel?: () => void;
	}>();

	let name = $state('');
	let sourceColor: SourceColor | null = $state(null);
	let format = $state<SourceColorFormat>('oklch');
	let textDraft = $state('');

	// Re-seed local drafts whenever the dialog is opened with new initial values.
	$effect.pre(() => {
		if (!open) return;
		name = initialName;
		sourceColor = initialSourceColor;
		format = initialSourceColor.format;
		textDraft = initialSourceColor.serialized;
	});
	let nameError = $derived(validateName(name, existingNames));
	let colorError = $derived(sourceColor ? '' : 'Enter a valid source color.');
	let canConfirm = $derived(!nameError && !colorError && sourceColor !== null);

	function switchFormat(next: SourceColorFormat) {
		format = next;
		if (sourceColor) sourceColor = createSourceColor(sourceColor.oklch, next);
		textDraft = sourceColor?.serialized ?? '';
	}

	function updateOklch(channel: 'lightness' | 'chroma' | 'hue', value: number) {
		const base = sourceColor?.oklch ?? { lightness: 0.7, chroma: 0.1, hue: 0 };
		sourceColor = createSourceColor({ ...base, [channel]: value }, 'oklch');
		textDraft = sourceColor.serialized;
	}

	function updateText(value: string) {
		textDraft = value;
		sourceColor = parseSourceColor(value, format);
	}

	function updateRgb(channel: 'red' | 'green' | 'blue', value: number) {
		const rgb = parseRgbDraft(textDraft);
		rgb[channel] = value;
		sourceColor = sourceColorFromRgb(rgb, 'rgb');
		textDraft = sourceColor.serialized;
	}

	function updateHsl(channel: 'hue' | 'saturation' | 'lightness', value: number) {
		const hsl = parseHslDraft(textDraft);
		hsl[channel] = value;
		sourceColor = sourceColorFromHsl(hsl, 'hsl');
		textDraft = sourceColor.serialized;
	}

	function confirm() {
		if (canConfirm && sourceColor) onconfirm(name.trim(), sourceColor);
	}

	function numeric(event: Event) {
		return Number((event.currentTarget as HTMLInputElement).value);
	}
</script>

<DialogShell {open} {title}>
	<div class="dialog-body">
		<label>Name <input aria-label="Ramp name" bind:value={name} /></label>
		{#if nameError}<p role="alert">{nameError}</p>{/if}

		<div role="group" aria-label="Source color format" class="segments">
			{#each ['oklch', 'hex', 'rgb', 'hsl'] as option}
				<button
					type="button"
					aria-pressed={format === option}
					onclick={() => switchFormat(option as SourceColorFormat)}>{option.toUpperCase()}</button
				>
			{/each}
		</div>

		{#if format === 'oklch'}
			<label
				>Lightness <input
					aria-label="Lightness"
					type="number"
					min="0"
					max="1"
					step="0.01"
					value={sourceColor?.oklch.lightness ?? 0}
					oninput={(event) => updateOklch('lightness', numeric(event))}
				/></label
			>
			<label
				>Chroma <input
					aria-label="Chroma"
					type="number"
					min="0"
					max="0.37"
					step="0.01"
					value={sourceColor?.oklch.chroma ?? 0}
					oninput={(event) => updateOklch('chroma', numeric(event))}
				/></label
			>
			<label
				>Hue <input
					aria-label="Hue"
					type="number"
					min="0"
					max="360"
					step="1"
					value={sourceColor?.oklch.hue ?? 0}
					oninput={(event) => updateOklch('hue', numeric(event))}
				/></label
			>
		{:else if format === 'hex'}
			<label
				>Hex <input
					aria-label="Hex"
					type="text"
					value={textDraft}
					oninput={(event) => updateText((event.currentTarget as HTMLInputElement).value)}
				/></label
			>
			<input
				aria-label="Native color picker"
				type="color"
				value={sourceColor?.serialized.startsWith('#') ? sourceColor.serialized : '#000000'}
				oninput={(event) => updateText((event.currentTarget as HTMLInputElement).value)}
			/>
		{:else if format === 'rgb'}
			<label
				>Red <input
					aria-label="Red"
					type="number"
					min="0"
					max="255"
					value={parseRgbDraft(textDraft).red}
					oninput={(event) => updateRgb('red', numeric(event))}
				/></label
			>
			<label
				>Green <input
					aria-label="Green"
					type="number"
					min="0"
					max="255"
					value={parseRgbDraft(textDraft).green}
					oninput={(event) => updateRgb('green', numeric(event))}
				/></label
			>
			<label
				>Blue <input
					aria-label="Blue"
					type="number"
					min="0"
					max="255"
					value={parseRgbDraft(textDraft).blue}
					oninput={(event) => updateRgb('blue', numeric(event))}
				/></label
			>
		{:else}
			<label
				>Hue <input
					aria-label="Hue"
					type="number"
					min="0"
					max="360"
					value={parseHslDraft(textDraft).hue}
					oninput={(event) => updateHsl('hue', numeric(event))}
				/></label
			>
			<label
				>Saturation <input
					aria-label="Saturation"
					type="number"
					min="0"
					max="100"
					value={parseHslDraft(textDraft).saturation}
					oninput={(event) => updateHsl('saturation', numeric(event))}
				/></label
			>
			<label
				>Lightness <input
					aria-label="Lightness"
					type="number"
					min="0"
					max="100"
					value={parseHslDraft(textDraft).lightness}
					oninput={(event) => updateHsl('lightness', numeric(event))}
				/></label
			>
		{/if}
		{#if colorError}<p role="alert">{colorError}</p>{/if}
		<p aria-label="Source color preview">{sourceColor?.serialized ?? 'Invalid color'}</p>
		<div class="actions">
			<button type="button" onclick={oncancel}>Cancel</button>
			<button type="button" disabled={!canConfirm} onclick={confirm}>Confirm</button>
		</div>
	</div>
</DialogShell>

<style>
	.dialog-body {
		display: grid;
		gap: 0.75rem;
	}
	.segments,
	.actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	[aria-pressed='true'] {
		font-weight: 700;
	}
	[role='alert'] {
		color: #b91c1c;
	}
</style>
