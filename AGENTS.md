# Repository Guidelines

## Project

Kiniro is a SvelteKit app for making OKLCH color palettes. The palette model is
centered on lightness: hue and chroma define the color family, and OKLCH
lightness generates the visible scale steps.

Prefer implementations that keep this model easy to reason about:

- Treat lightness step generation as shared domain logic, not as view-only state.
- Reuse helpers from `src/lib` when exporting CSS variables, rendering palettes,
  or testing generated values.
- Keep UI controls aligned with OKLCH concepts: lightness, chroma, hue, step
  count, half steps, and reversed scales.

## SvelteKit Conventions

- Use SvelteKit and Svelte 5 patterns already present in the codebase.
- Put route-level UI in `src/routes` and reusable logic in `src/lib`.
- Keep browser persistence and schema handling in `src/lib/storage.ts`.
- Keep CSS variable export behavior in `src/lib/cssVariables.ts`.
- Avoid duplicating palette math inside file-level components when a shared helper
  can express the same behavior.

## Components

For every component change:

- Add or update Vitest coverage through the Vite/Vitest setup when behavior can be
  tested meaningfully.
- Prefer valuable tests that check user-visible behavior, domain rules, and edge
  cases over tests that only mirror implementation details.
- Write comments only when they record motivation, usage, or non-obvious
  constraints. Do not repeat what the code already says.
- Keep component state minimal and derive values from explicit inputs where
  practical.

## OKLCH Lightness Rules

- Lightness is the primary mechanism for generating palette steps.
- Step generation should remain deterministic for exports, previews, and tests.
- Intermediate lightness controls should be documented and tested when their
  behavior affects generated colors.
- Reversed palettes should preserve the documented model in `PLAN.md`: compute the
  normal lightness scale first, then reverse the final values.

## Verification

After each file change, run:

```sh
pnpm run check
pnpm run test
```

If either command cannot run, document the blocker and what remains unverified.
