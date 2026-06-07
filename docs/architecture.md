# Application Architecture

Reference:

- Terminology: @docs/terminology.md

This document keeps the cross-cutting rules that span multiple modules. Module-
owned UI behavior lives with the corresponding route or component comments.

## Source Layout

Use a small file-structure rule set:

- `src/routes`: route files plus page components used directly by
  `+layout.svelte` or `+page.svelte`
- `src/lib/ui`: Svelte components not owned directly by the route entry files
- `src/lib/state`: TypeScript modules that use Svelte runes for app state
- `src/lib`: other TypeScript modules

## State Split

Kiniro keeps state in two ownership layers:

- **AppManager persisted state**: user-authored palette data plus durable UI
  choices that should survive reloads.
- **Component-local state**: ephemeral interaction state that is meaningful only
  while a specific component is mounted.

Only data that cannot be rebuilt from other persisted state belongs in
AppManager persisted state. Generated or derived values do not belong in
storage or undo history.

Use stable IDs for any persisted entity that can be selected, reordered,
restored, or deleted.

Components read app data and derived values from AppManager's reactive state,
accessors, or helpers. All changes to AppManager persisted state must go through
AppManager methods, which also coordinate validation, selection repair,
undo/redo, and persistence.

`AppManager` is provided with Runed context at the route boundary. UI modules
that need scoped app data receive stable identity props, such as theme, family,
ramp, or step IDs, and resolve the rest through the manager.

## Persistence

Local storage persists the undo/redo history. The current history entry contains
authored app data and durable UI choices, and is the reload source of truth. The
local-storage shape is internal and may include generated IDs.

If stored data fails validation, Kiniro discards it, rebuilds an empty state,
and notifies the user that local data was reset.

Persisted state is parsed through internal schemas before `AppManager` exposes
it to components. `AppManager` repairs loaded, imported, undone, and redone
state before persistence or rendering.

Inline edit previews are temporary. They do not write local storage or add undo
entries until submission.

## Dialogs

Dialogs own draft state for edits made inside the modal. Closing or canceling a
dialog discards the draft. AppManager state changes only after the dialog's
explicit submit/apply action.

Dialogs may show a local preview derived from draft values, but that preview
must not mutate AppManager state, undo history, or persistence until submit.

## Shared Naming and Validation Rules

Users edit friendly display names. CSS-safe names are derived automatically and
are not user-editable.

Naming validation must be shared by dialogs, inline editors, default-name
generation, and import conflict handling.

## Import And Export

Theme export files are public DTOs, not internal persisted state. They do not
include internal IDs, generated palette output, UI state, or history. Import
applies through `AppManager` so history, selection, and persistence stay
consistent.

## Shared Structure Across Variants

Variants inside the same theme share palette structure. Each variant owns only
the authored values for that structure. Generated palette output is derived from
both layers and is not persisted.

## Theme Target Gamut

Each Theme owns its target gamut. Palette generation, preview, contrast
checking, and export must use the same authored target so users do not see
different colors across workspaces.
