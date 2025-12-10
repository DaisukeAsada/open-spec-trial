/**
 * Reservation Domain - 型定義
 *
 * 予約管理ドメインの型定義を提供します。
 */

import type { ReservationId, UserId, BookId } from '../../shared/branded-types.js';

// ============================================
// 予約ステータス型定義
// ============================================

/** 予約ステータス */
export type ReservationStatus =
  | 'PENDING' // 予約待ち
  | 'NOTIFIED' // 通知済み（返却されて利用可能）
  | 'FULFILLED' // 貸出完了
  | 'EXPIRED' // 有効期限切れ
  | 'CANCELLED'; // キャンセル

// ============================================
// 予約型定義
// ============================================

/** 予約 */
export interface Reservation {
  readonly id: ReservationId;
  readonly userId: UserId;
  readonly bookId: BookId;
  readonly reservedAt: Date;
  readonly notifiedAt: Date | null;
  readonly expiresAt: Date | null;
  readonly status: ReservationStatus;
  /** 予約キュー内の順番（1始まり） */
  readonly queuePosition: number;
}

/** 予約作成入力 */
export interface CreateReservationInput {
  readonly userId: UserId;
  readonly bookId: BookId;
}

// ============================================
// エラー型定義
// ============================================

/** 予約ドメインエラー */
export type ReservationError =
  | {
      readonly type: 'VALIDATION_ERROR';
      readonly field: string;
      readonly message: string;
    }
  | { readonly type: 'BOOK_AVAILABLE'; readonly bookId: string }
  | {
      readonly type: 'ALREADY_RESERVED';
      readonly userId: string;
      readonly bookId: string;
    }
  | { readonly type: 'RESERVATION_NOT_FOUND'; readonly reservationId: string }
  | { readonly type: 'BOOK_NOT_FOUND'; readonly bookId: string }
  | { readonly type: 'USER_NOT_FOUND'; readonly userId: string };
