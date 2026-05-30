import { clone } from '../clone';

export type HistoryEntry<T> = {
	label: string;
	value: T;
};

// Serializable state for a committed timeline. `current` points at the snapshot
// the app has restored, and entries after it are redo states that are discarded
// by the next push.
export type HistoryState<T> = {
	entries: HistoryEntry<T>[];
	current: number;
};

// History tracks committed snapshots without owning the app's live state. The
// caller decides what each value contains and restores returned entries after
// undo or redo. Stored and returned values are cloned so timeline entries do not
// share mutable state with the caller.
export class History<T> {
	private static readonly CAP_LIMIT = 100;
	private static readonly CAP_THRESHOLD = 200;

	entries = $state<HistoryEntry<T>[]>([]);
	current = $state(0);
	canUndo = $derived(this.current > 0);
	canRedo = $derived(this.current < this.entries.length - 1);

	constructor(state: HistoryState<T>) {
		this.entries = clone(state.entries);
		this.current = state.current;
	}

	push(label: string, value: T): void {
		this.entries = this.entries.slice(0, this.current + 1);
		this.entries.push({ label, value: clone(value) });
		this.current = this.entries.length - 1;
		this.cap();
	}

	undo(): HistoryEntry<T> | null {
		if (!this.canUndo) return null;
		this.current -= 1;
		return clone(this.entries[this.current]);
	}

	redo(): HistoryEntry<T> | null {
		if (!this.canRedo) return null;
		this.current += 1;
		return clone(this.entries[this.current]);
	}

	private cap(): void {
		if (this.entries.length <= History.CAP_THRESHOLD) return;
		const start = Math.max(
			0,
			Math.min(this.current - History.CAP_LIMIT + 1, this.entries.length - History.CAP_LIMIT)
		);
		this.entries = this.entries.slice(start, start + History.CAP_LIMIT);
		this.current -= start;
	}
}
