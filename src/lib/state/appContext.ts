import { Context } from 'runed';
import type { AppManager } from './state.svelte';

export const appManagerContext = new Context<AppManager>('AppManager');

// Provides the single AppManager instance for components below the app route.
export function setAppManagerContext(app: AppManager): AppManager {
	return appManagerContext.set(app);
}

// Components that mutate app-owned state use this accessor so missing providers
// fail with a domain-specific message instead of a generic context error.
export function getAppManagerContext(): AppManager {
	try {
		return appManagerContext.get();
	} catch (error) {
		throw new Error('AppManager context is required for this component.', { cause: error });
	}
}
