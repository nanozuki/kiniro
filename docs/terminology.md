# Terminology

This document defines the core palette terminology used by Kiniro.

Hierarchy:

```text
Theme
  Variant
    Color Family
      Step Scale
        Step
      Color Ramp
        Swatch (one per Step)
```

## OKLCH

OKLCH is a color space with lightness, chroma, and hue channels. Some OKLCH
colors may be outside a target display gamut such as sRGB or Display P3.

## Theme

A Theme is a palette family named by the user. It contains one or more Variants,
owns the shared structure used by those variants, stores the theme-level CSS
variable prefix, and defines the target gamut used for palette generation and
preview.

## Theme Structure

Theme Structure is the part of a Theme shared by all of its Variants. It
includes the ordered Color Families, each family's Step Scale structure, and
the ordered Color Ramps inside each family.

## Variant

A Variant is a complete palette inside a Theme, named by the user. It uses its
Theme's shared structure and stores the variant-specific values for that
structure.

## Variant Values

Variant Values are the user-authored values that differ between Variants in the
same Theme. They include step lightness ranges and overrides, reverse state,
ramp source colors, and per-swatch OKLCH channel overrides.

## Color Family

A Color Family is a palette category inside a Variant, named by the user. It has
one Step Scale, and all Color Ramps in the Color Family use that Step Scale.

## Step Scale Options

Step Scale Options are settings used to create the Steps in a Step Scale,
including their indexes and lightness values. Step indexes follow the Step Scale
Options, while Step lightness values may be adjusted.

## Step Scale

A Step Scale is an ordered set of Steps in a user-defined order. It uses either
scale indexes or ordinal indexes, but not both.

## Step

A Step is one OKLCH lightness value in a Step Scale. Each Step has a unique
index within its Step Scale.

The index is a label, not the lightness value itself. Kiniro supports two index
styles:

- Scale index: `50`, `100`, `200`, etc.
- Ordinal index: `1`, `2`, `3`, etc.

## Color Ramp

A Color Ramp is a sequence of Swatches inside a Color Family, named by the user.
It has a Source Color, which users can enter as hex, RGB, HSL, or OKLCH.
Kiniro uses the source color's lightness, chroma, and hue with the Theme's
target gamut and the Color Family's Step Scale to define the Color Ramp's
Swatches.

## Source Color

A Source Color is the authored color for a Color Ramp. Kiniro preserves the
user-facing source format for editing and export, while using its OKLCH value to
generate the ramp's default swatches.

## Swatch

A Swatch is one color in a Color Ramp, associated with one Step. Each Swatch is
represented as an OKLCH color. It uses lightness from its Step and hue from its
Color Ramp's source color. Its default chroma is generated from the source
color's relative chroma within the Theme's target gamut unless its OKLCH
lightness, chroma, or hue is adjusted.
