import { clone } from '../clone';
import { normalizeCssPrefix } from '../cssVariables';
import type { InlineEditSession, InlineEditSubmitResult } from '$lib/ui/InlineInput.svelte';
import {
	applyThemeImport,
	exportThemes as exportThemesJson,
	type ImportThemeChoice,
	type ThemeExportFile
} from '../importExport';
import {
	cleanLightnessOverrides,
	createIndexStyleStructure,
	getStepIndexes,
	mapLightnessOverridesForIndexStyle,
	reverseStepScaleValues,
	reverseSwatchOverrides
} from '../lightness';
import {
	createColorFamily,
	createColorRamp,
	createDefaultRampValues,
	createDefaultStepScaleValues,
	createDefaultTheme,
	createEmptyAppState,
	createThemeVariant,
	syncThemeVariantValues,
	type AppState,
	type ColorFamilyStructure,
	type ColorFamilyValues,
	type ColorRampStructure,
	type Gamut,
	type Id,
	type OklchChannel,
	type SourceColor,
	type StepIndexStyle,
	type Theme,
	type ThemeVariant,
	type WorkspaceTab
} from '../model';
import {
	defaultFamilyName,
	defaultRampName,
	defaultThemeName,
	defaultVariantName,
	ensureUniqueName,
	familyNames,
	type NamedItem,
	rampNames,
	themeNames,
	validateName,
	variantNames
} from '../naming';
import {
	createDefaultPersistedState,
	loadState,
	saveState,
	STORAGE_KEY,
	type PersistedState,
	type PersistedUiState,
	type StorageLike
} from '../storage';

export type SelectionState = {
	themeId: Id | null;
	variantId: Id | null;
};

export type UiState = {
	selection: SelectionState;
	workspaceTab: WorkspaceTab;
};

export type AppManagerState = {
	data: AppState;
	ui: UiState;
};

export type HistoryEntry = PersistedState['history']['past'][number];
export type HistoryState = PersistedState['history'];

export type AppManagerOptions = {
	data?: AppState;
	ui?: Partial<UiState>;
	persistedState?: PersistedState;
	storage?: StorageLike;
	storageKey?: string;
};

// AppManager owns Kiniro's persisted state. Components keep ephemeral interaction
// state locally, but every durable change to app data, selection, workspace,
// undo/redo, or storage goes through this module so repair and persistence stay
// coordinated.
export class AppManager {
	data = $state<AppState>(createEmptyAppState());
	ui = $state<UiState>({
		selection: { themeId: null, variantId: null },
		workspaceTab: 'palette'
	});
	history = $state<HistoryState>({ past: [], future: [] });
	lastAction = $state<string | null>(null);
	storageReset = $state(false);
	storageError = $state<string | null>(null);

	private storage?: StorageLike;
	private storageKey: string;
	private previewBase: { data: AppState; ui: PersistedUiState } | null = null;
	private committedSnapshot: { data: AppState; ui: PersistedUiState } = {
		data: createEmptyAppState(),
		ui: {
			selectedThemeId: null,
			selectedVariantId: null,
			workspaceTab: 'palette'
		}
	};

	constructor(options: AppManagerOptions = {}) {
		this.storage = options.storage;
		this.storageKey = options.storageKey ?? STORAGE_KEY;

		const initial = this.loadInitialState(options);
		this.restorePersistedState(initial.state);
		this.storageReset = initial.reset;
		this.storageError = initial.error;

		if (initial.reconciled) this.persist();
	}

	get selectedTheme(): Theme | null {
		return this.data.themes.find((theme) => theme.id === this.ui.selection.themeId) ?? null;
	}

	get selectedVariant(): ThemeVariant | null {
		return (
			this.selectedTheme?.variants.find((variant) => variant.id === this.ui.selection.variantId) ??
			null
		);
	}

	get canUndo(): boolean {
		return this.history.past.length > 0;
	}

	get canRedo(): boolean {
		return this.history.future.length > 0;
	}

	selectTheme(themeId: Id): void {
		this.updateUi(() => {
			const theme = this.data.themes.find((item) => item.id === themeId);
			if (!theme) return;
			this.ui.selection = { themeId: theme.id, variantId: theme.variants[0]?.id ?? null };
			this.ui.workspaceTab = 'palette';
		});
	}

	selectVariant(variantId: Id): void {
		this.updateUi(() => {
			const theme = this.selectedTheme;
			if (!theme?.variants.some((variant) => variant.id === variantId)) return;
			this.ui.selection.variantId = variantId;
			this.ui.workspaceTab = 'palette';
		});
	}

	setWorkspaceTab(tab: WorkspaceTab): void {
		this.updateUi(() => {
			this.ui.workspaceTab = tab;
		});
	}

	setThemeTargetGamut(themeId: Id, gamut: Gamut): void {
		this.commitMutation('Set theme gamut', () => {
			const theme = this.data.themes.find((item) => item.id === themeId);
			if (theme) theme.targetGamut = gamut;
		});
	}

	addTheme(name = defaultThemeName(this.data.themes)): Theme {
		let created: Theme = createDefaultTheme();
		this.commitMutation('Add theme', () => {
			created = createDefaultTheme({
				name: ensureUniqueName(name, themeNames(this.data.themes), { fallbackBase: 'Theme' })
			});
			this.data.themes.push(created);
			this.ui.selection = { themeId: created.id, variantId: created.variants[0].id };
			this.ui.workspaceTab = 'palette';
		});
		return created;
	}

	previewThemeName(themeId: Id, name: string): void {
		this.beginPreview();
		const theme = this.data.themes.find((item) => item.id === themeId);
		if (!theme) return;
		theme.name = name;
	}

	renameTheme(themeId: Id, name: string): void {
		this.commitMutation(
			'Rename theme',
			() => {
				const theme = this.data.themes.find((item) => item.id === themeId);
				if (!theme) return;
				theme.name = ensureUniqueName(name, themeNames(this.data.themes), {
					exclude: theme,
					fallbackBase: 'Theme'
				});
			},
			{ includePreview: true }
		);
	}

	editThemeName(themeId: Id): InlineEditSession {
		const theme = this.data.themes.find((item) => item.id === themeId);
		const previous = theme?.name ?? '';
		return {
			preview: (draft) => {
				this.previewThemeName(themeId, draft);
			},
			submit: (draft) => {
				const theme = this.data.themes.find((item) => item.id === themeId);
				const result = resolveEditedName(draft, previous, themeNames(this.data.themes), theme, {
					fallbackBase: 'Theme',
					label: 'Theme'
				});
				this.renameTheme(themeId, result.value);
				return result;
			}
		};
	}

	deleteTheme(themeId: Id): void {
		this.commitMutation('Delete theme', () => {
			const index = this.data.themes.findIndex((theme) => theme.id === themeId);
			if (index < 0) return;
			this.data.themes.splice(index, 1);
			const neighbor = this.data.themes[index] ?? this.data.themes[index - 1] ?? null;
			this.ui.selection = {
				themeId: neighbor?.id ?? null,
				variantId: neighbor?.variants[0]?.id ?? null
			};
			this.ui.workspaceTab = 'palette';
		});
	}

	setThemeCssPrefix(themeId: Id, prefix: string): void {
		this.commitMutation('Set CSS prefix', () => {
			const theme = this.data.themes.find((item) => item.id === themeId);
			if (theme) theme.cssPrefix = normalizeCssPrefix(prefix);
		});
	}

	addVariant(name?: string): ThemeVariant | null {
		let created: ThemeVariant | null = null;
		this.commitMutation('Add variant', () => {
			const theme = this.selectedTheme;
			const source = this.selectedVariant;
			if (!theme || !source) return;
			created = createThemeVariant(theme.structure, {
				name: ensureUniqueName(name ?? defaultVariantName(theme.variants), variantNames(theme), {
					fallbackBase: 'Variant'
				}),
				values: clone(source.values)
			});
			theme.variants.push(created);
			this.ui.selection.variantId = created.id;
			this.ui.workspaceTab = 'palette';
		});
		return created;
	}

	previewVariantName(variantId: Id, name: string): void {
		this.beginPreview();
		const theme = this.selectedTheme;
		const variant = theme?.variants.find((item) => item.id === variantId);
		if (!theme || !variant) return;
		variant.name = name;
	}

	renameVariant(variantId: Id, name: string): void {
		this.commitMutation(
			'Rename variant',
			() => {
				const theme = this.selectedTheme;
				const variant = theme?.variants.find((item) => item.id === variantId);
				if (!theme || !variant) return;
				variant.name = ensureUniqueName(name, variantNames(theme), {
					exclude: variant,
					fallbackBase: 'Variant'
				});
			},
			{ includePreview: true }
		);
	}

	editVariantName(variantId: Id): InlineEditSession {
		const theme = this.selectedTheme;
		const variant = theme?.variants.find((item) => item.id === variantId);
		const previous = variant?.name ?? '';
		return {
			preview: (draft) => {
				this.previewVariantName(variantId, draft);
			},
			submit: (draft) => {
				const theme = this.selectedTheme;
				const variant = theme?.variants.find((item) => item.id === variantId);
				const result = resolveEditedName(
					draft,
					previous,
					theme ? variantNames(theme) : [],
					variant,
					{
						fallbackBase: 'Variant',
						label: 'Variant'
					}
				);
				this.renameVariant(variantId, result.value);
				return result;
			}
		};
	}

	deleteVariant(variantId: Id): void {
		this.commitMutation('Delete variant', () => {
			const theme = this.selectedTheme;
			if (!theme || theme.variants.length <= 1) return;
			const index = theme.variants.findIndex((variant) => variant.id === variantId);
			if (index < 0) return;
			theme.variants.splice(index, 1);
			const neighbor = theme.variants[index] ?? theme.variants[index - 1];
			this.ui.selection.variantId = neighbor.id;
			this.ui.workspaceTab = 'palette';
		});
	}

	addFamily(name?: string): ColorFamilyStructure | null {
		let created: ColorFamilyStructure | null = null;
		this.commitMutation('Add family', () => {
			const theme = this.selectedTheme;
			if (!theme) return;
			created = createColorFamily({
				name: ensureUniqueName(
					name ?? defaultFamilyName(theme.structure.families),
					familyNames(theme),
					{ fallbackBase: 'Family' }
				)
			});
			theme.structure.families.push(created);
			for (const variant of theme.variants)
				variant.values.families[created.id] = createDefaultFamilyValues();
			this.ui.workspaceTab = 'palette';
		});
		return created;
	}

	renameFamily(familyId: Id, name: string): void {
		this.commitMutation('Rename family', () => {
			const theme = this.selectedTheme;
			const family = theme?.structure.families.find((item) => item.id === familyId);
			if (!theme || !family) return;
			family.name = ensureUniqueName(name, familyNames(theme), {
				exclude: family,
				fallbackBase: 'Family'
			});
		});
	}

	deleteFamily(familyId: Id): void {
		this.commitMutation('Delete family', () => {
			const theme = this.selectedTheme;
			if (!theme) return;
			theme.structure.families = theme.structure.families.filter(
				(family) => family.id !== familyId
			);
			for (const variant of theme.variants) delete variant.values.families[familyId];
		});
	}

	setStepCount(familyId: Id, count: number): void {
		this.commitMutation('Set step count', () => {
			const theme = this.selectedTheme;
			const family = theme?.structure.families.find((item) => item.id === familyId);
			if (!theme || !family) return;
			family.stepScale.stepCount = Math.min(9, Math.max(5, Math.trunc(count)));
			this.cleanFamilyStepValues(theme, family);
		});
	}

	setIndexStyle(familyId: Id, indexStyle: StepIndexStyle): void {
		this.commitMutation('Set index style', () => {
			const theme = this.selectedTheme;
			const family = theme?.structure.families.find((item) => item.id === familyId);
			if (!theme || !family) return;
			const previous = family.stepScale;
			family.stepScale = createIndexStyleStructure(family.stepScale, indexStyle);
			for (const variant of theme.variants) {
				const values = variant.values.families[family.id]?.stepScale;
				if (values)
					values.lightnessOverrides = mapLightnessOverridesForIndexStyle(
						previous,
						family.stepScale,
						values.lightnessOverrides
					);
			}
		});
	}

	setHalfSteps(familyId: Id, halfStepStart: boolean, halfStepEnd: boolean): void {
		this.commitMutation('Set half steps', () => {
			const theme = this.selectedTheme;
			const family = theme?.structure.families.find((item) => item.id === familyId);
			if (!theme || !family || family.stepScale.indexStyle !== 'scale') return;
			family.stepScale.halfStepStart = halfStepStart;
			family.stepScale.halfStepEnd = halfStepEnd;
			this.cleanFamilyStepValues(theme, family);
		});
	}

	setLightnessRange(familyId: Id, start: number, end: number): void {
		this.commitMutation('Set lightness range', () => {
			const values = this.selectedVariant?.values.families[familyId]?.stepScale;
			if (!values) return;
			values.lightnessStart = start;
			values.lightnessEnd = end;
		});
	}

	overrideLightness(familyId: Id, stepIndex: string, lightness: number): void {
		this.commitMutation('Override lightness', () => {
			const family = this.selectedTheme?.structure.families.find((item) => item.id === familyId);
			const values = this.selectedVariant?.values.families[familyId]?.stepScale;
			if (!family || !values) return;
			if (getStepIndexes(family.stepScale).slice(1, -1).includes(stepIndex))
				values.lightnessOverrides[stepIndex] = lightness;
		});
	}

	resetLightness(familyId: Id, stepIndex: string): void {
		this.commitMutation('Reset lightness', () => {
			const values = this.selectedVariant?.values.families[familyId]?.stepScale;
			if (values) delete values.lightnessOverrides[stepIndex];
		});
	}

	reverseFamilyLightness(familyId: Id): void {
		this.commitMutation('Reverse family lightness', () => {
			const family = this.selectedTheme?.structure.families.find((item) => item.id === familyId);
			const familyValues = this.selectedVariant?.values.families[familyId];
			if (!family || !familyValues) return;
			familyValues.stepScale = reverseStepScaleValues(family.stepScale, familyValues.stepScale);
			for (const ramp of Object.values(familyValues.ramps))
				ramp.swatchOverrides = reverseSwatchOverrides(family.stepScale, ramp.swatchOverrides);
		});
	}

	addRamp(familyId: Id, sourceColor: SourceColor, name?: string): ColorRampStructure | null {
		let created: ColorRampStructure | null = null;
		this.commitMutation('Add ramp', () => {
			const theme = this.selectedTheme;
			const family = theme?.structure.families.find((item) => item.id === familyId);
			if (!theme || !family) return;
			created = createColorRamp({
				name: ensureUniqueName(name ?? defaultRampName(rampNames(theme)), rampNames(theme), {
					fallbackBase: 'Ramp'
				})
			});
			family.ramps.push(created);
			for (const variant of theme.variants)
				variant.values.families[family.id].ramps[created.id] = createDefaultRampValues(sourceColor);
		});
		return created;
	}

	renameRamp(rampId: Id, name: string): void {
		this.commitMutation('Rename ramp', () => {
			const theme = this.selectedTheme;
			const ramp = theme?.structure.families
				.flatMap((family) => family.ramps)
				.find((item) => item.id === rampId);
			if (!theme || !ramp) return;
			ramp.name = ensureUniqueName(name, rampNames(theme), { exclude: ramp, fallbackBase: 'Ramp' });
		});
	}

	setRampSourceColor(familyId: Id, rampId: Id, sourceColor: SourceColor): void {
		this.commitMutation('Set ramp source color', () => {
			const ramp = this.selectedVariant?.values.families[familyId]?.ramps[rampId];
			if (ramp) ramp.sourceColor = clone(sourceColor);
		});
	}

	deleteRamp(familyId: Id, rampId: Id): void {
		this.commitMutation('Delete ramp', () => {
			const theme = this.selectedTheme;
			const family = theme?.structure.families.find((item) => item.id === familyId);
			if (!theme || !family) return;
			family.ramps = family.ramps.filter((ramp) => ramp.id !== rampId);
			for (const variant of theme.variants) delete variant.values.families[familyId]?.ramps[rampId];
		});
	}

	overrideSwatchChannel(
		familyId: Id,
		rampId: Id,
		stepIndex: string,
		channel: OklchChannel,
		value: number
	): void {
		this.commitMutation('Override swatch channel', () => {
			const ramp = this.selectedVariant?.values.families[familyId]?.ramps[rampId];
			if (!ramp) return;
			ramp.swatchOverrides[stepIndex] = { ...ramp.swatchOverrides[stepIndex], [channel]: value };
		});
	}

	resetSwatchChannel(familyId: Id, rampId: Id, stepIndex: string, channel: OklchChannel): void {
		this.commitMutation('Reset swatch channel', () => {
			const ramp = this.selectedVariant?.values.families[familyId]?.ramps[rampId];
			if (!ramp?.swatchOverrides[stepIndex]) return;
			delete ramp.swatchOverrides[stepIndex][channel];
			if (Object.keys(ramp.swatchOverrides[stepIndex]).length === 0)
				delete ramp.swatchOverrides[stepIndex];
		});
	}

	resetSwatchColor(familyId: Id, rampId: Id, stepIndex: string): void {
		this.commitMutation('Reset swatch color', () => {
			const ramp = this.selectedVariant?.values.families[familyId]?.ramps[rampId];
			if (ramp) delete ramp.swatchOverrides[stepIndex];
		});
	}

	importThemes(file: ThemeExportFile, choices: readonly ImportThemeChoice[]): void {
		this.commitMutation('Import themes', () => {
			const result = applyThemeImport(this.data.themes, file.themes, choices);
			this.data.themes = result.themes;
			const importedTheme =
				result.themes.find((theme) => theme.id === result.selectedThemeId) ??
				result.themes[0] ??
				null;
			this.ui.selection.themeId = importedTheme?.id ?? null;
			this.ui.selection.variantId = importedTheme?.variants[0]?.id ?? null;
			this.ui.workspaceTab = 'palette';
		});
	}

	exportThemes(themeIds?: readonly Id[]): string {
		const themes = themeIds
			? this.data.themes.filter((theme) => themeIds.includes(theme.id))
			: this.data.themes;
		return exportThemesJson(themes);
	}

	undo(): void {
		const entry = this.history.past.pop();
		if (!entry) return;
		this.previewBase = null;
		this.history.future.push({ label: entry.label, ...clone(this.committedSnapshot) });
		this.restoreSnapshot(entry);
		this.committedSnapshot = this.snapshot();
		this.lastAction = `Undid ${entry.label}`;
		this.persist();
	}

	redo(): void {
		const entry = this.history.future.pop();
		if (!entry) return;
		this.previewBase = null;
		this.history.past.push({ label: entry.label, ...clone(this.committedSnapshot) });
		this.restoreSnapshot(entry);
		this.committedSnapshot = this.snapshot();
		this.lastAction = `Redid ${entry.label}`;
		this.persist();
	}

	repairUiState(): void {
		if (this.data.themes.length === 0) {
			this.ui.selection = { themeId: null, variantId: null };
			this.ui.workspaceTab = 'palette';
			return;
		}

		let theme = this.selectedTheme;
		if (!theme) theme = this.data.themes[0];
		let variant =
			theme.variants.find((item) => item.id === this.ui.selection.variantId) ??
			theme.variants[0] ??
			null;
		if (!variant) {
			variant = createThemeVariant(theme.structure, {
				name: defaultVariantName(theme.variants)
			});
			theme.variants.push(variant);
		}
		this.ui.selection = { themeId: theme.id, variantId: variant.id };
		if (this.ui.workspaceTab !== 'palette' && !themeHasRamps(theme))
			this.ui.workspaceTab = 'palette';
		for (const existingTheme of this.data.themes)
			Object.assign(existingTheme, syncThemeVariantValues(existingTheme));
	}

	private loadInitialState(options: AppManagerOptions): {
		state: PersistedState;
		reset: boolean;
		error: string | null;
		reconciled: boolean;
	} {
		if (options.persistedState) {
			const state = clone(options.persistedState);
			return {
				state,
				reset: false,
				error: null,
				reconciled: this.needsReconcile(state)
			};
		}

		if (options.storage) {
			const loaded = loadState(options.storage, this.storageKey);
			return {
				state: loaded.state,
				reset: loaded.reset,
				error: loaded.error,
				reconciled: loaded.ok ? this.needsReconcile(loaded.state) : false
			};
		}

		const state = createDefaultPersistedState();
		state.data = clone(options.data ?? createEmptyAppState());
		state.ui = toPersistedUi({
			selection: { themeId: null, variantId: null, ...options.ui?.selection },
			workspaceTab: options.ui?.workspaceTab ?? 'palette'
		});
		return {
			state,
			reset: false,
			error: null,
			reconciled: this.needsReconcile(state)
		};
	}

	private restorePersistedState(state: PersistedState): void {
		this.data = clone(state.data);
		this.ui = fromPersistedUi(state.ui);
		this.history = clone(state.history);
		this.lastAction = null;
		this.repairUiState();
		this.previewBase = null;
		this.committedSnapshot = this.snapshot();
	}

	private restoreSnapshot(snapshot: { data: AppState; ui: PersistedUiState }): void {
		this.data = clone(snapshot.data);
		this.ui = fromPersistedUi(snapshot.ui);
		this.repairUiState();
	}

	private snapshot(): { data: AppState; ui: PersistedUiState } {
		return {
			data: clone(this.data),
			ui: toPersistedUi(this.ui)
		};
	}

	private commitMutation<T>(
		label: string,
		mutate: () => T,
		options: { includePreview?: boolean } = {}
	): T {
		const before =
			options.includePreview && this.previewBase ? clone(this.previewBase) : this.snapshot();
		const result = mutate();
		this.repairUiState();
		const after = this.snapshot();
		this.previewBase = null;
		if (isSameSnapshot(before, after)) return result;
		this.history.past.push({ label, ...before });
		this.history.future = [];
		this.committedSnapshot = clone(after);
		this.lastAction = label;
		this.persist();
		return result;
	}

	private updateUi(mutate: () => void): void {
		const before = this.snapshot();
		mutate();
		this.previewBase = null;
		this.repairUiState();
		if (isSameSnapshot(before, this.snapshot())) return;
		this.persist();
	}

	private beginPreview(): void {
		this.previewBase ??= this.snapshot();
	}

	private persist(): void {
		if (!this.storage) return;
		saveState(
			this.storage,
			{
				version: createDefaultPersistedState().version,
				data: this.data,
				ui: toPersistedUi(this.ui),
				history: this.history
			},
			this.storageKey
		);
	}

	private needsReconcile(state: PersistedState): boolean {
		const repairedData = clone(state.data);
		const repairedUi = fromPersistedUi(state.ui);
		const previousData = this.data;
		const previousUi = this.ui;
		this.data = repairedData;
		this.ui = repairedUi;
		this.repairUiState();
		const reconciled = !isSameSnapshot({ data: state.data, ui: state.ui }, this.snapshot());
		this.data = previousData;
		this.ui = previousUi;
		return reconciled;
	}

	private cleanFamilyStepValues(theme: Theme, family: ColorFamilyStructure): void {
		const indexes = getStepIndexes(family.stepScale);
		for (const variant of theme.variants) {
			const familyValues = variant.values.families[family.id];
			if (!familyValues) continue;
			familyValues.stepScale.lightnessOverrides = cleanLightnessOverrides(
				familyValues.stepScale.lightnessOverrides,
				indexes
			);
			for (const ramp of Object.values(familyValues.ramps)) {
				ramp.swatchOverrides = Object.fromEntries(
					Object.entries(ramp.swatchOverrides).filter(([index]) => indexes.includes(index))
				);
			}
		}
	}
}

export function createAppManager(options: AppManagerOptions = {}): AppManager {
	return new AppManager(options);
}

function createDefaultFamilyValues(): ColorFamilyValues {
	return { stepScale: createDefaultStepScaleValues(), ramps: {} };
}

function themeHasRamps(theme: Theme): boolean {
	return theme.structure.families.some((family) => family.ramps.length > 0);
}

function toPersistedUi(ui: UiState): PersistedUiState {
	return {
		selectedThemeId: ui.selection.themeId,
		selectedVariantId: ui.selection.variantId,
		workspaceTab: ui.workspaceTab
	};
}

function fromPersistedUi(ui: PersistedUiState): UiState {
	return {
		selection: {
			themeId: ui.selectedThemeId,
			variantId: ui.selectedVariantId
		},
		workspaceTab: ui.workspaceTab
	};
}

function isSameSnapshot(
	left: { data: AppState; ui: PersistedUiState },
	right: { data: AppState; ui: PersistedUiState }
): boolean {
	return JSON.stringify(left) === JSON.stringify(right);
}

function resolveEditedName(
	draft: string,
	previous: string,
	existingNames: readonly NamedItem[],
	exclude: NamedItem | undefined,
	options: { fallbackBase: string; label: 'Theme' | 'Variant' }
): InlineEditSubmitResult {
	const validation = validateName(draft, existingNames, {
		exclude,
		fallbackBase: options.fallbackBase
	});
	const value =
		validation.error === 'empty-display-name' || validation.error === 'empty-css-name'
			? previous ||
				ensureUniqueName(options.fallbackBase, existingNames, {
					exclude,
					fallbackBase: options.fallbackBase
				})
			: ensureUniqueName(draft, existingNames, {
					exclude,
					fallbackBase: options.fallbackBase
				});

	if (validation.valid && value === draft) return { value };

	const error =
		validation.error === 'empty-display-name'
			? `${options.label} name cannot be empty; restored "${value}".`
			: validation.error === 'empty-css-name'
				? `${options.label} name must contain a letter or number; restored "${value}".`
				: validation.error === 'duplicate-name'
					? `${options.label} name already exists; using "${value}".`
					: validation.error === 'duplicate-css-name'
						? `${options.label} name would create the same CSS name as another ${options.label.toLowerCase()}; using "${value}".`
						: `${options.label} name was adjusted to "${value}".`;

	return { value, error };
}
