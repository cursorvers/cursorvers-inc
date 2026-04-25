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

## メディア資産デプロイ — iOS Safari cache 落とし穴

PR #15-#27 (2026-04-25) の実体験から得た教訓。同種の動画/オーディオ差し替えタスクで繰り返さないこと。

### 根本原因

iOS WebKit の `<video>` / `<audio>` は **AVPlayer system-level cache** が **path-keyed**。query string (`?v=20260425`) は cache key に含まれないため、`?v=` bump では iPhone Safari に新しいアセットが届かない。PC Safari は HTTP cache で動くため query bump が効き、iPhone だけ古い動画を表示し続ける非対称が発生する。

### 5 つの予防ルール (CI 強制対象)

これらは `.github/workflows/media-asset-policy.yml` + `scripts/lint-media-asset-policy.mjs` で PR 時に自動検証される。違反で CI fail。

- **R1: ローカル video/audio に `?v=` query を付けない**
  - 差し替えたければ file path そのものを rename する (`git mv hero.mp4 hero_v2.mp4`)
  - external URL (pexels.com 等) の query token は対象外
- **R2: video/audio file を modify せず、rename (add + delete) する**
  - `git diff --name-status` で `M` ステータスの video は fail
  - `R` (rename) または `A`/`D` ペアは OK
- **R3: service worker (sw.js) は video 拡張子を cache bypass する**
  - `fetch(event.request)` を video 拡張子に対して通す pattern が無ければ warn
  - これが欠けると SW cache で古い動画が延命する
- **R4: pre-deploy で `curl https://cursorvers.com/...` で疎通確認しない**
  - Cloudflare CDN の cache を probe が poisoning して古い asset を pin してしまう
  - smoke-test の post-deploy URL probe は `# probe-after-deploy` マーカーで許可
- **R5: `<video>` 子 `<source>` は mobile-first 順 (`max-width` → `min-width`)**
  - iOS は最初に match した source を選ぶため、PC 用が先にあるとモバイルで PC 版が再生される

### 検証手順 (必須)

1. CI (`media-asset-policy` job) が PASS していること
2. **iPhone 実機** (Safari) で反映確認 — Playwright / Lighthouse / PC Safari は build-id しか見ないので不十分
3. 反映しない場合、`?v=` を追加しない。3 回 query bump が無効なら即座に path rename に切り替える (PR #15-#27 の 5 回失敗を繰り返さない)

### 例外 override

緊急時のみ、PR に `media-asset-policy-ack` label を付けると全ルールが warning にダウングレードされる。label 付与は reviewer 合意後に限り、PR description に override 理由を必ず記す。

### 関連 PR (学習源)

- PR #15-#26: `?v=` query bump を 5 回試行し全敗 (iPhone 到達失敗)
- PR #27: `git mv hero_wave.mp4 → hero_v6_pc.mp4` + `<source>` から query 完全削除 + sw.js bump で即時反映成功
- PR #28: 本ルール群を CI 強制化 (`media-asset-policy.yml`)

---

## Platform 連携ルール

**システム変更時は `Cursorvers_Platform/docs/system-architecture.md` を更新すること。**

詳細: `/Users/masayuki/Cursorvers_Platform/.claude/CLAUDE.md` の「システム変更時（自動反映ルール）」を参照

---

作成日: 2025-12-21
