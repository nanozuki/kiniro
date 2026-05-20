import Color from 'colorjs.io';
import type {
	Gamut,
	GamutPreview,
	OklchChannel,
	OklchColor,
	SourceColor,
	SourceColorFormat
} from './model';

export type RgbColor = { red: number; green: number; blue: number };
export type HslColor = { hue: number; saturation: number; lightness: number };

export type GamutStatus = {
	inSrgb: boolean;
	inP3: boolean;
	outOfSelectedGamut: boolean;
	warning: string | null;
};

export type PreviewColor = GamutStatus & {
	gamut: GamutPreview;
	hex: string;
	css: string;
	color: Color;
};

const CHANNEL_FORMATS: Record<OklchChannel, { min: number; max: number; digits: number }> = {
	lightness: { min: 0, max: 1, digits: 4 },
	chroma: { min: 0, max: 0.37, digits: 4 },
	hue: { min: 0, max: 360, digits: 2 }
};

// Color source helpers keep persisted source colors in OKLCH while preserving the
// user-selected input format for dialogs and source cells.
export function parseSourceColor(
	input: string,
	format = inferSourceFormat(input)
): SourceColor | null {
	try {
		const color = new Color(input.trim());
		const oklch = colorToOklch(color);
		return createSourceColor(oklch, format);
	} catch {
		return null;
	}
}

export function createSourceColor(
	oklch: OklchColor,
	format: SourceColorFormat = 'oklch'
): SourceColor {
	const normalized = normalizeOklch(oklch);
	return {
		format,
		oklch: normalized,
		serialized: serializeSourceColor(normalized, format)
	};
}

export function sourceColorFromRgb(rgb: RgbColor, format: SourceColorFormat = 'rgb'): SourceColor {
	return createSourceColor(
		colorToOklch(new Color('srgb', [rgb.red / 255, rgb.green / 255, rgb.blue / 255])),
		format
	);
}

export function sourceColorFromHsl(hsl: HslColor, format: SourceColorFormat = 'hsl'): SourceColor {
	return createSourceColor(
		colorToOklch(new Color('hsl', [hsl.hue, hsl.saturation, hsl.lightness])),
		format
	);
}

export function serializeSourceColor(oklch: OklchColor, format: SourceColorFormat): string {
	const color = oklchToColor(oklch);
	if (format === 'hex') return toHex(color, 'srgb');
	if (format === 'rgb') return serializeRgb(color);
	if (format === 'hsl') return serializeHsl(color);
	return `oklch(${formatLightness(oklch.lightness)} ${formatChroma(oklch.chroma)} ${formatHue(oklch.hue)})`;
}

export function colorToOklch(color: Color): OklchColor {
	const [lightness, chroma, hue] = color.to('oklch').coords;
	return normalizeOklch({
		lightness: finiteOrZero(lightness),
		chroma: finiteOrZero(chroma),
		hue: finiteOrZero(hue)
	});
}

export function oklchToColor(oklch: OklchColor): Color {
	return new Color('oklch', [oklch.lightness, oklch.chroma, oklch.hue]);
}

export function getGamutStatus(oklch: OklchColor, gamut: GamutPreview): GamutStatus {
	const color = oklchToColor(oklch);
	const inSrgb = color.inGamut('srgb');
	const inP3 = color.inGamut('p3');
	const outOfSelectedGamut = gamut === 'srgb' ? !inSrgb : !inP3;
	let warning: string | null = null;

	if (outOfSelectedGamut) {
		warning = inP3
			? 'Outside sRGB. Preview is clamped.'
			: 'Outside sRGB and P3. Preview is clamped.';
	}

	return { inSrgb, inP3, outOfSelectedGamut, warning };
}

export function getPreviewColor(oklch: OklchColor, gamut: GamutPreview): PreviewColor {
	const space = gamut === 'srgb' ? 'srgb' : 'p3';
	const color = oklchToColor(oklch).to(space).toGamut({ space });
	return {
		...getGamutStatus(oklch, gamut),
		gamut,
		hex: toHex(color, 'srgb'),
		css: gamut === 'srgb' ? toHex(color, 'srgb') : serializeP3(color),
		color
	};
}

export function getMaxChroma(lightness: number, hue: number, gamut: Gamut): number {
	const normalizedLightness = normalizeChannelValue('lightness', lightness);
	const normalizedHue = normalizeChannelValue('hue', hue);
	let low = 0;
	let high = CHANNEL_FORMATS.chroma.max;

	for (let iteration = 0; iteration < 24; iteration += 1) {
		const chroma = (low + high) / 2;
		const color = new Color('oklch', [normalizedLightness, chroma, normalizedHue]);
		if (color.inGamut(gamut)) low = chroma;
		else high = chroma;
	}

	return normalizeChannelValue('chroma', low);
}

export function getRelativeChromaRatio(source: OklchColor, gamut: Gamut): number {
	const maxChroma = getMaxChroma(source.lightness, source.hue, gamut);
	if (maxChroma <= 0) return 0;
	return floorTo(clamp(source.chroma / maxChroma, 0, 1), 4);
}

export function getRelativeChroma(
	lightness: number,
	hue: number,
	ratio: number,
	gamut: Gamut
): number {
	return normalizeChannelValue('chroma', getMaxChroma(lightness, hue, gamut) * ratio);
}

export function toHex(color: Color, gamut: GamutPreview | 'srgb' = 'srgb'): string {
	const space = gamut === 'p3' ? 'p3' : 'srgb';
	const srgb = color.to(space).toGamut({ space }).to('srgb').toGamut({ space: 'srgb' });
	const [r, g, b] = srgb.coords.map((value) => Math.round(clamp(finiteOrZero(value), 0, 1) * 255));
	return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
}

export function formatLightness(value: number): string {
	return formatChannel('lightness', value);
}

export function formatChroma(value: number): string {
	return formatChannel('chroma', value);
}

export function formatHue(value: number): string {
	return formatChannel('hue', value);
}

export function normalizeChannelValue(channel: OklchChannel, value: number): number {
	const { min, max, digits } = CHANNEL_FORMATS[channel];
	return floorTo(clamp(finiteOrZero(value), min, max), digits);
}

export function normalizeOklch(oklch: OklchColor): OklchColor {
	return {
		lightness: normalizeChannelValue('lightness', oklch.lightness),
		chroma: normalizeChannelValue('chroma', oklch.chroma),
		hue: normalizeChannelValue('hue', oklch.hue)
	};
}

function inferSourceFormat(input: string): SourceColorFormat {
	const value = input.trim().toLowerCase();
	if (value.startsWith('#')) return 'hex';
	if (value.startsWith('rgb')) return 'rgb';
	if (value.startsWith('hsl')) return 'hsl';
	return 'oklch';
}

function serializeRgb(color: Color): string {
	const [red, green, blue] = color
		.to('srgb')
		.toGamut({ space: 'srgb' })
		.coords.map((value) => Math.round(clamp(finiteOrZero(value), 0, 1) * 255));
	return `rgb(${red} ${green} ${blue})`;
}

function serializeHsl(color: Color): string {
	const [hue, saturation, lightness] = color.to('srgb').toGamut({ space: 'srgb' }).to('hsl').coords;
	return `hsl(${formatHue(finiteOrZero(hue))} ${formatPercent(saturation)} ${formatPercent(lightness)})`;
}

function serializeP3(color: Color): string {
	const [red, green, blue] = color
		.to('p3')
		.toGamut({ space: 'p3' })
		.coords.map((value) => formatUnit(finiteOrZero(value)));
	return `color(display-p3 ${red} ${green} ${blue})`;
}

function formatChannel(channel: OklchChannel, value: number): string {
	const { digits } = CHANNEL_FORMATS[channel];
	return floorTo(finiteOrZero(value), digits).toFixed(digits);
}

function formatPercent(value: number | undefined | null): string {
	return `${floorTo(clamp(finiteOrZero(value), 0, 100), 2).toFixed(2)}%`;
}

function formatUnit(value: number): string {
	return floorTo(clamp(value, 0, 1), 4).toFixed(4);
}

function floorTo(value: number, digits: number): number {
	const scale = 10 ** digits;
	return Math.floor((value + Number.EPSILON) * scale) / scale;
}

function finiteOrZero(value: number | undefined | null): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function toHexByte(value: number): string {
	return value.toString(16).padStart(2, '0');
}
