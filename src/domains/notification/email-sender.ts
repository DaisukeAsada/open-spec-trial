/**
 * EmailSender - メール送信機能
 *
 * メール通知の送信と履歴記録を提供します。
 */

import type { Result } from '../../shared/result.js';
import { ok, err } from '../../shared/result.js';
import type { UserId } from '../../shared/branded-types.js';
import type { NotificationJobData, NotificationError, NotificationType } from './types.js';

// ============================================
// メール送信インターフェース
// ============================================

/** メールデータ */
export interface EmailData {
  readonly to: string;
  readonly subject: string;
  readonly body: string;
}

/** EmailSender インターフェース */
export interface EmailSender {
  /**
   * メールを送信
   * @param email - メールデータ
   * @returns 成功またはエラー
   */
  send(email: EmailData): Promise<Result<void, NotificationError>>;
}

// ============================================
// 通知履歴インターフェース
// ============================================

/** 通知履歴レコード */
export interface NotificationHistoryRecord {
  readonly id: string;
  readonly jobId: string;
  readonly type: NotificationType;
  readonly userId: UserId;
  readonly recipientEmail: string;
  readonly subject: string;
  readonly sentAt: Date;
  readonly success: boolean;
  readonly errorMessage: string | null;
}

/** NotificationHistoryRepository インターフェース */
export interface NotificationHistoryRepository {
  /**
   * 通知履歴を保存
   * @param record - 通知履歴レコード
   * @returns 成功またはエラー
   */
  save(record: NotificationHistoryRecord): Promise<Result<void, NotificationError>>;

  /**
   * ユーザーIDで通知履歴を検索
   * @param userId - ユーザーID
   * @returns 履歴レコードの配列またはエラー
   */
  findByUserId(userId: UserId): Promise<Result<NotificationHistoryRecord[], NotificationError>>;
}

// ============================================
// モック実装（テスト用）
// ============================================

/** モックEmailSender設定 */
export interface MockEmailSenderConfig {
  readonly shouldFail?: boolean;
}

/**
 * テスト用のモック EmailSender を作成
 * @param config - オプション設定
 * @returns EmailSender & 送信済みメール取得機能
 */
export function createMockEmailSender(
  config?: MockEmailSenderConfig
): EmailSender & { getSentEmails: () => EmailData[] } {
  const sentEmails: EmailData[] = [];
  const shouldFail = config?.shouldFail ?? false;

  return {
    send(email: EmailData): Promise<Result<void, NotificationError>> {
      if (shouldFail) {
        return Promise.resolve(
          err({
            type: 'SEND_ERROR',
            message: 'Mock email send failure',
            attempts: 1,
          })
        );
      }
      sentEmails.push(email);
      return Promise.resolve(ok(undefined));
    },

    getSentEmails(): EmailData[] {
      return [...sentEmails];
    },
  };
}

/**
 * テスト用のモック NotificationHistoryRepository を作成
 * @returns NotificationHistoryRepository
 */
export function createMockNotificationHistoryRepository(): NotificationHistoryRepository {
  const records: NotificationHistoryRecord[] = [];

  return {
    save(record: NotificationHistoryRecord): Promise<Result<void, NotificationError>> {
      records.push(record);
      return Promise.resolve(ok(undefined));
    },

    findByUserId(userId: UserId): Promise<Result<NotificationHistoryRecord[], NotificationError>> {
      const filtered = records.filter((r) => r.userId === userId);
      return Promise.resolve(ok(filtered));
    },
  };
}

// ============================================
// メール通知プロセッサ
// ============================================

/** ユーザー情報 */
export interface UserInfo {
  readonly email: string;
  readonly name: string;
}

/** 書籍情報 */
export interface BookInfo {
  readonly title: string;
}

/** 貸出情報 */
export interface LoanInfo {
  readonly bookTitle: string;
  readonly dueDate: Date;
}

/** EmailNotificationProcessor の依存関係 */
export interface EmailNotificationProcessorDeps {
  readonly emailSender: EmailSender;
  readonly historyRepository: NotificationHistoryRepository;
  readonly userLookup: (userId: string) => Promise<UserInfo | undefined>;
  readonly bookLookup: (bookId: string) => Promise<BookInfo | undefined>;
  readonly loanLookup?: (loanId: string) => Promise<LoanInfo | undefined>;
}

/**
 * メール通知プロセッサを作成
 * @param deps - 依存関係
 * @returns ジョブプロセッサ関数
 */
export function createEmailNotificationProcessor(
  deps: EmailNotificationProcessorDeps
): (data: NotificationJobData) => Promise<Result<void, NotificationError>> {
  const { emailSender, historyRepository, userLookup, bookLookup, loanLookup } = deps;

  return async (data: NotificationJobData): Promise<Result<void, NotificationError>> => {
    // ユーザー情報を取得
    const user = await userLookup(data.userId);
    if (user === undefined) {
      return err({
        type: 'SEND_ERROR',
        message: `User not found: ${String(data.userId)}`,
        attempts: 1,
      });
    }

    let subject: string;
    let body: string;
    const jobId = `email-${String(Date.now())}-${Math.random().toString(36).substring(2, 9)}`;

    if (data.type === 'RESERVATION_AVAILABLE') {
      // 書籍情報を取得
      const book = await bookLookup(data.bookId);
      if (book === undefined) {
        return err({
          type: 'SEND_ERROR',
          message: `Book not found: ${String(data.bookId)}`,
          attempts: 1,
        });
      }

      subject = `【図書館】予約書籍「${book.title}」が貸出可能になりました`;
      body = `${user.name} 様\n\nご予約いただいた書籍「${book.title}」が返却され、貸出可能になりました。\n\n予約有効期限は7日間です。お早めにご来館ください。\n\n図書館`;
    } else {
      // OVERDUE_REMINDER
      if (loanLookup === undefined) {
        return err({
          type: 'SEND_ERROR',
          message: 'Loan lookup function not provided',
          attempts: 1,
        });
      }

      const loan = await loanLookup(data.loanId);
      if (loan === undefined) {
        return err({
          type: 'SEND_ERROR',
          message: `Loan not found: ${String(data.loanId)}`,
          attempts: 1,
        });
      }

      subject = `【図書館】延滞のお知らせ - 「${loan.bookTitle}」`;
      body = `${user.name} 様\n\n貸出中の書籍「${loan.bookTitle}」の返却期限（${loan.dueDate.toLocaleDateString('ja-JP')}）を過ぎております。\n\nお早めにご返却ください。\n\n図書館`;
    }

    // メールを送信
    const sendResult = await emailSender.send({
      to: user.email,
      subject,
      body,
    });

    // 履歴を記録
    const errorMessage: string | null = sendResult.success
      ? null
      : 'message' in sendResult.error
        ? sendResult.error.message
        : 'Unknown error';
    const historyRecord: NotificationHistoryRecord = {
      id: `history-${jobId}`,
      jobId,
      type: data.type,
      userId: data.userId,
      recipientEmail: user.email,
      subject,
      sentAt: new Date(),
      success: sendResult.success,
      errorMessage,
    };
    await historyRepository.save(historyRecord);

    if (!sendResult.success) {
      return sendResult;
    }

    return ok(undefined);
  };
}
