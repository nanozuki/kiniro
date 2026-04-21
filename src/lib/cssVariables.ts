import Color from 'colorjs.io';
import { buildVariantGroups, type PaletteData } from './palette';
import { computeLightness, computeSteps } from './lightness';

// Normalizes user-facing names into stable CSS custom-property name segments.
export function slugifyCssIdent(value: string): string {
	const slug = value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
	return slug || 'item';
}

// Exports palettes as OKLCH CSS custom properties using shared lightness logic.
export function generateCssVariables(palettes: PaletteData[], prefix: string): string {
	const lines: string[] = ['/* Usage: color: oklch(var(--your-var) / 0.5); */', ':root {'];

	for (const palette of palettes) {
		const paletteName = slugifyCssIdent(palette.name);
		lines.push(`  /* ${palette.name} */`);

		for (const variant of palette.variants) {
			const variantName = slugifyCssIdent(variant.name);
			lines.push(`  /* ${palette.name} / ${variant.name} */`);

			for (const group of buildVariantGroups(palette, variant)) {
				const groupName = slugifyCssIdent(group.name);
				const steps = computeSteps(group);
				const lightness = computeLightness(group, steps);

				for (const color of group.colors) {
					try {
						const oklch = new Color(color.hex).to('oklch');
						const [, c, h] = oklch.coords;
						const C = c == null || isNaN(c) ? 0 : c;
						const H = h == null || isNaN(h) ? 0 : h;
						const colorName = slugifyCssIdent(color.name);

						for (let i = 0; i < steps.length; i++) {
							const L = lightness[i];
							lines.push(
								`  --${prefix}${paletteName}-${variantName}-${groupName}-${colorName}-${steps[i]}: ${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)};`
							);
						}
					} catch {
						// Invalid imported seed colors should not prevent exporting valid colors.
					}
				}

				lines.push('');
			}
		}
	}

	lines.push('}');
	return lines.join('\n');
}
