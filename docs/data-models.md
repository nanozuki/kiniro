# Data Models

All these data models should be reactive. I use `interface` here only to
describe the concept; the actual implementation should depend on the real use
case.

## ID

We need a unique ID make operation and rendering more efficient. Use
[nanoid](https://github.com/ai/nanoid) to generate all IDs in the app.

## Kiniro: Application Data Root

All data in Kiniro is stored in the reactive class "Kiniro":

```ts
interface Kiniro {
	themes: Theme[]; // persistant
	activeTheme: Theme; // derived from themes and current selection
	activeVariant: Variant; // derived from activeTheme and current selection
}
```

### Methods

- **export(themes)**: Export themes to a JSON file. User chooses which themes or
  all themes to export.
- **import(themes)**: Import themes from a JSON file, merge into existing
  themes. Replace existing themes if there are themes with the same name.
- **select(theme, variant)**: Select a theme and variant as the active editing target.
- **createTheme(name)**: Create a new theme with the given name and one 'default'
  variant.
- **deleteTheme(name)**: Delete a theme by name.

## Theme

A Kiniro has multiple themes, and each theme can have multiple variants. For
example, the "Rosé Pine" theme has three variants: "Rosé Pine", "Rosé Pine
Dawn", and "Rosé Pine Moon".

```ts
interface Theme {
	id: string; // persistant
	name: string; // persistant
	groups: ColorGroup[]; // persistant
	variants: Variant[]; // persistant
}
```

### Constraints

- Theme names should be unique.
- The counts, order, IDs, and names of ColorGroups and Colors are shared by all
  variants in the same theme.
- Switching variants should keep the count and positions of rendered color
  blocks stable. Only variant-specific values should change.

### Methods

- **setName(newName)**: Change theme name
- **createVariant(name)**: Create a new variant with the given name.
- **deleteVariant(name)**: Delete a variant by name.
- **addGroup(name)**: Add a new empty color group to the shared theme structure.
  Cascade: add a corresponding empty `VariantGroup` to every variant.
- **deleteGroup(name)**: Delete a color group from the shared theme structure.
  Cascade: remove the matching `VariantGroup` from every variant.

## Variant

A Variant contains only the values that may differ from one variant to another.
It does not own the shared group or color structure.

```ts
interface Variant {
	id: string; // persistant
	name: string; // persistant
	groups: Record<string, VariantGroup>; // persistant, keyed by ColorGroup.id
}
```

### Constraints

- Variant names in a theme should be unique.
- A Variant must provide values for every ColorGroup and Color defined by the
  parent Theme.
- `groups` is keyed by `ColorGroup.id`, so renaming a ColorGroup does not
  affect variant data.

### Methods

- **setName(newName)**: Change palette name

## ColorGroup

ColorGroup is part of the shared theme structure. It defines the group name,
shared step topology, and the shared list of colors.

```ts
interface ColorGroup {
	id: string; // persistant
	name: string; // persistant
	stepTopology: StepTopology; // persistant
	colors: Color[]; // persistant
}

interface StepTopology {
	stepsCount: number; // persistant
	halfStepBefore: boolean; // persistant
	halfStepAfter: boolean; // persistant
}
```

### Constraints

- Names of ColorGroups in a palette should be unique.
- For stepTopology:
  - The max value of `stepsCount` is 9, and the min value is 3.
  - `index` is a number from 100 to N00, where N is the steps count.
  - If `halfStepBefore` is true, add a '50' `index` before '100'.
  - If `halfStepAfter` is true, add a 'N50' `index` after 'N00'.
- Step topology must be identical across all variants in the same theme.

### Methods

- **setName(newName)**: Change color group name
- **setStepsCount(count)**: Change shared steps count. Cascade: remove entries
  from `LightnessSettings.overrides` and `VariantColor.steps` in all variants
  whose index no longer exists in the new topology.
- **setHalfStepBefore(enabled)**: Enable or disable half step before. Cascade:
  if disabling, remove the `50` index from `LightnessSettings.overrides` and
  `VariantColor.steps` in all variants.
- **setHalfStepAfter(enabled)**: Enable or disable half step after. Cascade: if
  disabling, remove the `N50` index from `LightnessSettings.overrides` and
  `VariantColor.steps` in all variants.
- **createColor(name)**: Create a new color with the given name in this shared
  group. Cascade: add a corresponding empty `VariantColor` to every variant's
  matching `VariantGroup`.
- **deleteColor(name)**: Delete a color from this shared group. Cascade: remove
  the matching `VariantColor` from every variant's matching `VariantGroup`.

## VariantGroup

VariantGroup stores all variant-specific values for one shared ColorGroup.

```ts
interface VariantGroup {
	lightness: LightnessSettings; // persistant
	colors: Record<string, VariantColor>; // persistant, keyed by Color.id
}
```

### Constraints

- A VariantGroup must exist for every ColorGroup in the parent Theme.
- `colors` is keyed by `Color.id`, so renaming a Color does not affect variant
  data.
- The set of keys in `colors` must match the IDs of `Color`s in the shared
  `ColorGroup.colors`.

## LightnessSettings

LightnessSettings stores the lightness values for one variant and one shared
group. The step topology comes from `ColorGroup.stepTopology`.

```ts
interface LightnessSettings {
	start: number; // persistant
	end: number; // persistant
	overrides: Record<number, number>; // persistant
}
```

### Constraints

- `start` and `end` must be set and not equal.
- The first step always uses `start`, and the last step always uses `end`.
- `overrides` uses step indexes like `200` or `650` as keys.
- Only intermediate steps may appear in `overrides`.
- Uncontrolled steps should be linearly interpolated between sibling controlled
  steps.

## Color

Color is part of the shared theme structure. It defines the stable identity and
name of a color slot across all variants.

```ts
interface Color {
	id: string; // persistant
	name: string; // persistant
}
```

### Constraints

- Color names in a ColorGroup should be unique.

### Methods

- **setName(newName)**: Change color name

## VariantColor

VariantColor stores the actual source color value for one variant and one shared
color slot. It caches the derived OKLCH values that all generated steps use as
default chroma and hue. It also stores any per-step overrides the user has set.

```ts
interface VariantColor {
	source: string; // persistant
	chroma: number; // derived from source
	hue: number; // derived from source
	steps: Record<number, StepOverride>; // persistant
}
```

### Constraints

- `source` is the original color value, using Hex RGB format.
- `chroma` and `hue` are derived from `source` in OKLCH space.
- `chroma` and `hue` are runtime cache values. They should not be saved to local
  storage or included in import/export JSON.
- `steps` is keyed by step index (e.g. `200`, `650`). Only steps with at least
  one override value should have an entry.

## StepOverride

StepOverride stores the user-set overrides for a single step within a
VariantColor. All fields are optional; only the overridden values are persisted.

```ts
interface StepOverride {
	lightness?: number; // overrides the LightnessSettings-derived value
	chroma?: number; // overrides VariantColor.chroma
	hue?: number; // overrides VariantColor.hue
}
```

### Constraints

- A `StepOverride` entry should only exist when at least one field is set.
- `lightness` override takes precedence over the group-level
  `LightnessSettings`-derived value for this step index.
- `chroma` and `hue` overrides take precedence over the `VariantColor` defaults.

## Step

Step is generated for one `VariantColor` at one step index in the shared
topology.

```ts
interface Step {
	index: number; // derived from ColorGroup.stepTopology
	lightness: { controlled: boolean; value: number }; // derived from VariantGroup.lightness and VariantColor.steps
	chroma: { controlled: boolean; value: number }; // derived from VariantColor.chroma and VariantColor.steps
	hue: { controlled: boolean; value: number }; // derived from VariantColor.hue and VariantColor.steps
}
```

### Constraints

- `index` comes from ColorGroup's shared stepTopology and can't be changed.
- `lightness` defaults to the value derived from `VariantGroup.lightness`
  (interpolated or group-level override). If `VariantColor.steps[index].lightness`
  is set, that value is used instead and `controlled` is true.
- `chroma` defaults to `VariantColor.chroma`. If
  `VariantColor.steps[index].chroma` is set, that value is used and `controlled`
  is true.
- `hue` defaults to `VariantColor.hue`. If `VariantColor.steps[index].hue` is
  set, that value is used and `controlled` is true.
- Step is a generated view model. It should not be persisted directly.

### Methods

- **setLightness(value)**: Override lightness for this step. Saves to `VariantColor.steps[index].lightness`.
- **resetLightness()**: Clear the lightness override. Removes the field from `VariantColor.steps[index]`.
- **setChroma(value)**: Override chroma for this step. Saves to `VariantColor.steps[index].chroma`.
- **resetChroma()**: Clear the chroma override. Removes the field from `VariantColor.steps[index]`.
- **setHue(value)**: Override hue for this step. Saves to `VariantColor.steps[index].hue`.
- **resetHue()**: Clear the hue override. Removes the field from `VariantColor.steps[index]`.
