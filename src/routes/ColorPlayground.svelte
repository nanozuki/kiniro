<script lang="ts">
	import Color from 'colorjs.io';
	import type { GroupData } from '$lib/storage';

	let { groups, prefix }: { groups: GroupData[]; prefix: string } = $props();

	type Slot = 'bg' | 'text' | 'btn-bg' | 'btn-border' | 'btn-text';

	const SLOTS: { id: Slot; label: string }[] = [
		{ id: 'bg', label: 'Background' },
		{ id: 'text', label: 'Text' },
		{ id: 'btn-bg', label: 'Button BG' },
		{ id: 'btn-border', label: 'Button Border' },
		{ id: 'btn-text', label: 'Button Text' }
	];

	type SlotValue = { hex: string; varName?: string };

	let active = $state<Slot>('bg');
	let chosen = $state<Record<Slot, SlotValue>>({
		bg: { hex: '#f5f5f5' },
		text: { hex: '#1a1a1a' },
		'btn-bg': { hex: '#5a52d5' },
		'btn-border': { hex: '#4a42c5' },
		'btn-text': { hex: '#ffffff' }
	});

	function toHex(color: Color): string {
		const srgb = color.to('srgb').toGamut();
		const [r, g, b] = srgb.coords.map((v) => Math.round(Math.min(1, Math.max(0, v ?? 0)) * 255));
		return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
	}

	// WCAG 2.1 contrast ratio
	function relativeLuminance(hex: string): number {
		try {
			const color = new Color(hex).to('srgb');
			const [r, g, b] = color.coords.map((c) => {
				const v = Math.max(0, Math.min(1, c ?? 0));
				return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
			});
			return 0.2126 * r + 0.7152 * g + 0.0722 * b;
		} catch {
			return 0;
		}
	}

	function contrastRatio(hex1: string, hex2: string): number {
		const l1 = relativeLuminance(hex1);
		const l2 = relativeLuminance(hex2);
		const lighter = Math.max(l1, l2);
		const darker = Math.min(l1, l2);
		return (lighter + 0.05) / (darker + 0.05);
	}

	type ContrastCheck = {
		label: string;
		fg: string;
		bg: string;
		ratio: number;
		kind: 'text' | 'ui';
		large: boolean;
		link: string;
	};

	const WCAG_CONTRAST = 'https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html';
	const WCAG_NON_TEXT = 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html';

	let textLarge = $state(false);

	const contrasts = $derived<ContrastCheck[]>([
		{
			label: 'Text on Background',
			fg: chosen.text.hex,
			bg: chosen.bg.hex,
			ratio: contrastRatio(chosen.text.hex, chosen.bg.hex),
			kind: 'text',
			large: textLarge,
			link: WCAG_CONTRAST
		},
		{
			label: 'Button text on Button BG',
			fg: chosen['btn-text'].hex,
			bg: chosen['btn-bg'].hex,
			ratio: contrastRatio(chosen['btn-text'].hex, chosen['btn-bg'].hex),
			kind: 'text',
			large: false,
			link: WCAG_CONTRAST
		},
		{
			label: 'Button border on Background',
			fg: chosen['btn-border'].hex,
			bg: chosen.bg.hex,
			ratio: contrastRatio(chosen['btn-border'].hex, chosen.bg.hex),
			kind: 'ui',
			large: false,
			link: WCAG_NON_TEXT
		}
	]);

	const cssOutput = $derived.by(() => {
		function val(slot: Slot): string {
			const v = chosen[slot];
			return v.varName ? `oklch(var(--${prefix}${v.varName}))` : v.hex;
		}
		return [
			'/* Container */',
			`background-color: ${val('bg')};`,
			`color: ${val('text')};`,
			'',
			'/* Button */',
			`background-color: ${val('btn-bg')};`,
			`border-color: ${val('btn-border')};`,
			`color: ${val('btn-text')};`
		].join('\n');
	});

	type SwatchRow = { name: string; swatches: { hex: string; label: string; varName: string }[] };

	const palette = $derived.by((): SwatchRow[] => {
		const rows: SwatchRow[] = [];
		for (const group of groups) {
			const steps: number[] = [];
			if (group.halfStepBefore) steps.push(50);
			for (let k = 1; k <= group.stepsCount; k++) steps.push(k * 100);
			if (group.halfStepAfter) steps.push(group.stepsCount * 100 + 50);

			const totalSteps =
				group.stepsCount -
				1 +
				0.5 * (group.halfStepBefore ? 1 : 0) +
				0.5 * (group.halfStepAfter ? 1 : 0);
			const stepSize = (group.lightnessMax - group.lightnessMin) / totalSteps;
			const lArr = steps.map((step) => {
				let pos: number;
				if (step === 50) pos = 0;
				else if (step === group.stepsCount * 100 + 50) pos = totalSteps;
				else {
					const k = step / 100;
					pos = group.halfStepBefore ? k - 0.5 : k - 1;
				}
				return group.lightnessMax - pos * stepSize;
			});
			if (group.reversed) lArr.reverse();

			for (const color of group.colors) {
				try {
					const oklch = new Color(color.hex).to('oklch');
					const [, c, h] = oklch.coords;
					const C = c == null || isNaN(c) ? 0 : c;
					const H = h == null || isNaN(h) ? 0 : h;
					rows.push({
						name: `${group.name} / ${color.name}`,
						swatches: steps.map((step, i) => ({
							hex: toHex(new Color('oklch', [lArr[i], C, H])),
							label: `${color.name}-${step}`,
							varName: `${color.name}-${step}`
						}))
					});
				} catch {
					// skip invalid colors
				}
			}
		}
		return rows;
	});

	function pick(hex: string, varName: string) {
		chosen[active] = { hex, varName };
	}
</script>

<div class="playground">
	<div class="slots">
		{#each SLOTS as slot (slot.id)}
			<button
				class="slot-btn"
				class:active={active === slot.id}
				onclick={() => (active = slot.id)}
			>
				<span class="dot" style:background-color={chosen[slot.id].hex}></span>
				{slot.label}
			</button>
		{/each}
		<label class="large-label">
			<input type="checkbox" bind:checked={textLarge} />
			Large text
		</label>
	</div>

	<div
		class="preview"
		style:background-color={chosen.bg.hex}
		style:color={chosen.text.hex}
		onclick={() => (active = 'bg')}
		onkeydown={(e) => e.key === 'Enter' && (active = 'bg')}
		role="button"
		tabindex="0"
		aria-label="Select background color"
	>
		<div
			class="preview-text"
			style:font-size={textLarge ? '1.5rem' : '1rem'}
			onclick={(e) => {
				e.stopPropagation();
				active = 'text';
			}}
			onkeydown={(e) => {
				if (e.key === 'Enter') {
					e.stopPropagation();
					active = 'text';
				}
			}}
			role="button"
			tabindex="0"
			aria-label="Select text color"
		>
			The quick brown fox jumps over the lazy dog.
		</div>
		<button
			class="preview-btn"
			style:background-color={chosen['btn-bg'].hex}
			style:border-color={chosen['btn-border'].hex}
			style:color={chosen['btn-text'].hex}
			onclick={(e) => {
				e.stopPropagation();
				active = 'btn-bg';
			}}
			aria-label="Select button color"
		>
			<span
				onclick={(e) => {
					e.stopPropagation();
					active = 'btn-text';
				}}
				onkeydown={(e) => {
					if (e.key === 'Enter') {
						e.stopPropagation();
						active = 'btn-text';
					}
				}}
				role="button"
				tabindex="0"
				aria-label="Select button text color"
			>
				Click me
			</span>
		</button>
	</div>

	<div class="info-row">
		<pre class="css-output">{cssOutput}</pre>

		<div class="contrast-checks">
			{#each contrasts as c (c.label)}
				{@const aaThreshold = c.kind === 'ui' ? 3 : c.large ? 3 : 4.5}
				{@const aaaThreshold = c.large ? 4.5 : 7}
				{@const passAA = c.ratio >= aaThreshold}
				{@const passAAA = c.ratio >= aaaThreshold}
				<div class="contrast-row">
					<span class="contrast-swatches">
						<span class="cswatch" style:background-color={c.fg}></span>
						<span class="cswatch" style:background-color={c.bg}></span>
					</span>
					<span class="contrast-label">
						{c.label}<a class="std-link" href={c.link} target="_blank" rel="noopener noreferrer">↗</a>
					</span>
						<span class="contrast-ratio">{c.ratio.toFixed(2)}:1</span>
					<span class="badge" class:pass={passAA} class:fail={!passAA}>AA</span>
					{#if c.kind === 'text'}
						<span class="badge" class:pass={passAAA} class:fail={!passAAA}>AAA</span>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	{#if palette.length > 0}
		<div class="palette">
			{#each palette as row (row.name)}
				<div class="palette-row">
					<span class="row-name">{row.name}</span>
					<div class="swatches">
						{#each row.swatches as s (s.label)}
							<div
								class="swatch"
								style:background-color={s.hex}
								title={s.label}
								onclick={() => pick(s.hex, s.varName)}
								onkeydown={(e) => e.key === 'Enter' && pick(s.hex, s.varName)}
								role="button"
								tabindex="0"
							></div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p class="empty-msg">Add color groups above to see the palette here.</p>
	{/if}
</div>

<style>
	.playground {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 8px;
	}

	.slots {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.slot-btn {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.7rem;
		font-size: 0.8rem;
		background: none;
		border: 1px solid #ccc;
		border-radius: 20px;
		cursor: pointer;
		color: #555;
	}

	.slot-btn.active {
		border-color: #907aa9;
		color: #907aa9;
		background: #f3f0f7;
	}

	.dot {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
		border: 1px solid rgba(0, 0, 0, 0.15);
		flex-shrink: 0;
	}

	.preview {
		padding: 1.5rem;
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		cursor: pointer;
		outline: none;
	}

	.preview-text {
		margin: 0;
		font-size: 1rem;
		line-height: 1.5;
		border-radius: 4px;
		padding: 0.25rem;
		cursor: pointer;
		outline: none;
	}

	.preview-btn {
		align-self: flex-start;
		padding: 0.5rem 1.25rem;
		border: 2px solid;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.info-row {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		align-items: flex-start;
	}

	.css-output {
		flex: 1;
		min-width: 16rem;
		margin: 0;
		padding: 0.75rem 1rem;
		background: #f8f9fa;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		font-family: monospace;
		font-size: 0.8rem;
		line-height: 1.6;
		color: #333;
		white-space: pre;
	}

	.contrast-checks {
		flex: 1;
		min-width: 20rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.contrast-row {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.8rem;
	}

	.contrast-swatches {
		display: flex;
		gap: 2px;
		flex-shrink: 0;
	}

	.cswatch {
		width: 1rem;
		height: 1rem;
		border-radius: 3px;
		border: 1px solid rgba(0, 0, 0, 0.12);
		display: inline-block;
	}

	.contrast-label {
		flex: 1;
		color: #555;
	}

	.std-link {
		margin-left: 0.25rem;
		font-size: 0.65rem;
		color: #aaa;
		text-decoration: none;
		vertical-align: super;
	}

	.std-link:hover {
		color: #907aa9;
	}

	.large-label {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: #555;
		cursor: pointer;
		flex-shrink: 0;
		white-space: nowrap;
	}

	.contrast-ratio {
		font-family: monospace;
		font-size: 0.8rem;
		color: #333;
		min-width: 4rem;
		text-align: right;
	}

	.badge {
		font-size: 0.7rem;
		font-weight: 700;
		padding: 0.1rem 0.4rem;
		border-radius: 3px;
		min-width: 2.5rem;
		text-align: center;
	}

	.badge.pass {
		background: #dcfce7;
		color: #166534;
	}

	.badge.fail {
		background: #fee2e2;
		color: #991b1b;
	}

	.palette {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.palette-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.row-name {
		font-size: 0.75rem;
		color: #888;
		min-width: 8rem;
		white-space: nowrap;
		font-family: monospace;
	}

	.swatches {
		display: flex;
		gap: 0.2rem;
		flex-wrap: wrap;
	}

	.swatch {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 4px;
		border: 1px solid rgba(0, 0, 0, 0.1);
		cursor: pointer;
	}

	.swatch:hover {
		transform: scale(1.15);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}

	.empty-msg {
		font-size: 0.875rem;
		color: #888;
		text-align: center;
		padding: 1rem;
		margin: 0;
	}
</style>
