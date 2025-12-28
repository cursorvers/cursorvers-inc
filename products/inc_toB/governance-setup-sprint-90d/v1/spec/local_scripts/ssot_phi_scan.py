#!/usr/bin/env python3
"""
SSOT PHI Scanner - 医療情報保護法(PHI)に基づく個人情報検出ツール

【重要な警告】
このツールは簡易スキャンであり、完全なPHI検出を保証しません。
本番環境での使用前に、専門家によるレビューを必ず実施してください。
誤検出（偽陽性）および検出漏れ（偽陰性）の可能性があります。

使用方法:
    python ssot_phi_scan.py <scan_directory> [--config <config_file>]

オプション:
    --config    追加キーワードを定義したYAMLまたはJSON設定ファイル
    --verbose   詳細な出力を表示
    --output    結果をファイルに出力

作成日: 2024-12-28
"""

import argparse
import json
import os
import re
import sys
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Optional


class PHICategory(Enum):
    """PHI（保護対象医療情報）のカテゴリ分類"""
    PERSONAL_ID = "個人識別情報"
    MEDICAL_INFO = "医療情報"
    CONTACT_INFO = "連絡先情報"
    FINANCIAL_INFO = "金融・保険情報"
    CUSTOM = "カスタム定義"


@dataclass
class PHIKeyword:
    """PHIキーワードの定義"""
    keyword: str
    category: PHICategory
    description: str = ""


@dataclass
class PHIPattern:
    """PHI正規表現パターンの定義"""
    name: str
    pattern: str
    category: PHICategory
    description: str = ""


@dataclass
class ScanResult:
    """スキャン結果"""
    file_path: str
    line_number: int
    line_content: str
    matched_item: str
    category: PHICategory
    match_type: str  # "keyword" or "pattern"


# ========================================
# PHIキーワード定義（カテゴリ別）
# ========================================

PHI_KEYWORDS: list[PHIKeyword] = [
    # 個人識別情報
    PHIKeyword("氏名", PHICategory.PERSONAL_ID, "個人の名前"),
    PHIKeyword("名前", PHICategory.PERSONAL_ID, "個人の名前"),
    PHIKeyword("フルネーム", PHICategory.PERSONAL_ID, "個人の名前"),
    PHIKeyword("生年月日", PHICategory.PERSONAL_ID, "出生日"),
    PHIKeyword("誕生日", PHICategory.PERSONAL_ID, "出生日"),
    PHIKeyword("年齢", PHICategory.PERSONAL_ID, "年齢情報"),
    PHIKeyword("性別", PHICategory.PERSONAL_ID, "性別情報"),
    PHIKeyword("住所", PHICategory.PERSONAL_ID, "住居地"),
    PHIKeyword("郵便番号", PHICategory.PERSONAL_ID, "郵便番号"),
    PHIKeyword("マイナンバー", PHICategory.PERSONAL_ID, "個人番号"),
    PHIKeyword("個人番号", PHICategory.PERSONAL_ID, "マイナンバー"),
    PHIKeyword("社会保障番号", PHICategory.PERSONAL_ID, "社会保障関連"),
    PHIKeyword("運転免許", PHICategory.PERSONAL_ID, "免許証番号"),
    PHIKeyword("パスポート", PHICategory.PERSONAL_ID, "旅券番号"),
    PHIKeyword("基礎年金番号", PHICategory.PERSONAL_ID, "年金番号"),
    PHIKeyword("患者ID", PHICategory.PERSONAL_ID, "患者識別子"),
    PHIKeyword("患者番号", PHICategory.PERSONAL_ID, "患者識別子"),

    # 医療情報
    PHIKeyword("カルテ", PHICategory.MEDICAL_INFO, "診療記録"),
    PHIKeyword("カルテ番号", PHICategory.MEDICAL_INFO, "診療記録番号"),
    PHIKeyword("診療録", PHICategory.MEDICAL_INFO, "診療記録"),
    PHIKeyword("診察記録", PHICategory.MEDICAL_INFO, "診療記録"),
    PHIKeyword("診断", PHICategory.MEDICAL_INFO, "診断情報"),
    PHIKeyword("診断名", PHICategory.MEDICAL_INFO, "診断名"),
    PHIKeyword("病名", PHICategory.MEDICAL_INFO, "疾患名"),
    PHIKeyword("疾患", PHICategory.MEDICAL_INFO, "疾患情報"),
    PHIKeyword("症状", PHICategory.MEDICAL_INFO, "症状記録"),
    PHIKeyword("主訴", PHICategory.MEDICAL_INFO, "主訴情報"),
    PHIKeyword("所見", PHICategory.MEDICAL_INFO, "医学的所見"),
    PHIKeyword("予後", PHICategory.MEDICAL_INFO, "予後情報"),
    PHIKeyword("既往歴", PHICategory.MEDICAL_INFO, "過去の病歴"),
    PHIKeyword("既往症", PHICategory.MEDICAL_INFO, "過去の病歴"),
    PHIKeyword("病歴", PHICategory.MEDICAL_INFO, "病歴情報"),
    PHIKeyword("家族歴", PHICategory.MEDICAL_INFO, "家族の病歴"),
    PHIKeyword("処方", PHICategory.MEDICAL_INFO, "処方情報"),
    PHIKeyword("処方箋", PHICategory.MEDICAL_INFO, "処方箋"),
    PHIKeyword("服薬", PHICategory.MEDICAL_INFO, "服薬情報"),
    PHIKeyword("投薬", PHICategory.MEDICAL_INFO, "投薬情報"),
    PHIKeyword("薬剤", PHICategory.MEDICAL_INFO, "薬剤情報"),
    PHIKeyword("アレルギー", PHICategory.MEDICAL_INFO, "アレルギー情報"),
    PHIKeyword("副作用", PHICategory.MEDICAL_INFO, "副作用情報"),
    PHIKeyword("検査結果", PHICategory.MEDICAL_INFO, "検査結果"),
    PHIKeyword("検査値", PHICategory.MEDICAL_INFO, "検査数値"),
    PHIKeyword("血液型", PHICategory.MEDICAL_INFO, "血液型情報"),
    PHIKeyword("血圧", PHICategory.MEDICAL_INFO, "血圧情報"),
    PHIKeyword("体温", PHICategory.MEDICAL_INFO, "体温情報"),
    PHIKeyword("身長", PHICategory.MEDICAL_INFO, "身体情報"),
    PHIKeyword("体重", PHICategory.MEDICAL_INFO, "身体情報"),
    PHIKeyword("BMI", PHICategory.MEDICAL_INFO, "身体指標"),
    PHIKeyword("入院", PHICategory.MEDICAL_INFO, "入院情報"),
    PHIKeyword("退院", PHICategory.MEDICAL_INFO, "退院情報"),
    PHIKeyword("手術", PHICategory.MEDICAL_INFO, "手術情報"),
    PHIKeyword("手術歴", PHICategory.MEDICAL_INFO, "手術履歴"),
    PHIKeyword("手術記録", PHICategory.MEDICAL_INFO, "手術記録"),
    PHIKeyword("麻酔", PHICategory.MEDICAL_INFO, "麻酔情報"),
    PHIKeyword("輸血", PHICategory.MEDICAL_INFO, "輸血情報"),
    PHIKeyword("透析", PHICategory.MEDICAL_INFO, "透析情報"),
    PHIKeyword("リハビリ", PHICategory.MEDICAL_INFO, "リハビリ情報"),
    PHIKeyword("治療", PHICategory.MEDICAL_INFO, "治療情報"),
    PHIKeyword("治療歴", PHICategory.MEDICAL_INFO, "治療履歴"),
    PHIKeyword("医師名", PHICategory.MEDICAL_INFO, "担当医師名"),
    PHIKeyword("担当医", PHICategory.MEDICAL_INFO, "担当医師"),
    PHIKeyword("主治医", PHICategory.MEDICAL_INFO, "主治医情報"),
    PHIKeyword("看護師名", PHICategory.MEDICAL_INFO, "担当看護師名"),
    PHIKeyword("担当看護師", PHICategory.MEDICAL_INFO, "担当看護師"),
    PHIKeyword("紹介状", PHICategory.MEDICAL_INFO, "紹介状"),
    PHIKeyword("診断書", PHICategory.MEDICAL_INFO, "診断書"),
    PHIKeyword("同意書", PHICategory.MEDICAL_INFO, "同意書"),
    PHIKeyword("精神科", PHICategory.MEDICAL_INFO, "精神科情報"),
    PHIKeyword("心療内科", PHICategory.MEDICAL_INFO, "心療内科情報"),
    PHIKeyword("感染症", PHICategory.MEDICAL_INFO, "感染症情報"),
    PHIKeyword("HIV", PHICategory.MEDICAL_INFO, "HIV関連"),
    PHIKeyword("AIDS", PHICategory.MEDICAL_INFO, "AIDS関連"),
    PHIKeyword("がん", PHICategory.MEDICAL_INFO, "がん関連"),
    PHIKeyword("癌", PHICategory.MEDICAL_INFO, "がん関連"),
    PHIKeyword("妊娠", PHICategory.MEDICAL_INFO, "妊娠情報"),
    PHIKeyword("出産", PHICategory.MEDICAL_INFO, "出産情報"),
    PHIKeyword("遺伝子", PHICategory.MEDICAL_INFO, "遺伝子情報"),
    PHIKeyword("DNA", PHICategory.MEDICAL_INFO, "DNA情報"),
    PHIKeyword("ゲノム", PHICategory.MEDICAL_INFO, "ゲノム情報"),

    # 連絡先情報
    PHIKeyword("電話番号", PHICategory.CONTACT_INFO, "電話番号"),
    PHIKeyword("電話", PHICategory.CONTACT_INFO, "電話情報"),
    PHIKeyword("携帯番号", PHICategory.CONTACT_INFO, "携帯電話番号"),
    PHIKeyword("携帯", PHICategory.CONTACT_INFO, "携帯電話"),
    PHIKeyword("FAX", PHICategory.CONTACT_INFO, "FAX番号"),
    PHIKeyword("メールアドレス", PHICategory.CONTACT_INFO, "メールアドレス"),
    PHIKeyword("Eメール", PHICategory.CONTACT_INFO, "メールアドレス"),
    PHIKeyword("email", PHICategory.CONTACT_INFO, "メールアドレス"),
    PHIKeyword("緊急連絡先", PHICategory.CONTACT_INFO, "緊急連絡先"),
    PHIKeyword("連絡先", PHICategory.CONTACT_INFO, "連絡先情報"),

    # 金融・保険情報
    PHIKeyword("保険証番号", PHICategory.FINANCIAL_INFO, "健康保険証番号"),
    PHIKeyword("被保険者番号", PHICategory.FINANCIAL_INFO, "被保険者番号"),
    PHIKeyword("保険証", PHICategory.FINANCIAL_INFO, "健康保険証"),
    PHIKeyword("健康保険", PHICategory.FINANCIAL_INFO, "健康保険"),
    PHIKeyword("国民健康保険", PHICategory.FINANCIAL_INFO, "国民健康保険"),
    PHIKeyword("社会保険", PHICategory.FINANCIAL_INFO, "社会保険"),
    PHIKeyword("後期高齢者", PHICategory.FINANCIAL_INFO, "後期高齢者医療"),
    PHIKeyword("介護保険", PHICategory.FINANCIAL_INFO, "介護保険"),
    PHIKeyword("公費負担", PHICategory.FINANCIAL_INFO, "公費負担"),
    PHIKeyword("自己負担", PHICategory.FINANCIAL_INFO, "自己負担"),
    PHIKeyword("請求", PHICategory.FINANCIAL_INFO, "医療費請求"),
    PHIKeyword("レセプト", PHICategory.FINANCIAL_INFO, "診療報酬明細書"),
    PHIKeyword("口座番号", PHICategory.FINANCIAL_INFO, "銀行口座"),
    PHIKeyword("クレジットカード", PHICategory.FINANCIAL_INFO, "クレジットカード"),
    PHIKeyword("カード番号", PHICategory.FINANCIAL_INFO, "カード番号"),
]


# ========================================
# 正規表現パターン定義
# ========================================

PHI_PATTERNS: list[PHIPattern] = [
    # 電話番号パターン（日本）
    PHIPattern(
        "電話番号(固定/携帯)",
        r"0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}",
        PHICategory.CONTACT_INFO,
        "日本の電話番号パターン（ハイフンあり/なし）"
    ),
    PHIPattern(
        "電話番号(括弧付き)",
        r"\(0\d{1,4}\)[-\s]?\d{1,4}[-\s]?\d{3,4}",
        PHICategory.CONTACT_INFO,
        "日本の電話番号パターン（括弧付き）"
    ),

    # マイナンバー（12桁）
    PHIPattern(
        "マイナンバー",
        r"\b\d{12}\b",
        PHICategory.PERSONAL_ID,
        "12桁の数字（マイナンバーの可能性）"
    ),

    # 郵便番号
    PHIPattern(
        "郵便番号",
        r"\b\d{3}[-\s]?\d{4}\b",
        PHICategory.PERSONAL_ID,
        "日本の郵便番号パターン"
    ),

    # メールアドレス
    PHIPattern(
        "メールアドレス",
        r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
        PHICategory.CONTACT_INFO,
        "メールアドレスパターン"
    ),

    # 日付パターン（生年月日の可能性）
    PHIPattern(
        "日付(YYYY/MM/DD)",
        r"\b(19|20)\d{2}[/\-年](0?[1-9]|1[0-2])[/\-月](0?[1-9]|[12][0-9]|3[01])日?\b",
        PHICategory.PERSONAL_ID,
        "日付パターン（生年月日の可能性）"
    ),
    PHIPattern(
        "日付(和暦)",
        r"(昭和|平成|令和)[元\d]{1,2}年(0?[1-9]|1[0-2])月(0?[1-9]|[12][0-9]|3[01])日",
        PHICategory.PERSONAL_ID,
        "和暦日付パターン"
    ),

    # 保険証番号パターン（数字8桁）
    PHIPattern(
        "保険証番号(8桁)",
        r"\b\d{8}\b",
        PHICategory.FINANCIAL_INFO,
        "8桁の数字（保険証番号の可能性）"
    ),

    # クレジットカード番号（16桁）
    PHIPattern(
        "クレジットカード番号",
        r"\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b",
        PHICategory.FINANCIAL_INFO,
        "クレジットカード番号パターン"
    ),

    # 個人名パターン（漢字2-4文字 + 敬称）
    PHIPattern(
        "個人名(敬称付き)",
        r"[\u4e00-\u9fff]{2,4}(様|さん|先生|医師|看護師|薬剤師)",
        PHICategory.PERSONAL_ID,
        "敬称付きの個人名パターン"
    ),
]


class PHIScanner:
    """PHIスキャナークラス"""

    # スキャン対象外の拡張子
    EXCLUDED_EXTENSIONS = {
        '.pyc', '.pyo', '.exe', '.dll', '.so', '.dylib',
        '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.svg', '.webp',
        '.mp3', '.mp4', '.avi', '.mov', '.wav',
        '.zip', '.tar', '.gz', '.rar', '.7z',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx',
        '.lock', '.woff', '.woff2', '.ttf', '.eot',
    }

    # スキャン対象外のディレクトリ
    EXCLUDED_DIRS = {
        '.git', '.svn', '.hg',
        'node_modules', 'vendor', '__pycache__',
        'venv', '.venv', 'env', '.env',
        'dist', 'build', 'target',
        '.idea', '.vscode',
    }

    def __init__(
        self,
        keywords: list[PHIKeyword] = None,
        patterns: list[PHIPattern] = None,
        verbose: bool = False,
    ):
        self.keywords = keywords or PHI_KEYWORDS.copy()
        self.patterns = patterns or PHI_PATTERNS.copy()
        self.verbose = verbose
        self.results: list[ScanResult] = []

        # 正規表現をコンパイル
        self._compiled_patterns = [
            (p, re.compile(p.pattern, re.IGNORECASE))
            for p in self.patterns
        ]

    def load_config(self, config_path: str) -> None:
        """外部設定ファイルから追加キーワードを読み込む"""
        path = Path(config_path)
        if not path.exists():
            print(f"警告: 設定ファイルが見つかりません: {config_path}")
            return

        try:
            if path.suffix in ('.yaml', '.yml'):
                try:
                    import yaml
                    with open(path, 'r', encoding='utf-8') as f:
                        config = yaml.safe_load(f)
                except ImportError:
                    print("警告: PyYAMLがインストールされていません。pip install pyyaml")
                    return
            elif path.suffix == '.json':
                with open(path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
            else:
                print(f"警告: サポートされていない設定ファイル形式: {path.suffix}")
                return

            # カスタムキーワードを追加
            if 'keywords' in config:
                for kw in config['keywords']:
                    category = PHICategory.CUSTOM
                    if 'category' in kw:
                        try:
                            category = PHICategory[kw['category'].upper()]
                        except KeyError:
                            category = PHICategory.CUSTOM

                    self.keywords.append(PHIKeyword(
                        keyword=kw['keyword'],
                        category=category,
                        description=kw.get('description', ''),
                    ))

            # カスタムパターンを追加
            if 'patterns' in config:
                for pt in config['patterns']:
                    category = PHICategory.CUSTOM
                    if 'category' in pt:
                        try:
                            category = PHICategory[pt['category'].upper()]
                        except KeyError:
                            category = PHICategory.CUSTOM

                    pattern_obj = PHIPattern(
                        name=pt['name'],
                        pattern=pt['pattern'],
                        category=category,
                        description=pt.get('description', ''),
                    )
                    self.patterns.append(pattern_obj)
                    self._compiled_patterns.append(
                        (pattern_obj, re.compile(pt['pattern'], re.IGNORECASE))
                    )

            if self.verbose:
                print(f"設定ファイルを読み込みました: {config_path}")

        except Exception as e:
            print(f"警告: 設定ファイルの読み込み中にエラー: {e}")

    def should_scan_file(self, file_path: Path) -> bool:
        """ファイルをスキャン対象とするか判定"""
        # 拡張子チェック
        if file_path.suffix.lower() in self.EXCLUDED_EXTENSIONS:
            return False

        # ディレクトリチェック
        for part in file_path.parts:
            if part in self.EXCLUDED_DIRS:
                return False

        # 隠しファイルを除外（.で始まるファイル）
        if file_path.name.startswith('.'):
            return False

        return True

    def scan_line(self, line: str, file_path: str, line_number: int) -> list[ScanResult]:
        """1行をスキャンしてPHIを検出"""
        results = []

        # キーワード検索
        for kw in self.keywords:
            if kw.keyword.lower() in line.lower():
                results.append(ScanResult(
                    file_path=file_path,
                    line_number=line_number,
                    line_content=line.strip()[:100],  # 100文字に制限
                    matched_item=kw.keyword,
                    category=kw.category,
                    match_type="keyword",
                ))

        # パターン検索
        for pattern_def, compiled_pattern in self._compiled_patterns:
            matches = compiled_pattern.findall(line)
            if matches:
                for match in matches:
                    match_str = match if isinstance(match, str) else match[0] if match else ""
                    results.append(ScanResult(
                        file_path=file_path,
                        line_number=line_number,
                        line_content=line.strip()[:100],
                        matched_item=f"{pattern_def.name}: {match_str}",
                        category=pattern_def.category,
                        match_type="pattern",
                    ))

        return results

    def scan_file(self, file_path: Path) -> list[ScanResult]:
        """ファイルをスキャン"""
        results = []

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                for line_number, line in enumerate(f, 1):
                    line_results = self.scan_line(line, str(file_path), line_number)
                    results.extend(line_results)
        except Exception as e:
            if self.verbose:
                print(f"警告: ファイル読み込みエラー: {file_path} - {e}")

        return results

    def scan_directory(self, directory: str) -> list[ScanResult]:
        """ディレクトリを再帰的にスキャン"""
        self.results = []
        dir_path = Path(directory)

        if not dir_path.exists():
            print(f"エラー: ディレクトリが存在しません: {directory}")
            return []

        if not dir_path.is_dir():
            print(f"エラー: ディレクトリではありません: {directory}")
            return []

        file_count = 0
        for file_path in dir_path.rglob('*'):
            if file_path.is_file() and self.should_scan_file(file_path):
                file_count += 1
                if self.verbose:
                    print(f"スキャン中: {file_path}")
                results = self.scan_file(file_path)
                self.results.extend(results)

        if self.verbose:
            print(f"\n合計 {file_count} ファイルをスキャンしました")

        return self.results

    def print_results(self) -> None:
        """スキャン結果を表示"""
        if not self.results:
            print("\n検出されたPHIはありません。")
            return

        # カテゴリ別に集計
        by_category: dict[PHICategory, list[ScanResult]] = {}
        for result in self.results:
            if result.category not in by_category:
                by_category[result.category] = []
            by_category[result.category].append(result)

        print("\n" + "=" * 80)
        print("PHI検出結果")
        print("=" * 80)

        for category, results in sorted(by_category.items(), key=lambda x: x[0].value):
            print(f"\n### {category.value} ({len(results)}件) ###")
            print("-" * 60)

            # ファイル別にグループ化
            by_file: dict[str, list[ScanResult]] = {}
            for r in results:
                if r.file_path not in by_file:
                    by_file[r.file_path] = []
                by_file[r.file_path].append(r)

            for file_path, file_results in by_file.items():
                print(f"\nファイル: {file_path}")
                for r in file_results:
                    print(f"  行 {r.line_number}: [{r.match_type}] {r.matched_item}")
                    if self.verbose:
                        print(f"    内容: {r.line_content}")

        # サマリー
        print("\n" + "=" * 80)
        print("サマリー")
        print("=" * 80)
        print(f"総検出数: {len(self.results)}件")
        for category, results in sorted(by_category.items(), key=lambda x: x[0].value):
            print(f"  - {category.value}: {len(results)}件")

        # ユニークファイル数
        unique_files = set(r.file_path for r in self.results)
        print(f"\n影響ファイル数: {len(unique_files)}ファイル")

    def export_results(self, output_path: str) -> None:
        """結果をJSONファイルにエクスポート"""
        export_data = {
            "summary": {
                "total_findings": len(self.results),
                "unique_files": len(set(r.file_path for r in self.results)),
                "by_category": {},
            },
            "findings": [],
        }

        for result in self.results:
            cat_name = result.category.value
            if cat_name not in export_data["summary"]["by_category"]:
                export_data["summary"]["by_category"][cat_name] = 0
            export_data["summary"]["by_category"][cat_name] += 1

            export_data["findings"].append({
                "file": result.file_path,
                "line": result.line_number,
                "content": result.line_content,
                "matched": result.matched_item,
                "category": result.category.value,
                "type": result.match_type,
            })

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, ensure_ascii=False, indent=2)

        print(f"\n結果をエクスポートしました: {output_path}")


def print_disclaimer() -> None:
    """免責事項を表示"""
    disclaimer = """
================================================================================
                           【重要な警告・免責事項】
================================================================================

このツールは簡易スキャンであり、完全なPHI検出を保証しません。

1. 誤検出（偽陽性）の可能性があります
   - 技術用語や一般的な単語がPHIとして検出される場合があります

2. 検出漏れ（偽陰性）の可能性があります
   - 暗号化されたデータ、バイナリファイル、画像内のテキストは検出できません
   - 新しい形式のPHIや変形された表現は検出されない場合があります

3. 本番環境での使用前に
   - 専門家（情報セキュリティ担当、法務担当）によるレビューを実施してください
   - HIPAA、個人情報保護法等の関連法規への準拠を確認してください

4. このツールの使用によって生じた損害について
   - 開発者は一切の責任を負いません

================================================================================
"""
    print(disclaimer)


def main():
    parser = argparse.ArgumentParser(
        description="PHI（保護対象医療情報）スキャンツール",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
使用例:
  python ssot_phi_scan.py ./src
  python ssot_phi_scan.py ./src --config custom_keywords.yaml
  python ssot_phi_scan.py ./src --verbose --output results.json
        """
    )
    parser.add_argument(
        'directory',
        help='スキャン対象のディレクトリ',
    )
    parser.add_argument(
        '--config', '-c',
        help='追加キーワードを定義した設定ファイル（YAML/JSON）',
    )
    parser.add_argument(
        '--verbose', '-v',
        action='store_true',
        help='詳細な出力を表示',
    )
    parser.add_argument(
        '--output', '-o',
        help='結果をJSONファイルに出力',
    )
    parser.add_argument(
        '--no-disclaimer',
        action='store_true',
        help='免責事項の表示をスキップ',
    )

    args = parser.parse_args()

    # 免責事項を表示
    if not args.no_disclaimer:
        print_disclaimer()

    # スキャナーを初期化
    scanner = PHIScanner(verbose=args.verbose)

    # 設定ファイルを読み込み
    if args.config:
        scanner.load_config(args.config)

    # スキャン実行
    print(f"\nスキャン開始: {args.directory}")
    print("-" * 40)

    scanner.scan_directory(args.directory)

    # 結果を表示
    scanner.print_results()

    # 結果をエクスポート
    if args.output:
        scanner.export_results(args.output)

    # 終了メッセージ
    print("\n" + "-" * 40)
    print("スキャン完了")

    # 検出があった場合は終了コード1を返す
    if scanner.results:
        sys.exit(1)
    sys.exit(0)


if __name__ == '__main__':
    main()
