# State And Data Refactor Plan

This branch should settle Kiniro's state ownership model in stages. The final
shape is that components interact only with `AppManager` for app-owned data and
mutations. Persistence, undo/redo history, validation, and direct state writes
stay behind `AppManager`, though they may be implemented by internal helper
modules or classes.

## Decisions

- `AppManager` is exposed through Runed context. Components read app-owned data
  from context instead of receiving it by props.
- Components may receive identity props, such as `themeId`, `familyId`,
  `rampId`, or `stepIndex`, when an ID is needed to locate scoped data.
- Components own ephemeral UI state only: dialog open state, edit mode, draft
  text, copy feedback, hover/focus state, and temporary choices.
- Undo/redo history stores authored app data plus durable UI choices, but never
  stores history itself.
- Restoring history should preserve the selected theme, selected variant, and
  workspace tab from the saved history entry.
- Keep a private AppManager invariant pass, but use it as a guard for invalid
  loaded/imported states rather than as the normal undo/redo selection strategy.
- Inline edit preview may show unresolved temporary values. Preview must not
  write localStorage or create undo/redo entries. Submit/finalization resolves
  and commits once.
- Inline edit session types and helpers are exported from `InlineInput.svelte`
  via `<script module>` to keep the component API simple. Editor support for
  named Svelte module exports comes from `typescript-svelte-plugin`.
- Export files are public DTOs and must not contain internal IDs.
- Import files are public ID-free DTOs. Import regenerates internal IDs and
  remaps family/ramp values into the internal model.
- Import overwrite matches existing themes by name. Preserve existing IDs only
  if it keeps implementation simple; regenerating IDs is acceptable.
- localStorage is internal persisted state and may keep IDs, but it must be
  fully validated before constructing AppManager state.
- The project is pinned to `pnpm@11.3.0`; use the Nix development environment's
  pnpm rather than an older global pnpm shim.

## Phase 1: Schemas And DTO Boundaries

Status: complete.

Goal: create a reliable runtime boundary for internal persisted state and public
import/export files.

Work:

- [x] Add zod schemas for the full internal persisted state shape, including app
      data, durable UI state, and history entries.
- [x] Add zod schemas for the public export/import DTO shape, with no IDs.
- [x] Stop reusing internal `Theme` as the export file type.
- [x] Keep schema modules reusable by storage, import/export, and AppManager tests.

Tests:

- [x] localStorage rejects invalid nested theme/variant/family/ramp data.
- [x] localStorage accepts valid internal persisted state, including IDs and history.
- [x] import rejects invalid nested public export data.
- [x] import accepts valid public ID-free export data.
- [x] Type-level or runtime tests should make it hard to accidentally include `id`
      in the public export DTO.

Manual QA:

- None expected for this phase.

## Phase 2: ID-Free Import And Export

Status: complete.

Goal: make exported files user-facing and independent of internal DOM/model IDs.

Work:

- [x] Change `exportThemes` to emit public DTOs with no `id` fields anywhere.
- [x] Change import validation to parse public DTOs through zod.
- [x] Convert imported public DTOs into internal themes with freshly generated IDs.
- [x] Remap family and ramp values from the public array structure into internal
      ID-keyed records.
- [x] Update import choices to use an array index or UI-only import key instead of
      imported theme IDs.
- [x] Preserve import conflict behavior, with overwrite matched by theme name.

Tests:

- [x] exported JSON contains no `id` keys at any depth.
- [x] importing an exported file creates valid internal themes with generated IDs.
- [x] imported family/ramp values still line up with their regenerated structure.
- [x] conflicting imports rename or overwrite by theme name.
- [x] overwrite either preserves or regenerates IDs consistently, depending on the
      chosen implementation.

Manual QA:

- [x] Export a non-trivial theme, inspect the JSON for readability, then import it
      back and confirm the palette still renders correctly.

## Phase 3: AppManager Persistence And Undo/Redo

Status: complete.

Goal: make AppManager the only component-visible owner of persistence and
undo/redo.

Work:

- Move localStorage load/save coordination behind AppManager.
- Introduce an AppManager-internal persistence collaborator if that keeps
  storage concerns isolated.
- Integrate history into AppManager.
- Change history entries to store `{ data, ui }`, not only `data`.
- Add AppManager methods for undo and redo.
- Add AppManager methods for import/export application so `+page.svelte` does
  not write `app.data` or `app.ui` directly.
- Replace route-level manual save calls with AppManager-managed commits.
- Keep an internal invariant pass for loaded/imported/restored state.

Tests:

- rename theme/variant submit creates one undo entry.
- undo and redo restore theme/variant names.
- undo and redo restore selected theme, selected variant, and workspace tab.
- localStorage is updated after commit mutations.
- localStorage is not updated during preview mutations.
- redo history is cleared after a new commit.
- AppManager import methods create history entries and persist.
- invalid loaded state is rejected or reconciled before components read it.

Manual QA:

- [x] Use the UI to rename a theme and a variant, then verify Undo and Redo buttons
      behave correctly.
- [x] Reload after a commit and confirm state and history survive.

## Phase 4: Inline Edit Sessions

Status: complete.

Goal: make inline editing safe by construction, with preview and submit packaged
as one edit session.

Work:

- [x] Replace independent `oninput` and `onsubmit` callbacks in `InlineInput` with
      an edit-session API.
- [x] Let `InlineInput` start an edit session when editing begins.
- [x] Let AppManager capture the previous value internally when creating each edit
      session, such as `app.editThemeName(themeId)`.
- [x] Expose `preview(draft)` and `submit(draft)` on each edit session.
- [x] Keep submit result support for resolved values and toastable adjustment
      messages.
- [x] Update all inline input call sites to use edit sessions.

Tests:

- [x] preview updates visible state without writing localStorage.
- [x] preview updates visible state without creating undo/redo entries.
- [x] submit resolves invalid values using the captured previous value where needed.
- [x] submit writes localStorage once.
- [x] submit creates one undo entry for an edit session.
- [x] Enter, Escape, and blur still finalize the current draft once.
- [x] IME composition still prevents accidental Enter submission.

Manual QA:

- [x] Type invalid and duplicate names slowly and confirm the input experience does
      not jump around during preview.
- [x] Confirm the final submitted value is normalized or repaired with a toast.

## Phase 5: AppManager Context

Status: complete.

Goal: remove prop drilling for AppManager-owned data and mutations.

Work:

- [x] Add `runed` as a direct dependency if the project imports Runed context
      directly.
- [x] Add an AppManager context module.
- [x] Set AppManager context at the route boundary.
- [x] Refactor route-owned components to read AppManager from context.
- [x] Refactor reusable UI components that edit app-owned data to read AppManager
      from context when possible.
- [x] Pass only identity/scope props when a component cannot infer what to read.
- [x] Keep purely presentational or generic components prop-driven.

Tests:

- [x] Existing component behavior remains covered after moving to context.
- [x] Components that need AppManager throw clearly or fail tests when rendered
      without the provider.
- [x] ID-scoped components render the right family/ramp/swatch after selection
      changes.

Manual QA:

- [x] Navigate through theme, variant, palette, CSS variable, and contrast checker
      workflows to catch context wiring mistakes that unit tests may miss.

## Phase 6: Cleanup And Documentation

Status: complete.

Goal: remove old ownership leaks and document the settled model.

Work:

- [x] Remove direct external writes to `app.data` and `app.ui`.
- [x] Remove disabled undo/redo placeholders and wire real controls.
- [x] Update architecture docs to match the final history, persistence, context,
      inline edit, and import/export model.
- [x] Keep module comments current where interfaces changed.
- [x] Remove obsolete tests that only covered old callback plumbing.

Tests:

- [x] `pnpm run lint`
- [x] `pnpm run check`
- [x] `pnpm run test`

Manual QA:

- [x] Full browser pass through create, rename, add family/ramp, edit scale, export,
      import, undo, redo, reload, and copy CSS workflows.

## Follow-up

- None currently.
