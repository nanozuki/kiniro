# Prototype

Reference:

- Terminology: @docs/terminology.md

## Page Structure

### Initial

At the beginning, user has no themes. Display only <TitleBar /> as a
landing page. Show description/introduction of Kiniro, and guide user to create
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
- <Palette />

```text
+------------------------------------------------------------------------------+
| # Kiniro                 [Undo] [Redo] [sRGB/P3]        [Export] [Import] |
+------------------------------------------------------------------------------+

+------------------------------------------------------------------------------+
| Themes:   [[Rose Pine]]  [Gruvbox]  [+]                                      |
| Variants: [[Main]]  [Dawn]  [Moon]  [+]                                      |
+------------------------------------------------------------------------------+
| ## Rose Pine [Rename] [Delete]                                               |
| ### Main [Rename] [Delete]                                                   |
+------------------------------------------------------------------------------+

+------------------------------------------------------------------------------+
| [[Palette]] [CSS Variables] [Contrast Checker]                               |
+------------------------------------------------------------------------------+

+------------------------------------------------------------------------------+
| Natural [Settings] [Rename] [Delete]                                         |
| StepScale:    100:0.9500  200:0.8500  300:0.7500  ...                        |
+------------++-----------+-----------+-----------+----------------------------+
| #191724    || #EEECFF   | #CECCDE   | #AF99FF   |                            |
| C: 0.0255  || L: 0.9500 | L: 0.8500 | L: 0.7500 |                            |
| H: 291.13  ||           |           | C: 0.0300 |           ...              |
|            ||           |           |           |                            |
| base [St.] || base-100  | base-200  | base-300  |                            |
+------------++-----------+-----------+-----------+----------------------------+
|                                [+ Color Ramp]                                |
+------------------------------------------------------------------------------+

+------------++-----------+-----------+-----------+----------------------------+
|                               [+ Color Family]                               |
+------------------------------------------------------------------------------+
```

### CSS Variables

At CSS Variables tab, replace <Palette /> with <CSSVariables />.

```text
+------------------------------------------------------------------------------+
| # Kiniro                 [Undo] [Redo] [sRGB/P3]        [Export] [Import] |
+------------------------------------------------------------------------------+

+------------------------------------------------------------------------------+
| Themes:   [[Rose Pine]]  [Gruvbox]  [+]                                      |
| Variants: [[Main]]  [Dawn]  [Moon]  [+]                                      |
+------------------------------------------------------------------------------+
| ## Rose Pine [Rename] [Delete]                                               |
| ### Main [Rename] [Delete]                                                   |
+------------------------------------------------------------------------------+

+------------------------------------------------------------------------------+
| [Palette] [[CSS Variables]] [Contrast Checker]                               |
+------------------------------------------------------------------------------+

+------------------------------------------------------------------------------+
| ## CSS Variables                                                             |
|                                                                              |
| Prefix: [color]                                                              |
| +--------------------------------------------------------------------------+ |
| | :root {                                                                  | |
| |   /* Natural */                                                           | |
| |   --color-main-base-100: 0.9500 0.0255 291;                              | |
| |   --color-main-base-200: 0.8500 0.0255 291;                              | |
| |   --color-main-base-300: 0.7500 0.0300 291;                              | |
| |   ...                                                                    | |
| | }                                                                        | |
| +--------------------------------------------------------------------------+ |
| Usage: color: oklch(var(--color-main-base-100) / 1);                        |
|                                                                              |
|                                                                       [Copy] |
+------------------------------------------------------------------------------+
```

### Contrast Checker

At Contrast Checker tab, replace <Palette /> with <ContrastChecker />.

```text
+------------------------------------------------------------------------------+
| # Kiniro                 [Undo] [Redo] [sRGB/P3]        [Export] [Import] |
+------------------------------------------------------------------------------+

+------------------------------------------------------------------------------+
| Themes:   [[Rose Pine]]  [Gruvbox]  [+]                                      |
| Variants: [[Main]]  [Dawn]  [Moon]  [+]                                      |
+------------------------------------------------------------------------------+
| ## Rose Pine [Rename] [Delete]                                               |
| ### Main [Rename] [Delete]                                                   |
+------------------------------------------------------------------------------+

+------------------------------------------------------------------------------+
| [Palette] [CSS Variables] [[Contrast Checker]]                               |
+------------------------------------------------------------------------------+

+------------------------------------------------------------------------------+
| ## Contrast Checker                                                          |
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
|  | Content Type    | Minimum AA | Enhanced AAA |                             |
|  +-----------------+------------+--------------+                             |
|  | Body Text       | Pass 4.5:1 | Fail 7:1     |                             |
|  | Large Text      | Pass 3:1   | Pass 4.5:1   |                             |
|  | UI and Graphics | Pass 3:1   | ---------    |                             |
|  +-----------------+------------+--------------+                             |
|                                                                              |
+------------------------------------------------------------------------------+
```

## Main Components

> **Convention:** `<background>` prefix marks operations that run automatically
> without direct user action (e.g., auto-save, value generation).

### <TitleBar />

This component has two states: with theme(s) and without theme. When there is no
theme, show Kiniro title, description, and buttons to create or import themes.
When there is at least one theme, show Kiniro title and buttons to export or
import themes, visible Undo/Redo controls with keyboard shortcuts, and the
global sRGB/P3 gamut switcher. Hide Undo/Redo, Export, and the gamut switcher in
the empty landing state. Keep Import visible in the empty landing state. Import
and Add first Theme use the same visual style.

**export(themes)**: Open a dialog that lists all themes and allows the user to
select which to export. No themes are selected by default; the confirm button is
disabled until at least one theme is selected; the dialog provides a select-all
action. The dialog also shows a filename field defaulting to `kiniro-data.json`,
which the user can edit before confirming. Confirming downloads the selected
themes as a JSON file. JSON export contains theme data only with `"version": 1`.
Keep JSON export as small as possible by omitting derived data such as sanitized
names and generated values. Export is read-only and does not create an Undo/Redo
history entry.

**import(file, themes)**: Open a file picker that accepts `.json` files to
select a JSON file. Do not support browser drag-and-drop import in v1. Validate
the whole file before showing theme selection. Missing or unsupported `version`
fails validation. Validation errors show a user-friendly summary with
collapsible technical details. Allow user to select themes to import; the
confirm button is disabled until at least one theme is selected. If there are
themes with the same name, ask user to overwrite or rename them. Conflict
handling is per theme, defaults to overwrite, and overwrite completely replaces
the existing theme. New imported themes append to the end of the theme list.
Overwritten themes keep their current positions. After import, select the leftmost newly added or overwritten theme in the theme
list, select its first variant, and switch to Palette.
Import is one undoable action.

**<background>syncLocalStorage()**: Save all data and states to local storage,
and load them from local storage when app is opened. For reducing data size and
interaction, omit generated data. Startup should restore and show the UI
immediately without a noticeable loading state. Autosave succeeds silently. If
autosave fails, show a non-spamming auto-disappearing toast and retry after one
minute while the app continues running normally. Persist selected theme, selected
variant, selected workspace tab, global gamut preview, and at most the 100 most
recent Undo/Redo history entries. In-memory history is not capped. Include a schema/version field. If local storage validation
fails, ignore the invalid local storage, rebuild an empty state, and show a toast
that the data was reset. Do not persist dialog draft inputs or "do not warn
again" state.

**undo() / redo()**: Undo/Redo tracks data changes only, not navigation,
selection, dialogs, focus, or edit mode. Undo/Redo buttons are disabled when
unavailable and use generic labels. After undo or redo, show a visible hint that
names the action.

### <ThemeManager />

Since there is a deep hierarchy in our app, we want to make it more flatten in
UX. So we manage Themes and Variants in one component.

At the top of this component, we show <ThemeNav /> with a button to add new
theme. And below that, we show <VariantNav /> with a button to add new variant.
User can switch between themes and variants by clicking the tabs. Theme and
variant tabs wrap onto additional lines instead of horizontal scrolling.
Themes and variants are reorderable with drag-and-drop by dragging the whole
tab. Reordering is undoable. Keep the selected item selected after reordering.

Creating a theme immediately creates:

- A theme named `Theme 1`, `Theme 2`, etc.
- A first variant named `default`.
- An initial color family named `Family 1`.
- A 9-step scale with lightness from `0.95` to `0.05`.
- No color ramps.

After creating a theme, select the new theme, its first variant, and Palette.

Creating a variant copies all data from the currently selected variant. Variants
inside the same theme share structure, including families, step scales, ramp
names, ramp order, and family order. Color values are variant-specific. After
creating a variant, select the new variant and switch to Palette.

And below that, we show a <ThemeTitle /> and <VariantTitle /> of current theme
and variant. In these components, user can rename or delete current theme and
variant. Keep current theme and variant titles below the nav tabs because those
titles host rename/delete actions. Rename is inline: clicking Rename turns the
title into an input. Inline inputs update live while typing. Enter/Esc do
nothing special beyond normal browser behavior. On blur, normalize/fix the value
and append one undo entry if the value actually changed. Invalid inline names
fall back to default names using the established naming rules. Duplicate inline
names are fixed by adding a number, for example `Name 2`. Theme deletion
requires typing the theme name. Other deletions use a normal confirmation
dialog. If the current item is deleted, select the next neighbor if available,
otherwise the previous neighbor. Deleting the only theme returns to the empty
state. A variant delete button is hidden when there is only one variant.

Theme names are unique across the app. Variant names are unique within their
theme. Display names are trimmed on save. Long names grow their container first;
if they still cannot fit, truncate with a tooltip.

### <WorkspaceTabs />

Show three tabs for the current variant: "Palette", "CSS Variables", and
"Contrast Checker", pointing to <Palette />, <CSSVariables />, and
<ContrastChecker />. Always show all tabs. If there are no color ramps in the
current variant, disable "CSS Variables" and "Contrast Checker" with a tooltip
explaining that a color ramp is required.

### <Palette />

Palette for editing one variant's palette, can contains multiple
<ColorFamilyEditor />.

**addColorFamily()**: Add a new color family immediately with the next default
name, for example `Family 2`. With zero color families, Palette shows only an Add
Color Family action. Empty color families are allowed. After adding or deleting a
color family, no special focus or scroll behavior is required.

Families are reorderable with drag-and-drop using drag handles. Reordering is
undoable and structural. Color family cards are not collapsible. Palette does
not provide filtering/searching for families or ramps.

Hierarchy:

```text
<Palette>
  <ColorFamily>
    <ColorFamilyTitle />
    <StepScale />
    <ColorRamp >
      <ColorSwatch />
    <ColorRamp />
  </ColorFamily />
</Palette>
```

#### <ColorFamilyTitle />

Show the name of the color family, and buttons to rename or delete it. Rename
uses the same inline title editing interaction as theme and variant rename.

**setName(name)**: Set the name of the color family.
**delete()**: Delete the color family, show a dialog to confirm the deletion.
Color family names are unique within the shared variant structure.

#### <StepScale />

Show and Edit the step scale of the color family.

Each color family has exactly one StepScale. StepScale settings are edited
inline after entering edit mode. Changes apply immediately. When focus leaves
the StepScale editing area, exit edit mode.

**setStepCount(count)**: the count of steps, from 5 to 9. Preserve overrides by
step index when the index still exists, and remove overrides for indexes that no
longer exist.
**setLightnessRange(start, end)**: the lightness range of steps.
**setHalfStepStart(boolean)**: Whether to have a half step at start. It is not
included in step count and is only available for scale index style.
**setHalfStepEnd(boolean)**: Whether to have a half step at end. It is not
included in step count and is only available for scale index style.
**setIndexStyle('scale'|'ordinal')**: set the index style of steps.
Scale style uses regular indexes `100`, `200`, ..., `{count * 100}`. Half step
start adds `50`; half step end adds `{count * 100 + 50}`. Ordinal style uses
`1`, `2`, ..., `{count}` and has no half steps. Switching from scale to ordinal
maps regular steps by position (`100 -> 1`, `200 -> 2`) and drops half-step
overrides; the half-step settings are hidden and do not apply in ordinal mode.
Switching from ordinal to scale maps by position (`1 -> 100`, `2 -> 200`).
**overrideLightness(stepIndex, lightness)**: override the lightness value of a
step, convert this step to a controlled step.
**resetLightness(stepIndex)**: reset the lightness value of a step to the
generated value, convert this step to an uncontrolled step.
**reverse()**: Reverse generated lightness values, step overrides, and swatch
overrides in ramps. Index labels are not reversed.
**<background>generateLightness()**: Distinguish controlled steps and
uncontrolled steps. The controlled steps are start step, end step, and all
overridden steps, and the rest steps are uncontrolled. Lightness of controlled
steps are specified by user. And lightness of uncontrolled steps are generated,
between two controlled nodes share an identical step size. Interpolation is
linear in OKLCH lightness.

Display lightness and chroma with 4 decimal digits. Display hue with 2 decimal
digits. Use the same precision in CSS export.

Numeric color and step inputs use these ranges:

- Lightness: `0..1`.
- Chroma: `0..0.37`.
- Hue: `0..360`.

Numeric inputs allow temporary empty and out-of-range values while focused.
Out-of-range values show error styling. Block non-numeric characters, but allow
a temporary negative sign while editing. On blur, empty values fall back to `0`,
out-of-range values clamp to the nearest valid value, lightness/chroma are
floored to 4 decimal digits, and hue is floored to 2 decimal digits.

Focused numeric inputs show a tooltip/popover with a plain slider. Treat the
popover as part of the input; clicking outside the input+popover commits blur
normalization and closes the popover. The slider updates values live while
dragging. Range controls and keyboard arrow stepping use `0.01` for
lightness/chroma and `1` for hue. Do not add drag/scrub interaction to numeric
values.

#### <ColorRamp />

Show and Edit the color ramp of the color family. A color ramp has a swatch for
each step in the step scale.

Adding a color ramp opens a dialog that asks for both ramp name and source
color. The dialog title is `Add Color Ramp`. Editing a ramp opens the same
dialog, titled `Edit Color Ramp`, for ramp name and source color. One dialog
confirmation creates one undo entry when values actually changed. Canceling a
dialog discards draft values and creates no undo entry. Ramp names are unique
within the shared variant structure.

Ramp source color input uses structured controls, not raw text as the primary
interface. Use a segmented control in this order: OKLCH / Hex / RGB / HSL. Show
inputs for the selected format, using full labels such as Lightness, Chroma, and
Hue in dialogs. New ramp source color values are initialized from
`oklch(0.7 0.1 {randomHue})`, where `randomHue` is an integer from `0` to `359`
generated when the Add Color Ramp dialog opens. Represent that initial color in
the selected source format. The default source color format uses the nearest
preceding ramp in Palette order, even if it is in another color family. If there
is no preceding ramp in the variant, default to OKLCH. The dialog starts with a
suggested default ramp name such as `Ramp 1`, choosing the next available name
across the shared variant structure. New ramps append to the end of the current
family. The native browser color picker is available; using it changes the
source color format to Hex. The Add/Edit Color Ramp dialog shows only the source
color preview, not a full generated ramp preview.

**setName(name)**: set the name of the color ramp.
**setSourceColor(color)**: set the source color of this color ramp, preserve the
selected input format, calculate the chroma and hue of the source color, and
update generated chroma/hue for all swatches in the color ramp while preserving
swatch-level channel overrides.
**overrideSwatchChannel(stepIndex, channel, value)**: override a single OKLCH
channel of a swatch.
**resetSwatchChannel(stepIndex, channel)**: reset one swatch channel to the
generated value.
**resetSwatchColor(stepIndex)**: reset all overridden swatch channels to the
generated value.
**delete()**: Delete the color ramp, show a dialog to confirm the deletion.

Clicking a swatch opens a modal dialog with a color preview. The dialog shows
generated values alongside overridden values and provides both per-channel reset
and reset-all controls. Swatch overrides are channel-level: non-overridden
channels continue to follow generated values. A swatch lightness override affects
only that swatch, not the StepScale.

If a color is unavailable in the current gamut preview, show a small marker on
the swatch. The marker tooltip says either "Unavailable in sRGB" or "Unavailable
in sRGB and P3". The swatch modal also shows a gamut warning for the edited
swatch when needed. Swatch modal preview uses the clamped preview color.

Swatches show their information directly in the cell. By default, show name,
step index, and clamped hex value for the current gamut preview. If there are
overridden channels, show those overridden values with compact `L`, `C`, and `H`
labels. Dialogs use full labels such as Lightness, Chroma, and Hue.

The source color cell is visually distinct from swatches. It uses only a small
square preview for the source color, and shows the original-format source value
plus OKLCH `C` and `H`. Do not show source color gamut warnings in the outer
cell or source color dialog.

Color ramps are reorderable with drag-and-drop using drag handles. Reordering is
undoable and structural. Duplicate source colors and duplicate generated swatch
colors are allowed.

### <CSSVariables />

Show the CSS variables of current variant, and a button to copy them to
clipboard.

The theme has one shared CSS variable prefix. The default prefix is `color`.
The app adds the leading `--` automatically. CSS Variables view shows variables
for the current variant only.

Generated variable names use:

```text
--{customPrefix}-{sanitizedVariantName}-{sanitizedRampName}-{step}
```

The output value is an OKLCH channel triple, not a full `oklch(...)` function:

```css
--color-main-base-100: 0.9500 0.0255 291;
```

This supports alpha usage:

```css
color: oklch(var(--color-main-base-100) / 1);
```

Show that usage example in the app, but do not include it when copying CSS.

CSS output uses one format in v1: channel-triple custom properties wrapped in
`:root { ... }`. Show the generated CSS in a read-only code block without syntax
highlighting. Group output by color family using a leading family-name comment
for each family, including empty families. Put one blank line between family
groups. Do not add ramp comments. Preserve Palette order for families, ramps,
and steps.

**setPrefix(prefix)**: set the theme-level CSS variable prefix. Prefix changes
reactively update variable names for all variants in the theme and are
undoable. Prefix editing follows the non-dialog input rule. Empty or invalid
prefix values fall back to `color` on blur.
**copyToClipboard()**: copy all CSS variable declarations to clipboard. This is
read-only and does not create an Undo/Redo history entry. Show a success toast
after copying, and an error toast if copying fails.

### <ContrastChecker />

Show a contrast checker for current variant. User can select a foreground color
and a background color from all swatches in current variant, and check the
contrast ratio between them, and whether they pass WCAG contrast requirement.
And we provide a component with background, text, line and a block to preview
the color contrast.

Hierarchy:

```text
<ContrastChecker>
  <ShowCase /><ColorSelector />
  <CheckResult />
</ContrastChecker>
```

<ShowCase /> show a background with a text, a block and a line on it. The
background color is the selected background color, and the color of text and
line and block is the selected foreground color.

There are two target controls, "foreground" and "background", in
<ColorSelector />. One of them is active, and the default active target is
"background". The active target has an outline. Clicking a selected color label
also activates that target. When user clicks a swatch in <ColorSelector />,
update the corresponding active target in <ShowCase />. Do not auto-switch the
active target after selection.

Each time the colors are changed, we will calculate the contrast ratio between
them, and show the result in <CheckResult />.

Use WCAG 2 contrast ratio for now. Calculate contrast from colors after clamping
to the selected gamut, because the checker should evaluate the actual displayed
value.

Contrast checker selections do not persist. Default foreground is the first
ramp's second swatch. Default background is the second ramp's second-to-last
swatch; if there is only one ramp, use that same ramp. Source color cells are not
selectable, only swatches.

The selected color labels use display names in the form `ramp + step`. The
color selector uses compact selector-specific cells with no text inside the
cells. On hover, show a tooltip with `ramp + step`. V1 supports
pointer/mouse selection only. The preview uses fixed sample content with one
line of large text, one line of normal text, and the existing line/block
component preview. Provide a foreground/background swap button. Show the numeric
contrast ratio only once in the section heading. Use `Pass` and `Fail` labels in
the result table.

### Shared Naming and Validation

Users can enter friendly display names. The app also displays the sanitized CSS
name so users do not need to reason about CSS naming rules. Sanitized names are
derived automatically and are not editable.

Sanitization rules:

- Lowercase.
- Trim.
- Convert spaces and underscores to hyphens.
- Remove unsupported characters.
- Collapse repeated hyphens.
- Require at least one letter or number.

Block names when the trimmed display name is empty or the sanitized name is
empty.

Inputs outside dialogs update live and do not create undo entries per keystroke.
They create one undo entry on blur only if the final value actually changed.
Invalid non-dialog names fall back to default names using established naming
rules. Duplicate non-dialog names or sanitized-name collisions are fixed by
appending a number, for example `Name 2`.

Dialogs show validation in real time and block confirmation while any value is
invalid, including duplicate names or sanitized-name collisions. Dialog
confirmation creates one undo entry only when values actually changed.

### Shared Structure Warning

Structural edits affect every variant in the current theme. Structural edits
include adding/deleting/renaming/reordering color families, changing StepScale
settings, reversing a StepScale, and adding/deleting/renaming/reordering color
ramps. Theme and variant reordering is undoable data editing, but it is not a
shared-structure warning case.

When a theme has multiple variants, show a non-blocking warning near the
operation explaining that the change affects all variants. Do not show an
additional confirmation dialog only for this warning. Destructive delete
confirmations still apply. Provide a "Do not warn again" option that lasts only
for the current browser session.

### Gamut Preview

Palette and Contrast Checker share the same global sRGB/P3 preview switcher. The
selected gamut preview is global app state, persists in local storage, and is
not part of Undo/Redo history. If P3 is unavailable on the current
browser/monitor, disable it and show "P3 is unavailable on this monitor" in the
switcher tooltip. If P3 was selected and becomes unavailable, fall back to sRGB
automatically. CSS export always uses unclamped OKLCH channel values regardless
of the selected preview gamut.
