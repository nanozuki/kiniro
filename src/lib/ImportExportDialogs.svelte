<script lang="ts">
	import {
		exportThemes,
		validateThemeImport,
		type ImportConflictChoice,
		type ThemeExportFile
	} from './importExport';
	import type { Theme } from './model';

	let {
		themes,
		onexport = (_filename: string, _json: string) => {},
		onimport = (_file: ThemeExportFile, _choices: ImportChoice[]) => {}
	} = $props<{
		themes: Theme[];
		onexport?: (filename: string, json: string) => void;
		onimport?: (file: ThemeExportFile, choices: ImportChoice[]) => void;
	}>();

	type ImportChoice = { themeId: string; conflict?: ImportConflictChoice };

	let exportOpen = $state(false);
	let importOpen = $state(false);
	let selectedThemeIds = $state<string[]>([]);
	let filename = $state('kiniro-themes.json');
	let importSummary = $state('');
	let importFile = $state<ThemeExportFile | null>(null);
	let importChoices = $state<ImportChoice[]>([]);
	let exportSelection = $derived(
		themes.filter((theme: Theme) => selectedThemeIds.includes(theme.id))
	);

	function openExport() {
		selectedThemeIds = themes.map((theme: Theme) => theme.id);
		exportOpen = true;
	}

	function toggleTheme(themeId: string, checked: boolean) {
		selectedThemeIds = checked
			? [...selectedThemeIds, themeId]
			: selectedThemeIds.filter((id) => id !== themeId);
	}

	function confirmExport() {
		onexport(filename.trim() || 'kiniro-themes.json', exportThemes(exportSelection));
		exportOpen = false;
	}

	async function readImport(event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		importFile = null;
		importChoices = [];
		if (!file) return;
		const result = validateThemeImport(await file.text());
		if (!result.ok) {
			importSummary = `${result.summary} ${result.details}`;
			return;
		}
		importFile = result.file;
		importSummary = `${result.file.themes.length} theme(s) ready to import.`;
		importChoices = result.file.themes.map((theme) => ({
			themeId: theme.id,
			conflict: hasConflict(theme) ? 'rename' : undefined
		}));
	}

	function hasConflict(theme: Theme) {
		return themes.some((existing: Theme) => existing.name === theme.name);
	}

	function choose(themeId: string, checked: boolean) {
		if (checked) importChoices = [...importChoices, { themeId, conflict: conflictFor(themeId) }];
		else importChoices = importChoices.filter((choice) => choice.themeId !== themeId);
	}

	function conflictFor(themeId: string): ImportConflictChoice | undefined {
		const theme = importFile?.themes.find((item) => item.id === themeId);
		return theme && hasConflict(theme) ? 'rename' : undefined;
	}

	function setConflict(themeId: string, conflict: ImportConflictChoice) {
		importChoices = importChoices.map((choice) =>
			choice.themeId === themeId ? { ...choice, conflict } : choice
		);
	}

	function confirmImport() {
		if (!importFile || importChoices.length === 0) return;
		onimport(importFile, importChoices);
		importOpen = false;
	}
</script>

<div class="entry-points">
	<button type="button" onclick={openExport} disabled={themes.length === 0}>Export themes</button>
	<button type="button" onclick={() => (importOpen = true)}>Import themes</button>
</div>

{#if exportOpen}
	<div class="dialog" role="dialog" aria-modal="true" aria-label="Export themes" tabindex="-1">
		<h2>Export themes</h2>
		<label
			>Filename <input
				value={filename}
				oninput={(event) => (filename = event.currentTarget.value)}
			/></label
		>
		{#each themes as theme}
			<label
				><input
					type="checkbox"
					checked={selectedThemeIds.includes(theme.id)}
					onchange={(event) => toggleTheme(theme.id, event.currentTarget.checked)}
				/>
				{theme.name}</label
			>
		{/each}
		<button type="button" onclick={confirmExport} disabled={exportSelection.length === 0}
			>Confirm export</button
		>
		<button type="button" onclick={() => (exportOpen = false)}>Cancel export</button>
	</div>
{/if}

{#if importOpen}
	<div class="dialog" role="dialog" aria-modal="true" aria-label="Import themes" tabindex="-1">
		<h2>Import themes</h2>
		<label
			>Import file <input
				type="file"
				accept="application/json,.json"
				onchange={readImport}
			/></label
		>
		{#if importSummary}<p role="status">{importSummary}</p>{/if}
		{#if importFile}
			{#each importFile.themes as theme}
				<div class="choice">
					<label
						><input
							type="checkbox"
							checked={importChoices.some((choice) => choice.themeId === theme.id)}
							onchange={(event) => choose(theme.id, event.currentTarget.checked)}
						/>
						{theme.name}</label
					>
					{#if hasConflict(theme)}
						<label
							>Conflict
							<select
								aria-label={`Conflict choice for ${theme.name}`}
								value={importChoices.find((choice) => choice.themeId === theme.id)?.conflict ??
									'rename'}
								onchange={(event) =>
									setConflict(theme.id, event.currentTarget.value as ImportConflictChoice)}
							>
								<option value="rename">Rename imported theme</option>
								<option value="overwrite">Overwrite existing theme</option>
							</select>
						</label>
					{/if}
				</div>
			{/each}
		{/if}
		<button
			type="button"
			onclick={confirmImport}
			disabled={!importFile || importChoices.length === 0}>Confirm import</button
		>
		<button type="button" onclick={() => (importOpen = false)}>Cancel import</button>
	</div>
{/if}

<style>
	.entry-points {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.dialog {
		display: grid;
		gap: 0.75rem;
		border: 1px solid currentColor;
		border-radius: 0.5rem;
		padding: 1rem;
		margin-block-start: 1rem;
	}
	.choice {
		display: grid;
		gap: 0.5rem;
		padding: 0.5rem;
		border: 1px dashed currentColor;
	}
</style>
