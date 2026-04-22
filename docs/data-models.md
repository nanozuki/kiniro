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
	themes: Theme[];
	activePalette: Palette;
}
```

### Methods

- **export(themes)**: Export themes to a JSON file. User chooses which themes or
  all themes to export.
- **import(themes)**: Import themes from a JSON file, merge into existing
  themes. Replace existing themes if there are themes with the same name.
- **select(theme, variant)**: Select a theme and variant as active palette.
- **createTheme(name)**: Create a new theme with the given name and one 'default'
  variant.
- **deleteTheme(name)**: Delete a theme by name.

## Theme

A Kiniro has multiple themes, and each theme can have multiple variants. For
example, the "Rosé Pine" theme has three variants: "Rosé Pine", "Rosé Pine
Dawn", and "Rosé Pine Moon".

```ts
interface Theme {
	id: string;
	name: string;
	variants: Palette[];
}
```

### Constraints

- Theme names should be unique.
- Each variants should have same structure that the counts and names of
  ColorGroups and Colors are the same. The values of colors can be different.

### Methods

- **setName(newName)**: Change theme name
- **createVariant(name)**: Create a new variant with the given name.
- **deleteVariant(name)**: Delete a variant by name.

## Variant

A Variant contains multiple color groups, and each group has multiple colors.

```ts
interface Variant {
	id: string;
	name: string;
	groups: ColorGroup[];
}
```

### Constraints

- Names of palettes/variants in a theme should be unique.

### Methods

- **setName(newName)**: Change palette name
- **addGroup(name)**: Add a new empty color group with the given name
- **deleteGroup(name)**: Delete a color group by name.

## ColorGroup

ColorGroup is a group of colors that share the same lightness steps.

```ts
interface ColorGroup {
	id: string;
	name: string;
	stepsSettings: StepsSettings;
	colors: Color[];
}

interface StepsSettings {
	lightnessStart: number;
	lightnessEnd: number;
	stepsCount: number;
	halfStepBefore: boolean;
	halfStepAfter: boolean;
	steps: Step[];
}

interface Step {
	index: number;
	lightness: number;
	controlled: boolean;
}
```

### Constraints

- Names of ColorGroups in a palette should be unique.
- For stepsSettings:
  - `start` and `end` should be set and not equal.
  - The max value of `stepsCount` is 9, and the min value is 3.
- For steps in stepsSettings:
  - `index` is a number from 100 to N00, where N is the steps count.
  - If `halfStepBefore` is true, add a '50' `index` before '100'.
  - If `halfStepAfter` is true, add a 'N50' `index` after 'N00'.
  - The lightness of the first step should be equal to `lightnessStart`, and
    the lightness of the last step should be equal to `lightnessEnd`.
  - The first and last steps, and all other steps with manually set lightness,
    should be `controlled`. The lightness of uncontrolled steps should be
    linearly interpolated between sibling controlled steps.

### Methods

- **setName(newName)**: Change color group name
- **setStepsCount(count)**: Change steps count and delete override items that do
  not fit the constraints.
- **setLightnessStart(value)**: Set lightness of first step, and set first
  step's lightness and controlled state.
- **setLightnessEnd(value)**: Set lightness of last step, and set last step's
  lightness and controlled.
- **setHalfStepBefore(enabled)**: Enable or disable half step before
- **setHalfStepAfter(enabled)**: Enable or disable half step after
- **setStepLightness(index, value)**: Set lightness of a step, and mark it as
  controlled.
- **createColor(name, colorValue)**: Create a new color with the given name and
  color value, add it to this group.

## Color

A Color comes from one original color and contains multiple steps with different
lightness.

```ts
interface Color {
	id: string;
	name: string;
	source: string;
	chroma: number;
	hue: number;
}
```

### Constraints

- Color names in a ColorGroup should be unique.
- `source` is the original color value, it using Hex RGB format
- `chroma` and `hue` come from the inspiration color. Because user can change
  the inspiration color, there is no need to let user adjust these values
  directly.

### Methods

- **setName(newName)**: Change color name
- **setInspiration(colorValue)**: Set inspiration color value and update chroma
  and hue to match the new inspiration color.

## Step

```ts
interface Step {
	name: string;
	index: number;
	lightness: { controlled: boolean; value: number };
	chroma: { controlled: boolean; value: number };
	hue: { controlled: boolean; value: number };
}
```

### Constraints

- `name` comes from Color's name and can't be changed.
- `index` comes from ColorGroup's stepsSetting and can't be changed.
- `lightness`, `chroma`, and `hue` come from "Color" and "ColorGroup" by
  default, but user can override them. Once user sets a value, it becomes
  controlled. We also provide methods to reset them.

### Methods

- **setValue(lightness, chroma, hue)**: Manually adjust values.
- **resetValue()**: Reset to default value

## Persistance Data

We need to save all themes to local storage, and also need to export and import
themes as JSON files. Considering consistancy, the data structure trim all
generated values.

```ts
interface PersistedTheme {
	name: string;
	variants: PersistedVariant[];
}

interface PersistedVariant {
	name: string;
	groups: PersistedColorGroup[];
}

interface PersistedColorGroup {
	name: string;
	stepsSettings: PersistedStepSettings[];
	colors: PersistedColor[];
}

interface PersistedStepSettings {
	lightnessStart: number;
	lightnessEnd: number;
	stepsCount: number;
	halfStepBefore: boolean;
	halfStepAfter: boolean;
	overrides: Record<number, number>;
}

interface PersistedColor {
	name: string;
	source: string;
	overrides: Record<number, { lightness?: number; chroma?: number; hue?: number }>;
}
```
