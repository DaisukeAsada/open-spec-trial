/**
 * Report Domain - 型定義
 *
 * レポート・統計ドメインの型定義を提供します。
 */

import type { BookId } from '../../shared/branded-types.js';

// ============================================
// 期間指定
// ============================================

/** 期間指定入力 */
export interface DateRange {
  readonly startDate: Date;
  readonly endDate: Date;
}

// ============================================
// 統計サマリー
// ============================================

/** 統計サマリー */
export interface StatisticsSummary {
  /** 貸出数 */
  readonly loanCount: number;
  /** 返却数 */
  readonly returnCount: number;
  /** 延滞数 */
  readonly overdueCount: number;
  /** 集計期間 */
  readonly dateRange: DateRange;
}

// ============================================
// 人気書籍ランキング
// ============================================

/** 人気書籍ランキング項目 */
export interface PopularBookItem {
  readonly bookId: BookId;
  readonly title: string;
  readonly author: string;
  readonly loanCount: number;
  readonly rank: number;
}

/** 人気書籍ランキング */
export interface PopularBooksRanking {
  readonly items: readonly PopularBookItem[];
  readonly dateRange: DateRange;
}

// ============================================
// カテゴリ別貸出統計
// ============================================

/** カテゴリ別貸出統計項目 */
export interface CategoryStatisticsItem {
  readonly category: string;
  readonly loanCount: number;
  readonly percentage: number;
}

/** カテゴリ別貸出統計 */
export interface CategoryStatistics {
  readonly items: readonly CategoryStatisticsItem[];
  readonly totalLoanCount: number;
  readonly dateRange: DateRange;
}

// ============================================
// エラー型定義
// ============================================

/** レポートドメインエラー */
export type ReportError =
  | { readonly type: 'VALIDATION_ERROR'; readonly field: string; readonly message: string }
  | { readonly type: 'INVALID_DATE_RANGE'; readonly message: string };

// ============================================
// レポート出力形式 (Task 9.2)
// ============================================

/** 表形式データ */
export interface TableData {
  /** ヘッダー行 */
  readonly headers: readonly string[];
  /** データ行 */
  readonly rows: readonly (readonly string[])[];
}
