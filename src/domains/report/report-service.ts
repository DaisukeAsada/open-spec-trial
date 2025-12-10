/**
 * ReportService - レポート・統計サービス
 *
 * 貸出統計、人気書籍ランキング、カテゴリ別統計を提供します。
 */

import type { Result } from '../../shared/result.js';
import { ok, err, isOk } from '../../shared/result.js';
import type { ReportRepository } from './report-repository.js';
import type {
  DateRange,
  StatisticsSummary,
  PopularBooksRanking,
  CategoryStatistics,
  ReportError,
  TableData,
} from './types.js';

// ============================================
// サービスインターフェース
// ============================================

/** ReportService インターフェース */
export interface ReportService {
  /**
   * 統計サマリーを取得
   * @param dateRange - 集計期間
   * @returns 統計サマリーまたはエラー
   */
  getStatisticsSummary(dateRange: DateRange): Promise<Result<StatisticsSummary, ReportError>>;

  /**
   * 人気書籍ランキングを取得
   * @param dateRange - 集計期間
   * @param limit - 取得件数上限
   * @returns 人気書籍ランキングまたはエラー
   */
  getPopularBooksRanking(
    dateRange: DateRange,
    limit: number
  ): Promise<Result<PopularBooksRanking, ReportError>>;

  /**
   * カテゴリ別貸出統計を取得
   * @param dateRange - 集計期間
   * @returns カテゴリ別貸出統計またはエラー
   */
  getCategoryStatistics(dateRange: DateRange): Promise<Result<CategoryStatistics, ReportError>>;

  // ============================================
  // CSVエクスポート機能 (Task 9.2)
  // ============================================

  /**
   * 統計サマリーをCSV形式でエクスポート
   * @param dateRange - 集計期間
   * @returns CSV文字列またはエラー
   */
  exportStatisticsSummaryToCsv(dateRange: DateRange): Promise<Result<string, ReportError>>;

  /**
   * 人気書籍ランキングをCSV形式でエクスポート
   * @param dateRange - 集計期間
   * @param limit - 取得件数上限
   * @returns CSV文字列またはエラー
   */
  exportPopularBooksRankingToCsv(
    dateRange: DateRange,
    limit: number
  ): Promise<Result<string, ReportError>>;

  /**
   * カテゴリ別貸出統計をCSV形式でエクスポート
   * @param dateRange - 集計期間
   * @returns CSV文字列またはエラー
   */
  exportCategoryStatisticsToCsv(dateRange: DateRange): Promise<Result<string, ReportError>>;

  // ============================================
  // 表形式データ整形機能 (Task 9.2)
  // ============================================

  /**
   * 統計サマリーを表形式のデータに整形
   * @param dateRange - 集計期間
   * @returns 表形式データまたはエラー
   */
  formatStatisticsSummaryAsTable(dateRange: DateRange): Promise<Result<TableData, ReportError>>;

  /**
   * 人気書籍ランキングを表形式のデータに整形
   * @param dateRange - 集計期間
   * @param limit - 取得件数上限
   * @returns 表形式データまたはエラー
   */
  formatPopularBooksRankingAsTable(
    dateRange: DateRange,
    limit: number
  ): Promise<Result<TableData, ReportError>>;

  /**
   * カテゴリ別貸出統計を表形式のデータに整形
   * @param dateRange - 集計期間
   * @returns 表形式データまたはエラー
   */
  formatCategoryStatisticsAsTable(dateRange: DateRange): Promise<Result<TableData, ReportError>>;
}

// ============================================
// バリデーション
// ============================================

/**
 * 期間の妥当性を検証
 * @param dateRange - 検証する期間
 * @returns 有効な場合はtrue
 */
function isValidDateRange(dateRange: DateRange): boolean {
  return dateRange.startDate <= dateRange.endDate;
}

// ============================================
// CSV出力ユーティリティ (Task 9.2)
// ============================================

/**
 * CSV値をエスケープ
 * カンマやダブルクォートを含む値をダブルクォートで囲む
 * @param value - エスケープする値
 * @returns エスケープされた値
 */
function escapeCsvValue(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    // ダブルクォートを2つに置換し、全体をダブルクォートで囲む
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * 表形式データをCSV文字列に変換
 * @param tableData - 表形式データ
 * @returns CSV文字列
 */
function tableDataToCsv(tableData: TableData): string {
  const headerLine = tableData.headers.map(escapeCsvValue).join(',');
  if (tableData.rows.length === 0) {
    return headerLine;
  }
  const rowLines = tableData.rows.map((row) => row.map(escapeCsvValue).join(',')).join('\n');
  return `${headerLine}\n${rowLines}`;
}

// ============================================
// サービス実装
// ============================================

/** ReportService 実装を作成 */
export function createReportService(reportRepository: ReportRepository): ReportService {
  return {
    async getStatisticsSummary(
      dateRange: DateRange
    ): Promise<Result<StatisticsSummary, ReportError>> {
      // 期間の妥当性チェック
      if (!isValidDateRange(dateRange)) {
        return err({
          type: 'INVALID_DATE_RANGE',
          message: '開始日は終了日より前である必要があります',
        });
      }

      // 各統計を集計
      const [loanCount, returnCount, overdueCount] = await Promise.all([
        reportRepository.countLoans(dateRange),
        reportRepository.countReturns(dateRange),
        reportRepository.countOverdues(dateRange),
      ]);

      return ok({
        loanCount,
        returnCount,
        overdueCount,
        dateRange,
      });
    },

    async getPopularBooksRanking(
      dateRange: DateRange,
      limit: number
    ): Promise<Result<PopularBooksRanking, ReportError>> {
      // 期間の妥当性チェック
      if (!isValidDateRange(dateRange)) {
        return err({
          type: 'INVALID_DATE_RANGE',
          message: '開始日は終了日より前である必要があります',
        });
      }

      // 人気書籍ランキングを取得
      const items = await reportRepository.getPopularBooks(dateRange, limit);

      return ok({
        items,
        dateRange,
      });
    },

    async getCategoryStatistics(
      dateRange: DateRange
    ): Promise<Result<CategoryStatistics, ReportError>> {
      // 期間の妥当性チェック
      if (!isValidDateRange(dateRange)) {
        return err({
          type: 'INVALID_DATE_RANGE',
          message: '開始日は終了日より前である必要があります',
        });
      }

      // カテゴリ別統計を取得
      const items = await reportRepository.getCategoryStatistics(dateRange);

      // 合計貸出数を計算
      const totalLoanCount = items.reduce((sum, item) => sum + item.loanCount, 0);

      return ok({
        items,
        totalLoanCount,
        dateRange,
      });
    },

    // ============================================
    // 表形式データ整形機能 (Task 9.2)
    // ============================================

    async formatStatisticsSummaryAsTable(
      dateRange: DateRange
    ): Promise<Result<TableData, ReportError>> {
      const summaryResult = await this.getStatisticsSummary(dateRange);
      if (!isOk(summaryResult)) {
        return summaryResult;
      }

      const summary = summaryResult.value;
      return ok({
        headers: ['項目', '件数'],
        rows: [
          ['貸出数', String(summary.loanCount)],
          ['返却数', String(summary.returnCount)],
          ['延滞数', String(summary.overdueCount)],
        ],
      });
    },

    async formatPopularBooksRankingAsTable(
      dateRange: DateRange,
      limit: number
    ): Promise<Result<TableData, ReportError>> {
      const rankingResult = await this.getPopularBooksRanking(dateRange, limit);
      if (!isOk(rankingResult)) {
        return rankingResult;
      }

      const ranking = rankingResult.value;
      return ok({
        headers: ['順位', 'タイトル', '著者', '貸出回数'],
        rows: ranking.items.map((item) => [
          String(item.rank),
          item.title,
          item.author,
          String(item.loanCount),
        ]),
      });
    },

    async formatCategoryStatisticsAsTable(
      dateRange: DateRange
    ): Promise<Result<TableData, ReportError>> {
      const statsResult = await this.getCategoryStatistics(dateRange);
      if (!isOk(statsResult)) {
        return statsResult;
      }

      const stats = statsResult.value;
      return ok({
        headers: ['カテゴリ', '貸出回数', '割合(%)'],
        rows: stats.items.map((item) => [
          item.category,
          String(item.loanCount),
          item.percentage.toFixed(2),
        ]),
      });
    },

    // ============================================
    // CSVエクスポート機能 (Task 9.2)
    // ============================================

    async exportStatisticsSummaryToCsv(dateRange: DateRange): Promise<Result<string, ReportError>> {
      const tableResult = await this.formatStatisticsSummaryAsTable(dateRange);
      if (!isOk(tableResult)) {
        return tableResult;
      }

      return ok(tableDataToCsv(tableResult.value));
    },

    async exportPopularBooksRankingToCsv(
      dateRange: DateRange,
      limit: number
    ): Promise<Result<string, ReportError>> {
      const tableResult = await this.formatPopularBooksRankingAsTable(dateRange, limit);
      if (!isOk(tableResult)) {
        return tableResult;
      }

      return ok(tableDataToCsv(tableResult.value));
    },

    async exportCategoryStatisticsToCsv(
      dateRange: DateRange
    ): Promise<Result<string, ReportError>> {
      const tableResult = await this.formatCategoryStatisticsAsTable(dateRange);
      if (!isOk(tableResult)) {
        return tableResult;
      }

      return ok(tableDataToCsv(tableResult.value));
    },
  };
}
