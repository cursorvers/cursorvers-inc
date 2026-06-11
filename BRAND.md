# Cursorvers株式会社 Brand & Design SSOT

**Status**: v2.0 locked 2026-06-11 (Design System v2 migration)
**Owner**: 大田原 正幸 (代表)
**Consumer projects**: cursorvers-inc LP / back-office / note記事 / x-auto / LINE Harness / medical-paper-governance / Fieldy / 登壇資料全般

---

## Color Palette

| 役割 | HEX | 用途 |
|---|---|---|
| Navy / Ink | `#13243F` | 見出し・本文・ヘッダー・主要ボタン |
| Ivory Base | `#F4F1EA` | ページ基調背景 |
| Raised Ivory | `#FBFAF5` | カード・白相当の raised surface |
| Recessed Band | `#ECE7DB` | セクション帯・薄い背景 |
| Azure | `#3E6FA8` | 一次アクセント・hover・罫・アイコン |
| Deep Azure | `#36618F` | 小サイズリンク・eyebrow |
| Soft Azure | `#7FA3CC` | 濃色地上のリンク・補助アクセント |
| Gold | `#C8922E` | 限定的な強調・実績・news amber 正規化 |
| Crimson | `#9B2D30` | 警告・リスク・失敗例のみ |
| Deep | `#101D33` | footer / dark section |
| Slate | `#6B7280` | 注釈・サブテキスト |
| Grey | `#6B6557` | 出典・キャプション |
| Hairline | `#D8D4C8` | 罫線・カード border |
| Dark Hairline | `#2A3A55` | 濃色地の罫線 |

旧 class 名はレビュー差分最小化のため残す。`brand-black` / `brand-charcoal` は Navy、`brand-gray` は Recessed Band、`flame` / orange 系は Azure に値 remap する。

## Typography

| 用途 | Font | Weight |
|---|---|---|
| 見出し / hero | `Noto Serif JP`, `Hiragino Mincho ProN`, Georgia, serif | 600 / 700 / 900 |
| 本文 / UI | `Noto Sans JP`, `Hiragino Sans`, system-ui, sans-serif | 400 / 500 / 700 |
| 英字ラベル | `Manrope`, `Noto Sans JP`, sans-serif | 400 / 600 / 800 |

Google Fonts は 3 family のみ。見出しは明朝、本文は Sans、英字ラベルは Manrope を使う。

## Components

- Header: `rgba(244,241,234,.88)` + blur + hairline。ロゴは `assets/brand/cvr_logo_dark.png`。
- Footer: `#101D33`、secondary text は ivory 85% 以下。ロゴは `assets/brand/cvr_logo_light.png`。
- Cards: `#FBFAF5`、1px `#D8D4C8`、radius 12px、浅い shadow。
- Buttons: primary は Navy fill、secondary は Navy outline、濃色地 CTA は Azure fill。
- Motion: reveal は JS が `.reveal` を自動付与。no-JS / reduced-motion は常時可視。

## Change Log

- 2026-06-11: v2.0 — Ivory / Navy / Azure / 明朝の Design System v2.0 に移行。Tailwind の `white` は `#FBFAF5` に override。
- 2026-04-21: v1.0 — CLOUDWIN登壇資料 v3 で確定。
