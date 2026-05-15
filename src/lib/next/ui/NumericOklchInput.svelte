<script lang="ts">
	import type { OklchChannel } from '../model';
	import { normalizeChannelValue } from '../color';

	let { channel, value, oncommit = (_value: number) => {} } = $props<{
		channel: OklchChannel;
		value: number;
		oncommit?: (value: number) => void;
	}>();
	let draft = $state(String(value));
	const label = channel === 'lightness' ? 'Lightness' : channel === 'chroma' ? 'Chroma' : 'Hue';
</script>

<label>{label}<input aria-label={label} inputmode="decimal" bind:value={draft} oninput={() => oncommit(normalizeChannelValue(channel, Number(draft || 0)))} onblur={() => oncommit(normalizeChannelValue(channel, Number(draft || 0)))} /></label>
