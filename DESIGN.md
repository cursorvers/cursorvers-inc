---
version: alpha
name: Cursorvers
description: Urban, refined AI and workflow brand using white and deep navy with a restrained flame-orange accent.
colors:
  primary: "#0F172A"
  dark: "#05070A"
  grid: "#1E293B"
  background: "#FFFFFF"
  accent: "#FF4500"
  surface: "#F8FAFC"
  muted: "#64748B"
  border: "#E2E8F0"
  footer-text: "#CBD5E1"
typography:
  headline:
    fontFamily: Noto Sans JP
    fontSize: 48px
    fontWeight: 700
    lineHeight: 1.15
  body:
    fontFamily: Noto Sans JP
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.12em
spacing:
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
rounded:
  sm: 4px
  md: 8px
  card: 12px
  pill: 9999px
components:
  hero-headline:
    textColor: "{colors.primary}"
    typography: "{typography.headline}"
  primary-action:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    rounded: "{rounded.md}"
    padding: 16px
  accent-marker:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.primary}"
    rounded: "{rounded.sm}"
  support-panel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.card}"
  metadata:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
  divider:
    backgroundColor: "{colors.border}"
    textColor: "{colors.primary}"
  footer:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.footer-text}"
  dark-announcement:
    backgroundColor: "{colors.dark}"
    textColor: "{colors.background}"
    typography: "{typography.headline}"
  grid-line:
    backgroundColor: "{colors.grid}"
    textColor: "{colors.background}"
---

# Cursorvers Design Contract

This file is the machine-readable visual contract for Cursorvers brand generation and review. It is derived from `BRAND.md` and `assets/css/renewal.css`; when this file conflicts with the locked brand source, `BRAND.md` wins.

## Overview

Cursorvers is a modern, urban, refined brand for AI-enabled work, automation, and professional systems.

The visual identity should feel sophisticated, precise, forward-moving, intelligent, clean, metropolitan, and practical rather than decorative.

## Colors

The core palette is strict: white base, deep navy structure, and flame orange as a restrained accent.

- **Primary (#0F172A):** Deep navy for headlines, structural blocks, table headers, footer background, and main visual mass.
- **Dark (#05070A):** High-contrast announcement or recruitment background only.
- **Grid (#1E293B):** Subtle dark-mode grid and interface-line detail.
- **Background (#FFFFFF):** Main canvas and negative space.
- **Accent (#FF4500):** Flame orange for small highlights, key markers, thin rules, focus states, chart bars, and one focal cue.
- **Surface (#F8FAFC):** Quiet supporting panels and document-like backgrounds.
- **Muted (#64748B):** Captions, source notes, metadata, and secondary annotations.

Orange should stay below roughly 5% of a frame unless the asset is explicitly a call-to-action surface. Do not let orange become the dominant color.

Avoid yellow, beige, green, red other than flame orange, cyan, and generic purple/blue AI gradients.

## Typography

Use `Noto Sans JP` for Japanese-first business communication. Use `Manrope` for English labels, uppercase navigation, and compact technical metadata.

Japanese text needs generous line height and clear hierarchy. Avoid thin weights for headline or thumbnail-scale text.

## Layout

Use a white or near-white base with deep navy structure and restrained orange accents. Prefer clean grids, strong asymmetry, clear focal objects, and ample negative space.

For image generation and thumbnails:

- preserve a high-contrast landing zone for Japanese text
- keep one dominant message or focal object
- use cursor, trajectory, star, navigation, system-flow, or forward-motion metaphors when they fit the subject
- keep background detail lower on the text side
- use orange as a marker, underline, small geometry, or directional cue
- for recruitment, hiring, seminar, and announcement banners, a dark high-contrast variant is allowed: black/deep-navy grid background, oversized white English headline, white rectangular Japanese copy block, and a photorealistic professional subject on the right
- keep the left 55-60% as the text mass and the right 40-45% as the human/scene zone
- use faint UI or workflow traces only as low-contrast background texture; do not make them readable labels

## Components

Primary actions and strong structural elements use deep navy with white text. Accent treatments use flame orange sparingly as a border, underline, dot, small badge, or chart element.

Cards and document panels should feel clean, precise, and lightly elevated. Avoid decorative nested cards.

## Image Generation Notes

Reference direction for recruitment or announcement images:

`/Users/masayuki/Downloads/HGtOzDCaEAAIPBR.jpeg`

Use this as an abstract composition reference, not as a copy target.

For similar images:

- canvas should be a wide horizontal banner
- left side should carry a massive white English keyword or role label
- Japanese headline should sit in a hard white rectangular block with black or deep navy characters
- right side may use a photorealistic professional person or work scene when authorized by the task
- background should be black/deep navy with a subtle technical grid and faint interface traces
- lighting should feel urban, cinematic, and business-professional
- typography should feel bold, blunt, and immediately readable at feed size
- Japanese copy should be deterministic overlay whenever exact text matters

Avoid:

- copying the exact person, pose, or layout one-to-one
- accidental readable UI labels in the background
- soft pastel startup colors
- orange-dominant frames
- decorative logo placement unless explicitly requested
- thin Japanese type or low-contrast text

## Do's and Don'ts

- Do preserve the white x deep navy x flame orange identity.
- Do use the logo as brand reference for motion, cursor shape, star trajectory, and precision.
- Do keep Japanese text areas clear and high contrast.
- Do favor urban business-media polish over playful startup styling.
- Don't add the Cursorvers logo to every generated image by default.
- Don't add CTA buttons, handles, hashtags, or follow prompts unless the channel explicitly asks for an ad or campaign creative.
- Don't use real third-party logos, trademarks, or real people unless explicitly authorized.
- Don't use generic SaaS dashboard stock visuals, neon cyberpunk, cartoon mascots, excessive glow, or cluttered office scenes.

## Logo

Primary logo reference:

`/Users/masayuki/Library/CloudStorage/GoogleDrive-flux@cursorvers.com/マイドライブ/_Cursorvers/Cursorvers_logo/Cursorvers_logo2.jpeg`

Repo-local assets:

- `Cursorvers_logo_navy.jpeg`
- `Cursorvers_logo_navy.webp`
- `Cursorvers_logo_white.jpeg`
- `Cursorvers_logo_white.webp`
- `cursorvers-icon.svg`
- `cursorvers_icon_design.png`

The logo is a reference source, not a default overlay. Use its visual DNA: deep navy, cursor symbol, shooting-star trajectory, forward motion, sharp minimal silhouette, and large white negative space.

## Channel Rules

For `note_thumbnail`, use editorial, trustworthy, document-like polish. Prefer deterministic Japanese text overlay for exact copy.

For `x_auto`, keep no-CTA, no-handle, no-logo defaults. Express Cursorvers through palette, motion, composition, and precision rather than placing the logo.

For `web_hero`, logo use is allowed when explicitly requested. Keep the first viewport white/navy dominant with orange as one attention or conversion cue.

## 9. image-first 設計 SOP (renewal v1 §10 由来)

> 出典: `~/Dev/Cursorvers_Platform/_workspaces/20260420_inc_renewal_v1/00_spec/design-system.md` §10 SOP / §11 ChatGPT Images 2.0 prompt 集 (ミヤマ流 STEP1-3 への昇華、2026-05-12 確定)
> 本節は production brand SSOT としての要約。完全形は staging spec と canonical SSOT (`~/.claude/assets/docs/cursorvers-design-system.md`「image-first 設計 SOP」節) を参照。

### 使うとき
- Cursorvers LP に新規 page を追加するとき
- 既存 page の hero を抜本改修するとき
- thumbnail / 動画 / スライド / ベンダー説明資料で「絵 1 枚」が必要なとき

### 使わないとき
- 既存 page の typo / コピー微修正
- 上記カラー/タイポ範囲内の component 追加 (CSS class 増設だけで足りる場合)
- master board (`_workspaces/20260420_inc_renewal_v1/20_after/assets/board/master-v1.svg`) の再生成

### 5-step 手順 (要約)
1. STEP0: 色/タイポ + 失敗モード 5 件を prompt prefix に freeze
2. STEP1: master-v1.svg を board として ChatGPT に upload
3. STEP2: renewal v1 §11.x prompt で Images 2.0 → 3-5 案 → orange ≤ 10% で 1 枚採択
4. STEP3: 採択画像 + prefix を Codex に渡し HTML/コード scaffold を `*-draft.html` に出力
5. STEP4: `grep -cEi "mincho|#0052CC|font-serif"` = 0、コントラスト 4.5:1、orange ≤ 10% で lint

### ガードレール
- MUST: smartphone 中央、grayscale 写真、orange ≤ 10%、明朝 0、CTA に navy または flame
- MUST-NOT: 大面積オレンジ背景、紺 #0052CC 再混入、明朝、装飾グラデ 2 箇所以上、本文オレンジ

### 適用 skill
本 SOP は thumbnail-gen / x-auto-thumbnail-art-director / note-manuscript / note-generate / generate-video skill が cover image を生成する際の brand 制約源として **必須参照**。
