# 復旧手順書

障害発生時（ファイル破損、誤操作等）にこのリポジトリを復旧するための手順です。

---

## 1. バックアップタグの確認

```bash
git fetch --tags
git tag -l "backup/*"
```

出力例：
```
backup/2025-12-02-180532
backup/2025-12-03-030000
backup/2025-12-03-142315
```

---

## 2. 特定時点への復旧

### 方法A: 一時的に確認する場合

```bash
git checkout backup/2025-12-02-180532
```

確認後、元に戻す：
```bash
git checkout main
```

### 方法B: 復旧用ブランチを作成する場合

```bash
git checkout backup/2025-12-02-180532
git checkout -b recovery-2025-12-02
```

修正を加えてから main にマージ：
```bash
git checkout main
git merge recovery-2025-12-02
git push origin main
```

### 方法C: main を完全に巻き戻す場合（注意）

```bash
git checkout main
git reset --hard backup/2025-12-02-180532
git push origin main --force
```

⚠️ **警告**: `--force` は履歴を上書きします。他の作業者がいる場合は事前に連絡してください。

---

## 3. GitHub 上で確認

- Tags 一覧: https://github.com/cursorvers/cursorvers-inc/tags
- Actions 履歴: https://github.com/cursorvers/cursorvers-inc/actions

---

## 4. バックアップの仕組み

| トリガー | タイミング |
|---------|-----------|
| 定期実行 | 毎日 AM 3:00 JST |
| push 時 | main ブランチへの push |
| 手動 | Actions タブから「Run workflow」 |

タグ名形式: `backup/YYYY-MM-DD-HHMMSS`

---

## 5. 緊急連絡先

復旧に困った場合は Founder に連絡してください。

