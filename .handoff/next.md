# next

Created: 2026-05-18 21:00 Updated: 2026-05-18 22:00

## Goal

Complete the new Kiniro prototype implementation in the `/next` route, then
promote it to the main route and clean up obsolete code.

## Context

Kiniro is a SvelteKit web app for making OKLCH color palettes with
lightness-based step generation and CSS variable export.

The prototype redesigns the entire app with:

- Deeper hierarchy: Theme → Variant → Color Family → Color Ramp → Swatch
- Shared structure across variants in a theme (families, ramps, step scales)
- Variant-specific values (lightness overrides, source colors, swatch overrides)
- Two step index styles: scale (`50`, `100`, `200`) and ordinal (`1`, `2`, `3`)
- Optional half steps for scale style
- Controlled lightness interpolation with manual overrides
- Reverse support for lightness values and swatch overrides
- Per-swatch OKLCH channel overrides
- sRGB/P3 gamut preview with clamped display colors
- Undo/redo for data changes only (not UI state)
- Local storage persistence with version validation
- JSON import/export with conflict resolution

Key docs:

- `README.md`: Product direction and development commands
- `docs/terminology.md`: Domain model hierarchy and term definitions
- `docs/prototype.md`: Page layouts, component responsibilities, and behavior
  rules

## Status

**Implementation complete.** The new prototype is promoted to
`src/routes/+page.svelte` and obsolete code has been removed.

Verification passed:

- `pnpm run check` — clean
- `pnpm run test` — all tests passing

**Next: Manual testing and refinement.** The implementation passes automated
checks, but needs hands-on testing to identify UX issues, edge cases, and areas
for improvement. Expect adjustments and improvements based on real usage.

## Key Decisions

### Module organization

- Built next implementation alongside legacy code under `src/lib/next/`
- Developed the new route at `/next` initially, then promoted to root
- Kept model operations pure; app state manager enforces invariants
- Generated palette, CSS, and contrast data are derived reactively, never
  persisted

### Data and UI state separation

- App data: user-authored palette data (themes, variants, families, ramps,
  swatches, overrides)
- UI state: navigation, selection, workspace tab, gamut preview, dialogs, focus,
  scroll, edit mode
- Undo/redo tracks app data only; UI state may persist separately but is not
  part of history

### Shared structure enforcement

- Theme structure (families, ramps, step scales) is shared across all variants
  in a theme
- Variant values (lightness, colors, overrides) are per-variant
- Structural changes show a non-blocking warning when a theme has multiple
  variants
- Switching step index styles maps by position and drops half-step overrides

### History model

- Snapshot-based undo/redo for v1 (patch-based deferred if performance requires)
- History entries only at semantic commit points: blur, dialog confirm, delete
  confirm, reorder complete, import confirm
- Capped at 100 persisted entries; uncapped in-memory
- After restore, minimal UI repair only (selection, tab validity); no
  auto-scroll or auto-focus

### Naming and sanitization

- Display names are user-friendly; CSS names are derived automatically
- Inline inputs normalize/fix on blur with one undo entry if changed
- Dialogs validate in real time and block confirm while invalid
- Duplicate names or sanitized collisions repaired with numeric suffixes

### Color and gamut preview

- OKLCH is the source of truth; sRGB/P3 preview is clamped for display only
- CSS export always uses unclamped OKLCH channel triples
- Contrast checker uses clamped preview colors for measurement
- Gamut preview state is global, persists, but is not part of undo/redo

### Component testing

- Browser-based component tests for user-visible behavior using Vitest
- Domain module tests for reusable logic (model, naming, lightness, color,
  palette, CSS, contrast)
- Route-level tests for shell integration and workspace behavior

## Open Questions

None. The prototype is complete and verified.
