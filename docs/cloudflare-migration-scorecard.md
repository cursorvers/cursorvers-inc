# Cloudflare 移行スコアカード (実装前後の多角比較)

計測ポリシー: 前後で同一手順・同一環境 (ローカル macOS、東京リージョン到達)。定量軸は実測、定性軸は根拠を明記して採点。各軸 10 点満点。

## 実装前 baseline (2026-08-21 計測、GitHub Pages + 前段 Cloudflare CDN)

### ① Lighthouse (headless Chrome, perf/a11y/bp/seo)

| ページ | Perf | A11y | BP | SEO |
|---|---|---|---|---|
| / | 55 | 93 | 96 | 100 |
| /contact.html | 57 | 95 | 92 | 100 |
| /services.html | 56 | 95 | 92 | 100 |

### ② TTFB 実測 (curl time_starttransfer, 秒)

| ページ | 計測値 | 中央値 |
|---|---|---|
| / (×5) | 0.398 / 0.132 / 0.111 / 0.117 / 0.111 | **0.117** |
| /contact.html (×3) | 0.431 / 0.530 / 0.089 | **0.431** (cold MISS 込み) |

### ③ セキュリティヘッダ (curl -sI 実測)

HSTS / CSP / X-Content-Type-Options / Referrer-Policy / Permissions-Policy / X-Frame-Options: **6 種すべて不在 (0/6)**

### ④〜⑦ 定性軸 (根拠付き)

| 軸 | 前 | 根拠 |
|---|---|---|
| ④ コスト | 10 | $0 (GitHub Pages 無料 + Cloudflare Free) |
| ⑤ 運用性/DX | 6 | デプロイ経路は GHA 1 本だが、配信 (GitHub) とフォーム (GAS) と DNS (Cloudflare) の 3 面管理。ヘッダ変更不可 |
| ⑥ スパム耐性 | 2 | GAS フォームに bot 対策なし (CAPTCHA/レート制限なし) |
| ⑦ データガバナンス | 4 | リードは Google (GAS/Sheets) 側、保存先・保持期間がコード管理外。privacy.html の開示はあり |

### 実装前 7 軸スコア

| 軸 | 点 (/10) |
|---|---|
| ① Lighthouse (4 カテゴリ平均 86) | 8.6 |
| ② TTFB/LCP (中央値 0.117s、cold 0.43s) | 7 |
| ③ セキュリティヘッダ (0/6) | 0 |
| ④ コスト | 10 |
| ⑤ 運用性/DX | 6 |
| ⑥ スパム耐性 | 2 |
| ⑦ データガバナンス | 4 |
| **合計** | **37.6 / 70** |

## 実装後 (2026-08-22 DNS 切替後、本番 cursorvers.com で同一手順にて再計測)

DNS 切替を実施し cursorvers.com が Cloudflare Pages を配信。切替後の Lighthouse で検出した回帰
(SEO robots.txt 欠落 / CSP が Cloudflare Insights beacon をブロック) を修正後の確定値。

### ① Lighthouse (本番実測、回帰修正後)

| ページ | Perf | A11y | BP | SEO |
|---|---|---|---|---|
| / | 55 | 93 | 96 | 100 |
| /contact.html | 63 | 95 | 96 | 100 |
| /services.html | 56 | 95 | 96 | 100 |

(BP/SEO は `_headers` `/*` と robots.txt の site-wide 適用で全ページ同値。contact は GAS リンク廃止で Perf 57→63)

### ② TTFB 実測 (本番、curl time_starttransfer)

| 対象 | baseline | after | 備考 |
|---|---|---|---|
| HTML `/` | 0.117s | ~0.42s | Pages は HTML に `cache-control: max-age=0, must-revalidate` を付与 (更新即時反映を優先し edge cache しない仕様)。LCP/Perf スコアは baseline と同等 |
| 静的アセット (CSS/JS/画像) | — | ~0.05s | `max-age=14400` で edge cache HIT。体感速度を決める層は高速 |

### ③〜⑦ (本番構成の根拠で再採点)

| 軸 | 点 (/10) | 根拠 |
|---|---|---|
| ③ セキュリティヘッダ | 10 | **6/6 を本番実測** (baseline 0/6)。HSTS/CSP/XCTO/Referrer/Permissions/XFO |
| ④ コスト | 10 | $0 維持 (Pages/D1/Turnstile 無料枠、Resend 配線後も無料枠内) |
| ⑤ 運用性/DX | 9 | 配信+フォーム+ヘッダ+DNS+DB を Cloudflare 1 面に集約、branch preview、宣言的設定 |
| ⑥ スパム耐性 | 9 | Turnstile (siteverify + hostname + action 検証) + honeypot + 入力上限。本番で fail-closed 403 実測 |
| ⑦ データガバナンス | 9 | リードは自社管理 D1 (APAC)、スキーマ・保持がコード管理下、privacy.html 更新済み、Google 依存を GA のみに縮小 |

### 実装後 7 軸スコア

| 軸 | 点 (/10) |
|---|---|
| ① Lighthouse (4 カテゴリ平均 ~87) | 8.7 |
| ② TTFB/LCP (HTML は仕様上 0.42s、アセット 0.05s、Perf 同等) | 6.5 |
| ③ セキュリティヘッダ (6/6) | 10 |
| ④ コスト | 10 |
| ⑤ 運用性/DX | 9 |
| ⑥ スパム耐性 | 9 |
| ⑦ データガバナンス | 9 |
| **合計** | **62.2 / 70** (baseline 37.6 → **+24.6**) |

> 2026-08-22 追記: 上記 2 項目は完了 (点は保守的に据え置き)。
> - Resend 本配線: cursorvers.jp を Resend で Verified (Tokyo/ap-northeast-1、DKIM/SPF/MX/DMARC を Cloudflare DNS に登録)。通知は `noreply@cursorvers.jp` → `info@cursorvers.jp,flux@cursorvers.com` (複数宛先対応済み)。両宛先とも Delivered 実証
> - WAF rate limiting: `/api/contact` POST に同一 IP 5 req/10s 超で 429 (rule `contact-form-rate-limit`)。連投実測で 415×5 → 429 発火を確認
> - www.cursorvers.com も Cloudflare へ切替完了: Pages custom domain + CNAME `cursorvers-inc.pages.dev` + ゾーン Redirect Rule `www-to-apex-301` で従来どおり apex へ 301 (GitHub 依存解消)

### 前後比較 (7 軸)

```
              前 (GitHub+GAS)      後 (Cloudflare)
① Lighthouse  ████████░░  8.6      ████████░░  8.7
② TTFB/LCP    ███████░░░  7.0      ██████░░░░  6.5   ▼ HTML は更新即時反映優先で非cache (アセットは高速)
③ секヘッダ    ░░░░░░░░░░  0        ██████████ 10    ★ 0/6 → 6/6
④ コスト       ██████████ 10       ██████████ 10
⑤ 運用性/DX    ██████░░░░  6        █████████░  9    ★ 4面管理 → Cloudflare 1面集約
⑥ スパム耐性   ██░░░░░░░░  2        █████████░  9    ★ 無防備 → Turnstile+honeypot+入力上限
⑦ データガバ    ████░░░░░░  4        █████████░  9    ★ Google管理 → 自社D1
─────────────────────────────────────────────
合計          37.6 / 70            62.2 / 70        +24.6
```

## 再計測コマンド (前後同一)

```sh
# TTFB ×5
for i in 1 2 3 4 5; do curl -so /dev/null -w '%{time_starttransfer}\n' https://cursorvers.com/; done
# ヘッダ
curl -sI https://cursorvers.com/ | grep -iE 'strict-transport|content-security|x-content-type|referrer-policy|permissions-policy|x-frame'
# Lighthouse (scripts/run-lighthouse.sh と同条件)
npx lighthouse https://cursorvers.com/ --only-categories=performance,accessibility,best-practices,seo --output=json --quiet
```

## pages.dev プレビュー実測 (2026-08-21, https://preview-e2e.cursorvers-inc.pages.dev)

Pages プロジェクト・D1 (`6bc7a848-…`, APAC)・remote migrations・プレビューデプロイまで実施済み。

| 項目 | baseline (GitHub Pages 本番) | preview 実測 | 備考 |
|---|---|---|---|
| セキュリティヘッダ | 0/6 | **6/6** | HSTS/CSP/XCTO/Referrer/Permissions/XFO 全て配信確認 |
| TTFB 中央値 (×5) | 0.117s | **0.039s** | 二重 CDN 解消。本番ドメイン切替後に再計測 |
| Lighthouse Perf (/, contact, services) | 55 / 57 / 56 | 56 / **75** / 52 | contact は GAS リンク廃止で +18 |
| Lighthouse A11y | 93 / 95 / 95 | 96 / 98 / 95 | |
| Lighthouse SEO | 100 | 61 | **プレビュー限定の測定アーティファクト**: pages.dev プレビューは `X-Robots-Tag: noindex` を自動付与 (is-crawlable=0)。本番ドメインでは付かないため S5 で再計測 |
| /api/contact | — | secrets 未設定で 403 fail-closed、415 検証も edge で機能 | |

## 移行後の有効化手順 (user gates)

1. ~~`wrangler d1 create cursorvers-leads`~~ **完了 (2026-08-21)**: database_id `6bc7a848-be02-4d93-b132-3760dd8fbe24` を wrangler.toml に反映済み
2. ~~`wrangler d1 migrations apply cursorvers-leads --remote`~~ **完了 (2026-08-21)**
3. ~~Turnstile ウィジェット作成 → GitHub 変数 `TURNSTILE_SITE_KEY` + Cloudflare secret `TURNSTILE_SECRET_KEY`~~ **完了 (2026-08-22)**: widget `cursorvers-inc-contact` (sitekey `0x4AAAAAAEX9scBt9VoNRgl9`、hostnames = cursorvers.com + cursorvers-inc.pages.dev)。GH 変数・Pages secret 登録済み。本番 slot で実 sitekey 配信・widget 描画を確認
4. ~~Resend API key + ドメイン検証~~ **本配線完了 (2026-08-22)**: `RESEND_API_KEY` は sops SSoT → Keychain → Pages secret (平文レス経路)。cursorvers.jp を Resend で **Verified** (Tokyo リージョン、DKIM/SPF/MX/DMARC 4 レコードを Cloudflare DNS へ same-origin API で登録、検証 10 分で完了)。`RESEND_FROM = Cursorvers LP <noreply@cursorvers.jp>` / `NOTIFY_TO = info@cursorvers.jp,flux@cursorvers.com` (contact.ts はカンマ区切り複数宛先対応)。両宛先へ Delivered 実証。なお cursorvers.co.jp は null MX (受信不可ドメイン) のため宛先に使えない
5. GitHub secrets: `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` (b5d2ea575b38ec2342d19f91e98c9347)。**token は Pages:Edit に加えて D1:Edit (account scope) が必須** — wrangler.toml が D1 binding を持つため deploy 時に D1 権限も要求される。Pages テンプレート単体の token だと初回 deploy が不透明なエラーで落ちる
6. ~~Cloudflare WAF rate limiting rule~~ **完了 (2026-08-22)**: `/api/contact` POST に同一 IP 5 req/10s 超で 429 (Free プラン枠、rule id `46ce4f9ded1c4140989c1f41c26f6973`)。本番連投で 415×5 → 429×3 の発火を実測。codex security 再レビュー (2026-08-21, CONDITIONAL) の条件消化
7. pages.dev で E2E 確認 (Turnstile 実キーで action=contact_submit を含む実トークン検証) → DNS 切替 (AuthLevel 1) → GAS 無効化

## ローカル E2E 実施済み (2026-08-21, `wrangler pages dev` + Turnstile test key + local D1)

415 (Content-Type essence 不一致) / 413 (実体 32KB 超) / 400 (token 欠落・type 不正・email 不正) / honeypot silent 200 / hostname allowlist fail-closed 403 / 正常系 200 + D1 INSERT 実確認 + Resend 失敗時 mailWarn でリード保全 — 全パス。未検証で残るのは実 Turnstile キーでの pages.dev E2E と Resend 実送信のみ。
