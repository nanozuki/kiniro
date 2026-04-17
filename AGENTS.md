# Repository Guidelines

## Project

Kiniro is a SvelteKit app for making OKLCH color palettes. The palette model is
centered on lightness: hue and chroma define the color family, and OKLCH
lightness generates the visible scale steps.

Prefer implementations that keep this model easy to reason about:

- Treat lightness step generation as shared domain logic, not as view-only
  state.
  - Reuse helpers from `src/lib` when exporting CSS variables, rendering
    palettes, or testing generated values.
  - Keep UI controls aligned with OKLCH concepts: lightness, chroma, hue, step
    count, half steps, and reversed scales.

## SvelteKit Conventions

- Use SvelteKit and Svelte 5 patterns already present in the codebase.
- Put route-level UI in `src/routes` and reusable logic in `src/lib`.
- Keep browser persistence and schema handling in `src/lib/storage.ts`.
- Keep CSS variable export behavior in `src/lib/cssVariables.ts`.
- Avoid duplicating palette math inside file-level components when a shared
  helper can express the same behavior.
- Keep component state minimal and derive values from explicit inputs where
  practical.

## Comments

Add comment for each exported function, and Svelte component. Keep comments
brief, descriptive, and natural. Focus on motivation, usage, and non-obvious
constraints. Avoid unnecessary styles and labels and do not include obvious
information or repeat code step-by-step.

Place comments immediately before the code they describe. Use line comments
rather than block comments.

## Testing

Add valuable tests for each exported function and Svelte component (except
`+page.svelte`), focusing on user-visible behavior, domain rules, and edge
cases. Don't add meaningless tests that only mirror implementation details.

## OKLCH Lightness Rules

- Lightness is the primary mechanism for generating palette steps.
- Step generation should remain deterministic for exports, previews, and tests.
- Intermediate lightness controls should be documented and tested when their
  behavior affects generated colors.
- Reversed palettes should preserve the documented model in `PLAN.md`: compute
  the normal lightness scale first, then reverse the final values.

## Verification

After each file change, run:

`pnpm run check` and `pnpm run test`

And fix all issues.
