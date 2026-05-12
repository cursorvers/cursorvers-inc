# Cursorvers株式会社 Brand & Design SSOT

**Status**: v1.0 locked 2026-04-21 (CLOUDWIN登壇資料 v3 で決定)
**Owner**: 大田原 正幸 (代表)
**Consumer projects**: cursorvers-inc LP / back-office / note記事 / x-auto / LINE Harness / medical-paper-governance / Fieldy / 登壇資料全般

---

## Color palette (strict 3-color)

| 役割 | HEX | 用途 |
|---|---|---|
| Navy | `#0F172A` | タイトル背景・見出し・表ヘッダー |
| Flame Orange | `#FF4500` | アクセント・CTA・border-left・chart bars |
| White | `#FFFFFF` | ベース背景・navy上テキスト |

### Supporting (注釈・区切りのみ)
- Slate: `#475569` / `#64748B` / `#94A3B8` (small/tiny/caption)
- Border: `#E2E8F0` / `#F8FAFC` (box bg / table border)

**禁止色**: 黄色系（#FFF4E6含む）、青系（navy以外）、緑系、赤系（orange以外）

---

## Typography

```
font-family: 'Noto Sans JP', 'Hiragino Sans', sans-serif;
```

| 要素 | サイズ | 色 |
|---|---|---|
| body | 24px | navy |
| h1 | 32px + border-bottom 3px orange | navy |
| h2 | 26px | navy |
| h3 | 21px | slate |
| table | 20px | — |
| .small | 18px | slate |
| .tiny | 14px | #64748B |

---

## Marp presentation default

- `size: 16:9` / `paginate: false`
- 背景: 白 + 右上 logo (96-64px) + 右下 QR (contact.html)
- Title/Summary slides: navy bg, white text, orange accents
- **CRITICAL**: `section.title header, section.summary header { color: #FFFFFF }` を必ず設定 (デフォ灰色は navy 上で不可視)

テンプレ: `~/Dev/cloudwin-talk/src/presentation.md` (reference implementation)

---

## Chart (matplotlib) rules

```python
NAVY, FLAME, WHITE, MUTED = "#0F172A", "#FF4500", "#FFFFFF", "#94A3B8"
rcParams["font.family"] = ["Hiragino Sans", "Hiragino Maru Gothic Pro", "sans-serif"]
fig.patch.set_facecolor(NAVY); ax.set_facecolor(NAVY)
```

- サイズ: 1200×700 (標準) / 1400×800 (大型)
- バー: FLAME / テキスト: WHITE / 軸・凡例: MUTED / グリッド: white alpha 0.12
- 出典は必ず下部に `#94A3B8` 10pt で記載
- 数値ラベルは太字・大きく (可読性優先)

サンプル: `~/Dev/cloudwin-talk/src/assets/figures/fda-growth.png`

---

## Components

- `.highlight`: `background:#FFFFFF; padding:6px 12px; border-left:4px solid #FF4500;`
- `.box`: `background:#F8FAFC; padding:9px 14px; border:1px solid #E2E8F0; border-radius:6px;`
- `.src`: `font-size:14px; color:#64748B; border-top:1px dashed #E2E8F0;`

---

## Assets (SSOT)

- Logo (navy on white): `Cursorvers_logo_navy.jpeg/webp`
- Logo (white on navy): `Cursorvers_logo_white.jpeg/webp`
- Icon: `cursorvers-icon.svg` / `cursorvers_icon_design.png`
- Contact QR: 動的生成 → `https://cursorvers.com/contact.html`
- Top QR: 動的生成 → `https://cursorvers.com/`

---

## Change log

- 2026-04-21: v1.0 — CLOUDWIN登壇資料 v3 で確定（pre-既存 assets/ と整合確認済）。従来の `section.summary bg:#FFF4E6` など黄色系は deprecated。
