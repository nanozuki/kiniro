# 001 — ColorGroup: Configurable Step Count & Half-Steps

## Goal

Let users control the number of palette steps and optionally add half-steps at the light/dark ends.

## Design Decisions

### Step count
- Range: 3–9, default 9
- Labels: `100`, `200`, …, `N00` (e.g. 9 steps → `100`–`900`)

### Half-steps
- **"half step before"**: adds a `50` step at the light end
- **"half step after"**: adds a `N50` step at the dark end (e.g. `950` for 9 steps, `550` for 5 steps)
- Half-step label values shown dynamically in the UI (e.g. "Add `50` step" / "Add `950` step")
- Based on Tailwind's 11-step convention (`50`–`950`), where `50`/`950` are extensions beyond the main `100`–`900` range

### Lightness range semantics (key decision)
`lightnessMax` and `lightnessMin` always represent the **full palette extremes** — the lightest and darkest swatch the user will actually see:

- Half-steps **disabled**: `100 = lightnessMax`, `N00 = lightnessMin`
- Half-step before **enabled**: `50 = lightnessMax`, `100` is computed one step inward
- Half-step after **enabled**: `N50 = lightnessMin`, `N00` is computed one step inward

This keeps the controls intuitive — toggling half-steps shifts intermediate steps slightly but the extremes stay user-controlled.

### Lightness for half-steps
With `stepSize = (lightnessMax - lightnessMin) / totalSteps`:
- `50` lightness = `lightnessMax` (by definition, it is the max)
- `100` lightness = `lightnessMax - stepSize * 0.5`
- `N00` lightness = `lightnessMin + stepSize * 0.5`
- `N50` lightness = `lightnessMin` (by definition, it is the min)

Where `totalSteps = stepsCount - 1 + 0.5 * (halfStepBefore ? 1 : 0) + 0.5 * (halfStepAfter ? 1 : 0)`

### Reversed toggle
Labels stay positional — `50` is always the lightest, `N50` always the darkest, regardless of `reversed`. The `reversed` toggle flips the lightness values only.

---

## Changes Required

### `ColorRow.svelte`
- Remove hardcoded `STEPS = [100, 200, ..., 900]` constant
- Accept a `steps: number[]` prop (with current array as default for standalone use)
- Use `steps[i]` instead of `STEPS[i]` in `palette` derivation and swatch label

### `ColorGroup.svelte`
- Add `stepsCount = $bindable(9)` prop (3–9)
- Add `halfStepBefore = $bindable(false)` prop
- Add `halfStepAfter = $bindable(false)` prop
- Compute `steps: number[]` from the above (e.g. `[50, 100, 200, ..., 950]`)
- Recompute `lightness: number[]` using the new semantics above
- Pass both `steps` and `lightness` down to each `<ColorRow>`
- Add UI controls: a select/number input for step count, two checkboxes for half-steps

---

## References
- [Tailwind CSS Colors](https://tailwindcss.com/docs/colors) — 50/950 as palette extremes
- [Material Design Color System](https://m2.material.io/design/color/the-color-system.html) — 50 as lightest tint
