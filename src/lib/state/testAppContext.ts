import { appManagerContext } from './appContext';
import type { AppManager } from './state.svelte';

export function appManagerContextOption(app: AppManager) {
	return {
		context: new Map([[appManagerContext.key, app]])
	};
}
