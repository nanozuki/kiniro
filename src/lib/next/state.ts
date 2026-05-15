import {
	cleanLightnessOverrides,
	createIndexStyleStructure,
	getStepIndexes,
	mapLightnessOverridesForIndexStyle,
	reverseStepScaleValues,
	reverseSwatchOverrides
} from './lightness';
import {
	createDefaultRampValues,
	createDefaultStepScaleStructure,
	createDefaultStepScaleValues,
	createDefaultTheme,
	createEmptyAppState,
	createThemeVariant,
	syncThemeVariantValues,
	type AppState,
	type ColorFamilyStructure,
	type ColorFamilyValues,
	type ColorRampStructure,
	type GamutPreview,
	type Id,
	type OklchChannel,
	type SourceColor,
	type StepIndexStyle,
	type Theme,
	type ThemeVariant,
	type WorkspaceTab
} from './model';
import {
	defaultFamilyName,
	defaultRampName,
	defaultThemeName,
	defaultVariantName,
	ensureUniqueName,
	familyNames,
	rampNames,
	themeNames,
	variantNames
} from './naming';
import { normalizeCssPrefix } from './cssVariables';

export type SelectionState = {
	themeId: Id | null;
	variantId: Id | null;
};

export type NextUiState = {
	selection: SelectionState;
	workspaceTab: WorkspaceTab;
	gamutPreview: GamutPreview;
};

export type NextAppManagerState = {
	data: AppState;
	ui: NextUiState;
};

export type IdFactory = () => Id;

export type NextAppManagerOptions = {
	data?: AppState;
	ui?: Partial<NextUiState>;
	idFactory?: IdFactory;
};

// NextAppManager is the mutation boundary for v1 app data and UI state. App data
// contains only authored palette data; UI state contains navigation and preview
// choices, and every data operation repairs selection enough to keep the screen valid.
export class NextAppManager {
	data: AppState;
	ui: NextUiState;
	private idFactory: IdFactory;

	constructor(options: NextAppManagerOptions = {}) {
		this.data = clone(options.data ?? createEmptyAppState());
		const { selection, ...uiOptions } = options.ui ?? {};
		this.ui = {
			selection: { themeId: null, variantId: null, ...selection },
			workspaceTab: 'palette',
			gamutPreview: 'srgb',
			...uiOptions
		};
		this.idFactory = options.idFactory ?? createSequentialIdFactory();
		this.repairUiState();
	}

	get selectedTheme(): Theme | null {
		return this.data.themes.find((theme) => theme.id === this.ui.selection.themeId) ?? null;
	}

	get selectedVariant(): ThemeVariant | null {
		return this.selectedTheme?.variants.find((variant) => variant.id === this.ui.selection.variantId) ?? null;
	}

	selectTheme(themeId: Id): void {
		const theme = this.data.themes.find((item) => item.id === themeId);
		if (!theme) return;
		this.ui.selection = { themeId: theme.id, variantId: theme.variants[0]?.id ?? null };
		this.ui.workspaceTab = 'palette';
		this.repairUiState();
	}

	selectVariant(variantId: Id): void {
		const theme = this.selectedTheme;
		if (!theme?.variants.some((variant) => variant.id === variantId)) return;
		this.ui.selection.variantId = variantId;
		this.ui.workspaceTab = 'palette';
	}

	setWorkspaceTab(tab: WorkspaceTab): void {
		this.ui.workspaceTab = tab;
		this.repairUiState();
	}

	setGamutPreview(gamutPreview: GamutPreview): void {
		this.ui.gamutPreview = gamutPreview;
	}

	addTheme(name = defaultThemeName(this.data.themes)): Theme {
		const theme = createDefaultTheme({ id: this.idFactory(), name: ensureUniqueName(name, themeNames(this.data.themes), { fallbackBase: 'Theme' }), variantId: this.idFactory(), familyId: this.idFactory() });
		this.data.themes.push(theme);
		this.ui.selection = { themeId: theme.id, variantId: theme.variants[0].id };
		this.ui.workspaceTab = 'palette';
		return theme;
	}

	renameTheme(themeId: Id, name: string): void {
		const theme = this.data.themes.find((item) => item.id === themeId);
		if (!theme) return;
		theme.name = ensureUniqueName(name, themeNames(this.data.themes), { exclude: theme, fallbackBase: 'Theme' });
	}

	deleteTheme(themeId: Id): void {
		const index = this.data.themes.findIndex((theme) => theme.id === themeId);
		if (index < 0) return;
		this.data.themes.splice(index, 1);
		const neighbor = this.data.themes[index] ?? this.data.themes[index - 1] ?? null;
		this.ui.selection = { themeId: neighbor?.id ?? null, variantId: neighbor?.variants[0]?.id ?? null };
		this.ui.workspaceTab = 'palette';
		this.repairUiState();
	}

	setThemeCssPrefix(themeId: Id, prefix: string): void {
		const theme = this.data.themes.find((item) => item.id === themeId);
		if (theme) theme.cssPrefix = normalizeCssPrefix(prefix);
	}

	addVariant(name?: string): ThemeVariant | null {
		const theme = this.selectedTheme;
		const source = this.selectedVariant;
		if (!theme || !source) return null;
		const variant = createThemeVariant(theme.structure, {
			id: this.idFactory(),
			name: ensureUniqueName(name ?? defaultVariantName(theme.variants), variantNames(theme), { fallbackBase: 'Variant' }),
			values: clone(source.values)
		});
		theme.variants.push(variant);
		this.ui.selection.variantId = variant.id;
		this.ui.workspaceTab = 'palette';
		return variant;
	}

	renameVariant(variantId: Id, name: string): void {
		const theme = this.selectedTheme;
		const variant = theme?.variants.find((item) => item.id === variantId);
		if (!theme || !variant) return;
		variant.name = ensureUniqueName(name, variantNames(theme), { exclude: variant, fallbackBase: 'Variant' });
	}

	deleteVariant(variantId: Id): void {
		const theme = this.selectedTheme;
		if (!theme || theme.variants.length <= 1) return;
		const index = theme.variants.findIndex((variant) => variant.id === variantId);
		if (index < 0) return;
		theme.variants.splice(index, 1);
		const neighbor = theme.variants[index] ?? theme.variants[index - 1];
		this.ui.selection.variantId = neighbor.id;
		this.ui.workspaceTab = 'palette';
	}

	addFamily(name?: string): ColorFamilyStructure | null {
		const theme = this.selectedTheme;
		if (!theme) return null;
		const family: ColorFamilyStructure = {
			id: this.idFactory(),
			name: ensureUniqueName(name ?? defaultFamilyName(theme.structure.families), familyNames(theme), { fallbackBase: 'Family' }),
			stepScale: createDefaultStepScaleStructure(),
			ramps: []
		};
		theme.structure.families.push(family);
		for (const variant of theme.variants) variant.values.families[family.id] = createDefaultFamilyValues();
		this.ui.workspaceTab = 'palette';
		return family;
	}

	renameFamily(familyId: Id, name: string): void {
		const theme = this.selectedTheme;
		const family = theme?.structure.families.find((item) => item.id === familyId);
		if (!theme || !family) return;
		family.name = ensureUniqueName(name, familyNames(theme), { exclude: family, fallbackBase: 'Family' });
	}

	deleteFamily(familyId: Id): void {
		const theme = this.selectedTheme;
		if (!theme) return;
		theme.structure.families = theme.structure.families.filter((family) => family.id !== familyId);
		for (const variant of theme.variants) delete variant.values.families[familyId];
		this.repairUiState();
	}

	setStepCount(familyId: Id, count: number): void {
		const theme = this.selectedTheme;
		const family = theme?.structure.families.find((item) => item.id === familyId);
		if (!theme || !family) return;
		family.stepScale.stepCount = Math.min(9, Math.max(5, Math.trunc(count)));
		this.cleanFamilyStepValues(theme, family);
	}

	setIndexStyle(familyId: Id, indexStyle: StepIndexStyle): void {
		const theme = this.selectedTheme;
		const family = theme?.structure.families.find((item) => item.id === familyId);
		if (!theme || !family) return;
		const previous = family.stepScale;
		family.stepScale = createIndexStyleStructure(family.stepScale, indexStyle);
		for (const variant of theme.variants) {
			const values = variant.values.families[family.id]?.stepScale;
			if (values) values.lightnessOverrides = mapLightnessOverridesForIndexStyle(previous, family.stepScale, values.lightnessOverrides);
		}
	}

	setHalfSteps(familyId: Id, halfStepStart: boolean, halfStepEnd: boolean): void {
		const theme = this.selectedTheme;
		const family = theme?.structure.families.find((item) => item.id === familyId);
		if (!theme || !family || family.stepScale.indexStyle !== 'scale') return;
		family.stepScale.halfStepStart = halfStepStart;
		family.stepScale.halfStepEnd = halfStepEnd;
		this.cleanFamilyStepValues(theme, family);
	}

	setLightnessRange(familyId: Id, start: number, end: number): void {
		const values = this.selectedVariant?.values.families[familyId]?.stepScale;
		if (!values) return;
		values.lightnessStart = start;
		values.lightnessEnd = end;
	}

	overrideLightness(familyId: Id, stepIndex: string, lightness: number): void {
		const family = this.selectedTheme?.structure.families.find((item) => item.id === familyId);
		const values = this.selectedVariant?.values.families[familyId]?.stepScale;
		if (!family || !values) return;
		if (getStepIndexes(family.stepScale).slice(1, -1).includes(stepIndex)) values.lightnessOverrides[stepIndex] = lightness;
	}

	resetLightness(familyId: Id, stepIndex: string): void {
		const values = this.selectedVariant?.values.families[familyId]?.stepScale;
		if (values) delete values.lightnessOverrides[stepIndex];
	}

	reverseFamilyLightness(familyId: Id): void {
		const family = this.selectedTheme?.structure.families.find((item) => item.id === familyId);
		const familyValues = this.selectedVariant?.values.families[familyId];
		if (!family || !familyValues) return;
		familyValues.stepScale = reverseStepScaleValues(family.stepScale, familyValues.stepScale);
		for (const ramp of Object.values(familyValues.ramps)) ramp.swatchOverrides = reverseSwatchOverrides(family.stepScale, ramp.swatchOverrides);
	}

	addRamp(familyId: Id, sourceColor: SourceColor, name?: string): ColorRampStructure | null {
		const theme = this.selectedTheme;
		const family = theme?.structure.families.find((item) => item.id === familyId);
		if (!theme || !family) return null;
		const ramp: ColorRampStructure = {
			id: this.idFactory(),
			name: ensureUniqueName(name ?? defaultRampName(rampNames(theme)), rampNames(theme), { fallbackBase: 'Ramp' })
		};
		family.ramps.push(ramp);
		for (const variant of theme.variants) variant.values.families[family.id].ramps[ramp.id] = createDefaultRampValues(sourceColor);
		this.repairUiState();
		return ramp;
	}

	renameRamp(rampId: Id, name: string): void {
		const theme = this.selectedTheme;
		const ramp = theme?.structure.families.flatMap((family) => family.ramps).find((item) => item.id === rampId);
		if (!theme || !ramp) return;
		ramp.name = ensureUniqueName(name, rampNames(theme), { exclude: ramp, fallbackBase: 'Ramp' });
	}

	setRampSourceColor(familyId: Id, rampId: Id, sourceColor: SourceColor): void {
		const ramp = this.selectedVariant?.values.families[familyId]?.ramps[rampId];
		if (ramp) ramp.sourceColor = clone(sourceColor);
	}

	deleteRamp(familyId: Id, rampId: Id): void {
		const theme = this.selectedTheme;
		const family = theme?.structure.families.find((item) => item.id === familyId);
		if (!theme || !family) return;
		family.ramps = family.ramps.filter((ramp) => ramp.id !== rampId);
		for (const variant of theme.variants) delete variant.values.families[familyId]?.ramps[rampId];
		this.repairUiState();
	}

	overrideSwatchChannel(familyId: Id, rampId: Id, stepIndex: string, channel: OklchChannel, value: number): void {
		const ramp = this.selectedVariant?.values.families[familyId]?.ramps[rampId];
		if (!ramp) return;
		ramp.swatchOverrides[stepIndex] = { ...ramp.swatchOverrides[stepIndex], [channel]: value };
	}

	resetSwatchChannel(familyId: Id, rampId: Id, stepIndex: string, channel: OklchChannel): void {
		const ramp = this.selectedVariant?.values.families[familyId]?.ramps[rampId];
		if (!ramp?.swatchOverrides[stepIndex]) return;
		delete ramp.swatchOverrides[stepIndex][channel];
		if (Object.keys(ramp.swatchOverrides[stepIndex]).length === 0) delete ramp.swatchOverrides[stepIndex];
	}

	resetSwatchColor(familyId: Id, rampId: Id, stepIndex: string): void {
		const ramp = this.selectedVariant?.values.families[familyId]?.ramps[rampId];
		if (ramp) delete ramp.swatchOverrides[stepIndex];
	}

	repairUiState(): void {
		if (this.data.themes.length === 0) {
			this.ui.selection = { themeId: null, variantId: null };
			this.ui.workspaceTab = 'palette';
			return;
		}

		let theme = this.selectedTheme;
		if (!theme) theme = this.data.themes[0];
		let variant = theme.variants.find((item) => item.id === this.ui.selection.variantId) ?? theme.variants[0] ?? null;
		if (!variant) {
			variant = createThemeVariant(theme.structure, { id: this.idFactory(), name: defaultVariantName(theme.variants) });
			theme.variants.push(variant);
		}
		this.ui.selection = { themeId: theme.id, variantId: variant.id };
		if (this.ui.workspaceTab !== 'palette' && !themeHasRamps(theme)) this.ui.workspaceTab = 'palette';
		for (const existingTheme of this.data.themes) Object.assign(existingTheme, syncThemeVariantValues(existingTheme));
	}

	private cleanFamilyStepValues(theme: Theme, family: ColorFamilyStructure): void {
		const indexes = getStepIndexes(family.stepScale);
		for (const variant of theme.variants) {
			const familyValues = variant.values.families[family.id];
			if (!familyValues) continue;
			familyValues.stepScale.lightnessOverrides = cleanLightnessOverrides(familyValues.stepScale.lightnessOverrides, indexes);
			for (const ramp of Object.values(familyValues.ramps)) {
				ramp.swatchOverrides = Object.fromEntries(Object.entries(ramp.swatchOverrides).filter(([index]) => indexes.includes(index)));
			}
		}
	}
}

export function createNextAppManager(options: NextAppManagerOptions = {}): NextAppManager {
	return new NextAppManager(options);
}

function createDefaultFamilyValues(): ColorFamilyValues {
	return { stepScale: createDefaultStepScaleValues(), ramps: {} };
}

function themeHasRamps(theme: Theme): boolean {
	return theme.structure.families.some((family) => family.ramps.length > 0);
}

function createSequentialIdFactory(): IdFactory {
	let nextId = 1;
	return () => `id-${nextId++}`;
}

function clone<T>(value: T): T {
	return structuredClone(value);
}
