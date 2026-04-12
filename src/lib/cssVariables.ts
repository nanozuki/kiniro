import Color from 'colorjs.io';
import type { GroupData } from './storage';
import { computeLightness, computeSteps } from './lightness';

export function generateCssVariables(groups: GroupData[], prefix: string): string {
	const lines: string[] = ['/* Usage: color: oklch(var(--your-var) / 0.5); */', ':root {'];

	for (const group of groups) {
		lines.push(`  /* ${group.name} */`);

		const steps = computeSteps(group);
		const lightness = computeLightness(group, steps);

		for (const color of group.colors) {
			try {
				const oklch = new Color(color.hex).to('oklch');
				const [, c, h] = oklch.coords;
				const C = c == null || isNaN(c) ? 0 : c;
				const H = h == null || isNaN(h) ? 0 : h;

				for (let i = 0; i < steps.length; i++) {
					const L = lightness[i];
					lines.push(
						`  --${prefix}${color.name}-${steps[i]}: ${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)};`
					);
				}
			} catch {
				// skip invalid colors
			}
		}

		lines.push('');
	}

	lines.push('}');
	return lines.join('\n');
}
