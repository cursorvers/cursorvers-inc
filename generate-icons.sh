#!/bin/bash
# PWA Icon Generator for Cursorvers
# Usage: ./generate-icons.sh <source-image>

set -e

SOURCE="${1:-cursorvers_icon_design.png}"
ICONS_DIR="icons"

if [ ! -f "$SOURCE" ]; then
    echo "❌ Error: Source image not found: $SOURCE"
    echo "Please provide the path to the icon design image."
    exit 1
fi

echo "📱 Generating PWA icons from: $SOURCE"
echo ""

# Create icons directory if it doesn't exist
mkdir -p "$ICONS_DIR"

# Generate icons
echo "🔵 Generating 512x512 (Android Chrome - High res)..."
sips -z 512 512 "$SOURCE" --out "$ICONS_DIR/icon-512.png"

echo "🔵 Generating 192x192 (Android Chrome - Standard)..."
sips -z 192 192 "$SOURCE" --out "$ICONS_DIR/icon-192.png"

echo "🍎 Generating 180x180 (Apple Touch Icon)..."
sips -z 180 180 "$SOURCE" --out "$ICONS_DIR/apple-touch-icon.png"

echo "🪟 Generating 144x144 (Windows Tile)..."
sips -z 144 144 "$SOURCE" --out "$ICONS_DIR/icon-144.png"

echo ""
echo "✅ All icons generated successfully!"
echo ""
echo "📊 Icon sizes:"
ls -lh "$ICONS_DIR" | grep -E "icon-|apple-touch"

echo ""
echo "✨ Next steps:"
echo "1. Verify icons in '$ICONS_DIR/' directory"
echo "2. Test PWA installation on mobile device"
echo "3. Check manifest.json configuration"
