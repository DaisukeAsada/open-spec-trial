/**
 * UserController - 利用者管理REST APIコントローラー
 *
 * 利用者管理のREST APIエンドポイントを提供します。
 *
 * エンドポイント:
 * - POST /api/users - 利用者登録
 * - GET /api/users/:id - 利用者詳細取得
 * - GET /api/users/search - 利用者検索
 * - GET /api/users/:id/loans - 利用者の貸出履歴
 */

import { Router, type Request, type Response } from 'express';
import type { UserId } from '../../shared/branded-types.js';
import { isOk } from '../../shared/result.js';
import type { UserService } from './user-service.js';
import type { CreateUserInput, UserSearchCriteria, UserError } from './types.js';

// ============================================
// リクエストボディ型定義
// ============================================

/** 利用者登録リクエストボディ */
interface CreateUserRequestBody {
  name?: string;
  address?: string | null;
  email?: string;
  phone?: string | null;
  loanLimit?: number;
}

// ============================================
// HTTPステータスコード決定
// ============================================

/**
 * UserErrorに基づいてHTTPステータスコードを決定
 */
function getErrorStatusCode(error: UserError): number {
  switch (error.type) {
    case 'VALIDATION_ERROR':
      return 400;
    case 'NOT_FOUND':
      return 404;
    case 'DUPLICATE_EMAIL':
      return 409;
  }
}

// ============================================
// コントローラーファクトリ
// ============================================

/**
 * UserControllerを作成
 * @param userService - UserServiceインスタンス
 * @returns Expressルーター
 */
export function createUserController(userService: UserService): Router {
  const router = Router();

  // ============================================
  // GET /api/users/search - 利用者検索
  // Note: :id より前に定義する必要がある
  // ============================================

  router.get('/search', async (req: Request, res: Response): Promise<void> => {
    // クエリパラメータから検索条件を構築
    const criteria: UserSearchCriteria = {
      ...(typeof req.query.name === 'string' && { name: req.query.name }),
      ...(typeof req.query.userId === 'string' && { userId: req.query.userId }),
      ...(typeof req.query.email === 'string' && { email: req.query.email }),
      ...(typeof req.query.phone === 'string' && { phone: req.query.phone }),
    };

    const result = await userService.searchUsers(criteria);

    if (isOk(result)) {
      res.status(200).json(result.value);
    } else {
      const statusCode = getErrorStatusCode(result.error);
      res.status(statusCode).json({ error: result.error });
    }
  });

  // ============================================
  // POST /api/users - 利用者登録
  // ============================================

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    const body = req.body as CreateUserRequestBody;
    const input: CreateUserInput = {
      name: body.name ?? '',
      address: body.address ?? null,
      email: body.email ?? '',
      phone: body.phone ?? null,
      ...(body.loanLimit !== undefined && { loanLimit: body.loanLimit }),
    };

    const result = await userService.createUser(input);

    if (isOk(result)) {
      res.status(201).json(result.value);
    } else {
      const statusCode = getErrorStatusCode(result.error);
      res.status(statusCode).json({ error: result.error });
    }
  });

  // ============================================
  // GET /api/users/:id - 利用者詳細取得
  // ============================================

  router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id as UserId;

    const result = await userService.getUserById(userId);

    if (isOk(result)) {
      res.status(200).json(result.value);
    } else {
      const statusCode = getErrorStatusCode(result.error);
      res.status(statusCode).json({ error: result.error });
    }
  });

  // ============================================
  // GET /api/users/:id/loans - 利用者の貸出履歴
  // ============================================

  router.get('/:id/loans', async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.id as UserId;

    const result = await userService.getUserWithLoans(userId);

    if (isOk(result)) {
      res.status(200).json(result.value);
    } else {
      const statusCode = getErrorStatusCode(result.error);
      res.status(statusCode).json({ error: result.error });
    }
  });

  return router;
}
