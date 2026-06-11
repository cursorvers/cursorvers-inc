---
version: "2.0"
name: Cursorvers
description: Restrained medical AI assurance brand using ivory, navy, azure, and Japanese serif hierarchy.
colors:
  ink: "#13243F"
  background: "#F4F1EA"
  card: "#FBFAF5"
  band: "#ECE7DB"
  accent: "#3E6FA8"
  accentDeep: "#36618F"
  accentSoft: "#7FA3CC"
  gold: "#C8922E"
  crimson: "#9B2D30"
  deep: "#101D33"
  slate: "#6B7280"
  grey: "#6B6557"
  hairline: "#D8D4C8"
  hairlineDark: "#2A3A55"
typography:
  headline:
    fontFamily: Noto Serif JP
    fontWeight: 900
    lineHeight: 1.16
  section:
    fontFamily: Noto Serif JP
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: Noto Sans JP
    fontWeight: 400
    lineHeight: 1.9
  label:
    fontFamily: Manrope
    fontWeight: 700
    letterSpacing: 0.18em
components:
  header:
    backgroundColor: "rgba(244,241,234,0.88)"
    borderColor: "{colors.hairline}"
  footer:
    backgroundColor: "{colors.deep}"
    textColor: "rgba(244,241,234,0.85)"
  primaryAction:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.background}"
    radius: 8px
  card:
    backgroundColor: "{colors.card}"
    borderColor: "{colors.hairline}"
    radius: 12px
---

# Cursorvers Design Contract

This file is the machine-readable visual contract for Cursorvers brand generation and review. `BRAND.md` remains the human-readable SSOT.

## Overview

Cursorvers v2.0 is a restrained medical AI assurance identity. It should feel precise, trustworthy, professional, and clinically literate. The main visual language is ivory surfaces, navy structure, azure accents, and Japanese serif headings.

## Colors

Use `#F4F1EA` as the base canvas, `#FBFAF5` for raised panels, `#13243F` for ink and structure, and `#3E6FA8` for the primary accent. `#C8922E` is a limited secondary accent for results, highlights, and amber news tags. `#9B2D30` is reserved for warning or risk semantics.

Do not use generic blue gradients, large warm-orange areas, pure white surface fills, or decorative multi-accent palettes. Legacy class names may remain in HTML, but their values map to v2 tokens.

## Typography

Use `Noto Serif JP` for hero, h1, h2, h3, and key numbers. Use `Noto Sans JP` for body and interface copy. Use `Manrope` for English labels, navigation metadata, and compact technical labels.

Headlines should be dignified, high-contrast, and quiet. Body text should keep generous line height and scan well on mobile.

## Layout

Prefer full-width bands, calm cards, precise grids, and restrained elevation. Avoid nested cards and ornamental backgrounds. Buttons use navy fill or navy outline; on dark sections, azure fill is allowed.

## Motion

Reveal motion is progressive enhancement. The page must remain visible without JavaScript and under reduced motion. Animations should be subtle fade/rise transitions, once per element.

## Assets

Repo-local v2 logo assets:

- `assets/brand/cvr_logo_dark.png` for header and light surfaces
- `assets/brand/cvr_logo_light.png` for footer and dark sections
- `assets/brand/cvr_icon_dark.png`
- `assets/brand/cvr_icon_light.png`

## Channel Rules

For `web_hero`, keep the first viewport ivory/navy dominant with one azure focal cue. For `note_thumbnail` and `x_auto`, express Cursorvers through palette, typography, and precision rather than default logo placement.
