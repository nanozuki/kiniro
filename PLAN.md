# New Design Implementation Action List

## Working Approach

Build the new app beside the current implementation under a `/next` route. Keep
old modules and components as references until the new route shell is ready,
then promote the `/next` app to `+page.svelte` and remove obsolete code.

New modules should live alongside legacy modules, for example under
`src/lib/next`, or keep legacy-compatible exports until the promotion step. The
existing root route must keep passing checks while `/next` is built.

Each action below is sized at module/component level. Product details should be
taken from `README.md`, `docs/terminology.md`, and `docs/prototype.md` when
starting the action.

After completing an action, mark that action as `Done` in this file. If the
implementation leaves follow-up adjustments, design decisions, or constraints
that a later session should know about, record them near the completed action so
the next session can continue with full context.

## Actions

### 1. Domain model module — Done

- Add new theme/variant/family/ramp/swatch types.
- Separate shared theme structure from variant-specific values.
- Add factory helpers for empty app state and default theme creation.
- Add model tests for default creation and shared-structure invariants.

Notes:

- Added next-domain model in `src/lib/next/model.ts` with shared
  `ThemeStructure` and variant-specific `VariantValues`.
- Added tests in `src/lib/next/model.spec.ts` for default creation and
  shared-structure syncing.

### 2. Naming and validation module — Done

- Add display-name normalization and CSS-name sanitization helpers.
- Add uniqueness/collision helpers for themes, variants, families, and ramps.
- Add fallback default-name helpers.
- Add tests for invalid names, duplicate names, and sanitized-name collisions.

Notes:

- Added naming helpers in `src/lib/next/naming.ts` for display-name trimming,
  CSS-name sanitization, validation, collision detection, scoped name lists, and
  default-name generation.
- Invalid inline names can be repaired with `ensureUniqueName`; dialog-style
  blocking validation can use `validateName`.
- Sanitized CSS name collisions are treated separately from exact display-name
  duplicates.

### 3. Step scale and lightness module — Done

- Extend current lightness helpers for scale and ordinal index styles.
- Add half-step handling, controlled lightness interpolation, override cleanup,
  and reverse behavior.
- Add mapping helpers for index-style changes.
- Add tests for step indexes, interpolation, controlled values, half steps, and
  reverse behavior.

Notes:

- Added next step-scale helpers in `src/lib/next/lightness.ts` for scale and
  ordinal step labels, half-step positions, controlled interpolation, cleanup,
  index-style mapping, and reverse helpers.
- Index-style mapping maps regular scale steps by position and drops half-step
  overrides. Mapped endpoint values are preserved so the future state manager can
  decide whether to apply them to endpoints or clean them as overrides.
- Reverse helpers include both step lightness values and swatch override key
  remapping for future ramp operations.

### 4. Color and gamut module — Done

- Expand color parsing and conversion around OKLCH, Hex, RGB, and HSL source
  formats.
- Add sRGB/P3 preview conversion, clamped preview color generation, and
  out-of-gamut detection.
- Add numeric formatting helpers for lightness, chroma, and hue.
- Add tests for parsing, formatting, clamping, and gamut warnings.

Notes:

- Added next color helpers in `src/lib/next/color.ts` for source-color parsing,
  OKLCH conversion, source serialization, sRGB/P3 preview CSS, clamped preview
  hex, gamut warning status, and numeric channel normalization/formatting.
- Preview helpers expose original gamut status and clamped colors separately so
  later generated palette, swatch, and contrast modules can keep persisted data
  unclamped while showing display-safe previews.

### 5. Generated palette module — Done

- Add helpers that generate color families, ramps, and swatches from model data.
- Apply step lightness, ramp source chroma/hue, and swatch channel overrides.
- Keep generated values out of persisted data.
- Add tests for generated swatches and override precedence.

Notes:

- Added generated palette helpers in `src/lib/next/palette.ts` that derive
  ordered families, ramps, steps, and swatches from theme structure plus current
  variant values.
- Swatches keep both generated OKLCH channels and final OKLCH channels so later
  UI/export modules can show override indicators without persisting derived
  palette data.

### 6. CSS variables module — Done

- Add next-version CSS export for the current variant only.
- Use theme-level prefix, sanitized names, family grouping, and OKLCH channel
  triples.
- Preserve palette order from generated data.
- Add tests for names, precision, grouping, empty families, and copy output.

Notes:

- Added CSS export helpers in `src/lib/next/cssVariables.ts` that export only
  the selected variant, normalize the theme prefix, sanitize variant/ramp names,
  preserve generated palette order, and render grouped `:root` channel triples.
- Empty families are emitted as family comments, and usage examples are returned
  separately from copied CSS output.

### 7. Contrast module — Done

- Add WCAG contrast helpers based on clamped preview colors.
- Add default foreground/background selection helpers.
- Add pass/fail result helpers for the checker table.
- Add tests for contrast ratio, defaults, and result thresholds.

Notes:

- Added contrast helpers in `src/lib/next/contrast.ts` for WCAG ratio
  calculation from clamped preview colors, selectable swatch targets, prototype
  default foreground/background selection, and AA/AAA pass-fail table results.
- Contrast targets are derived from generated swatches only; source color cells
  are intentionally excluded.

### 8. App state manager module — Done

- Add a new app-level manager for the `/next` app.
- Keep app data and UI state separate: app data contains user-authored palette
  data, while UI state contains selection, workspace tab, gamut preview, dialog
  drafts, focus, scroll, and edit mode.
- Implement selection, workspace tab, gamut preview, theme operations, variant
  operations, family operations, step scale operations, ramp operations, and
  swatch operations.
- Enforce naming, shared-structure, and active-selection invariants.
- Keep generated values and other derived data out of app data.
- Add tests for each operation group, data/UI separation, selection repair, and
  cross-variant structure behavior.

Notes:

- Added `NextAppManager` in `src/lib/next/state.ts` as the `/next` mutation
  boundary for app data plus durable UI state: selection, workspace tab, and
  gamut preview.
- Manager operations enforce unique names, shared theme structure across
  variants, selected-variant-only color/value edits, tab repair when generated
  workspaces are invalid, and omission of generated palette/CSS/contrast data
  from app state.
- Dialog drafts, focus, scroll, edit mode, history, and persistence remain for
  later actions.

### 9. Undo/redo module — Done

- Add history handling for app data changes only, using snapshot-based entries
  for v1 unless performance forces a patch-based implementation.
- Create history entries only at semantic commit points, such as blur,
  confirmed dialogs, deletion confirmation, reordering completion, import
  confirmation, and prefix normalization.
- Exclude navigation, selection history, dialogs, focus, scroll, edit mode, and
  preview state from history.
- After undo/redo, repair only invalid UI state needed to keep a valid screen;
  do not automatically switch to, scroll to, or focus the changed component.
- Add tests for undo/redo stack behavior, redo clearing, action labels, data/UI
  separation, and invalid-selection repair.

Notes:

- Added snapshot-based App data history in `src/lib/next/history.ts` with undo,
  redo, redo clearing, action labels, capped persistence snapshots, and a restore
  hook for minimal UI repair by the app state manager.
- UI state remains outside history entries.

### 10. Storage module — Done

- Add next-version persistence with versioned local storage state.
- Persist app data, selected state, global preview state, and capped saved
  history.
- Persist only UI state that should survive reloads; do not persist dialog
  drafts, focus, scroll, edit mode, or "do not warn again" state.
- Ignore invalid stored data safely and expose reset/error status for UI toasts.
- Add tests for schema validation, defaults, invalid storage, derived-data
  omission, and history capping.

Notes:

- Added versioned next local-storage helpers in `src/lib/next/storage.ts` with
  durable UI state, capped saved history, safe invalid-data reset, and explicit
  persisted shape that omits derived/transient UI data.

### 11. Import/export module — Done

- Add JSON export and import helpers separate from UI dialogs.
- Validate export file version and theme payloads.
- Support selected-theme export data and import conflict resolution results.
- Add tests for export shape, validation failures, overwrite behavior, and
  rename behavior.

Notes:

- Added theme-only JSON import/export helpers in `src/lib/next/importExport.ts`
  with version validation, friendly validation failures, overwrite-in-place, and
  rename-and-append conflict handling.

### 12. `/next` route shell scaffold — Done

- Create `src/routes/next/+page.svelte` while the root route remains stable.
- Connect app state manager, storage sync, selected theme/variant/tab, and gamut
  preview state.
- Render placeholder sections for TitleBar, ThemeManager, WorkspaceTabs,
  workspace content, dialogs, and toasts.
- Verify initial empty state and populated editor state in `/next`.
- Add route-level tests for shell behavior.

Notes:

- Added `/next` shell with local-storage bootstrap/sync, app-state manager
  connection, empty landing state, editor placeholders, workspace tab state,
  gamut preview state, dialog/toast placeholders, and route-level tests.

### 13. Shared UI primitives — Done

- Add reusable inline-name editor, numeric OKLCH input, dialog shell,
  confirmation dialog, toast area, tab button, and compact color cell primitives.
- Keep primitives data-light and reusable across feature components.
- Add component tests for user-visible behavior.

Notes:

- Added data-light Svelte primitives in `src/lib/next/ui`: inline name editor,
  numeric OKLCH input, dialog shell, confirmation dialog, toast area, tab button,
  and compact color cell, with browser component tests.

### 14. TitleBar component — Done

- Implement empty and non-empty states.
- Wire import/export entry points, undo/redo controls, and gamut switcher.
- Keep actual import/export dialog logic delegated to dedicated
  components/modules.
- Add component tests for visible controls in both states.

Notes:

- Added `src/lib/next/TitleBar.svelte` with landing/editor states, delegated
  import/export/undo/redo/gamut/add-theme callbacks, and component tests.

### 15. ThemeManager component — Done

- Implement theme and variant navigation, add actions, rename actions, delete
  actions, and reorder entry points.
- Keep title actions below navigation.
- Surface shared state through the app state manager only.
- Add component tests for selection, create, rename, and delete behavior.

Notes:

- Added `src/lib/next/ThemeManager.svelte` with theme/variant navigation,
  create, inline rename, delete entry points, title actions below navigation, and
  callbacks intended to be wired to the app state manager.
- Drag-and-drop reorder UI is left for later integration with concrete DnD
  behavior.

### 16. WorkspaceTabs component — Done

- Implement Palette, CSS Variables, and Contrast Checker tabs.
- Disable dependent tabs when the current variant has no ramps.
- Add component tests for enabled/disabled tab behavior.

### 17. Palette component — Done

- Implement the family list workspace and Add Color Family flow.
- Delegate family editing to `ColorFamily`.
- Add component tests for empty palette and family creation behavior.

### 18. ColorFamily component — Done

- Implement family boundary, sticky header, family title actions, step scale
  summary, family delete, and ramp list.
- Delegate step editing and ramp editing to child components.
- Add component tests for family actions and shared-structure warning
  visibility.

### 19. StepScale component — Done

- Implement compact summary and expanded inline editing.
- Wire structure controls and variant-value controls to state manager
  operations.
- Add component tests for step settings, lightness overrides, reset, and
  reverse.

### 20. ColorRamp component

- Implement source color cell, swatch row, ramp actions, and reorder entry
  points.
- Open Add/Edit Color Ramp dialog for ramp name and source color.
- Add component tests for ramp rendering, edit opening, and delete behavior.

### 21. ColorRampDialog component

- Implement structured OKLCH/Hex/RGB/HSL source controls.
- Validate names and source color drafts in real time.
- Confirm as one undoable change and discard canceled drafts.
- Add component tests for validation, format switching, confirm, and cancel.

### 22. ColorSwatch component and swatch modal

- Implement swatch display cell, override indicators, gamut warning marker, and
  edit modal.
- Support per-channel reset and reset-all behavior.
- Add component tests for displayed values, override controls, and gamut
  warnings.

### 23. CSSVariables component

- Implement CSS workspace tab with prefix editing, generated code block, usage
  example, export note, and copy action.
- Wire prefix changes as undoable theme data changes.
- Add component tests for output rendering, prefix blur fallback, and copy
  success/failure feedback.

### 24. ContrastChecker component

- Implement showcase, color selector, foreground/background target controls,
  swap action, and result table.
- Use generated current-variant swatches only.
- Add component tests for default selections, target selection, swap, and
  pass/fail rendering.

### 25. Import/export dialogs

- Implement export theme selection and filename dialog.
- Implement import file picker flow, validation summary, theme selection, and
  conflict choices.
- Keep import as one undoable action and export as read-only.
- Add component tests for disabled confirm states, conflict choices, and
  successful callbacks.

### 26. Route shell promotion

- Replace placeholder sections in `src/routes/next/+page.svelte` as feature
  components become available.
- Promote the `/next` page composition to `src/routes/+page.svelte` after it
  passes checks.
- Add or update route-level tests for promoted shell behavior.

### 27. Obsolete code cleanup

- Remove old route components and old model modules after the promoted shell
  passes checks.
- Migrate or delete obsolete tests.
- Keep useful helper tests by moving them to the new modules.
- Run full verification after cleanup.

## Verification Rule

After each implementation action that changes files, run:

`pnpm run check` and `pnpm run test`

Fix all failures before moving to the next action.
