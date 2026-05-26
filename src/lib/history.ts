import { clone } from './clone';
import type { AppState, WorkspaceTab } from './model';

export type HistoryUiState = {
	selectedThemeId: string | null;
	selectedVariantId: string | null;
	workspaceTab: WorkspaceTab;
};

export type HistoryEntry = {
	label: string;
	data: AppState;
	ui: HistoryUiState;
};

export type HistoryState = {
	past: HistoryEntry[];
	future: HistoryEntry[];
};

export type HistorySnapshot = {
	data: AppState;
	ui: HistoryUiState;
	history: HistoryState;
	lastAction: string | null;
};

export type HistoryOptions = {
	initialData?: AppState;
	initialUi?: HistoryUiState;
};

// SnapshotHistory tracks undoable app snapshots, including durable UI choices
// that should be restored alongside authored data.
export class SnapshotHistory {
	data: AppState;
	ui: HistoryUiState;
	history: HistoryState = { past: [], future: [] };
	lastAction: string | null = null;

	constructor(options: HistoryOptions = {}) {
		this.data = clone(options.initialData ?? { themes: [] });
		this.ui = clone(
			options.initialUi ?? {
				selectedThemeId: null,
				selectedVariantId: null,
				workspaceTab: 'palette'
			}
		);
	}

	get canUndo(): boolean {
		return this.history.past.length > 0;
	}

	get canRedo(): boolean {
		return this.history.future.length > 0;
	}

	commit(label: string, next: { data: AppState; ui: HistoryUiState }): boolean {
		if (isSameSnapshot({ data: this.data, ui: this.ui }, next)) return false;
		this.history.past.push({ label, data: clone(this.data), ui: clone(this.ui) });
		this.history.future = [];
		this.data = clone(next.data);
		this.ui = clone(next.ui);
		this.lastAction = label;
		return true;
	}

	undo(): HistorySnapshot | null {
		const entry = this.history.past.pop();
		if (!entry) return null;
		this.history.future.push({ label: entry.label, data: clone(this.data), ui: clone(this.ui) });
		this.data = clone(entry.data);
		this.ui = clone(entry.ui);
		this.lastAction = `Undid ${entry.label}`;
		return this.snapshot();
	}

	redo(): HistorySnapshot | null {
		const entry = this.history.future.pop();
		if (!entry) return null;
		this.history.past.push({ label: entry.label, data: clone(this.data), ui: clone(this.ui) });
		this.data = clone(entry.data);
		this.ui = clone(entry.ui);
		this.lastAction = `Redid ${entry.label}`;
		return this.snapshot();
	}

	snapshot(limit?: number): HistorySnapshot {
		const cap = (entries: HistoryEntry[]) => (limit == null ? entries : entries.slice(-limit));
		return {
			data: clone(this.data),
			ui: clone(this.ui),
			history: { past: clone(cap(this.history.past)), future: clone(cap(this.history.future)) },
			lastAction: this.lastAction
		};
	}
}

export function createSnapshotHistory(options: HistoryOptions = {}): SnapshotHistory {
	return new SnapshotHistory(options);
}

function isSameSnapshot(
	left: { data: AppState; ui: HistoryUiState },
	right: { data: AppState; ui: HistoryUiState }
): boolean {
	return JSON.stringify(left) === JSON.stringify(right);
}
