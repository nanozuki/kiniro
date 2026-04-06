import Color from 'colorjs.io';
import type { GroupData } from './storage';

const STEPS = [100, 200, 300, 400, 500, 600, 700, 800, 900];
const STEPS_COUNT = 9;

export function generateCssVariables(groups: GroupData[], prefix: string): string {
	const lines: string[] = [
		'/* Usage: color: oklch(var(--your-var) / 0.5); */',
		':root {'
	];

	for (const group of groups) {
		lines.push(`  /* ${group.name} */`);

		const lightness = Array.from(
			{ length: STEPS_COUNT },
			(_, i) =>
				group.lightnessMax - (group.lightnessMax - group.lightnessMin) * (i / (STEPS_COUNT - 1))
		);
		if (group.reversed) lightness.reverse();

		for (const color of group.colors) {
			try {
				const oklch = new Color(color.hex).to('oklch');
				const [, c, h] = oklch.coords;
				const C = c == null || isNaN(c) ? 0 : c;
				const H = h == null || isNaN(h) ? 0 : h;

				for (let i = 0; i < STEPS.length; i++) {
					const L = lightness[i];
					lines.push(
						`  --${prefix}${color.name}-${STEPS[i]}: ${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)};`
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
