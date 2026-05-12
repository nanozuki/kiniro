# Repository Guidelines

Read @README.md to get an overview of this project.

## Documentation Map

- `docs/terminology.md`: Shared domain terms for themes, variants, palettes,
  color families, color ramps, swatches, source colors, and generated values.
- `docs/prototype.md`: Current prototype design, including page layouts,
  component responsibilities, component hierarchy, and component-owned behavior.

## Techniques

- Use `nix flake` and `direnv` for development environment.
- Use SvelteKit and Svelte 5. Use runes for reactivity.
- Put route-level UI in `src/routes` and reusable logic in `src/lib`.
- Use `color.js` for color calculations.
- Use `melt-ui` next version to build components

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

## Verification

After each file change, run:

`pnpm run check` and `pnpm run test`

And fix all issues.
