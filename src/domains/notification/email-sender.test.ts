/**
 * EmailSender - テスト
 *
 * メール送信機能のテストを提供します。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createMockEmailSender,
  createEmailNotificationProcessor,
  type EmailSender,
  type NotificationHistoryRepository,
  type NotificationHistoryRecord,
} from './email-sender.js';
import { createUserId, createBookId, createLoanId } from '../../shared/branded-types.js';
import type { ReservationAvailableJobData, OverdueReminderJobData } from './types.js';

describe('EmailSender', () => {
  describe('createMockEmailSender', () => {
    it('メールを送信できる', async () => {
      // Arrange
      const sender = createMockEmailSender();

      // Act
      const result = await sender.send({
        to: 'test@example.com',
        subject: 'テスト件名',
        body: 'テスト本文',
      });

      // Assert
      expect(result.success).toBe(true);
    });

    it('送信したメールを記録する', async () => {
      // Arrange
      const sender = createMockEmailSender();

      // Act
      await sender.send({
        to: 'test@example.com',
        subject: 'テスト件名',
        body: 'テスト本文',
      });

      // Assert
      const sentEmails = sender.getSentEmails();
      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0]).toEqual({
        to: 'test@example.com',
        subject: 'テスト件名',
        body: 'テスト本文',
      });
    });

    it('送信失敗を設定できる', async () => {
      // Arrange
      const sender = createMockEmailSender({ shouldFail: true });

      // Act
      const result = await sender.send({
        to: 'test@example.com',
        subject: 'テスト件名',
        body: 'テスト本文',
      });

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('SEND_ERROR');
      }
    });
  });
});

describe('NotificationHistoryRepository', () => {
  describe('createMockNotificationHistoryRepository', () => {
    let repository: NotificationHistoryRepository;

    beforeEach(async () => {
      const { createMockNotificationHistoryRepository } = await import('./email-sender.js');
      repository = createMockNotificationHistoryRepository();
    });

    it('通知履歴を保存できる', async () => {
      // Arrange
      const record: NotificationHistoryRecord = {
        id: 'history-1',
        jobId: 'job-1',
        type: 'RESERVATION_AVAILABLE',
        userId: createUserId('user-1'),
        recipientEmail: 'test@example.com',
        subject: 'テスト件名',
        sentAt: new Date(),
        success: true,
        errorMessage: null,
      };

      // Act
      const result = await repository.save(record);

      // Assert
      expect(result.success).toBe(true);
    });

    it('保存した履歴を取得できる', async () => {
      // Arrange
      const record: NotificationHistoryRecord = {
        id: 'history-1',
        jobId: 'job-1',
        type: 'RESERVATION_AVAILABLE',
        userId: createUserId('user-1'),
        recipientEmail: 'test@example.com',
        subject: 'テスト件名',
        sentAt: new Date(),
        success: true,
        errorMessage: null,
      };
      await repository.save(record);

      // Act
      const result = await repository.findByUserId(createUserId('user-1'));

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toHaveLength(1);
        expect(result.value[0]?.id).toBe('history-1');
      }
    });
  });
});

describe('EmailNotificationProcessor', () => {
  let mockEmailSender: EmailSender & {
    getSentEmails: () => { to: string; subject: string; body: string }[];
  };
  let mockHistoryRepository: NotificationHistoryRepository;
  let mockUserLookup: (userId: string) => Promise<{ email: string; name: string } | undefined>;
  let mockBookLookup: (bookId: string) => Promise<{ title: string } | undefined>;

  beforeEach(async () => {
    const { createMockEmailSender, createMockNotificationHistoryRepository } =
      await import('./email-sender.js');
    mockEmailSender = createMockEmailSender();
    mockHistoryRepository = createMockNotificationHistoryRepository();
    mockUserLookup = vi.fn((_userId: string) =>
      Promise.resolve({
        email: 'user@example.com',
        name: 'テストユーザー',
      })
    );
    mockBookLookup = vi.fn((_bookId: string) =>
      Promise.resolve({
        title: 'テスト書籍',
      })
    );
  });

  describe('予約書籍貸出可能通知', () => {
    it('メールを送信して履歴を記録する', async () => {
      // Arrange
      const processor = createEmailNotificationProcessor({
        emailSender: mockEmailSender,
        historyRepository: mockHistoryRepository,
        userLookup: mockUserLookup,
        bookLookup: mockBookLookup,
      });

      const jobData: ReservationAvailableJobData = {
        type: 'RESERVATION_AVAILABLE',
        userId: createUserId('user-1'),
        bookId: createBookId('book-1'),
        timestamp: new Date(),
      };

      // Act
      const result = await processor(jobData);

      // Assert
      expect(result.success).toBe(true);

      // メールが送信されたか確認
      const sentEmails = mockEmailSender.getSentEmails();
      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0]?.to).toBe('user@example.com');
      expect(sentEmails[0]?.subject).toContain('テスト書籍');
    });

    it('ユーザーが見つからない場合はエラーを返す', async () => {
      // Arrange
      mockUserLookup = vi.fn(() => Promise.resolve(undefined));
      const processor = createEmailNotificationProcessor({
        emailSender: mockEmailSender,
        historyRepository: mockHistoryRepository,
        userLookup: mockUserLookup,
        bookLookup: mockBookLookup,
      });

      const jobData: ReservationAvailableJobData = {
        type: 'RESERVATION_AVAILABLE',
        userId: createUserId('user-1'),
        bookId: createBookId('book-1'),
        timestamp: new Date(),
      };

      // Act
      const result = await processor(jobData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('SEND_ERROR');
      }
    });

    it('書籍が見つからない場合はエラーを返す', async () => {
      // Arrange
      mockBookLookup = vi.fn(() => Promise.resolve(undefined));
      const processor = createEmailNotificationProcessor({
        emailSender: mockEmailSender,
        historyRepository: mockHistoryRepository,
        userLookup: mockUserLookup,
        bookLookup: mockBookLookup,
      });

      const jobData: ReservationAvailableJobData = {
        type: 'RESERVATION_AVAILABLE',
        userId: createUserId('user-1'),
        bookId: createBookId('book-1'),
        timestamp: new Date(),
      };

      // Act
      const result = await processor(jobData);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('SEND_ERROR');
      }
    });
  });

  describe('延滞リマインダー通知', () => {
    let mockLoanLookup: (
      loanId: string
    ) => Promise<{ bookTitle: string; dueDate: Date } | undefined>;

    beforeEach(() => {
      mockLoanLookup = vi.fn((_loanId: string) =>
        Promise.resolve({
          bookTitle: '延滞書籍',
          dueDate: new Date('2024-12-01'),
        })
      );
    });

    it('延滞リマインダーメールを送信する', async () => {
      // Arrange
      const processor = createEmailNotificationProcessor({
        emailSender: mockEmailSender,
        historyRepository: mockHistoryRepository,
        userLookup: mockUserLookup,
        bookLookup: mockBookLookup,
        loanLookup: mockLoanLookup,
      });

      const jobData: OverdueReminderJobData = {
        type: 'OVERDUE_REMINDER',
        userId: createUserId('user-1'),
        loanId: createLoanId('loan-1'),
        timestamp: new Date(),
      };

      // Act
      const result = await processor(jobData);

      // Assert
      expect(result.success).toBe(true);

      // メールが送信されたか確認
      const sentEmails = mockEmailSender.getSentEmails();
      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0]?.to).toBe('user@example.com');
      expect(sentEmails[0]?.subject).toContain('延滞');
    });
  });
});
