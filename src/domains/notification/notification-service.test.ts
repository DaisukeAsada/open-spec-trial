/**
 * NotificationService - テスト
 *
 * 非同期通知キューのテストを提供します。
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createNotificationService } from './notification-service.js';
import type { NotificationQueue } from './notification-queue.js';
import type { NotificationJobData } from './types.js';
import { createUserId, createBookId, createLoanId } from '../../shared/branded-types.js';

describe('NotificationService', () => {
  let mockQueue: NotificationQueue;
  let enqueuedJobs: NotificationJobData[];

  beforeEach(() => {
    enqueuedJobs = [];

    mockQueue = {
      enqueue: vi.fn((data: NotificationJobData) => {
        enqueuedJobs.push(data);
        return Promise.resolve({
          success: true as const,
          value: `job-${String(enqueuedJobs.length)}`,
        });
      }),
      getJobStatus: vi.fn((jobId: string) => {
        return Promise.resolve({
          success: true as const,
          value: {
            id: jobId,
            status: 'PENDING' as const,
            attempts: 0,
            maxAttempts: 3,
          },
        });
      }),
      close: vi.fn(() => Promise.resolve()),
    };
  });

  describe('sendReservationAvailable', () => {
    it('予約書籍の貸出可能通知をキューに追加できる', async () => {
      // Arrange
      const service = createNotificationService(mockQueue);
      const userId = createUserId('user-1');
      const bookId = createBookId('book-1');

      // Act
      const result = await service.sendReservationAvailable(userId, bookId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockQueue.enqueue).toHaveBeenCalledTimes(1);
      expect(enqueuedJobs).toHaveLength(1);
      expect(enqueuedJobs[0]).toMatchObject({
        type: 'RESERVATION_AVAILABLE',
        userId: userId,
        bookId: bookId,
      });
    });

    it('キューエラー時にエラー結果を返す', async () => {
      // Arrange
      mockQueue.enqueue = vi.fn(() =>
        Promise.resolve({
          success: false as const,
          error: { type: 'QUEUE_ERROR' as const, message: 'Connection failed' },
        })
      );
      const service = createNotificationService(mockQueue);
      const userId = createUserId('user-1');
      const bookId = createBookId('book-1');

      // Act
      const result = await service.sendReservationAvailable(userId, bookId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('QUEUE_ERROR');
      }
    });
  });

  describe('sendOverdueReminder', () => {
    it('延滞リマインダー通知をキューに追加できる', async () => {
      // Arrange
      const service = createNotificationService(mockQueue);
      const userId = createUserId('user-1');
      const loanId = createLoanId('loan-1');

      // Act
      const result = await service.sendOverdueReminder(userId, loanId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockQueue.enqueue).toHaveBeenCalledTimes(1);
      expect(enqueuedJobs).toHaveLength(1);
      expect(enqueuedJobs[0]).toMatchObject({
        type: 'OVERDUE_REMINDER',
        userId: userId,
        loanId: loanId,
      });
    });

    it('キューエラー時にエラー結果を返す', async () => {
      // Arrange
      mockQueue.enqueue = vi.fn(() =>
        Promise.resolve({
          success: false as const,
          error: { type: 'QUEUE_ERROR' as const, message: 'Connection failed' },
        })
      );
      const service = createNotificationService(mockQueue);
      const userId = createUserId('user-1');
      const loanId = createLoanId('loan-1');

      // Act
      const result = await service.sendOverdueReminder(userId, loanId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('QUEUE_ERROR');
      }
    });
  });

  describe('getJobStatus', () => {
    it('ジョブのステータスを取得できる', async () => {
      // Arrange
      const service = createNotificationService(mockQueue);
      const jobId = 'job-123';

      // Act
      const result = await service.getJobStatus(jobId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockQueue.getJobStatus).toHaveBeenCalledWith(jobId);
      if (result.success) {
        expect(result.value.id).toBe(jobId);
        expect(result.value.status).toBe('PENDING');
      }
    });
  });
});
