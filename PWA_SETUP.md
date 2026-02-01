# Cursorvers PWA セットアップガイド

## 概要

このサイトは Progressive Web App (PWA) として動作し、モバイルデバイスにインストール可能です。

## 必須要件

### 1. HTTPS 必須

PWA（Service Worker）は **HTTPS 環境でのみ動作** します。

| 環境 | HTTPS要否 |
|------|----------|
| 本番環境 | ✅ 必須 |
| localhost | ✅ 自動的にHTTPSと同等扱い |
| HTTP | ❌ Service Worker が登録できない |

**デプロイ先の推奨**:
- GitHub Pages（自動HTTPS）
- Netlify（自動HTTPS）
- Vercel（自動HTTPS）
- Cloudflare Pages（自動HTTPS）

### 2. 必須ファイル

```
Cursorvers_Inc_HTML/
├── manifest.json         # PWA設定ファイル
├── sw.js                 # Service Worker
├── icons/                # アイコンセット
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── apple-touch-icon.png
│   └── icon-144.png
└── index.html            # PWAメタタグ含む
```

## インストール手順

### モバイル（iOS/Android）

1. **Safari（iOS）**:
   - サイトにアクセス
   - 共有ボタン → 「ホーム画面に追加」

2. **Chrome（Android）**:
   - サイトにアクセス
   - メニュー → 「ホーム画面に追加」

3. **確認**:
   - ホーム画面にアイコンが表示
   - タップで全画面表示（ブラウザUIなし）

### デスクトップ

1. **Chrome/Edge**:
   - サイトにアクセス
   - アドレスバー右のインストールアイコン
   - または メニュー → 「Cursorversをインストール」

## Service Worker キャッシュ戦略

### Network First（HTMLページ）

常に最新のコンテンツを取得。ネットワーク失敗時のみキャッシュ使用。

**対象**:
- `/index.html`
- `/services.html`
- `/contact.html`
- 全ナビゲーションリクエスト

**理由**: コンテンツ更新を即座に反映

### Cache First（静的アセット）

キャッシュ優先、キャッシュミス時のみネットワーク取得。

**対象**:
- `/dist/tailwind.min.css`
- `/icons/*.png`
- `/Cursorvers_logo_*.webp`

**理由**: 高速表示、通信量削減

## アイコンデザイン

### コンセプト

**カーソル + 星 = デジタル変革のシンボル**

詳細: `/icons/DESIGN_SPEC.md`

### 新規アイコン生成

ユーザー提供のデザイン画像から生成：

```bash
# 1. デザイン画像を配置
cp <your-design>.png cursorvers_icon_design.png

# 2. 自動生成
./generate-icons.sh cursorvers_icon_design.png
```

生成されるサイズ:
- 512x512: Android Chrome（高解像度）
- 192x192: Android Chrome（標準）
- 180x180: Apple Touch Icon
- 144x144: Windows タイル

## バージョン管理

Service Worker キャッシュは `sw.js` の `CACHE_VERSION` で管理：

```javascript
const CACHE_VERSION = '1.0.0'; // semver
```

**更新手順**:
1. `CACHE_VERSION` をインクリメント（例: `1.0.0` → `1.0.1`）
2. デプロイ
3. ユーザーが再訪問時、新しい Service Worker が自動更新

## トラブルシューティング

### Service Worker が登録されない

1. **HTTPS確認**: `https://` でアクセスしているか
2. **コンソール確認**: DevTools → Console で "[PWA] Service Worker registered" を確認
3. **キャッシュクリア**: DevTools → Application → Clear storage

### アイコンが表示されない

1. **パス確認**: `/icons/icon-192.png` が存在するか
2. **manifest.json**: `icons` 配列のパスが正しいか
3. **ブラウザキャッシュ**: ハードリロード（Cmd+Shift+R / Ctrl+Shift+R）

### 古いコンテンツが表示される

1. **バージョン確認**: `sw.js` の `CACHE_VERSION` を更新したか
2. **強制更新**: DevTools → Application → Service Workers → Unregister → リロード

## セキュリティ

### 実装済み

- ✅ HTTPS必須（manifest.json に記載）
- ✅ Network First for HTML（常に最新を取得）
- ✅ Cache First for static assets（パフォーマンス）
- ✅ semverバージョン管理

### 推奨事項

- 📌 定期的な `CACHE_VERSION` 更新
- 📌 CSP（Content Security Policy）の設定
- 📌 Subresource Integrity（SRI）の適用

## テスト

### ローカルテスト

```bash
# HTTPSサーバー起動（必須）
npx http-server -S -C localhost.pem -K localhost-key.pem -p 8443
```

### Lighthouse監査

1. DevTools → Lighthouse
2. "Progressive Web App" にチェック
3. "Generate report"

**目標スコア**: 90+

## 参照

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)

---

**作成日**: 2026-02-02
**バージョン**: 1.0.0
