import { clone } from './clone';

export const INITIAL_HISTORY_LABEL = 'Initial state';

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
	constructor(private readonly state: HistoryState<T>) {}

	get entries(): HistoryEntry<T>[] {
		return this.state.entries;
	}

	get current(): number {
		return this.state.current;
	}

	get canUndo(): boolean {
		return this.state.current > 0;
	}

	get canRedo(): boolean {
		return this.state.current < this.state.entries.length - 1;
	}

	push(label: string, value: T): void {
		this.state.entries = this.state.entries.slice(0, this.state.current + 1);
		this.state.entries.push({ label, value: clone(value) });
		this.state.current = this.state.entries.length - 1;
	}

	replaceCurrent(value: T): void {
		const entry = this.state.entries[this.state.current];
		if (!entry) return;
		entry.value = clone(value);
	}

	undo(): HistoryEntry<T> | null {
		if (!this.canUndo) return null;
		this.state.current -= 1;
		return clone(this.state.entries[this.state.current]);
	}

	redo(): HistoryEntry<T> | null {
		if (!this.canRedo) return null;
		this.state.current += 1;
		return clone(this.state.entries[this.state.current]);
	}

	restore(state: HistoryState<T>): void {
		this.state.entries = clone(state.entries);
		this.state.current = state.current;
	}

	snapshot(limit?: number): HistoryState<T> {
		return clone(limit == null ? this.state : capHistoryState(this.state, limit));
	}
}

export function createHistoryState<T>(value: T, label = INITIAL_HISTORY_LABEL): HistoryState<T> {
	return {
		entries: [{ label, value: clone(value) }],
		current: 0
	};
}

export function capHistoryState<T>(state: HistoryState<T>, limit: number): HistoryState<T> {
	if (state.entries.length <= limit) return clone(state);
	const start = Math.max(0, Math.min(state.current - limit + 1, state.entries.length - limit));
	const entries = state.entries.slice(start, start + limit);
	return {
		entries: clone(entries),
		current: state.current - start
	};
}
