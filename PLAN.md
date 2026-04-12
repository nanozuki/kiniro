# Plan: Controlled Lightness Steps for ColorGroup

## Goal

Improve `ColorGroup` lightness generation so users can manually adjust intermediate
steps while keeping the rest of the scale auto-calculated.

Current behavior uses one linear interpolation from `lightnessMax` to
`lightnessMin`. The new behavior should use piecewise linear interpolation between
controlled steps.

## Behavior

- `lightnessMax` controls the first step.
- `lightnessMin` controls the last step.
- Users can adjust every step except the first and last step.
- Once an intermediate step is adjusted, it becomes a controlled step.
- Uncontrolled steps are auto-calculated linearly between the closest surrounding
  controlled steps.
- Controlled steps should have a reset action so users can return them to auto
  calculation.

## Data Model

Add a persisted group-level field:

```ts
controlledLightness: Record<number, number>
```

Use step labels as keys instead of array indexes:

```ts
controlledLightness = {
  200: 0.8,
  600: 0.42
}
```

Step labels are better than indexes because the app supports optional half steps
such as `50` and `950`, and labels remain easier to reason about when the step
set changes.

## Interpolation Rule

Build anchor points from:

- first step with `lightnessMax`
- every controlled intermediate step present in `steps`
- last step with `lightnessMin`

Then interpolate all non-controlled steps between their nearest left and right
anchors.

Example:

```ts
steps = [100, 200, 300, 400, 500]
lightnessMax = 0.95
lightnessMin = 0.15
controlledLightness = { 200: 0.8 }
```

Result:

```ts
100: 0.95
200: 0.8
300: 0.583
400: 0.367
500: 0.15
```

## Reversed Behavior

Keep the current app behavior: compute the normal lightness array first, then
reverse the final array when `reversed` is enabled.

With the same example:

```ts
normal = [0.95, 0.8, 0.583, 0.367, 0.15]
reversed = [0.15, 0.367, 0.583, 0.8, 0.95]
```

That means a manually controlled value is tied to the logical normal scale before
reversal. For example, a controlled value at step `200` appears at step `400`
after reversal in a five-step palette.

This matches the existing `reversed` model, where reversal flips generated values
across step labels.

## Implementation Steps

1. Update storage schema in `src/lib/storage.ts`.
   - Add `controlledLightness` with a default empty object.
   - Add the field to `DEFAULT_GROUPS`.
   - Add the field when creating a new group.

2. Update `ColorGroup.svelte`.
   - Add `controlledLightness` as a bindable prop.
   - Replace the current single linear `lightness` derived calculation with
     piecewise interpolation.
   - Add controls for editable intermediate steps.
   - Mark controlled steps visually.
   - Add a reset button/action for each controlled step.
   - Clean up controlled values whose step labels no longer exist after changing
     `stepsCount`, `halfStepBefore`, or `halfStepAfter`.

3. Update `+page.svelte`.
   - Bind `group.controlledLightness` into `ColorGroup`.
   - Initialize `controlledLightness` for newly added groups.

4. Update CSS variable generation in `src/lib/cssVariables.ts`.
   - Use the same piecewise interpolation rule as `ColorGroup.svelte`.
   - Keep `reversed` behavior consistent with the UI.

5. Check dependent views.
   - Confirm `ColorPlayground.svelte` either still matches the exported CSS
     variables or update it to use the same helper calculation if needed.
   - Consider extracting shared step/lightness helpers if duplication becomes
     risky.

## Verification

- Run type checking and linting with the repo's existing commands.
- Manually verify:
  - intermediate step changes become controlled
  - reset returns a controlled step to auto calculation
  - first and last steps are not manually editable
  - changing `stepsCount` removes obsolete controlled values
  - optional `50` and trailing half steps interpolate correctly
  - `reversed` output matches the documented behavior
  - generated CSS variables match the UI lightness values
