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

A Theme is a palette family named by the user. It contains one or more Variants.

## Variant

A Variant is a complete palette inside a Theme, named by the user. It contains
one or more Color Families.

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
It has a source color, which users can enter as hex, RGB, HSL, or OKLCH. Kiniro
uses the source color's chroma and hue with the Color Family's Step Scale to
define the Color Ramp's Swatches.

## Swatch

A Swatch is one color in a Color Ramp, associated with one Step. Each Swatch is
represented as an OKLCH color. It uses lightness from its Step and chroma/hue
from its Color Ramp's source color unless its OKLCH lightness, chroma, or hue is
adjusted.
