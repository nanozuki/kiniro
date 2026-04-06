import { browser } from '$app/environment';
import { z } from 'zod';

const STORAGE_KEY = 'kiniro-palettes';

const ColorDataSchema = z.object({
	id: z.number(),
	name: z.string(),
	hex: z.string()
});

const GroupDataSchema = z.object({
	id: z.number(),
	name: z.string(),
	lightnessMax: z.number(),
	lightnessMin: z.number(),
	reversed: z.boolean().default(false),
	colors: z.array(ColorDataSchema)
});

const StorageSchema = z.array(GroupDataSchema);

export type ColorData = z.infer<typeof ColorDataSchema>;
export type GroupData = z.infer<typeof GroupDataSchema>;

const DEFAULT_GROUPS: GroupData[] = [
	{ id: 1, name: 'palette', lightnessMax: 0.95, lightnessMin: 0.16, reversed: false, colors: [{ id: 1, name: 'primary', hex: '#907aa9' }] }
];

export function loadGroups(): GroupData[] {
	if (!browser) return [];
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		if (saved) {
			const result = StorageSchema.safeParse(JSON.parse(saved));
			if (result.success) return result.data;
		}
	} catch {}
	return DEFAULT_GROUPS;
}

export function saveGroups(groups: GroupData[]): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

export function parseGroupsJson(json: string): GroupData[] | null {
	try {
		const result = StorageSchema.safeParse(JSON.parse(json));
		return result.success ? result.data : null;
	} catch {
		return null;
	}
}
