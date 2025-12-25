# Cursorvers LP 改修指示書（Claude Code 用）
目的：トップLPの「48時間でお渡しするもの」ブロックを「セルフ簡易チェック（3分）」に置換し、
その直後に「上位：AIセーフティ簡易診断（48h）」ブロックを新設して導線を二段化する。

---

## 0. 変更方針（必須）
- 入口：無料/3分の「セルフ簡易チェック（Self Check）」を最優先CTAにする（iPhoneで完結）。
- 上位：既存の「AIセーフティ簡易診断（48h）」は “上位枠” として別セクションに残す（有料）。
- 命名：
  - 無料側は「Lite」という名称を使わない（ServicesにLite Partnerがあるため混線）。
  - 無料側は「セルフ簡易チェック（3分）」または「セルフ簡易診断（3分）」のどちらか。
    ※推奨：チェック（医療的な“診断”連想を避ける）
- 規制/守備：
  - セルフチェックは「医療行為（診断・治療）」ではなく「運用・ガバナンスの自己点検」である旨を明記。
  - 「患者情報（PHI）入力禁止」を常時表示（リンク先アプリでも同様）。

---

## 1. 対象ページ
- トップ： https://cursorvers.com/
- 任意：Servicesに「セルフチェック」導線を追記（https://cursorvers.com/services.html）

※コード構成が不明なため、以下の手順で対象ファイルを特定：
- リポジトリ内検索で「48時間でお渡しするもの」「48h Deliverables」を探す
- トップLPの該当セクション（4つの項目＋申込ボタン）を特定して置換

---

## 2. トップLP：セクション置換（必須）

### 2-1. 置換対象（現行）
- 見出し：`48h Deliverables` / `48時間でお渡しするもの`
- 4つの項目（優先3項目、赤黄青、90日、委員会スライド）
- CTA：`AIセーフティ簡易診断を申し込む`（script.google.com）

### 2-2. 新セクションA（置換後）：セルフ簡易チェック（3分）
#### 表示テキスト（コピペ可）
- 小見出し（eyebrow）：`Self Check (3min)`
- 見出し（H2）：`セルフ簡易チェック（3分）`
- リード文：
  `院内AI利用の「安全運用」を、赤・黄・青で一次判定します。患者情報は入力しません。`

- 項目（4つ、現行と同じUIカード/リスト形式でOK）
  1) `10問に回答（選択式のみ）`
     `iPhoneでそのまま完結。最短3分。`
  2) `リスクを 赤・黄・青 で可視化`
     `運用・ガバナンス上の論点を一次判定。`
  3) `まず着手すべき3項目（簡易版）`
     `次に何をすべきかを即表示。`
  4) `48h診断に進むべきか提案`
     `結果に応じて、上位メニューをご案内。`

- 注意文（小さめ表示、必須）
  `※本チェックは医療行為（診断・治療）ではありません。`
  `※患者情報・症例の詳細は入力しないでください。`

- CTA（ボタン2つ、優先順位はこの順）
  - Primary：`3分セルフ簡易チェックを開始`
    - リンク先：SELF_CHECK_URL（下記3-1参照）
  - Secondary：`48h簡易診断（有料）を見る`
    - リンク先：`/services.html#spot`（該当アンカーがなければ#section02等を新設）

### 2-3. 新セクションB（新設）：上位：AIセーフティ簡易診断（48h）
- 小見出し：`48h Upgrade`
- 見出し：`上位：AIセーフティ簡易診断（48h）`
- リード：
  `セルフチェックの結果を、院内でそのまま使える資料に落とし込みます（オンライン完結）。`

- 項目（4つ）：※現行「48時間でお渡しするもの」の4項目をそのまま移植してOK
  1) `まず着手すべき3項目（優先順位付き）`
  2) `リスク評価：赤・黄・青 の3段階`
  3) `90日アクションリスト（担当・期限の雛形）`
  4) `委員会・理事会でそのまま使える説明スライド（簡易版）`

- 価格表示（Servicesと一致させる）
  `診療所・在宅：50,000円／回（税抜）`
  `小規模病院：100,000円／回（税抜）`

- CTA
  - Primary：`48h簡易診断を申し込む`
    - リンク先：既存フォームURL（GOOGLE_FORM_URL）
  - Secondary：`料金プランを見る`
    - `/services.html`

---

## 3. リンク/URL（実装用定数）
### 3-1. SELF_CHECK_URL（新設）
- まずは仮でOK。Manus側でデプロイしたURLに差し替える。
- 例（仮）：https://app.cursorvers.com/scorecard

### 3-2. GOOGLE_FORM_URL（既存）
- 既存の申込フォームURLを使う（トップLPのContact/申込ボタンのリンクと同じ）
- https://script.google.com/macros/s/AKfycbwDP0d67qtifyms2h67LawjNWJi_Lh44faPC7Z4axfS_Gdmjzcd50rcl_kmTYBTysKirQ/exec

---

## 4. Servicesページ（任意だが推奨）
- Section02（AIセーフティ簡易診断）の直前に小さく導線追加：
  - 文：`まずは3分セルフ簡易チェックで一次判定 → 必要に応じて48hへ`
  - ボタン：`セルフチェックを開始` → SELF_CHECK_URL
- ただし Services の価格・プラン内容は変更しない（記載の一貫性維持）。

---

## 5. 受入基準（Acceptance Criteria）
- トップLPで「48時間でお渡しするもの」ブロックが消え、代わりに
  - セルフ簡易チェック（3分）
  - 上位：AIセーフティ簡易診断（48h）
  の2ブロックが順に表示される。
- セルフチェックCTAがモバイルでも押しやすい（1カラム/余白/タップ領域）。
- 48hの価格表記がServicesページと一致している。
- 既存セクション（Why Cursorvers / Business / Services導線等）が崩れていない。
- Lighthouseで致命的なアクセシビリティ警告が増えていない（最低限）。

---

## 6. 追加（可能なら）
- ボタンクリック計測（data-attrや簡易イベント）：
  - `cta_self_check_click`
  - `cta_48h_apply_click`

以下、**批判的吟味（＝仕様適合だけでなく「売れる／壊れない／後で拡張できる」観点）**で見ます。
結論：方向性は良いです。**ただし“今のままだと後で詰むポイント”がいくつかある**ので、そこを潰すのが優先です。

---

## 1) まず総評：設計意図は正しい（入口の摩擦低下→上位へ）

* 「48h deliverables をいきなり見せる」より、**3分セルフ→必要なら48h**はCV的に合理的。
* deliverables を「上位：48h」へ移したのも筋が良い（価値の差分が作れる）。

ここまではOK。

---

## 2) 最重要の指摘：`id="#48h-upgrade"` は“数字始まり”で将来トラブルになりやすい

HTMLの `id` 自体は数字始まりでも動きますが、**CSSセレクタ／JSの `querySelector()`（CSSセレクタ解釈）でハマる**可能性があります。

* 例：`document.querySelector('#48h-upgrade')` がうまく取れないケースが出やすい
* 将来、スクロールスパイ／ヘッダーナビ強調／A/B計測などで詰みます

### 推奨修正（今すぐやる）

* `id="upgrade-48h"` または `id="section-48h-upgrade"` に変更
* それに合わせてリンクも変更

  * `href="#upgrade-48h"`

> **この変更は「今」やる価値が高い**です（後から直すほど影響範囲が増える）。

---

## 3) 仕様逸脱（Secondary CTA）の扱い：NGではないが“仕様を更新すべき”

あなたの指示書（project.md）が `/services.html#spot` を指定していたのに対し、実装は `#48h-upgrade`。

### ここは「どちらが正しいか」

* **UX的には `#48h-upgrade` が勝ち**です
  同一ページ内で下にスクロールする方が、離脱が減ります。
* `/services.html#spot` は「比較検討したい層」には良いが、**いまは売上が急務**なので、クリック後にページ遷移させる設計は弱い。

### ベストプラクティス（折衷案）

* Secondary CTAは **ページ内スクロール**にしてOK（今の設計維持）
* 代わりに、セルフセクションの下部に小さく **テキストリンク**で追加：

  * `料金プラン全体を見る → services.html#spot`
* そして **project.md（仕様）側を更新**して「Secondaryはページ内リンクでも可」と明記

> 結論：**実装を直すより、仕様を直す方が合理的**です（意図が正しいため）。

---

## 4) 価格表記の整合：トップとServicesで“税抜/税込”がズレると信用を落とす

Servicesに税抜表記があるなら、トップも合わせるのが安全です（混乱＝離脱）。

### 推奨

* `50,000円／回（税抜）`
* `100,000円／回（税抜）`

---

## 5) `data-cta` は“置いただけ”だと計測されない（実装が必要）

`data-cta="cta_self_check_click"` などを付けたのは良いですが、**それを拾うJSがないとゼロ効果**です。

### 最小の実装案（例：gtagがある場合）

```js
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-cta]");
  if (!a) return;
  const name = a.getAttribute("data-cta");
  if (window.gtag) {
    gtag("event", name, { value: 1 });
  }
});
```

* GAがないなら、まずは **console.log** でもいい（動作確認ができる）
* できれば `referrer / path / device` を一緒に送る

---

## 6) アンカー遷移の体験：固定ヘッダーがあるなら見出しが隠れる

ページ内リンク（`#upgrade-48h`）を使うなら、見出しがヘッダーに隠れないようにします。

### 推奨

* `scroll-margin-top` をセクションに付与（例：80px）

```css
#upgrade-48h { scroll-margin-top: 80px; }
```

---

## 7) “Servicesページ導線（任意だが推奨）”は、実装する価値が高い

未実装になっていますが、ここは後回しにしない方が良いです。

### なぜ必要か

* Topでセルフ→48hを見たユーザーが、結局「価格の全体像」を確認しに Services に行きます
  → Services側に「まずは3分セルフ」導線がないと、**迷子になる**。

### 最小追加（Servicesの48hセクション直前）

* 1行説明＋ボタン1つだけで十分

  * 「まずは3分セルフ簡易チェックで一次判定」
  * CTA：セルフチェックへ

---

## 8) UXの地雷：セルフURLが仮のまま公開されるリスク

仮URLでも良いですが、公開直後に未完成だと信用が落ちます。

### 推奨の防御

* appがまだない場合：ボタン押下で

  * `準備中` モーダル
  * 代替：メール登録（「公開時に通知」）
  * or 既存フォーム（48h申込）へ誘導
    のどれかにする。

---

# 推奨の修正優先順位（最短で“売れる状態”にする順）

1. **`#48h-upgrade` のIDを変更（数字始まりをやめる）**
2. 価格に **（税抜）** を付けてServicesと整合
3. アンカー遷移の **scroll-margin-top**
4. `data-cta` を拾うJS（最低限）
5. Servicesに「セルフ導線」追記
6. Secondary CTAの仕様は **project.md側を更新**（ページ内リンク許容）

---

# 「Secondary CTAは修正しますか？」への回答

私の判断はこうです：

* **修正しない（ページ内リンクのまま）**がベター
* ただし、**仕様（project.md）を更新**し、Servicesへのリンクは「小さく併設」で補完

これが **CV最大化×整合性**のバランスが取れます。

---

必要なら、次の返信で「Claude Codeに投げる“差分指示”」として、

* `id` のリネーム
* 税抜追記
* scroll-margin-top
* クリック計測JS追加
* Services導線追加
  を、**パッチ形式（やること順＋コピペ可コード）**でまとめて出します。

# Cursorvers セルフ簡易チェック - 申し送り資料

## プロジェクト概要

医療施設向けAIセーフティ診断ツール。10問のウィザード形式で診断し、4カテゴリ（データ/プライバシー、運用/責任分界、契約/ベンダー、人/教育/ログ）で評価。結果は赤/黄/青の3段階判定。

## 技術スタック

| 分類 | 技術 |
|------|------|
| フロントエンド | React 19 + TypeScript + Tailwind CSS 4 |
| バックエンド | Express 4 + tRPC 11 |
| データベース | MySQL (TiDB) + Drizzle ORM |
| 認証 | Manus OAuth |
| アニメーション | Framer Motion |
| 3Dビジュアル | Three.js |
| PDF生成 | jsPDF (Canvas API) |

## ディレクトリ構造

```
cursorvers-scorecard/
├── client/src/
│   ├── pages/
│   │   ├── Home.tsx          # ランディングページ（Three.js背景）
│   │   ├── Scorecard.tsx     # 診断ウィザード
│   │   ├── ScorecardResult.tsx # 結果画面
│   │   ├── History.tsx       # 診断履歴
│   │   ├── AdminDashboard.tsx # 管理画面
│   │   ├── Settings.tsx      # 設定画面
│   │   └── Apply48h.tsx      # 48h申込ブリッジ
│   ├── components/
│   │   └── ThreeBackground.tsx # 3D背景コンポーネント
│   └── lib/
│       ├── trpc.ts           # tRPCクライアント
│       └── generatePdf.ts    # PDF生成ユーティリティ
├── server/
│   ├── routers.ts            # tRPCルーター
│   ├── db.ts                 # データベースクエリ
│   └── scorecard.test.ts     # Vitestテスト
├── shared/
│   └── scorecard.ts          # 共有定数・型定義・ロジック
├── drizzle/
│   └── schema.ts             # DBスキーマ
├── README.md                 # プロジェクト概要
├── ARCHITECTURE.md           # アーキテクチャ設計書
├── CONTRIBUTING.md           # コーディング規約
└── todo.md                   # タスク管理
```

## 主要API

| エンドポイント | 説明 |
|---------------|------|
| `scorecard.submit` | 診断結果を保存（匿名可） |
| `scorecard.updateEmail` | メールアドレスを更新 |
| `scorecard.getAll` | 全診断結果を取得（管理者のみ） |
| `scorecard.getUserHistory` | ユーザーの診断履歴を取得 |
| `scorecard.exportCsv` | CSVエクスポート（管理者のみ） |

## データベーススキーマ

`scorecard_submissions` テーブル:
- `id` (INT, PK, AUTO_INCREMENT)
- `facilityType` (VARCHAR) - 施設区分
- `facilityName` (TEXT, nullable) - 施設名
- `email` (VARCHAR, nullable) - メールアドレス
- `answers` (JSON) - 回答データ
- `scores` (JSON) - カテゴリ別スコア
- `overallColor` (VARCHAR) - 総合判定色
- `categoryColors` (JSON) - カテゴリ別判定色
- `topActions` (JSON) - 優先アクション
- `userId` (INT, nullable) - ログインユーザーID
- `utmSource`, `utmMedium`, `utmCampaign` - UTM情報
- `createdAt` (TIMESTAMP)

## 現在の実装状況

### 完了済み ✅

1. **コア機能**
   - 10問ウィザード形式の診断フロー
   - スコアリングロジック（Yes/わからない=1点、No=0点）
   - 結果画面（総合判定、カテゴリ別評価、優先3項目）
   - PDF出力（白黒報告書風）
   - SNSシェア（X/Twitter、LinkedIn、LINE）

2. **データ管理**
   - 匿名診断結果の保存
   - 施設名・メールアドレスの任意入力
   - UTM情報の記録
   - 診断履歴機能（ログインユーザー）

3. **管理機能**
   - 管理者ダッシュボード
   - フィルター機能（施設名、日付、判定色、施設区分）
   - CSVエクスポート

4. **UI/UX**
   - Google Workspace Studio風デザイン
   - Three.js 3Dビジュアル背景
   - Framer Motionアニメーション
   - モバイルファースト設計

### 未実装・推奨機能 📋

1. **リマインダーメール送信機能**
   - 診断後一定期間経過したユーザーに再診断を促すメール
   - 実装方法: n8n連携またはcronジョブ

2. **詳細レポートページ**
   - 各カテゴリの詳細解説
   - 具体的な改善アクション一覧
   - 参考資料リンク

3. **ダッシュボード分析機能**
   - 時系列推移グラフ
   - カテゴリ別分布チャート
   - 施設区分別統計

4. **多言語対応（英語）**
   - 海外ベンダー向け

## 開発コマンド

```bash
# 開発サーバー起動
pnpm dev

# テスト実行
pnpm test

# データベースマイグレーション
pnpm db:push

# ビルド
pnpm build
```

## 環境変数

システム環境変数は自動注入されます:
- `DATABASE_URL` - MySQL接続文字列
- `JWT_SECRET` - セッション署名
- `VITE_APP_ID` - Manus OAuth アプリID
- その他OAuth関連

## 注意事項

1. **質問の追加・変更**
   - `shared/scorecard.ts` の `QUESTIONS` 配列を編集
   - カテゴリ追加時は `CategoryKey` 型も更新

2. **スコアリングロジック変更**
   - `shared/scorecard.ts` の `calculateScore`, `getCategoryColor`, `getOverallColor` を編集

3. **PDF出力のカスタマイズ**
   - `client/src/lib/generatePdf.ts` を編集
   - Canvas APIで描画

4. **管理者権限**
   - データベースの `users.role` を `admin` に変更

## テスト

```bash
# 全テスト実行
pnpm test

# テストカバレッジ
pnpm test -- --coverage
```

現在8件のテストがパス:
- `scorecard.submit` - 診断結果保存
- `scorecard.getAll` - 管理者権限チェック
- `auth.logout` - ログアウト処理

## 連絡先

プロジェクトオーナー: Cursorvers
