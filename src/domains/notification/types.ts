/**
 * Notification Domain - 型定義
 *
 * 通知管理ドメインの型定義を提供します。
 */

import type { BookId, LoanId, UserId } from '../../shared/branded-types.js';

// ============================================
// 通知ジョブ種別
// ============================================

/** 通知タイプ */
export type NotificationType =
  | 'RESERVATION_AVAILABLE' // 予約書籍の貸出可能通知
  | 'OVERDUE_REMINDER'; // 延滞リマインダー

// ============================================
// 通知ジョブ型定義
// ============================================

/** 予約書籍貸出可能通知ジョブデータ */
export interface ReservationAvailableJobData {
  readonly type: 'RESERVATION_AVAILABLE';
  readonly userId: UserId;
  readonly bookId: BookId;
  readonly timestamp: Date;
}

/** 延滞リマインダー通知ジョブデータ */
export interface OverdueReminderJobData {
  readonly type: 'OVERDUE_REMINDER';
  readonly userId: UserId;
  readonly loanId: LoanId;
  readonly timestamp: Date;
}

/** 通知ジョブデータ（ユニオン型） */
export type NotificationJobData = ReservationAvailableJobData | OverdueReminderJobData;

// ============================================
// ジョブ状態型定義
// ============================================

/** ジョブステータス */
export type JobStatus =
  | 'PENDING' // 待機中
  | 'PROCESSING' // 処理中
  | 'COMPLETED' // 完了
  | 'FAILED'; // 失敗

/** ジョブ情報 */
export interface NotificationJob {
  readonly id: string;
  readonly data: NotificationJobData;
  readonly status: JobStatus;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly createdAt: Date;
  readonly processedAt: Date | null;
  readonly failedReason: string | null;
}

// ============================================
// エラー型定義
// ============================================

/** 通知ドメインエラー */
export type NotificationError =
  | {
      readonly type: 'QUEUE_ERROR';
      readonly message: string;
    }
  | {
      readonly type: 'SEND_ERROR';
      readonly message: string;
      readonly attempts: number;
    }
  | {
      readonly type: 'JOB_NOT_FOUND';
      readonly jobId: string;
    };

// ============================================
// 設定型定義
// ============================================

/** 通知キュー設定 */
export interface NotificationQueueConfig {
  /** Redis接続URL */
  readonly redisUrl: string;
  /** 最大リトライ回数（デフォルト: 3） */
  readonly maxRetries: number;
  /** リトライ間隔（ミリ秒） */
  readonly retryDelay: number;
}
