#!/bin/bash
# アイコン更新スクリプト（カーソル+星デザイン用）

set -e

echo "🎨 Cursorvers アイコン更新"
echo ""

# デザイン画像の存在確認
if [ ! -f "cursorvers_icon_design.png" ]; then
    echo "❌ エラー: cursorvers_icon_design.png が見つかりません"
    echo ""
    echo "📝 手順:"
    echo "1. カーソル+星のデザイン画像を以下に保存してください:"
    echo "   /Users/masayuki/Cursorvers_Platform/Cursorvers_Inc_HTML/cursorvers_icon_design.png"
    echo ""
    echo "2. 再度このスクリプトを実行:"
    echo "   ./update-icons.sh"
    exit 1
fi

echo "✅ デザイン画像を検出: cursorvers_icon_design.png"
echo ""

# 古いアイコンをバックアップ
echo "💾 既存アイコンをバックアップ中..."
mkdir -p icons/backup
cp icons/icon-*.png icons/backup/ 2>/dev/null || true
cp icons/apple-touch-icon.png icons/backup/ 2>/dev/null || true

echo "🔄 新デザインでアイコンを生成中..."
./generate-icons.sh cursorvers_icon_design.png

echo ""
echo "✨ アイコン更新完了！"
echo ""
echo "📊 新しいアイコン:"
ls -lh icons/ | grep -E "icon-|apple-touch"

echo ""
echo "🚀 次のステップ:"
echo "1. icons/ ディレクトリでアイコンを確認"
echo "2. Git コミット & プッシュ"
echo "3. デプロイ後、モバイルでインストールテスト"
