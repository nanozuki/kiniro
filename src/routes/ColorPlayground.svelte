<script lang="ts">
	import Color from 'colorjs.io';
	import { computeLightness, computeSteps } from '$lib/lightness';
	import type { GroupData } from '$lib/storage';

	let { groups, prefix }: { groups: GroupData[]; prefix: string } = $props();

	type ColorRole = 'foreground' | 'background';
	type ColorChoice = { hex: string; varName?: string };
	type Rating = {
		label: string;
		description: string;
		aa: number;
		aaa: number | null;
	};
	type SwatchRow = { name: string; swatches: { hex: string; label: string; varName: string }[] };

	const RATINGS: Rating[] = [
		{
			label: 'Body text',
			description: 'Normal-size text',
			aa: 4.5,
			aaa: 7
		},
		{
			label: 'Large-scale text',
			description: 'At least 18pt, or 14pt bold',
			aa: 3,
			aaa: 4.5
		},
		{
			label: 'UI and graphics',
			description: 'Active controls, icons, graphs',
			aa: 3,
			aaa: null
		}
	];

	const MDN_CONTRAST =
		'https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Understanding_WCAG/Perceivable/Color_contrast';

	let active = $state<ColorRole>('foreground');
	let colors = $state<Record<ColorRole, ColorChoice>>({
		foreground: { hex: '#1a1a1a' },
		background: { hex: '#f5f5f5' }
	});

	function toHex(color: Color): string {
		const srgb = color.to('srgb').toGamut();
		const [r, g, b] = srgb.coords.map((v) => Math.round(Math.min(1, Math.max(0, v ?? 0)) * 255));
		return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
	}

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

	function colorLabel(choice: ColorChoice): string {
		return choice.varName ? `var(--${prefix}${choice.varName})` : choice.hex;
	}

	const ratio = $derived(contrastRatio(colors.foreground.hex, colors.background.hex));
	const colorPair = $derived(
		`${colorLabel(colors.foreground)} on ${colorLabel(colors.background)}`
	);

	const palette = $derived.by((): SwatchRow[] => {
		const rows: SwatchRow[] = [];
		for (const group of groups) {
			const steps = computeSteps(group);
			const lArr = computeLightness(group, steps);

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

	function chooseRole(role: ColorRole) {
		active = role;
	}

	function updateHex(role: ColorRole, hex: string) {
		colors[role] = { hex };
	}

	function pick(hex: string, varName: string) {
		colors[active] = { hex, varName };
	}
</script>

<div class="playground">
	<div class="controls">
		<button
			class="role-btn"
			class:active={active === 'background'}
			onclick={() => chooseRole('background')}
		>
			<span class="dot" style:background-color={colors.background.hex}></span>
			Background
		</button>
		<button
			class="role-btn"
			class:active={active === 'foreground'}
			onclick={() => chooseRole('foreground')}
		>
			<span class="dot" style:background-color={colors.foreground.hex}></span>
			Foreground
		</button>
	</div>

	<div class="inputs">
		<label>
			Background
			<input
				type="color"
				value={colors.background.hex}
				oninput={(e) => updateHex('background', e.currentTarget.value)}
			/>
			<input
				type="text"
				value={colorLabel(colors.background)}
				readonly
				onfocus={() => chooseRole('background')}
			/>
		</label>
		<label>
			Foreground
			<input
				type="color"
				value={colors.foreground.hex}
				oninput={(e) => updateHex('foreground', e.currentTarget.value)}
			/>
			<input
				type="text"
				value={colorLabel(colors.foreground)}
				readonly
				onfocus={() => chooseRole('foreground')}
			/>
		</label>
	</div>

	<div
		class="preview"
		style:background-color={colors.background.hex}
		style:color={colors.foreground.hex}
	>
		<span class="preview-text">Sample text</span>
		<div class="preview-bar" style:background-color={colors.foreground.hex}></div>
		<div class="preview-block" style:background-color={colors.foreground.hex}></div>
	</div>

	<div class="result">
		<div>
			<span class="result-label">Contrast</span>
			<strong>{ratio.toFixed(2)}:1</strong>
		</div>
		<span class="pair-label">{colorPair}</span>
	</div>

	<div class="ratings" aria-label="Color contrast ratings">
		<div class="rating-header">
			<span>Content type</span>
			<span>Minimum AA</span>
			<span>Enhanced AAA</span>
		</div>
		{#each RATINGS as rating (rating.label)}
			{@const passAA = ratio >= rating.aa}
			{@const passAAA = rating.aaa == null ? null : ratio >= rating.aaa}
			<div class="rating-row">
				<div>
					<strong>{rating.label}</strong>
					<span>{rating.description}</span>
				</div>
				<span class="badge" class:pass={passAA} class:fail={!passAA}>
					{passAA ? 'Pass' : 'Fail'}
					{rating.aa}:1
				</span>
				{#if passAAA === null}
					<span class="badge muted">Not defined</span>
				{:else}
					<span class="badge" class:pass={passAAA} class:fail={!passAAA}>
						{passAAA ? 'Pass' : 'Fail'}
						{rating.aaa}:1
					</span>
				{/if}
			</div>
		{/each}
	</div>

	<a class="source-link" href={MDN_CONTRAST} target="_blank" rel="noopener noreferrer">
		Contrast thresholds from MDN color contrast guidance
	</a>

	{#if palette.length > 0}
		<div class="palette">
			{#each palette as row (row.name)}
				<div class="palette-row">
					<span class="row-name">{row.name}</span>
					<div class="swatches">
						{#each row.swatches as s (s.label)}
							<button
								class="swatch"
								style:background-color={s.hex}
								title={`Set ${active} to ${s.label}`}
								aria-label={`Set ${active} to ${s.label}`}
								onclick={() => pick(s.hex, s.varName)}
							></button>
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

	.controls,
	.inputs {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.role-btn {
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

	.role-btn.active {
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

	.inputs label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #555;
	}

	.inputs input[type='color'] {
		width: 2.5rem;
		height: 2rem;
		padding: 0;
		border: 1px solid #ccc;
		border-radius: 4px;
		cursor: pointer;
	}

	.inputs input[type='text'] {
		width: 13rem;
		padding: 0.25rem 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-family: monospace;
		font-size: 0.8rem;
		color: #333;
		background: #f9fafb;
	}

	.preview {
		width: min(18rem, 100%);
		min-height: 8rem;
		border-radius: 8px;
		border: 1px solid rgba(0, 0, 0, 0.12);
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1rem;
		padding: 0.75rem;
	}

	.preview-text {
		font-size: 1rem;
		line-height: 1.5;
	}

	.preview-bar {
		width: 100%;
		height: 2px;
	}

	.preview-block {
		width: 100%;
		height: 4rem;
		border-radius: 4px;
	}

	.result {
		display: flex;
		align-items: baseline;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.result-label {
		margin-right: 0.5rem;
		font-size: 0.8rem;
		color: #666;
	}

	.result strong {
		font-family: monospace;
		font-size: 1.25rem;
	}

	.pair-label {
		font-family: monospace;
		font-size: 0.8rem;
		color: #666;
	}

	.ratings {
		display: flex;
		flex-direction: column;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		overflow: hidden;
	}

	.rating-header,
	.rating-row {
		display: grid;
		grid-template-columns: minmax(12rem, 1fr) minmax(8rem, auto) minmax(8rem, auto);
		gap: 0.75rem;
		align-items: center;
		padding: 0.65rem 0.75rem;
	}

	.rating-header {
		background: #f8f9fa;
		color: #666;
		font-size: 0.75rem;
		font-weight: 700;
	}

	.rating-row {
		border-top: 1px solid #e5e7eb;
		font-size: 0.8rem;
	}

	.rating-row div {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.rating-row span {
		color: #666;
	}

	.badge {
		font-size: 0.75rem;
		font-weight: 700;
		padding: 0.2rem 0.45rem;
		border-radius: 3px;
		text-align: center;
		white-space: nowrap;
	}

	.badge.pass {
		background: #dcfce7;
		color: #166534;
	}

	.badge.fail {
		background: #fee2e2;
		color: #991b1b;
	}

	.badge.muted {
		background: #f3f4f6;
		color: #6b7280;
	}

	.source-link {
		align-self: flex-start;
		font-size: 0.8rem;
		color: #666;
	}

	.source-link:hover {
		color: #111;
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
		padding: 0;
		border-radius: 4px;
		border: 1px solid rgba(0, 0, 0, 0.1);
		cursor: pointer;
	}

	.swatch:hover {
		transform: scale(1.15);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}

	.empty-msg {
		margin: 0;
		color: #888;
		font-size: 0.875rem;
	}

	@media (max-width: 720px) {
		.rating-header,
		.rating-row {
			grid-template-columns: 1fr;
		}

		.inputs label {
			width: 100%;
		}

		.inputs input[type='text'] {
			flex: 1;
			min-width: 0;
		}
	}
</style>
