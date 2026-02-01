# Cursorvers PWA Icon Design Specification

## Design Concept

**カーソル + 星 = デジタル変革のシンボル**

### Visual Elements

1. **Cursor Arrow (カーソル矢印)**
   - Position: Left center
   - Color: Navy (#0B0C10)
   - Style: Solid, clean outline
   - Represents: Navigation, interaction, digital interface

2. **Stars (星 ×3)**
   - Position: Upper right, scattered
   - Color: Navy (#0B0C10)
   - Style: 4-point stars (diamond shape)
   - Sizes: Large → Medium → Small (perspective effect)
   - Represents: Innovation, excellence, AI magic

3. **Wordmark**
   - Text: "cursorvers"
   - Font: Sans-serif, semi-bold
   - Position: Bottom center
   - Color: Navy (#0B0C10)

### Color Palette

| Element | Color | Hex | RGB |
|---------|-------|-----|-----|
| Background | White | #FFFFFF | rgb(255, 255, 255) |
| Foreground | Navy | #0B0C10 | rgb(11, 12, 16) |

### Size Variants

| Size | Usage | File |
|------|-------|------|
| 512x512 | Android Chrome (High-res) | icon-512.png |
| 192x192 | Android Chrome (Standard) | icon-192.png |
| 180x180 | Apple Touch Icon | apple-touch-icon.png |
| 144x144 | Windows Tile | icon-144.png |

## Design Rationale

### Why Cursor + Stars?

1. **Cursor**: Represents the company name "Cursorvers" and digital interaction
2. **Stars**: Symbolizes:
   - ✨ AI innovation
   - ⭐ Excellence in medical consulting
   - 🌟 Guiding light for hospital directors

### Minimalist Approach

- **Simple shapes**: Easily recognizable at small sizes (16px)
- **High contrast**: Navy on white ensures visibility
- **Scalable**: Vector-based design maintains quality at any size

## Icon Variations

### Light Mode (Default)
- Background: White (#FFFFFF)
- Foreground: Navy (#0B0C10)

### Dark Mode (Future)
- Background: Navy (#0B0C10)
- Foreground: White (#FFFFFF) or Cyan (#00D4FF)

## Maskable Icon Support

All icons include `"purpose": "any maskable"` in manifest.json:
- **Safe area**: 80% of canvas (center 410x410 in 512x512)
- **Padding**: 51px on all sides
- **Critical elements**: Cursor and largest star within safe area

## Brand Consistency

This icon design is consistent with:
- Main logo: `Cursorvers_logo_navy.jpeg`
- Website color scheme: `#0B0C10` (brand-black)
- Typography: Sans-serif, modern, professional

## Usage Guidelines

### Do's ✅
- Use official icon files from `/icons/` directory
- Maintain aspect ratio (1:1 square)
- Preserve minimum padding (10% on all sides)

### Don'ts ❌
- Do not alter colors
- Do not distort proportions
- Do not add gradients or shadows
- Do not crop or rotate

---

**Created**: 2026-02-02
**Version**: 1.0
**Designer**: Claude (Orchestrator) + User Input
