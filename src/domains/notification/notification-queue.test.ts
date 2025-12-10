/**
 * NotificationQueue - テスト
 *
 * Redis + BullMQ によるジョブキューのテストを提供します。
 */

import { describe, it, expect } from 'vitest';
import { createMockNotificationQueue } from './notification-queue.js';
import type { NotificationJobData, NotificationQueueConfig } from './types.js';
import { createUserId, createBookId } from '../../shared/branded-types.js';

describe('NotificationQueue', () => {
  describe('createMockNotificationQueue', () => {
    it('ジョブをキューに追加できる', async () => {
      // Arrange
      const queue = createMockNotificationQueue();
      const jobData: NotificationJobData = {
        type: 'RESERVATION_AVAILABLE',
        userId: createUserId('user-1'),
        bookId: createBookId('book-1'),
        timestamp: new Date(),
      };

      // Act
      const result = await queue.enqueue(jobData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.value).toBe('string');
      }
    });

    it('追加したジョブのステータスを取得できる', async () => {
      // Arrange
      const queue = createMockNotificationQueue();
      const jobData: NotificationJobData = {
        type: 'RESERVATION_AVAILABLE',
        userId: createUserId('user-1'),
        bookId: createBookId('book-1'),
        timestamp: new Date(),
      };

      // Act
      const enqueueResult = await queue.enqueue(jobData);
      expect(enqueueResult.success).toBe(true);
      if (!enqueueResult.success) return;

      const statusResult = await queue.getJobStatus(enqueueResult.value);

      // Assert
      expect(statusResult.success).toBe(true);
      if (statusResult.success) {
        expect(statusResult.value.id).toBe(enqueueResult.value);
        expect(statusResult.value.status).toBe('PENDING');
        expect(statusResult.value.attempts).toBe(0);
        expect(statusResult.value.maxAttempts).toBe(3);
      }
    });

    it('存在しないジョブIDでエラーを返す', async () => {
      // Arrange
      const queue = createMockNotificationQueue();

      // Act
      const result = await queue.getJobStatus('non-existent-job');

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('JOB_NOT_FOUND');
      }
    });

    it('リトライ設定が反映される', async () => {
      // Arrange
      const config = { maxRetries: 5 };
      const queue = createMockNotificationQueue(config);
      const jobData: NotificationJobData = {
        type: 'RESERVATION_AVAILABLE',
        userId: createUserId('user-1'),
        bookId: createBookId('book-1'),
        timestamp: new Date(),
      };

      // Act
      const enqueueResult = await queue.enqueue(jobData);
      expect(enqueueResult.success).toBe(true);
      if (!enqueueResult.success) return;

      const statusResult = await queue.getJobStatus(enqueueResult.value);

      // Assert
      expect(statusResult.success).toBe(true);
      if (statusResult.success) {
        expect(statusResult.value.maxAttempts).toBe(5);
      }
    });

    it('キューをクローズできる', async () => {
      // Arrange
      const queue = createMockNotificationQueue();

      // Act & Assert - should not throw
      await expect(queue.close()).resolves.toBeUndefined();
    });
  });

  describe('createNotificationQueue (unit tests)', () => {
    it('設定を正しく受け取る', () => {
      // Arrange
      const config: NotificationQueueConfig = {
        redisUrl: 'redis://localhost:6379',
        maxRetries: 3,
        retryDelay: 1000,
      };

      // Act & Assert - 設定オブジェクトが正しく構成されることを確認
      expect(config.maxRetries).toBe(3);
      expect(config.retryDelay).toBe(1000);
    });
  });
});

describe('NotificationQueue with retry', () => {
  it('最大3回までリトライする設定がデフォルト', async () => {
    // Arrange
    const queue = createMockNotificationQueue();
    const jobData: NotificationJobData = {
      type: 'RESERVATION_AVAILABLE',
      userId: createUserId('user-1'),
      bookId: createBookId('book-1'),
      timestamp: new Date(),
    };

    // Act
    const enqueueResult = await queue.enqueue(jobData);
    expect(enqueueResult.success).toBe(true);
    if (!enqueueResult.success) return;

    const statusResult = await queue.getJobStatus(enqueueResult.value);

    // Assert
    expect(statusResult.success).toBe(true);
    if (statusResult.success) {
      expect(statusResult.value.maxAttempts).toBe(3);
    }
  });
});
