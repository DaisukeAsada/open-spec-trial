/**
 * ReportController - レポート・統計REST APIコントローラー
 *
 * レポート・統計のREST APIエンドポイントを提供します。
 *
 * エンドポイント:
 * - GET /api/reports/summary - 統計サマリー
 * - GET /api/reports/loans - 貸出統計（期間指定）
 * - GET /api/reports/popular - 人気書籍ランキング
 * - GET /api/reports/category - カテゴリ別貸出統計
 * - GET /api/reports/export - CSVエクスポート
 */

import { Router, type Request, type Response } from 'express';
import { isOk } from '../../shared/result.js';
import type { ReportService } from './report-service.js';
import type { DateRange, ReportError } from './types.js';

// ============================================
// リクエストクエリパラメータ型定義
// ============================================

/** 期間指定クエリパラメータ */
interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
}

/** 人気書籍ランキングクエリパラメータ */
interface PopularBooksQuery extends DateRangeQuery {
  limit?: string;
}

/** CSVエクスポートクエリパラメータ */
interface ExportQuery extends DateRangeQuery {
  type?: string;
  limit?: string;
}

// ============================================
// HTTPステータスコード決定
// ============================================

/**
 * ReportErrorに基づいてHTTPステータスコードを決定
 */
function getErrorStatusCode(error: ReportError): number {
  switch (error.type) {
    case 'VALIDATION_ERROR':
    case 'INVALID_DATE_RANGE':
      return 400;
  }
}

// ============================================
// バリデーション
// ============================================

/**
 * 日付文字列を Date オブジェクトに変換
 * @param dateStr - 日付文字列 (YYYY-MM-DD形式)
 * @returns Date オブジェクトまたは null (無効な場合)
 */
function parseDate(dateStr: string | undefined): Date | null {
  if (dateStr === undefined || dateStr === '') {
    return null;
  }
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
}

/**
 * クエリパラメータから DateRange を抽出・検証
 * @param query - クエリパラメータ
 * @returns DateRange または バリデーションエラー
 */
function parseDateRange(
  query: DateRangeQuery
): { success: true; dateRange: DateRange } | { success: false; error: ReportError } {
  const startDate = parseDate(query.startDate);
  const endDate = parseDate(query.endDate);

  if (startDate === null) {
    return {
      success: false,
      error: {
        type: 'VALIDATION_ERROR',
        field: 'startDate',
        message: 'startDateは有効な日付形式（YYYY-MM-DD）で指定してください',
      },
    };
  }

  if (endDate === null) {
    return {
      success: false,
      error: {
        type: 'VALIDATION_ERROR',
        field: 'endDate',
        message: 'endDateは有効な日付形式（YYYY-MM-DD）で指定してください',
      },
    };
  }

  return {
    success: true,
    dateRange: { startDate, endDate },
  };
}

/**
 * 数値文字列をパース
 * @param value - 数値文字列
 * @param defaultValue - デフォルト値
 * @returns パースされた数値
 */
function parseLimit(value: string | undefined, defaultValue: number): number {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  const num = parseInt(value, 10);
  if (isNaN(num) || num <= 0) {
    return defaultValue;
  }
  return num;
}

// ============================================
// コントローラーファクトリ
// ============================================

/**
 * ReportControllerを作成
 * @param reportService - ReportServiceインスタンス
 * @returns Expressルーター
 */
export function createReportController(reportService: ReportService): Router {
  const router = Router();

  // ============================================
  // GET /api/reports/summary - 統計サマリー取得
  // ============================================

  router.get('/summary', async (req: Request, res: Response): Promise<void> => {
    const query = req.query as DateRangeQuery;
    const parseResult = parseDateRange(query);

    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error });
      return;
    }

    const result = await reportService.getStatisticsSummary(parseResult.dateRange);

    if (isOk(result)) {
      res.status(200).json(result.value);
    } else {
      const statusCode = getErrorStatusCode(result.error);
      res.status(statusCode).json({ error: result.error });
    }
  });

  // ============================================
  // GET /api/reports/loans - 貸出統計取得（期間指定）
  // ============================================

  router.get('/loans', async (req: Request, res: Response): Promise<void> => {
    const query = req.query as DateRangeQuery;
    const parseResult = parseDateRange(query);

    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error });
      return;
    }

    const result = await reportService.getStatisticsSummary(parseResult.dateRange);

    if (isOk(result)) {
      res.status(200).json(result.value);
    } else {
      const statusCode = getErrorStatusCode(result.error);
      res.status(statusCode).json({ error: result.error });
    }
  });

  // ============================================
  // GET /api/reports/popular - 人気書籍ランキング取得
  // ============================================

  router.get('/popular', async (req: Request, res: Response): Promise<void> => {
    const query = req.query as PopularBooksQuery;
    const parseResult = parseDateRange(query);

    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error });
      return;
    }

    const limit = parseLimit(query.limit, 10);
    const result = await reportService.getPopularBooksRanking(parseResult.dateRange, limit);

    if (isOk(result)) {
      res.status(200).json(result.value);
    } else {
      const statusCode = getErrorStatusCode(result.error);
      res.status(statusCode).json({ error: result.error });
    }
  });

  // ============================================
  // GET /api/reports/category - カテゴリ別貸出統計取得
  // ============================================

  router.get('/category', async (req: Request, res: Response): Promise<void> => {
    const query = req.query as DateRangeQuery;
    const parseResult = parseDateRange(query);

    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error });
      return;
    }

    const result = await reportService.getCategoryStatistics(parseResult.dateRange);

    if (isOk(result)) {
      res.status(200).json(result.value);
    } else {
      const statusCode = getErrorStatusCode(result.error);
      res.status(statusCode).json({ error: result.error });
    }
  });

  // ============================================
  // GET /api/reports/export - CSVエクスポート
  // ============================================

  router.get('/export', async (req: Request, res: Response): Promise<void> => {
    const query = req.query as ExportQuery;
    const parseResult = parseDateRange(query);

    if (!parseResult.success) {
      res.status(400).json({ error: parseResult.error });
      return;
    }

    const exportType = query.type;

    // type パラメータのバリデーション
    if (exportType === undefined || exportType === '') {
      res.status(400).json({
        error: {
          type: 'VALIDATION_ERROR',
          field: 'type',
          message: 'typeパラメータを指定してください（summary, popular, category）',
        },
      });
      return;
    }

    const validTypes = ['summary', 'popular', 'category'];
    if (!validTypes.includes(exportType)) {
      res.status(400).json({
        error: {
          type: 'VALIDATION_ERROR',
          field: 'type',
          message: 'typeパラメータは summary, popular, category のいずれかを指定してください',
        },
      });
      return;
    }

    // タイプに応じたCSVエクスポート
    let csvResult;
    let filename: string;
    const limit = parseLimit(query.limit, 10);

    switch (exportType) {
      case 'summary':
        csvResult = await reportService.exportStatisticsSummaryToCsv(parseResult.dateRange);
        filename = 'statistics-summary.csv';
        break;
      case 'popular':
        csvResult = await reportService.exportPopularBooksRankingToCsv(
          parseResult.dateRange,
          limit
        );
        filename = 'popular-books.csv';
        break;
      case 'category':
        csvResult = await reportService.exportCategoryStatisticsToCsv(parseResult.dateRange);
        filename = 'category-statistics.csv';
        break;
      default:
        // ここには到達しないはず
        res.status(400).json({
          error: {
            type: 'VALIDATION_ERROR',
            field: 'type',
            message: 'typeパラメータが不正です',
          },
        });
        return;
    }

    if (isOk(csvResult)) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csvResult.value);
    } else {
      const statusCode = getErrorStatusCode(csvResult.error);
      res.status(statusCode).json({ error: csvResult.error });
    }
  });

  return router;
}
