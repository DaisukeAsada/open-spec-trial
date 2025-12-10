/**
 * Loan Repository Interface
 *
 * 貸出データの永続化を担当するリポジトリのインターフェース定義。
 * 具体的な実装は Infrastructure 層で行います。
 */

import type { LoanId, UserId, CopyId } from '../../shared/branded-types.js';
import type { Result } from '../../shared/result.js';
import type { Loan, CreateLoanInput, LoanError } from './types.js';

// ============================================
// リポジトリインターフェース
// ============================================

/** 貸出リポジトリ */
export interface LoanRepository {
  /**
   * 新しい貸出を作成
   * @param input - 貸出作成入力
   * @param dueDate - 返却期限
   * @returns 作成された貸出またはエラー
   */
  create(input: CreateLoanInput, dueDate: Date): Promise<Result<Loan, LoanError>>;

  /**
   * IDで貸出を取得
   * @param id - 貸出ID
   * @returns 貸出またはNOT_FOUNDエラー
   */
  findById(id: LoanId): Promise<Result<Loan, LoanError>>;

  /**
   * ユーザーのアクティブな貸出数を取得
   * @param userId - ユーザーID
   * @returns アクティブな貸出数
   */
  countActiveLoans(userId: UserId): Promise<number>;

  /**
   * ユーザーのアクティブな貸出一覧を取得
   * @param userId - ユーザーID
   * @returns アクティブな貸出一覧
   */
  findActiveByUserId(userId: UserId): Promise<Loan[]>;

  /**
   * 蔵書コピーIDでアクティブな貸出を検索
   * @param copyId - 蔵書コピーID
   * @returns アクティブな貸出またはnull
   */
  findActiveByCopyId(copyId: CopyId): Promise<Loan | null>;

  /**
   * 複数の蔵書コピーIDでアクティブな貸出を一括検索
   * @param copyIds - 蔵書コピーIDの配列
   * @returns アクティブな貸出の配列
   */
  findActiveByMultipleCopyIds(copyIds: readonly CopyId[]): Promise<Loan[]>;

  /**
   * 貸出を更新（返却処理用）
   * @param id - 貸出ID
   * @param returnedAt - 返却日
   * @returns 更新された貸出またはエラー
   */
  updateReturnedAt(id: LoanId, returnedAt: Date): Promise<Result<Loan, LoanError>>;
}
