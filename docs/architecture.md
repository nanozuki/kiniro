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
  choices that should survive reloads. Authored data includes themes, variants,
  shared family/ramp structure, step-scale values, source colors, swatch
  overrides, theme CSS prefixes, and each Theme's target gamut. Durable UI
  choices include the selected theme, selected variant, and selected workspace
  tab.
- **Component-local state**: ephemeral interaction state such as dialog open
  flags, inline edit drafts, copy feedback, hover/focus state, and temporary
  form choices.

Only data that cannot be rebuilt from other persisted state belongs in
AppManager persisted state. Generated or derived values do not belong in local
storage or undo history. That includes sanitized names, generated lightness
values, generated swatches, CSS output, clamped preview colors, and contrast
results.

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

Local storage persists:

- authored app data
- durable UI choices that should survive reloads
- undo/redo history snapshots

If stored data fails validation, Kiniro discards it, rebuilds an empty state,
and notifies the user that local data was reset.

The local-storage shape is internal and may include generated IDs. It is parsed
through the internal zod schemas before `AppManager` exposes the state to
components. `AppManager` runs a repair pass after loading, importing, undoing, or
redoing so selection and variant values line up with the current theme
structure.

Undo and redo history stores the previous authored app data plus durable UI
choices for each committed mutation. It does not store the history stacks inside
history entries. Undo and redo restore selected theme, selected variant, and
workspace tab along with the authored data, then persist the restored snapshot.

Inline edit previews are temporary. Preview mutations may show unresolved draft
text in the UI, but they do not write local storage or add undo entries.
Submission resolves names, creates at most one history entry, and persists once.

## Shared Naming and Validation Rules

Users edit friendly display names. CSS-safe names are derived automatically and
are not user-editable.

Sanitization rules:

- lowercase
- trim surrounding whitespace
- convert spaces and underscores to hyphens
- remove unsupported characters
- collapse repeated hyphens
- require at least one letter or number

A name is invalid when the trimmed display name is empty or its sanitized form
is empty.

Inside dialogs, validation is live and confirmation stays disabled until every
value is valid.

## Import And Export

Theme export files are public DTOs, not internal persisted state. They do not
include internal IDs at any depth. Import validates this public shape, generates
fresh internal IDs, remaps family and ramp values onto those IDs, and applies the
result through `AppManager` so history, selection, and persistence stay
consistent.

When importing a theme with the same name as an existing theme, the import flow
lets the user choose whether to rename the incoming theme or overwrite the
existing one. The matching key is the theme name, not an internal ID.

## Shared Structure Across Variants

Variants inside the same theme share structure. Shared structure includes:

- color family names and order
- each family's step-scale structure
- ramp names and order within each family

Variant-specific values include step lightness values, reverse state, source
colors, generated swatches, and swatch channel overrides.

When a theme has multiple variants, structural edits should show a nearby,
non-blocking warning. The warning explains that the edit affects every variant
in the theme. This warning is separate from destructive delete confirmations.

## Theme Target Gamut

Palette generation, palette preview, and contrast checking use each Theme's
target gamut.

- the target gamut is authored Theme data
- it persists across reloads and exports with the Theme
- generated swatch chroma uses relative chroma within that gamut
- previewed colors may be clamped to the Theme's target gamut
- CSS export always uses the original OKLCH channel values, not preview-clamped
  colors
