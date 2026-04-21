import { browser } from '$app/environment';
import { z } from 'zod';
import {
	createDefaultPalette,
	migrateGroupsToPalettes,
	syncVariantGroups,
	type ColorData,
	type GroupData,
	type GroupLightnessSettings,
	type PaletteData,
	type PaletteGroupData,
	type PaletteVariantData
} from './palette';

export type {
	ColorData,
	GroupData,
	GroupLightnessSettings,
	PaletteData,
	PaletteGroupData,
	PaletteVariantData
};

const STORAGE_KEY = 'kiniro-palettes';

const ColorDataSchema = z.object({
	id: z.number(),
	name: z.string(),
	hex: z.string()
});

const GroupLightnessSettingsSchema = z.object({
	lightnessMax: z.number(),
	lightnessMin: z.number(),
	controlledLightness: z.record(z.coerce.number(), z.number()).default({}),
	reversed: z.boolean().default(false),
	stepsCount: z.number().min(3).max(9).default(9),
	halfStepBefore: z.boolean().default(false),
	halfStepAfter: z.boolean().default(false)
});

const LegacyGroupDataSchema = GroupLightnessSettingsSchema.extend({
	id: z.number(),
	name: z.string(),
	colors: z.array(ColorDataSchema)
});

const PaletteGroupDataSchema = z.object({
	id: z.number(),
	name: z.string(),
	colors: z.array(ColorDataSchema)
});

const PaletteVariantDataSchema = z.object({
	id: z.number(),
	name: z.string(),
	groups: z.record(z.coerce.number(), GroupLightnessSettingsSchema)
});

const PaletteDataSchema = z.object({
	id: z.number(),
	name: z.string(),
	groups: z.array(PaletteGroupDataSchema),
	variants: z.array(PaletteVariantDataSchema)
});

const StorageSchema = z.array(PaletteDataSchema);
const LegacyStorageSchema = z.array(LegacyGroupDataSchema);

function normalizePalettes(palettes: PaletteData[]): PaletteData[] {
	return palettes.length > 0 ? palettes.map(syncVariantGroups) : [createDefaultPalette()];
}

function parseStorageValue(value: unknown): PaletteData[] | null {
	const result = StorageSchema.safeParse(value);
	if (result.success) return normalizePalettes(result.data);

	const legacyResult = LegacyStorageSchema.safeParse(value);
	if (legacyResult.success) return migrateGroupsToPalettes(legacyResult.data);

	return null;
}

// Loads saved palettes in the browser, falls back to the default palette there,
// and returns an empty array during SSR.
export function loadPalettes(): PaletteData[] {
	if (!browser) return [];
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			const parsed = parseStorageValue(JSON.parse(saved));
			if (parsed) return parsed;
		}
	} catch {
		// Fall back to defaults when saved JSON is unavailable or invalid.
	}
	return [createDefaultPalette()];
}

// Persists palettes as JSON without storing derived color steps.
export function savePalettes(palettes: PaletteData[]): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(palettes.map(syncVariantGroups)));
}

// Validates imported palette JSON and migrates legacy group files when needed.
export function parsePalettesJson(json: string): PaletteData[] | null {
	try {
		return parseStorageValue(JSON.parse(json));
	} catch {
		return null;
	}
}
