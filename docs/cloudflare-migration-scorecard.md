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

## 実装後 (S5 で同一手順にて再計測)

> 記入待ち: DNS 切替後に ①②③ を同一コマンドで再計測し、④〜⑦ を新構成の根拠で再採点する。

| 軸 | 点 (/10) | 根拠 |
|---|---|---|
| ① Lighthouse | TBD | |
| ② TTFB/LCP | TBD | |
| ③ セキュリティヘッダ | TBD | _headers で 6 種宣言済み (デプロイ後に実測確認) |
| ④ コスト | TBD | 見込み $0 (Pages/D1/Turnstile/Resend 全て無料枠) |
| ⑤ 運用性/DX | TBD | 配信+フォーム+ヘッダ+DNS を Cloudflare 1 面に集約、branch preview 付き |
| ⑥ スパム耐性 | TBD | Turnstile (siteverify + hostname 検証) + honeypot + 入力上限 |
| ⑦ データガバナンス | TBD | リードは自社管理 D1、スキーマ・保持がコード管理下、privacy.html 更新済み |

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
3. Turnstile ウィジェット作成 → GitHub 変数 `TURNSTILE_SITE_KEY` + Cloudflare secret `TURNSTILE_SECRET_KEY`
4. Resend: API key (`RESEND_API_KEY` secret) + cursorvers.com の DKIM/SPF 検証 + `NOTIFY_TO` 設定
5. GitHub secrets: `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`
6. **Cloudflare WAF rate limiting rule を `/api/contact` に設定** (Free プランの 1 ルール枠。例: 同一 IP 10 req/10min 超で 429)。codex security 再レビュー (2026-08-21, verdict=CONDITIONAL) の本番前必須条件
7. pages.dev で E2E 確認 (Turnstile 実キーで action=contact_submit を含む実トークン検証) → DNS 切替 (AuthLevel 1) → GAS 無効化

## ローカル E2E 実施済み (2026-08-21, `wrangler pages dev` + Turnstile test key + local D1)

415 (Content-Type essence 不一致) / 413 (実体 32KB 超) / 400 (token 欠落・type 不正・email 不正) / honeypot silent 200 / hostname allowlist fail-closed 403 / 正常系 200 + D1 INSERT 実確認 + Resend 失敗時 mailWarn でリード保全 — 全パス。未検証で残るのは実 Turnstile キーでの pages.dev E2E と Resend 実送信のみ。
