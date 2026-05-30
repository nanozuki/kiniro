import type { z } from 'zod';
import { STORAGE_STATE_VERSION, savedStateSchema, type uiStateSchema } from './schemas';

export const STORAGE_KEY = 'kiniro';
export const STORAGE_VERSION = STORAGE_STATE_VERSION;

export type PersistedUiState = z.infer<typeof uiStateSchema>;
export type PersistedState = z.infer<typeof savedStateSchema>;

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type LoadStorageResult =
	| { ok: true; state: PersistedState; reset: false; error: null }
	| { ok: false; state: PersistedState; reset: true; error: string };

// Storage persists authored App data plus durable UI choices. Derived palette,
// CSS, previews, dialog drafts, focus, scroll, edit mode, and transient warnings
// are intentionally excluded from the schema.
export function createDefaultPersistedState(): PersistedState {
	const data = { themes: [] };
	const ui = {
		selectedThemeId: null,
		selectedVariantId: null,
		workspaceTab: 'palette' as const
	};
	return {
		version: STORAGE_VERSION,
		data,
		ui,
		history: {
			entries: [{ label: 'Initial state', value: { data, ui } }],
			current: 0
		}
	};
}

export function saveState(storage: StorageLike, state: PersistedState, key = STORAGE_KEY): void {
	storage.setItem(
		key,
		JSON.stringify({
			version: STORAGE_VERSION,
			data: state.data,
			ui: state.ui,
			history: state.history
		})
	);
}

export function loadState(storage: StorageLike, key = STORAGE_KEY): LoadStorageResult {
	const fallback = createDefaultPersistedState();
	const raw = storage.getItem(key);
	if (raw == null) return { ok: true, state: fallback, reset: false, error: null };

	try {
		const parsed: unknown = JSON.parse(raw);
		const state = savedStateSchema.parse(parsed);
		return { ok: true, state, reset: false, error: null };
	} catch (error) {
		storage.removeItem(key);
		return {
			ok: false,
			state: fallback,
			reset: true,
			error: error instanceof Error ? error.message : 'Invalid stored state.'
		};
	}
}
