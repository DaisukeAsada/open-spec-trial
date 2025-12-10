/**
 * Notification Domain - 公開API
 *
 * 通知ドメインの公開インターフェースを提供します。
 */

// 型のエクスポート
export type {
  NotificationType,
  NotificationJobData,
  ReservationAvailableJobData,
  OverdueReminderJobData,
  JobStatus,
  NotificationJob,
  NotificationError,
  NotificationQueueConfig,
} from './types.js';

// キューのエクスポート
export type { NotificationQueue, JobStatusInfo, JobProcessor } from './notification-queue.js';
export {
  createNotificationQueue,
  createMockNotificationQueue,
  createNotificationWorker,
} from './notification-queue.js';

// サービスのエクスポート
export type { NotificationService } from './notification-service.js';
export { createNotificationService } from './notification-service.js';

// メール送信のエクスポート
export type {
  EmailData,
  EmailSender,
  NotificationHistoryRecord,
  NotificationHistoryRepository,
  UserInfo,
  BookInfo,
  LoanInfo,
  EmailNotificationProcessorDeps,
} from './email-sender.js';
export {
  createMockEmailSender,
  createMockNotificationHistoryRepository,
  createEmailNotificationProcessor,
} from './email-sender.js';
