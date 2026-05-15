import type { AppState, GamutPreview, Id, WorkspaceTab } from './model';
import type { HistoryState } from './history';

export const NEXT_STORAGE_KEY = 'kiniro.next.v1';
export const NEXT_STORAGE_VERSION = 1;
export const PERSISTED_HISTORY_LIMIT = 100;

export type PersistedUiState = {
	selectedThemeId: Id | null;
	selectedVariantId: Id | null;
	workspaceTab: WorkspaceTab;
	gamutPreview: GamutPreview;
};

export type PersistedNextState = {
	version: 1;
	data: AppState;
	ui: PersistedUiState;
	history: HistoryState;
};

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export type LoadStorageResult =
	| { ok: true; state: PersistedNextState; reset: false; error: null }
	| { ok: false; state: PersistedNextState; reset: true; error: string };

// Storage persists authored App data plus durable UI choices. Derived palette,
// CSS, previews, dialog drafts, focus, scroll, edit mode, and transient warnings
// are intentionally excluded from the schema.
export function createDefaultPersistedState(): PersistedNextState {
	return {
		version: NEXT_STORAGE_VERSION,
		data: { themes: [] },
		ui: { selectedThemeId: null, selectedVariantId: null, workspaceTab: 'palette', gamutPreview: 'srgb' },
		history: { past: [], future: [] }
	};
}

export function saveNextState(storage: StorageLike, state: PersistedNextState, key = NEXT_STORAGE_KEY): void {
	storage.setItem(key, JSON.stringify(capHistory(state)));
}

export function loadNextState(storage: StorageLike, key = NEXT_STORAGE_KEY): LoadStorageResult {
	const fallback = createDefaultPersistedState();
	const raw = storage.getItem(key);
	if (raw == null) return { ok: true, state: fallback, reset: false, error: null };

	try {
		const parsed: unknown = JSON.parse(raw);
		if (!isPersistedState(parsed)) throw new Error('Stored Kiniro state has an invalid schema.');
		return { ok: true, state: capHistory(parsed), reset: false, error: null };
	} catch (error) {
		storage.removeItem(key);
		return { ok: false, state: fallback, reset: true, error: error instanceof Error ? error.message : 'Invalid stored state.' };
	}
}

export function capHistory(state: PersistedNextState, limit = PERSISTED_HISTORY_LIMIT): PersistedNextState {
	return {
		version: NEXT_STORAGE_VERSION,
		data: clone(state.data),
		ui: { ...state.ui },
		history: {
			past: clone(state.history.past.slice(-limit)),
			future: clone(state.history.future.slice(-limit))
		}
	};
}

function isPersistedState(value: unknown): value is PersistedNextState {
	if (!isRecord(value) || value.version !== NEXT_STORAGE_VERSION) return false;
	if (!isAppState(value.data)) return false;
	if (!isRecord(value.ui)) return false;
	if (!['palette', 'cssVariables', 'contrastChecker'].includes(String(value.ui.workspaceTab))) return false;
	if (!['srgb', 'p3'].includes(String(value.ui.gamutPreview))) return false;
	if (!(value.ui.selectedThemeId == null || typeof value.ui.selectedThemeId === 'string')) return false;
	if (!(value.ui.selectedVariantId == null || typeof value.ui.selectedVariantId === 'string')) return false;
	if (!isRecord(value.history) || !Array.isArray(value.history.past) || !Array.isArray(value.history.future)) return false;
	return value.history.past.every(isHistoryEntry) && value.history.future.every(isHistoryEntry);
}

function isHistoryEntry(value: unknown): boolean {
	return isRecord(value) && typeof value.label === 'string' && isAppState(value.data);
}

function isAppState(value: unknown): value is AppState {
	return isRecord(value) && Array.isArray(value.themes);
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function clone<T>(value: T): T {
	return structuredClone(value);
}
