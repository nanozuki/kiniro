import { clone } from './clone';
import type { AppState } from './model';

export type HistoryEntry = {
	label: string;
	data: AppState;
};

export type HistoryState = {
	past: HistoryEntry[];
	future: HistoryEntry[];
};

export type HistorySnapshot = {
	data: AppState;
	history: HistoryState;
	lastAction: string | null;
};

export type HistoryOptions = {
	initialData?: AppState;
	onRestore?: (data: AppState) => void;
};

// SnapshotHistory tracks semantic App data commits only. UI state is repaired by
// the owner through onRestore and is never stored in undo/redo entries.
export class SnapshotHistory {
	data: AppState;
	history: HistoryState = { past: [], future: [] };
	lastAction: string | null = null;
	private onRestore?: (data: AppState) => void;

	constructor(options: HistoryOptions = {}) {
		this.data = clone(options.initialData ?? { themes: [] });
		this.onRestore = options.onRestore;
	}

	get canUndo(): boolean {
		return this.history.past.length > 0;
	}

	get canRedo(): boolean {
		return this.history.future.length > 0;
	}

	commit(label: string, nextData: AppState): boolean {
		if (isSameData(this.data, nextData)) return false;
		this.history.past.push({ label, data: clone(this.data) });
		this.history.future = [];
		this.data = clone(nextData);
		this.lastAction = label;
		return true;
	}

	undo(): AppState | null {
		const entry = this.history.past.pop();
		if (!entry) return null;
		this.history.future.push({ label: this.lastAction ?? entry.label, data: clone(this.data) });
		this.data = clone(entry.data);
		this.lastAction = `Undid ${entry.label}`;
		this.onRestore?.(this.data);
		return clone(this.data);
	}

	redo(): AppState | null {
		const entry = this.history.future.pop();
		if (!entry) return null;
		this.history.past.push({ label: entry.label, data: clone(this.data) });
		this.data = clone(entry.data);
		this.lastAction = `Redid ${entry.label}`;
		this.onRestore?.(this.data);
		return clone(this.data);
	}

	snapshot(limit?: number): HistorySnapshot {
		const cap = (entries: HistoryEntry[]) => (limit == null ? entries : entries.slice(-limit));
		return {
			data: clone(this.data),
			history: { past: clone(cap(this.history.past)), future: clone(cap(this.history.future)) },
			lastAction: this.lastAction
		};
	}
}

export function createSnapshotHistory(options: HistoryOptions = {}): SnapshotHistory {
	return new SnapshotHistory(options);
}

function isSameData(left: AppState, right: AppState): boolean {
	return JSON.stringify(left) === JSON.stringify(right);
}

