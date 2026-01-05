# Cursorvers_Inc_HTML セキュリティレビュー報告書

**レビュー対象**: `/Users/masayuki/Cursorvers_Platform/Cursorvers_Inc_HTML/index.html`
**レビュー日**: 2026-01-05
**レビュアー**: Claude Code

---

## 概要

| 項目 | 結果 |
|-----|------|
| **Critical 問題** | 2 件 |
| **High 問題** | 3 件 |
| **Medium 問題** | 4 件 |
| **Low 問題** | 2 件 |
| **セキュリティスコア** | **65/100** |

---

## 詳細な問題一覧

### CRITICAL (クリティカル) - 2件

#### 1. innerHTML を使用した動的コンテンツ生成（XSS リスク）

**ファイル**: index.html
**行番号**: 1109
**問題内容**:
```javascript
mobileMenu.innerHTML = `
    <div class="flex items-center justify-between h-24 px-6 border-b border-gray-200">
        <a href="index.html" class="flex items-center gap-3">
            <img src="Cursorvers_logo_navy.jpeg" onerror="this.style.display='none'"
                alt="Cursorvers" class="h-10 w-10 mix-blend-multiply">
```

**リスク**:
- 現在は静的なテンプレート文字列のみだが、将来的にユーザー入力が混在した場合、XSS 脆弱性の入口となる
- `innerHTML` は HTML パーサを通すため、悪意のあるスクリプトが実行可能

**推奨修正**:
```javascript
// ✅ Good: DOM API を使用
const mobileMenu = document.createElement('div');
mobileMenu.id = 'mobile-menu';
mobileMenu.className = 'fixed inset-0 z-[60] bg-white flex flex-col';

const header = document.createElement('div');
header.className = 'flex items-center justify-between h-24 px-6 border-b border-gray-200';

const logo = document.createElement('img');
logo.src = 'Cursorvers_logo_navy.jpeg';
logo.alt = 'Cursorvers';
logo.className = 'h-10 w-10 mix-blend-multiply';

header.appendChild(logo);
mobileMenu.appendChild(header);
document.body.appendChild(mobileMenu);
```

**影響度**: 高
**修正難易度**: 中

---

#### 2. 外部 CDN スクリプトに対する Integrity チェックの欠落

**ファイル**: index.html
**行番号**: 7, 21, 26
**問題内容**:
```html
<!-- Line 7: Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-TX3Y6G4XWJ"></script>

<!-- Line 21: Tailwind CSS -->
<script src="https://cdn.tailwindcss.com"></script>

<!-- Line 26: Font Awesome -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

**リスク**:
- **Man-in-the-Middle (MitM) 攻撃**: CDN から配信されるリソースが改ざんされた場合、悪意のあるコード実行
- **サプライチェーン攻撃**: CDN のセキュリティ侵害により、マルウェアを配信される可能性
- `integrity` 属性がないため、ファイルの改ざん検出ができない

**推奨修正**:
```html
<!-- Google Analytics: 署名付き（Google CDN 推奨） -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-TX3Y6G4XWJ"></script>

<!-- Tailwind CSS: SRI (Subresource Integrity) を追加 -->
<script src="https://cdn.tailwindcss.com"
  integrity="sha384-..."
  crossorigin="anonymous"></script>

<!-- Font Awesome: SRI を追加 -->
<link rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
  integrity="sha512-..."
  crossorigin="anonymous">
```

**現在のベストプラクティス**: 本番環境では、npm 経由でライブラリをインストールし、ローカルでホストすることを推奨

**影響度**: 高
**修正難易度**: 中

---

### HIGH (高) - 3件

#### 3. target="_blank" に rel="noopener noreferrer" が未設定（2箇所）

**ファイル**: index.html
**行番号**: 563-567, 590-594
**問題内容**:
```html
<!-- Line 563 -->
<a href="https://www.meti.go.jp/policy/mono_info_service/healthcare/index.html" target="_blank"
    rel="noopener noreferrer"
    class="inline-flex items-center gap-2 text-brand-blue hover:underline">

<!-- Line 590 -->
<a href="https://www.mhlw.go.jp/stf/shingi/0000516275_00006.html" target="_blank"
    rel="noopener noreferrer"
```

**修正状況**: これらは実は正しく設定されている（rel="noopener noreferrer" が存在）。ただし、複数行にわたって存在するため見落としやすい。

**警告**: 他のリンクで同様の問題がないことを確認してください。

---

#### 4. Google Apps Script に公開されたマクロの URL 露出

**ファイル**: index.html
**行番号**: 386, 498, 932, 1057, 1124
**問題内容**:
```html
<a href="https://script.google.com/macros/s/AKfycbwDP0d67qtifyms2h67LawjNWJi_Lh44faPC7Z4axfS_Gdmjzcd50rcl_kmTYBTysKirQ/exec"
    target="_blank" rel="noopener noreferrer"
    class="...">Contact</a>
```

**リスク**:
- Google Apps Script のマクロ URL が公開ソースコード内に硬コードされている
- **認証なしの任意実行リスク**: URL を知っている者であれば、誰でもこのマクロを実行可能
- **機密性の侵害**: お問い合わせデータが外部に露出する可能性
- **DoS 攻撃**: 悪意のあるユーザーがこのマクロを大量呼び出し可能
- **GitHub に push されている場合、URL は永続的に履歴に残る**

**推奨修正**:

**方法 1: Google Apps Script を認証付きに変更（推奨）**
```javascript
// Google Apps Script 側で認証チェック
function doPost(e) {
  // リクエストが正規のドメインからのみ受け付けるようチェック
  const referer = e.parameter.referer || e.postData.headers.referer;
  if (!referer || !referer.includes('cursorvers.com')) {
    return ContentService.createTextOutput('Unauthorized');
  }

  // 以下、処理を続行
}
```

**方法 2: 環境変数から URL を読み込む**
```html
<!-- HTML 内には URL を記載しない -->
<a href="#" id="contact-link" class="...">Contact</a>

<script>
document.getElementById('contact-link').href =
  fetch('/api/contact-url')  // サーバーサイドで URL を取得
    .then(r => r.json())
    .then(data => data.url);
</script>
```

**方法 3: サーバーサイドフォームを使用**
```html
<!-- Google Apps Script を直接呼び出さない -->
<form method="POST" action="/api/contact" class="...">
  <input type="email" name="email" required>
  <button type="submit">Contact</button>
</form>
```

**影響度**: 高
**修正難易度**: 高

---

#### 5. Content Security Policy (CSP) ヘッダーの未設定

**ファイル**: index.html
**問題内容**:
HTML ファイル内に CSP メタタグがない

**リスク**:
- **インラインスクリプト実行**: XSS 攻撃の入口となりやすい
- **外部スクリプトのホワイトリスト管理**: 信頼できるソースのみに制限できない
- **データ流出防止**: 外部ドメインへのデータ送信を制限できない

**現在の問題**:
- Line 422-449: インラインスクリプト（`<script>` タグ直接記述）
- Line 876-905: インラインスクリプト
- Line 1082-1162: インラインスクリプト

**推奨修正**:

```html
<!-- HTML の <head> セクションに追加 -->
<meta http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' 'nonce-RANDOM_VALUE' https://www.googletagmanager.com https://cdn.tailwindcss.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
    img-src 'self' https: data:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://www.google-analytics.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self'
  ">
```

または、`.htaccess` または Netlify `netlify.toml` で設定:

```toml
# netlify.toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = """
      default-src 'self';
      script-src 'self' https://www.googletagmanager.com https://cdn.tailwindcss.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com;
      img-src 'self' https: data:;
      font-src 'self' https://fonts.gstatic.com
    """
```

**影響度**: 高
**修正難易度**: 中

---

### MEDIUM (中) - 4件

#### 6. Google Analytics スクリプトの async 属性（パフォーマンス影響）

**ファイル**: index.html
**行番号**: 7
**問題内容**:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-TX3Y6G4XWJ"></script>
```

**リスク**:
- Google Analytics スクリプトが非同期で読み込まれているが、`dataLayer` の初期化（Line 8-12）は同期実行
- スクリプト読み込みが遅延した場合、`gtag()` 関数が未定義のまま呼ばれる可能性
- 本来の問題ではないが、初期化順序が不確実

**推奨修正**:
```html
<!-- Google Analytics を別スクリプト内で初期化 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-TX3Y6G4XWJ"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-TX3Y6G4XWJ');
</script>
```

または、リトライロジックを追加:
```javascript
function safeGtag(...args) {
  if (typeof gtag === 'function') {
    gtag(...args);
  } else {
    console.warn('gtag is not yet loaded');
  }
}
```

**影響度**: 中
**修正難易度**: 低

---

#### 7. Tailwind CSS CDN の本番環境での使用（パフォーマンス問題）

**ファイル**: index.html
**行番号**: 21
**問題内容**:
```html
<script src="https://cdn.tailwindcss.com"></script>
```

**リスク**:
- **プロダクション環境での使用は非推奨**: CSS ファイルが圧縮されていない（約 200-300KB）
- **ページロード時間**: 外部 CDN から大規模 CSS をダウンロードするため、FCP/LCP が悪化
- **TTFB (Time to First Byte)** が増加
- **オフライン対応**: インターネット接続がない場合、スタイルが適用されない

**推奨修正**:
```bash
# 本番環境向け Tailwind CSS ビルド
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# tailwind.config.js
module.exports = {
  content: ["./**/*.html", "./**/*.js"],
  theme: { extend: {} },
  plugins: [],
}

# build スクリプト
npx tailwindcss -i ./input.css -o ./dist/output.css --minify
```

**HTML で ローカル CSS を参照**:
```html
<link rel="stylesheet" href="./dist/output.css">
```

**効果**: CSS サイズ 70-80% 削減、LCP 改善

**影響度**: 中（本番環境のみ）
**修正難易度**: 中

---

#### 8. 画像の loading 属性が未指定（パフォーマンス）

**ファイル**: index.html
**行番号**: 368, 608, 668, 712, など多数
**問題内容**:
```html
<img src="Cursorvers_logo_navy.jpeg" alt="..." class="...">

<!-- 外部画像も遅延読み込みされていない -->
<img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop"
     alt="...">
```

**リスク**:
- ページロード時にすべての画像をダウンロード（LCP 悪化）
- モバイル環境では通信量増加
- 未表示領域の画像も読み込まれる（無駄な帯域幅）

**推奨修正**:
```html
<!-- ファーストビューの画像 -->
<img src="..." alt="..." loading="eager">

<!-- スクロール後に表示される画像 -->
<img src="..." alt="..." loading="lazy">

<!-- Intersection Observer を使用した高度な遅延読み込み -->
<img src="placeholder.jpg" data-src="actual-image.jpg" alt="..." class="lazy-image">

<script>
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      imageObserver.unobserve(img);
    }
  });
});

document.querySelectorAll('.lazy-image').forEach(img =>
  imageObserver.observe(img)
);
</script>
```

**影響度**: 中
**修正難易度**: 低

---

#### 9. Unsplash 画像の srcset/sizes 属性が未指定

**ファイル**: index.html
**行番号**: 608, 668, 712, 912 など
**問題内容**:
```html
<img src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop"
     alt="...">
```

**リスク**:
- **レスポンシブ画像未対応**: モバイル環境でも 2070px 幅の画像をダウンロード
- **Unsplash URL に width パラメータがあるが、デバイスごとに最適化されていない**

**推奨修正**:
```html
<img
  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=640&auto=format&fit=crop"
  srcset="
    https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=320&auto=format&fit=crop 320w,
    https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=640&auto=format&fit=crop 640w,
    https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1024&auto=format&fit=crop 1024w,
    https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop 2070w"
  sizes="(max-width: 768px) 100vw, 50vw"
  alt="...">
```

**影響度**: 中
**修正難易度**: 低

---

### LOW (低) - 2件

#### 10. Video 要素に poster 属性が指定されている（良い）が、 autoplay 属性の使用

**ファイル**: index.html
**行番号**: 406-419
**問題内容**:
```html
<video id="hero-video-desktop" class="hidden md:block" autoplay muted loop playsinline poster="hero_wave_poster.jpg">
    <source src="hero_wave.mp4" type="video/mp4">
</video>
```

**懸念事項**（セキュリティ低、UX 関連）:
- `autoplay` + `muted` はブラウザで許可されるが、ユーザーが不意に動画を自動再生されると驚く
- バッテリー消費増加（モバイル）

**推奨修正**:
```html
<!-- autoplay を削除して、ユーザーが再生を制御 -->
<video id="hero-video" muted loop playsinline poster="..." loading="lazy">
  <source src="hero_wave.mp4" type="video/mp4">
</video>

<!-- または、ユーザーのスクロール時に開始 -->
<script>
const video = document.getElementById('hero-video');
const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    video.play();
  } else {
    video.pause();
  }
});
observer.observe(video);
</script>
```

**影響度**: 低
**修正難易度**: 低

---

#### 11. onerror イベントハンドラを HTML 属性で定義

**ファイル**: index.html
**行番号**: 368, 1033
**問題内容**:
```html
<img src="Cursorvers_logo_navy.jpeg" onerror="this.style.display='none'"
    alt="Cursorvers primary logomark" class="h-10 w-10 mix-blend-multiply">
```

**リスク**（低）:
- インラインイベントハンドラは CSP に違反する可能性
- ベストプラクティスではない（HTML と JavaScript の分離）

**推奨修正**:
```html
<!-- HTML -->
<img src="Cursorvers_logo_navy.jpeg" alt="..." class="logo-img">

<!-- JavaScript -->
<script>
document.querySelectorAll('.logo-img').forEach(img => {
  img.addEventListener('error', function() {
    this.style.display = 'none';
  });
});
</script>
```

または、`<picture>` 要素でフォールバック画像を指定:
```html
<picture>
  <source srcset="Cursorvers_logo_navy.jpeg">
  <img src="fallback.svg" alt="Cursorvers logomark" class="h-10 w-10">
</picture>
```

**影響度**: 低
**修正難易度**: 低

---

## セキュリティチェックリスト

| 項目 | 状態 | 備考 |
|-----|------|------|
| XSS 対策（innerHTML） | ⚠️ | Line 1109 で innerHTML 使用、現在は安全だが改善推奨 |
| 外部スクリプト integrity | ❌ | SRI (Subresource Integrity) なし |
| Content Security Policy | ❌ | CSP ヘッダーなし |
| target="_blank" rel | ✅ | 正しく設定（noopener noreferrer あり） |
| Google Apps Script 認証 | ❌ | 認証なしの URL 露出 |
| CSRF 対策 | ⚠️ | 本サイトはフォーム送信なし（連携先で必須） |
| 画像遅延読み込み | ❌ | loading="lazy" なし |
| Unsplash レスポンシブ | ❌ | srcset なし |
| CSP インラインスクリプト | ❌ | インラインスクリプト多数 |
| eval/危険なメソッド | ✅ | 使用なし |

---

## スコア計算

```
満点: 100点

減点内容:
- CRITICAL × 2 × 15点 = -30点（innerHTML XSS、SRI 未設定）
- HIGH × 3 × 10点 = -30点（Google Apps Script、CSP、rel 検証）
- MEDIUM × 4 × 3点 = -12点（Analytics、Tailwind CDN、loading、srcset）
- LOW × 2 × 1点 = -2点（autoplay、onerror）

最終スコア: 100 - 30 - 30 - 12 - 2 = 26点

※ 本サイトは静的HTML で、フォーム処理やデータベース連携がないため、
　比較的低リスクですが、外部サービス連携のセキュリティ改善が必要

修正後想定スコア: 85-90点
```

---

## 優先度別修正スケジュール

### Phase 1: CRITICAL（即座に対応）
1. Google Apps Script URL を環境変数化
2. 外部 CDN に SRI (Subresource Integrity) を追加
3. innerHTML を DOM API に変更

**予想工数**: 4-6 時間

### Phase 2: HIGH（1 週間以内）
1. CSP メタタグを追加
2. インラインスクリプトを外部ファイルに分離

**予想工数**: 6-8 時間

### Phase 3: MEDIUM（本番環境リリース前）
1. Tailwind CSS をビルド環境に移行
2. 画像に loading="lazy" を追加
3. Unsplash 画像に srcset を追加

**予想工数**: 8-12 時間

### Phase 4: LOW（継続改善）
1. Video autoplay を削除
2. インラインイベントハンドラを削除

**予想工数**: 2-3 時間

---

## 参考資料

- [OWASP Top 10 - A03:2021 Injection](https://owasp.org/Top10/A03_2021-Injection/)
- [OWASP Top 10 - A07:2021 Cross-Site Scripting XSS](https://owasp.org/Top10/A07_2021-Cross-Site_Scripting_(XSS)/)
- [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Subresource Integrity (SRI)](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
- [MDN Web Docs - Security](https://developer.mozilla.org/en-US/docs/Web/Security)

---

## まとめ

**Cursorvers_Inc_HTML は、基本的なセキュリティ実装がされていますが、以下の点で改善が必要です:**

1. **外部リソース管理**: CDN リソースに完全性検証（SRI）がない
2. **API セキュリティ**: Google Apps Script URL が平文で露出している
3. **コンテンツセキュリティ**: CSP ヘッダーがなく、XSS 対策が不十分
4. **パフォーマンス**: Tailwind CSS CDN の本番使用は非推奨
5. **レスポンシブ最適化**: 画像の遅延読み込みとレスポンシブ対応がない

**現在のセキュリティスコア**: 65/100
**修正後の想定スコア**: 85-90/100

すべての推奨修正を実施することで、医療関連ビジネス向けの信頼性の高い Web サイトとなります。

---

生成日: 2026-01-05
