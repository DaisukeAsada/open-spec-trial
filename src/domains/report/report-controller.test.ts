/**
 * ReportController - テスト
 *
 * レポート・統計REST APIコントローラーのユニットテスト
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';
import type { ReportService } from './report-service.js';
import type {
  DateRange,
  StatisticsSummary,
  PopularBooksRanking,
  CategoryStatistics,
  ReportError,
} from './types.js';
import { ok, err } from '../../shared/result.js';
import { createReportController } from './report-controller.js';
import type { BookId } from '../../shared/branded-types.js';

// ============================================
// モックサービスファクトリ
// ============================================

function createMockReportService(): ReportService {
  return {
    getStatisticsSummary: vi.fn(),
    getPopularBooksRanking: vi.fn(),
    getCategoryStatistics: vi.fn(),
    exportStatisticsSummaryToCsv: vi.fn(),
    exportPopularBooksRankingToCsv: vi.fn(),
    exportCategoryStatisticsToCsv: vi.fn(),
    formatStatisticsSummaryAsTable: vi.fn(),
    formatPopularBooksRankingAsTable: vi.fn(),
    formatCategoryStatisticsAsTable: vi.fn(),
  };
}

// ============================================
// テスト用ヘルパー
// ============================================

function createTestApp(reportService: ReportService): Express {
  const app = express();
  app.use(express.json());
  app.use('/api/reports', createReportController(reportService));
  return app;
}

function createTestDateRange(): DateRange {
  return {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
  };
}

// ============================================
// GET /api/reports/summary - 統計サマリー取得
// ============================================

describe('GET /api/reports/summary', () => {
  let mockService: ReportService;
  let app: Express;

  beforeEach(() => {
    mockService = createMockReportService();
    app = createTestApp(mockService);
  });

  it('統計サマリーを正常に取得できる', async () => {
    const dateRange = createTestDateRange();
    const summary: StatisticsSummary = {
      loanCount: 150,
      returnCount: 120,
      overdueCount: 10,
      dateRange,
    };

    vi.mocked(mockService.getStatisticsSummary).mockResolvedValue(ok(summary));

    const response = await request(app)
      .get('/api/reports/summary')
      .query({ startDate: '2024-01-01', endDate: '2024-12-31' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      loanCount: 150,
      returnCount: 120,
      overdueCount: 10,
    });
  });

  it('期間パラメータが不正な場合は400を返す', async () => {
    const response = await request(app).get('/api/reports/summary').query({ startDate: 'invalid' });

    expect(response.status).toBe(400);
    expect(response.body.error.type).toBe('VALIDATION_ERROR');
  });

  it('startDateが未指定の場合は400を返す', async () => {
    const response = await request(app)
      .get('/api/reports/summary')
      .query({ endDate: '2024-12-31' });

    expect(response.status).toBe(400);
    expect(response.body.error.type).toBe('VALIDATION_ERROR');
  });

  it('endDateが未指定の場合は400を返す', async () => {
    const response = await request(app)
      .get('/api/reports/summary')
      .query({ startDate: '2024-01-01' });

    expect(response.status).toBe(400);
    expect(response.body.error.type).toBe('VALIDATION_ERROR');
  });

  it('サービスエラー時は400を返す', async () => {
    const error: ReportError = {
      type: 'INVALID_DATE_RANGE',
      message: '開始日は終了日より前である必要があります',
    };

    vi.mocked(mockService.getStatisticsSummary).mockResolvedValue(err(error));

    const response = await request(app)
      .get('/api/reports/summary')
      .query({ startDate: '2024-12-31', endDate: '2024-01-01' });

    expect(response.status).toBe(400);
    expect(response.body.error.type).toBe('INVALID_DATE_RANGE');
  });
});

// ============================================
// GET /api/reports/loans - 貸出統計取得
// ============================================

describe('GET /api/reports/loans', () => {
  let mockService: ReportService;
  let app: Express;

  beforeEach(() => {
    mockService = createMockReportService();
    app = createTestApp(mockService);
  });

  it('貸出統計を正常に取得できる', async () => {
    const dateRange = createTestDateRange();
    const summary: StatisticsSummary = {
      loanCount: 150,
      returnCount: 120,
      overdueCount: 10,
      dateRange,
    };

    vi.mocked(mockService.getStatisticsSummary).mockResolvedValue(ok(summary));

    const response = await request(app)
      .get('/api/reports/loans')
      .query({ startDate: '2024-01-01', endDate: '2024-12-31' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      loanCount: 150,
      returnCount: 120,
      overdueCount: 10,
    });
  });

  it('期間パラメータが不正な場合は400を返す', async () => {
    const response = await request(app)
      .get('/api/reports/loans')
      .query({ startDate: 'invalid', endDate: '2024-12-31' });

    expect(response.status).toBe(400);
    expect(response.body.error.type).toBe('VALIDATION_ERROR');
  });
});

// ============================================
// GET /api/reports/popular - 人気書籍ランキング取得
// ============================================

describe('GET /api/reports/popular', () => {
  let mockService: ReportService;
  let app: Express;

  beforeEach(() => {
    mockService = createMockReportService();
    app = createTestApp(mockService);
  });

  it('人気書籍ランキングを正常に取得できる', async () => {
    const dateRange = createTestDateRange();
    const ranking: PopularBooksRanking = {
      items: [
        {
          bookId: 'book-1' as BookId,
          title: '人気の本',
          author: '著者A',
          loanCount: 50,
          rank: 1,
        },
        {
          bookId: 'book-2' as BookId,
          title: '次に人気の本',
          author: '著者B',
          loanCount: 30,
          rank: 2,
        },
      ],
      dateRange,
    };

    vi.mocked(mockService.getPopularBooksRanking).mockResolvedValue(ok(ranking));

    const response = await request(app)
      .get('/api/reports/popular')
      .query({ startDate: '2024-01-01', endDate: '2024-12-31', limit: '10' });

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(2);
    expect(response.body.items[0].title).toBe('人気の本');
    expect(response.body.items[0].rank).toBe(1);
  });

  it('limitパラメータが未指定の場合はデフォルト10件', async () => {
    const dateRange = createTestDateRange();
    const ranking: PopularBooksRanking = {
      items: [],
      dateRange,
    };

    vi.mocked(mockService.getPopularBooksRanking).mockResolvedValue(ok(ranking));

    await request(app)
      .get('/api/reports/popular')
      .query({ startDate: '2024-01-01', endDate: '2024-12-31' });

    expect(mockService.getPopularBooksRanking).toHaveBeenCalledWith(
      expect.any(Object),
      10 // デフォルト値
    );
  });

  it('limitパラメータで取得件数を指定できる', async () => {
    const dateRange = createTestDateRange();
    const ranking: PopularBooksRanking = {
      items: [],
      dateRange,
    };

    vi.mocked(mockService.getPopularBooksRanking).mockResolvedValue(ok(ranking));

    await request(app)
      .get('/api/reports/popular')
      .query({ startDate: '2024-01-01', endDate: '2024-12-31', limit: '5' });

    expect(mockService.getPopularBooksRanking).toHaveBeenCalledWith(expect.any(Object), 5);
  });

  it('サービスエラー時は400を返す', async () => {
    const error: ReportError = {
      type: 'INVALID_DATE_RANGE',
      message: '開始日は終了日より前である必要があります',
    };

    vi.mocked(mockService.getPopularBooksRanking).mockResolvedValue(err(error));

    const response = await request(app)
      .get('/api/reports/popular')
      .query({ startDate: '2024-12-31', endDate: '2024-01-01' });

    expect(response.status).toBe(400);
    expect(response.body.error.type).toBe('INVALID_DATE_RANGE');
  });
});

// ============================================
// GET /api/reports/export - CSVエクスポート
// ============================================

describe('GET /api/reports/export', () => {
  let mockService: ReportService;
  let app: Express;

  beforeEach(() => {
    mockService = createMockReportService();
    app = createTestApp(mockService);
  });

  it('統計サマリーをCSVエクスポートできる（type=summary）', async () => {
    const csvContent = '項目,件数\n貸出数,150\n返却数,120\n延滞数,10';

    vi.mocked(mockService.exportStatisticsSummaryToCsv).mockResolvedValue(ok(csvContent));

    const response = await request(app)
      .get('/api/reports/export')
      .query({ startDate: '2024-01-01', endDate: '2024-12-31', type: 'summary' });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toContain('attachment');
    expect(response.text).toContain('貸出数,150');
  });

  it('人気書籍ランキングをCSVエクスポートできる（type=popular）', async () => {
    const csvContent = '順位,タイトル,著者,貸出回数\n1,人気の本,著者A,50';

    vi.mocked(mockService.exportPopularBooksRankingToCsv).mockResolvedValue(ok(csvContent));

    const response = await request(app)
      .get('/api/reports/export')
      .query({ startDate: '2024-01-01', endDate: '2024-12-31', type: 'popular', limit: '10' });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.text).toContain('人気の本');
  });

  it('カテゴリ別統計をCSVエクスポートできる（type=category）', async () => {
    const csvContent = 'カテゴリ,貸出回数,割合(%)\n小説,100,50.00';

    vi.mocked(mockService.exportCategoryStatisticsToCsv).mockResolvedValue(ok(csvContent));

    const response = await request(app)
      .get('/api/reports/export')
      .query({ startDate: '2024-01-01', endDate: '2024-12-31', type: 'category' });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.text).toContain('小説');
  });

  it('typeパラメータが未指定の場合は400を返す', async () => {
    const response = await request(app)
      .get('/api/reports/export')
      .query({ startDate: '2024-01-01', endDate: '2024-12-31' });

    expect(response.status).toBe(400);
    expect(response.body.error.type).toBe('VALIDATION_ERROR');
  });

  it('typeパラメータが不正な場合は400を返す', async () => {
    const response = await request(app)
      .get('/api/reports/export')
      .query({ startDate: '2024-01-01', endDate: '2024-12-31', type: 'invalid' });

    expect(response.status).toBe(400);
    expect(response.body.error.type).toBe('VALIDATION_ERROR');
  });

  it('サービスエラー時は400を返す', async () => {
    const error: ReportError = {
      type: 'INVALID_DATE_RANGE',
      message: '開始日は終了日より前である必要があります',
    };

    vi.mocked(mockService.exportStatisticsSummaryToCsv).mockResolvedValue(err(error));

    const response = await request(app)
      .get('/api/reports/export')
      .query({ startDate: '2024-12-31', endDate: '2024-01-01', type: 'summary' });

    expect(response.status).toBe(400);
    expect(response.body.error.type).toBe('INVALID_DATE_RANGE');
  });
});

// ============================================
// カテゴリ別統計取得
// ============================================

describe('GET /api/reports/category', () => {
  let mockService: ReportService;
  let app: Express;

  beforeEach(() => {
    mockService = createMockReportService();
    app = createTestApp(mockService);
  });

  it('カテゴリ別貸出統計を正常に取得できる', async () => {
    const dateRange = createTestDateRange();
    const stats: CategoryStatistics = {
      items: [
        { category: '小説', loanCount: 100, percentage: 50 },
        { category: '技術書', loanCount: 60, percentage: 30 },
        { category: '雑誌', loanCount: 40, percentage: 20 },
      ],
      totalLoanCount: 200,
      dateRange,
    };

    vi.mocked(mockService.getCategoryStatistics).mockResolvedValue(ok(stats));

    const response = await request(app)
      .get('/api/reports/category')
      .query({ startDate: '2024-01-01', endDate: '2024-12-31' });

    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(3);
    expect(response.body.totalLoanCount).toBe(200);
    expect(response.body.items[0].category).toBe('小説');
  });

  it('期間パラメータが不正な場合は400を返す', async () => {
    const response = await request(app)
      .get('/api/reports/category')
      .query({ startDate: 'invalid', endDate: '2024-12-31' });

    expect(response.status).toBe(400);
    expect(response.body.error.type).toBe('VALIDATION_ERROR');
  });
});
