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
- Use the next version of `melt-ui` to build components.
- Update related documentation when changing domain concepts, layout behavior,
  or component responsibilities.

## Comments

Write comments for modules' interfaces, except when they are obvious enough.
"Module" here means any structure that provides an abstraction boundary, such as
classes, components, file/directory modules, subsystems, and services. Prefer
deep modules: simple interfaces that hide meaningful complexity. Avoid shallow
modules, including pure re-export modules, that add indirection without hiding
complexity.

"Interface" here means everything another module needs to know to use this
module correctly, including exported functions, parameters, return values,
props, events, errors, side effects, and important invariants.

Module comments should explain the motivation, usage, and non-obvious
constraints of the module. They should be brief, descriptive, and natural. Do
not add comments just to satisfy this rule; omit comments when the interface is
self-explanatory. Avoid unnecessary styles and labels.

In-module comments only for non-obvious implementation details, such as complex
algorithms, edge case handling, and important invariants. Avoid comments that
only mirror the code or explain obvious steps.

Prefer line comments over block comments.

## Testing

Write tests for reusable modules and non-trivial behavior.

Test cases should be meaningful and focused on user-visible behavior. They
should cover domain rules, edge cases, and potential failure points. Avoid tests
that only mirror implementation details or verify trivial behavior.

## Verification

Before committing, run `pnpm run lint`, `pnpm run check` and `pnpm run test`,
and resolve all errors and warnings.
