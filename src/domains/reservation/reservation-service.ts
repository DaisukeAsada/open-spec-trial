/**
 * ReservationService - 予約管理サービス
 *
 * 予約の作成・キャンセル処理を提供します。
 */

import type { Result } from '../../shared/result.js';
import { err } from '../../shared/result.js';
import type { ReservationRepository } from './reservation-repository.js';
import type { BookRepository } from '../book/book-repository.js';
import type { UserRepository } from '../user/user-repository.js';
import type { Reservation, CreateReservationInput, ReservationError } from './types.js';

// ============================================
// サービスインターフェース
// ============================================

/** ReservationService インターフェース */
export interface ReservationService {
  /**
   * 新しい予約を作成
   * 貸出中の書籍に対してのみ予約可能
   * @param input - 予約作成入力（userId, bookId）
   * @returns 作成された予約またはエラー
   */
  createReservation(input: CreateReservationInput): Promise<Result<Reservation, ReservationError>>;
}

// ============================================
// サービス実装
// ============================================

/** ReservationService 実装を作成 */
export function createReservationService(
  reservationRepository: ReservationRepository,
  bookRepository: Pick<BookRepository, 'findById' | 'findCopiesByBookId'>,
  userRepository: Pick<UserRepository, 'findById'>
): ReservationService {
  return {
    async createReservation(
      input: CreateReservationInput
    ): Promise<Result<Reservation, ReservationError>> {
      const { userId, bookId } = input;

      // 1. 利用者の存在確認
      const userResult = await userRepository.findById(userId);
      if (!userResult.success) {
        return err({
          type: 'USER_NOT_FOUND',
          userId: userId,
        });
      }

      // 2. 書籍の存在確認
      const bookResult = await bookRepository.findById(bookId);
      if (!bookResult.success) {
        return err({
          type: 'BOOK_NOT_FOUND',
          bookId: bookId,
        });
      }

      // 3. 同一ユーザーによる同一書籍への重複予約チェック
      const hasExisting = await reservationRepository.hasActiveReservation(userId, bookId);
      if (hasExisting) {
        return err({
          type: 'ALREADY_RESERVED',
          userId: userId,
          bookId: bookId,
        });
      }

      // 4. 書籍の蔵書コピーの状態を確認（すべて貸出可能なら予約不可）
      const copiesResult = await bookRepository.findCopiesByBookId(bookId);
      if (!copiesResult.success) {
        return err({
          type: 'BOOK_NOT_FOUND',
          bookId: bookId,
        });
      }
      const copies = copiesResult.value;

      // すべてのコピーが AVAILABLE なら予約不可（貸出可能な本は予約できない）
      const hasAvailableCopy = copies.some((copy) => copy.status === 'AVAILABLE');
      if (hasAvailableCopy) {
        return err({
          type: 'BOOK_AVAILABLE',
          bookId: bookId,
        });
      }

      // 5. 予約キュー内の順番を計算（既存の予約数 + 1）
      const currentQueueCount = await reservationRepository.countActiveByBookId(bookId);
      const queuePosition = currentQueueCount + 1;

      // 6. 予約を作成
      const reservationResult = await reservationRepository.create(input, queuePosition);

      return reservationResult;
    },
  };
}
