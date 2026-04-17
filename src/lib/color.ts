import Color from 'colorjs.io';

export type BaseOklch = { l: number; c: number; h: number };

// Converts any Color.js color to a display-safe six-digit sRGB hex string.
export function toDisplayHex(color: Color): string {
	const srgb = color.to('srgb').toGamut();
	const [r, g, b] = srgb.coords.map((v) => Math.round(Math.min(1, Math.max(0, v ?? 0)) * 255));
	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Parses a seed color into OKLCH coordinates used for generated palette rows.
export function parseBaseOklch(hex: string): BaseOklch | null {
	try {
		const oklch = new Color(hex).to('oklch');
		const [lightness, chroma, hue] = oklch.coords;
		const l = lightness == null || isNaN(lightness) ? 0 : lightness;
		const c = chroma == null || isNaN(chroma) ? 0 : chroma;
		const h = hue == null || isNaN(hue) ? 0 : hue;
		return { l, c, h };
	} catch {
		return null;
	}
}
