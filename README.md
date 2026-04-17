# Kiniro

Kiniro is a SvelteKit web app for making color palettes in the OKLCH color
space. It helps you start from colors you like, generate useful palette steps,
and export the result as CSS variables.

## Product Direction

The core idea is to use OKLCH lightness to build palette steps. Hue and chroma
describe the character of a color, while lightness controls how the color moves
from bright to dark across a scale.

Kiniro should make that relationship visible and editable:

- Create color groups in OKLCH.
- Generate palette steps from lightness ranges.
- Support optional half steps such as `50` and trailing half steps.
- Allow controlled intermediate lightness values when a simple linear scale is
  not enough.
- Export CSS variables that match the palette shown in the UI.

## Development

Install dependencies:

```sh
pnpm install
```

Start the SvelteKit development server:

```sh
pnpm run dev
```

Run type and Svelte checks:

```sh
pnpm run check
```

Run the Vitest suite:

```sh
pnpm run test
```

When changing files, run both `pnpm run check` and `pnpm run test` before
finishing the change.

## Testing And Comments

Use Vitest through the Vite setup for component and library tests. Focus tests on
behavior that matters to the palette maker: lightness interpolation, step labels,
reversed scales, CSS variable output, persistence, and user-facing component
behavior.

Comments should explain motivation or usage when it is not obvious. Avoid
comments that repeat the code.
