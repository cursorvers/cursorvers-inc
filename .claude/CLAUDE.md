# Cursorvers_Inc_HTML - コーポレートサイト

会社情報を提供する静的HTMLサイトです。

---

## 技術スタック

- **フロントエンド**: 静的HTML
- **スタイリング**: Tailwind CSS (CDN)
- **JavaScript**: Vanilla JS
- **ホスティング**: GitHub Pages / Netlify 等

## プロジェクト構造

```
Cursorvers_Inc_HTML/
├── index.html              # トップページ（会社概要）
├── mobile-menu.js          # モバイルメニュー実装
├── *.html                  # その他のページ
├── css/                   # カスタムスタイル（あれば）
├── js/                    # JavaScript
├── images/                # 画像ファイル
└── README.md
```

## 実装パターン

### HTML構造

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cursorvers Inc.</title>

  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <header>
    <!-- ヘッダー -->
  </header>

  <main>
    <!-- メインコンテンツ -->
  </main>

  <footer>
    <!-- フッター -->
  </footer>

  <script src="/js/mobile-menu.js"></script>
</body>
</html>
```

### セキュリティ（JavaScript）

#### XSS対策

```javascript
// ❌ Bad: innerHTML でユーザー入力を直接挿入
element.innerHTML = userInput;

// ✅ Good: textContent を使用
element.textContent = userInput;
```

#### mobile-menu.js のセキュリティレビュー

**ファイル**: `mobile-menu.js`
- `innerHTML` を使用しているが、静的なテンプレート文字列のみ
- ユーザー入力は含まれないため、現状は安全
- 将来的にユーザー入力を扱う場合は注意が必要

### パフォーマンス最適化

#### Tailwind CSS の本番ビルド（推奨）

**現状**: CDN版を使用（開発用）

**推奨**: 本番環境では minify されたCSSを使用

```bash
npm install -D tailwindcss
npx tailwindcss init

# tailwind.config.js
module.exports = {
  content: ["./**/*.html", "./**/*.js"],
  theme: { extend: {} },
  plugins: [],
}

# ビルド
npx tailwindcss -i ./src/input.css -o ./css/styles.css --minify
```

**効果**: CSSサイズ 200KB → 20KB（90%削減）

#### 画像の遅延読み込み

```html
<img
  src="placeholder.jpg"
  data-src="actual-image.jpg"
  loading="lazy"
  alt="説明"
>
```

### JavaScript パターン

#### モバイルメニュー実装

**現在の実装** (`mobile-menu.js`):
- DOM操作で動的にメニューを生成
- イベントリスナーでメニュー開閉を制御

**ベストプラクティス**:
```javascript
// イベント委譲で効率化
document.addEventListener('click', (e) => {
  if (e.target.matches('[data-menu-toggle]')) {
    const menu = document.querySelector('[data-mobile-menu]');
    menu?.classList.toggle('hidden');
  }
});
```

## 開発フロー

1. **HTML作成**: セマンティックなマークアップ
2. **CSS適用**: Tailwind クラス
3. **JavaScript追加**: インタラクション実装
4. **最適化**: 画像圧縮、CSS/JS minify
5. **デプロイ**: GitHub Pages 等

## SEO対策

```html
<head>
  <!-- 基本メタタグ -->
  <meta name="description" content="Cursorvers Inc. - AI駆動の医療サービスを提供">
  <meta name="keywords" content="AI, 医療, LINE Bot, 会社情報">

  <!-- OGP -->
  <meta property="og:title" content="Cursorvers Inc.">
  <meta property="og:description" content="AI駆動の医療サービスを提供する企業">
  <meta property="og:image" content="https://example.com/company-image.jpg">
  <meta property="og:type" content="website">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
</head>
```

## 注意事項

- Tailwind CDN は開発用のみ（本番では minify されたCSSを推奨）
- `innerHTML` は XSS リスクがあるため慎重に
- モバイルファーストで設計

## 他プロジェクトとの関係

- **Cursorvers_edu_HTML**: 同じ静的HTML + Tailwind 構成（スタイル共通化可能）
- **LINE Bot プロジェクト**: サービス提供元としての会社情報

## 推奨される改善

### 1. サイト間相互リンクの追加

```html
<!-- Cursorvers_Inc_HTML/index.html -->
<nav>
  <a href="../Cursorvers_edu_HTML/index.html">サービス紹介</a>
  <a href="./index.html">会社情報</a>
</nav>
```

### 2. 共通コンポーネントの抽出

Cursorvers_edu_HTML と共通のヘッダー/フッターを使用している場合：

```bash
# 共通コンポーネントディレクトリを作成
mkdir -p ../shared-components/
# ヘッダー/フッターを共通化
```

### 3. スタイルの統一

両サイトで Tailwind CSS を使用しているため、共通のカスタマイズ設定を使用：

```javascript
// 共通 tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'brand-primary': '#...',
        'brand-secondary': '#...',
      }
    }
  }
}
```

---

作成日: 2025-12-21
