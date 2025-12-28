#!/usr/bin/env python3
"""
estimate_capacity.py - Google Sheets 容量見積もりスクリプト

このスクリプトは、案件管理シートの現在の使用状況から
残容量と月間処理可能件数を推定します。

使用方法:
  python estimate_capacity.py [--rows 現在行数] [--cols 列数] [--monthly 月間案件数]

例:
  python estimate_capacity.py --rows 500 --cols 30 --monthly 20
  python estimate_capacity.py  # デフォルト値で推定
"""

import argparse
from dataclasses import dataclass
from datetime import datetime


# Google Sheets の制限値
GOOGLE_SHEETS_MAX_CELLS = 10_000_000  # 1000万セル
RECOMMENDED_MAX_ROWS = 50_000  # 推奨最大行数（パフォーマンス維持）
PERFORMANCE_OPTIMAL_ROWS = 10_000  # 最適パフォーマンス行数

# 案件管理の標準設定
DEFAULT_COLS_PER_ROW = 30  # 1案件あたりの列数
DEFAULT_ROWS_PER_CASE = 1  # 1案件あたりの行数（通常は1）
DEFAULT_MONTHLY_CASES = 20  # デフォルト月間案件数


@dataclass
class CapacityEstimate:
    """容量見積もり結果"""
    current_rows: int
    current_cols: int
    current_cells: int
    max_cells: int
    remaining_cells: int
    capacity_used_percent: float
    remaining_rows: int
    monthly_cases: int
    months_remaining: float
    status: str  # GREEN, YELLOW, RED
    recommendations: list[str]


def estimate_capacity(
    current_rows: int,
    current_cols: int = DEFAULT_COLS_PER_ROW,
    monthly_cases: int = DEFAULT_MONTHLY_CASES,
    rows_per_case: int = DEFAULT_ROWS_PER_CASE
) -> CapacityEstimate:
    """
    現在のシート状況から残容量を計算

    Args:
        current_rows: 現在の行数（ヘッダー含む）
        current_cols: 列数
        monthly_cases: 月間案件数
        rows_per_case: 1案件あたりの行数

    Returns:
        CapacityEstimate: 見積もり結果
    """
    # 現在のセル使用数
    current_cells = current_rows * current_cols

    # 残容量
    remaining_cells = GOOGLE_SHEETS_MAX_CELLS - current_cells
    remaining_rows = remaining_cells // current_cols

    # 容量使用率
    capacity_used_percent = (current_cells / GOOGLE_SHEETS_MAX_CELLS) * 100

    # 月間処理可能件数と残り月数
    rows_per_month = monthly_cases * rows_per_case
    if rows_per_month > 0:
        months_remaining = remaining_rows / rows_per_month
    else:
        months_remaining = float('inf')

    # ステータス判定
    recommendations = []

    if current_rows < 1000:
        status = "GREEN"
        recommendations.append("正常運用中。月次バックアップを継続してください。")
    elif current_rows < 5000:
        status = "YELLOW"
        recommendations.append("容量に余裕がありますが、四半期ごとのアーカイブを検討してください。")
        if current_rows > 3000:
            recommendations.append("完了案件のアーカイブを実施することを推奨します。")
    else:
        status = "RED"
        recommendations.append("容量が逼迫しています。早急にアーカイブまたはシート分割を実施してください。")
        recommendations.append("古い完了案件を別シートに移動することを強く推奨します。")
        if current_rows > PERFORMANCE_OPTIMAL_ROWS:
            recommendations.append("パフォーマンス低下が予想されます。10,000行以下に削減を推奨。")

    # パフォーマンス警告
    if current_rows > PERFORMANCE_OPTIMAL_ROWS:
        recommendations.append(
            f"現在 {current_rows:,} 行あります。"
            f"最適パフォーマンスのため {PERFORMANCE_OPTIMAL_ROWS:,} 行以下を推奨。"
        )

    return CapacityEstimate(
        current_rows=current_rows,
        current_cols=current_cols,
        current_cells=current_cells,
        max_cells=GOOGLE_SHEETS_MAX_CELLS,
        remaining_cells=remaining_cells,
        capacity_used_percent=capacity_used_percent,
        remaining_rows=remaining_rows,
        monthly_cases=monthly_cases,
        months_remaining=months_remaining,
        status=status,
        recommendations=recommendations
    )


def format_report(estimate: CapacityEstimate) -> str:
    """見積もり結果をフォーマット"""
    status_emoji = {
        "GREEN": "[OK]",
        "YELLOW": "[WARN]",
        "RED": "[CRITICAL]"
    }

    report = f"""
================================================================================
                        容量見積もりレポート
                        {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
================================================================================

【現在の使用状況】
  行数:       {estimate.current_rows:>12,} 行
  列数:       {estimate.current_cols:>12,} 列
  セル数:     {estimate.current_cells:>12,} セル
  使用率:     {estimate.capacity_used_percent:>11.4f} %

【容量上限】
  最大セル数: {estimate.max_cells:>12,} セル
  残りセル数: {estimate.remaining_cells:>12,} セル
  残り行数:   {estimate.remaining_rows:>12,} 行

【運用予測】
  月間案件数: {estimate.monthly_cases:>12,} 件/月
  残り運用可能期間: {estimate.months_remaining:>8.1f} ヶ月

【ステータス】 {status_emoji[estimate.status]} {estimate.status}

【推奨事項】
"""
    for i, rec in enumerate(estimate.recommendations, 1):
        report += f"  {i}. {rec}\n"

    report += """
================================================================================
"""
    return report


def format_json(estimate: CapacityEstimate) -> str:
    """JSON形式で出力"""
    import json
    return json.dumps({
        "timestamp": datetime.now().isoformat(),
        "current": {
            "rows": estimate.current_rows,
            "cols": estimate.current_cols,
            "cells": estimate.current_cells,
            "capacity_used_percent": round(estimate.capacity_used_percent, 4)
        },
        "limits": {
            "max_cells": estimate.max_cells,
            "remaining_cells": estimate.remaining_cells,
            "remaining_rows": estimate.remaining_rows
        },
        "forecast": {
            "monthly_cases": estimate.monthly_cases,
            "months_remaining": round(estimate.months_remaining, 1) if estimate.months_remaining != float('inf') else None
        },
        "status": estimate.status,
        "recommendations": estimate.recommendations
    }, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser(
        description="Google Sheets 案件管理シートの容量見積もり"
    )
    parser.add_argument(
        "--rows", "-r",
        type=int,
        default=100,
        help="現在の行数（ヘッダー含む）デフォルト: 100"
    )
    parser.add_argument(
        "--cols", "-c",
        type=int,
        default=DEFAULT_COLS_PER_ROW,
        help=f"列数。デフォルト: {DEFAULT_COLS_PER_ROW}"
    )
    parser.add_argument(
        "--monthly", "-m",
        type=int,
        default=DEFAULT_MONTHLY_CASES,
        help=f"月間案件数。デフォルト: {DEFAULT_MONTHLY_CASES}"
    )
    parser.add_argument(
        "--json", "-j",
        action="store_true",
        help="JSON形式で出力"
    )
    parser.add_argument(
        "--simulate",
        type=int,
        nargs="+",
        metavar="ROWS",
        help="複数のシナリオをシミュレート（行数をスペース区切りで指定）"
    )

    args = parser.parse_args()

    if args.simulate:
        # 複数シナリオのシミュレーション
        print("\n" + "=" * 80)
        print("                    シナリオ別容量シミュレーション")
        print("=" * 80)
        print(f"\n{'行数':>10} | {'使用率':>10} | {'残り月数':>10} | ステータス")
        print("-" * 50)

        for rows in args.simulate:
            est = estimate_capacity(rows, args.cols, args.monthly)
            months_str = f"{est.months_remaining:.1f}" if est.months_remaining != float('inf') else "無限"
            print(f"{rows:>10,} | {est.capacity_used_percent:>9.4f}% | {months_str:>10} | {est.status}")

        print()
    else:
        # 通常の見積もり
        estimate = estimate_capacity(args.rows, args.cols, args.monthly)

        if args.json:
            print(format_json(estimate))
        else:
            print(format_report(estimate))


if __name__ == "__main__":
    main()
