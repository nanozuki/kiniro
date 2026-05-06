# Prototype

Reference:

- Terminology: @docs/terminology.md

## Page Structure

### Initial

At the beginning, user has no themes. Display only <TitleBar /> as a
landingpage. Show discrption/introduction of Kiniro, and guide user to create
theme or import existing data.

```text
+------------------------------------------------------------------------------+
| # Kiniro                                                                     |
|                                                                              |
| <Description of Kiniro>                                                      |
|                                                   [Import] [Add first Theme] |
+------------------------------------------------------------------------------+
```

### Palette Editor

After user creates a theme, we will show our main editor page. It's divided into
four sections:

- <TitleBar />
- <ThemeManager />
- <WorkspaceTabs />
- <PaletteEditor />

```text
+------------------------------------------------------------------------------+
| # Kiniro                                                   [Export] [Import] |
+------------------------------------------------------------------------------+

+------------------------------------------------------------------------------+
| Themes:   [[Rose Pine]]  [Gruvbox]  [+]                                      |
| Variants: [[Main]]  [Dawn]  [Moon]  [+]                                      |
+------------------------------------------------------------------------------+
| ## Rose Pine [Rename] [Delete]                                               |
| ### Main [Rename] [Delete]                                                   |
+------------------------------------------------------------------------------+

+------------------------------------------------------------------------------+
| [[studio]] [CSS Variants] [Constract Checker]                                |
+------------------------------------------------------------------------------+

+------------------------------------------------------------------------------+
| Natural [Settings] [Rename] [Delete]                                         |
| StepScale:    100:0.9500  200:0.8500  300:0.7500  ...                        |
+------------++-----------+-----------+-----------+----------------------------+
| #191724    || #EEECFF   | #CECCDE   | #AF99FF   |                            |
| C: 0.0255  || L: 0.9500 | L: 0.8500 | L: 0.7500 |                            |
| H: 291.13  ||           |           | C: 0.0300 |           ...              |
|            ||           |           |           |                            |
| base [St.] || base-100  | base-200  | base-200  |                            |
+------------++-----------+-----------+-----------+----------------------------+
|                                [+ Color Ramp]                                |
+------------------------------------------------------------------------------+

+------------++-----------+-----------+-----------+----------------------------+
|                               [+ Color Family]                               |
+------------------------------------------------------------------------------+
```

### CSS Variables

At CSS Variants tab, replace <PaletteEditor /> with <CSSVariables />.

```text
+------------------------------------------------------------------------------+
| Kiniro                                                     [Export] [Import] |
+------------------------------------------------------------------------------+

+------------------------------------------------------------------------------+
| Themes:   [[Rose Pine]]  [Gruvbox]  [+]                                      |
| Variants: [[Main]]  [Dawn]  [Moon]  [+]                                      |
+------------------------------------------------------------------------------+
| ## Rose Pine [Rename] [Delete]                                               |
| ### Main [Rename] [Delete]                                                   |
+------------------------------------------------------------------------------+

+------------------------------------------------------------------------------+
| [studio] [[CSS Variants]] [Constract Checker]                                |
+------------------------------------------------------------------------------+

+------------------------------------------------------------------------------+
| ## CSS Variables                                                             |
|                                                                              |
| Prefix: [color-main]                                                         |
| +--------------------------------------------------------------------------+ |
| | :root {                                                                  | |
| |   --color-main-base-100: #191724;                                        | |
| |   --color-main-base-200: #EEECFF;                                        | |
| |   --color-main-base-300: #CECCDE;                                        | |
| |   ...                                                                    | |
| | }                                                                        | |
| +--------------------------------------------------------------------------+ |
|                                                                              |
|                                                                       [Copy] |
+------------------------------------------------------------------------------+
```

### Constract Checker

At CSS Variants tab, replace <PaletteEditor /> with <ConstractChecker />.

```text
+------------------------------------------------------------------------------+
| Kiniro                                                     [Export] [Import] |
+------------------------------------------------------------------------------+

+------------------------------------------------------------------------------+
| Themes:   [[Rose Pine]]  [Gruvbox]  [+]                                      |
| Variants: [[Main]]  [Dawn]  [Moon]  [+]                                      |
+------------------------------------------------------------------------------+
| ## Rose Pine [Rename] [Delete]                                               |
| ### Main [Rename] [Delete]                                                   |
+------------------------------------------------------------------------------+

+------------------------------------------------------------------------------+
| [studio] [CSS Variants] [[Constract Checker]]                                |
+------------------------------------------------------------------------------+

+------------------------------------------------------------------------------+
| ## Constract Checker                                                         |
|                                                                              |
|  ((foreground))  (background)          ### Natural                           |
|   "text-700"      "base-100"           base [ ][x][ ][ ][ ][ ][ ][ ][ ]      |
|  +------------------------------+      text [ ][ ][ ][ ][ ][ ][x][ ][ ]      |
|  |                              |      ...                                   |
|  |  Sample Text                 |                                            |
|  |                              |      # Accent                              |
|  |  --------------------------  |      rose [ ][ ][ ][ ][ ][ ][ ][ ][ ]      |
|  |                              |      pine [ ][ ][ ][ ][ ][ ][ ][ ][ ]      |
|  |  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  |      ...                                   |
|  |  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  |                                            |
|  |  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  |                                            |
|  |                              |                                            |
|  +------------------------------+                                            |
|                                                                              |
|  ### Contrast 4.77:1                                                         |
|  +-----------------+------------+--------------+                             |
|  | Content Type    | Minimum AA | Exhanced AAA |                             |
|  +-----------------+------------+--------------+                             |
|  | Body Text       | PASS 4.5:1 | Fail 7:1     |                             |
|  | Large Text      | PASS 3:1   | PASS 4.5:1   |                             |
|  | UI and Graphics | PASS 3:1   | ---------    |                             |
|  +-----------------+------------+--------------+                             |
|                                                                              |
+------------------------------------------------------------------------------+
```

## Main Components

### <TitleBar />

This component has two states: with theme(s) and without theme. When there is no
theme, show Kiniro title, description, and buttons to create or import themes.
When there is at least one theme, show Kiniro title and buttons to export or
import themes.

**export(themes)**: Open a dialog to show a list of themes, allow user to select
themes to export, and export selected themes as a JSON file.

**import(file, themes)**: Open a file picker to select a JSON file, and show a
list of themes in the file. Allow user to select themes to import, if there are
themes with the same name, ask user to overwrite or rename them, and import
selected themes to the app.

**<background>syncLocalStorage()**: Save all data and states to local storage,
and load them from local storage when app is opened. For reducing data size and
interaction, omit generated data.

### <ThemeManager />

Since there is a deep hierarchy in our app, we want to make it more flatten in
UX. So we manage Themes and Variants in one component.

At the top of this component, we show <ThemeNav /> with a button to add new
theme. And below that, we show <VariantNav /> with a button to add new variant.
User can switch between themes and variants by clicking the tabs. When user
create a new theme/variant, we will guide user to input a namw for it.

And below that, we show a <ThemeTitle /> and <VariantTitle /> of current theme
and variant. In these components, user can rename or delete current theme and
variant. When user clicks delete, show a dialog to confirm the deletion.

### <WorkspaceTabs />

Show three tabs for the current variant: "Studio", "CSS Variants", and
"Contrast Checker", pointing to <PaletteEditor />, <CSSVariables />, and
<ConstractChecker />. If there is no color ramps in current variant, only show
"Studio" tab.

### <PaletteEditor />

PaletteEditor for editing one variant's palette, can contains multiple
<ColorFamilyEditor />.

**addColorFamily()**: Add a new color family, guide user to input a name for it.

Hierarchy:

```text
<PaletteEditor>
  <ColorFamily>
    <ColorFamilyTitle />
    <StepScale />
    <ColorRamp >
      <ColorSwatch />
    <ColorRamp />
  </ColorFamily />
</PaletteEditor>
```

#### <ColorFamilyTitle />

Show the name of the color family, and buttons to rename or delete it.

**setName(name)**: Set the name of the color family.
**delete()**: Delete the color family, show a dialog to confirm the deletion.

#### <StepScale />

Show and Edit the step scale of the color family.

**setStepCount(count)**: the count of steps, from 3 to 9.
**setLightnessRange(start, end)**: the lightness range of steps.
**setHaftStepStart(boolean)**: Whether to have a half step at start, doesn't
including in step count.
**setHaftStepEnd(boolean)**: Whether to have a half step at end, doesn't
including in step count.
**setIndexStyle('scale'|'ordinal')**: set the index style of steps.
**overrideLightness(stepIndex, lightness)**: override the lightness value of a
step, convert this step to a controlled step.
**resetLightness(stepIndex)**: reset the lightness value of a step to the
generated value, convert this step to an uncontrolled step.
**<background>generateLightness()**: Distiguish controlled steps and
uncontrolled steps. The controlled steps are start step, end step, and all
overridden steps, and the rest steps are uncontrolled. Lightness of controlled
steps are specified by user. And lightness of uncontrolled steps are generated,
between two controlled nodes share an identical step size.
**delete()**: Delete the step scale, show a dialog to confirm the deletion.

#### <ColorRamp />

Show and Edit the color ramp of the color family. A color ramp has a swatch for
each step in the step scale.

**setName(name)**: set the name of the color ramp.
**setSourceColor(color)**: set the source color of this color ramp, calculate
the chroma and hue of the source color, and update to all swatches in the color
ramp.
**overrideSwatchColor(stepIndex, color)**: override the color of a swatch
**resetSwatchColor(stepIndex)**: reset the color of a swatch to the generated
value.
**delete()**: Delete the color ramp, show a dialog to confirm the deletion.

### <CSSVariables />

Show the CSS variables of current variant, and a button to copy them to
clipboard.

**Note**: Because we need css variables exporting, we need to make sure the
names of themes, variants, color families, and color ramps are all valid for CSS
variable names. Or find a way to encode them to valid CSS variable names.

**setPrefix(prefix)**: set the prefix of CSS variables, and update all variable
names. Default prefix is "color-{variantName}", for example, "color-main".
**copyToClipboard()**: copy all CSS variables to clipboard.

### <ConstractChecker />

Show a constract checker for current variant. User can select a foreground color
and a background color from all swatches in current variant, and check the
contrast ratio between them, and whether they pass WCAG constract requirement.
And we provide a component with background, text, line and a block to preview
the color constract.

Hierarchy:

```text
<ConstractChecker>
  <ShowCase /><ColorSelector />
  <CheckResult />
</ConstractChecker>
```

<ShowCase /> show a background with a text, a block and a line on it. The
background color is the selected background color, and the color of text and
line and block is the selected foreground color.

There are two buttons, "foreground" and "background" in <ColorSelector />, one
of them is active, the default one is "background". When user click a swatch in
<ColorSelector />, update the corresponding color in <ShowCase />. And the
active button changes to another one. Also, user can click the deactive button
to change the active state.

Each time the colors are changed, we will calculate the contrast ratio between
them, and show the result in <CheckResult />.
