/**
 * NotificationService - 通知サービス
 *
 * 非同期通知の送信を提供します。
 */

import type { Result } from '../../shared/result.js';
import type { BookId, LoanId, UserId } from '../../shared/branded-types.js';
import type { NotificationQueue, JobStatusInfo } from './notification-queue.js';
import type { NotificationError } from './types.js';

// ============================================
// サービスインターフェース
// ============================================

/** NotificationService インターフェース */
export interface NotificationService {
  /**
   * 予約書籍の貸出可能通知を送信
   * @param userId - 利用者ID
   * @param bookId - 書籍ID
   * @returns 成功またはエラー
   */
  sendReservationAvailable(
    userId: UserId,
    bookId: BookId
  ): Promise<Result<void, NotificationError>>;

  /**
   * 延滞リマインダー通知を送信
   * @param userId - 利用者ID
   * @param loanId - 貸出ID
   * @returns 成功またはエラー
   */
  sendOverdueReminder(userId: UserId, loanId: LoanId): Promise<Result<void, NotificationError>>;

  /**
   * ジョブのステータスを取得
   * @param jobId - ジョブID
   * @returns ジョブステータス情報またはエラー
   */
  getJobStatus(jobId: string): Promise<Result<JobStatusInfo, NotificationError>>;
}

// ============================================
// サービス実装
// ============================================

/**
 * NotificationService を作成
 * @param queue - 通知キュー
 * @returns NotificationService
 */
export function createNotificationService(queue: NotificationQueue): NotificationService {
  return {
    async sendReservationAvailable(
      userId: UserId,
      bookId: BookId
    ): Promise<Result<void, NotificationError>> {
      const result = await queue.enqueue({
        type: 'RESERVATION_AVAILABLE',
        userId,
        bookId,
        timestamp: new Date(),
      });

      if (!result.success) {
        return result;
      }

      return { success: true, value: undefined };
    },

    async sendOverdueReminder(
      userId: UserId,
      loanId: LoanId
    ): Promise<Result<void, NotificationError>> {
      const result = await queue.enqueue({
        type: 'OVERDUE_REMINDER',
        userId,
        loanId,
        timestamp: new Date(),
      });

      if (!result.success) {
        return result;
      }

      return { success: true, value: undefined };
    },

    async getJobStatus(jobId: string): Promise<Result<JobStatusInfo, NotificationError>> {
      return queue.getJobStatus(jobId);
    },
  };
}
