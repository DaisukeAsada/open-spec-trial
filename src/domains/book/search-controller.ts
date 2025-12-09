/**
 * SearchController - 検索REST APIコントローラー
 *
 * 蔵書検索のREST APIエンドポイントを提供します。
 *
 * エンドポイント:
 * - GET /api/books/search - 検索実行（クエリパラメータ対応）
 *
 * Task 3.3: 検索 REST API エンドポイント
 * Requirements: 2.1, 2.3
 */

import { Router, type Request, type Response } from 'express';
import { isOk } from '../../shared/result.js';
import type { SearchService, SearchInput } from './search-service.js';
import type { SearchSortBy, SearchSortOrder } from './search-repository.js';

// ============================================
// 定数
// ============================================

/** デフォルトのページ番号 */
const DEFAULT_PAGE = 1;

/** デフォルトのページサイズ */
const DEFAULT_LIMIT = 20;

/** 最大ページサイズ */
const MAX_LIMIT = 100;

// ============================================
// ヘルパー関数
// ============================================

/**
 * クエリパラメータを数値に変換
 */
function parseIntParam(value: string | undefined, defaultValue: number): number {
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * クエリパラメータを真偽値に変換
 */
function parseBoolParam(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  return value === 'true';
}

/**
 * ソートフィールドのバリデーション
 */
function parseSearchSortBy(value: string | undefined): SearchSortBy | undefined {
  if (value === 'title' || value === 'author' || value === 'publicationYear') {
    return value;
  }
  return undefined;
}

/**
 * ソート順序のバリデーション
 */
function parseSearchSortOrder(value: string | undefined): SearchSortOrder | undefined {
  if (value === 'asc' || value === 'desc') {
    return value;
  }
  return undefined;
}

// ============================================
// レスポンス型定義
// ============================================

/** ページネーション付き検索レスポンス */
interface SearchResponse {
  readonly books: readonly unknown[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

// ============================================
// コントローラーファクトリ
// ============================================

/**
 * SearchControllerを作成
 * @param searchService - SearchServiceインスタンス
 * @returns Expressルーター
 */
export function createSearchController(searchService: SearchService): Router {
  const router = Router();

  // ============================================
  // GET /search - 検索実行
  // ============================================

  router.get('/search', async (req: Request, res: Response): Promise<void> => {
    // クエリパラメータの取得とパース
    const keyword = typeof req.query['keyword'] === 'string' ? req.query['keyword'] : '';
    const sortBy = parseSearchSortBy(req.query['sortBy'] as string | undefined);
    const sortOrder = parseSearchSortOrder(req.query['sortOrder'] as string | undefined);
    const publicationYearFrom = parseIntParam(req.query['publicationYearFrom'] as string | undefined, NaN);
    const publicationYearTo = parseIntParam(req.query['publicationYearTo'] as string | undefined, NaN);
    const category = typeof req.query['category'] === 'string' ? req.query['category'] : undefined;
    const availableOnly = parseBoolParam(req.query['availableOnly'] as string | undefined);

    // ページネーションパラメータ
    const page = Math.max(1, parseIntParam(req.query['page'] as string | undefined, DEFAULT_PAGE));
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseIntParam(req.query['limit'] as string | undefined, DEFAULT_LIMIT)));

    // SearchInput の構築
    const input: SearchInput = {
      keyword,
      ...(sortBy !== undefined && { sortBy }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(!isNaN(publicationYearFrom) && { publicationYearFrom }),
      ...(!isNaN(publicationYearTo) && { publicationYearTo }),
      ...(category !== undefined && { category }),
      ...(availableOnly !== undefined && { availableOnly }),
    };

    const result = await searchService.search(input);

    if (isOk(result)) {
      const { books, total } = result.value;
      const totalPages = Math.ceil(total / limit);

      const response: SearchResponse = {
        books,
        total,
        page,
        limit,
        totalPages,
      };

      res.status(200).json(response);
    }
    // SearchService.search は never エラーを返すため、else ブランチは到達不可能
  });

  return router;
}
