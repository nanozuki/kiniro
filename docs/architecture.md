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

Kiniro keeps state in two layers:

- **App data**: user-authored palette data such as themes, variants, shared
  family/ramp structure, step-scale values, source colors, swatch overrides,
  theme CSS prefixes, and each Theme's target gamut.
- **UI state**: navigation and presentation state such as the selected theme,
  selected variant, and selected workspace tab.

Generated or derived values do not belong in either persisted data or undo
history. That includes sanitized names, generated lightness values, generated
swatches, CSS output, clamped preview colors, and contrast results.

Use stable IDs for any persisted entity that can be selected, reordered,
restored, or deleted.

## Persistence

Local storage persists:

- App data
- durable UI choices that should survive reloads

If stored data fails validation, Kiniro discards it, rebuilds an empty state,
and notifies the user that local data was reset.

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

Outside dialogs, inputs update live but create at most one undoable commit on
blur. Invalid values fall back to the module's default naming rule. Duplicate
names, including sanitized-name collisions, are repaired by appending a number.

Inside dialogs, validation is live and confirmation stays disabled until every
value is valid.

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
