/**
 * NotificationQueue - 通知キュー
 *
 * Redis + BullMQ によるジョブキュー実装を提供します。
 */

import { Queue, Worker, type Job } from 'bullmq';
import type { Result } from '../../shared/result.js';
import { ok, err } from '../../shared/result.js';
import type {
  NotificationJobData,
  NotificationError,
  NotificationQueueConfig,
  JobStatus,
} from './types.js';

// ============================================
// ジョブステータス情報
// ============================================

/** ジョブステータス情報 */
export interface JobStatusInfo {
  readonly id: string;
  readonly status: JobStatus;
  readonly attempts: number;
  readonly maxAttempts: number;
}

// ============================================
// キューインターフェース
// ============================================

/** NotificationQueue インターフェース */
export interface NotificationQueue {
  /**
   * 通知ジョブをキューに追加
   * @param data - 通知ジョブデータ
   * @returns ジョブIDまたはエラー
   */
  enqueue(data: NotificationJobData): Promise<Result<string, NotificationError>>;

  /**
   * ジョブのステータスを取得
   * @param jobId - ジョブID
   * @returns ジョブステータス情報またはエラー
   */
  getJobStatus(jobId: string): Promise<Result<JobStatusInfo, NotificationError>>;

  /**
   * キューをクローズ
   */
  close(): Promise<void>;
}

// ============================================
// BullMQ 実装
// ============================================

/** キュー名 */
const QUEUE_NAME = 'notifications';

/**
 * BullMQ を使用した NotificationQueue を作成
 * @param config - キュー設定
 * @returns NotificationQueue
 */
export function createNotificationQueue(config: NotificationQueueConfig): NotificationQueue {
  const { redisUrl, maxRetries, retryDelay } = config;

  // Redis接続設定をURLからパース
  const connectionUrl = new URL(redisUrl);
  const connection = {
    host: connectionUrl.hostname,
    port: parseInt(connectionUrl.port || '6379', 10),
  };

  const queue = new Queue<NotificationJobData>(QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: maxRetries,
      backoff: {
        type: 'fixed',
        delay: retryDelay,
      },
      removeOnComplete: {
        count: 100,
      },
      removeOnFail: {
        count: 100,
      },
    },
  });

  return {
    async enqueue(data: NotificationJobData): Promise<Result<string, NotificationError>> {
      try {
        const job = await queue.add(`notification:${data.type}`, data);
        if (job.id === undefined) {
          return err({ type: 'QUEUE_ERROR', message: 'Failed to get job ID' });
        }
        return ok(job.id);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return err({ type: 'QUEUE_ERROR', message });
      }
    },

    async getJobStatus(jobId: string): Promise<Result<JobStatusInfo, NotificationError>> {
      try {
        const job = await queue.getJob(jobId);
        if (job === undefined) {
          return err({ type: 'JOB_NOT_FOUND', jobId });
        }

        const state = await job.getState();
        let status: JobStatus;
        switch (state) {
          case 'completed':
            status = 'COMPLETED';
            break;
          case 'failed':
            status = 'FAILED';
            break;
          case 'active':
            status = 'PROCESSING';
            break;
          default:
            status = 'PENDING';
        }

        return ok({
          id: jobId,
          status,
          attempts: job.attemptsMade,
          maxAttempts: job.opts.attempts ?? maxRetries,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return err({ type: 'QUEUE_ERROR', message });
      }
    },

    async close(): Promise<void> {
      await queue.close();
    },
  };
}

// ============================================
// モック実装（テスト用）
// ============================================

/** モックキュー設定 */
export interface MockQueueConfig {
  readonly maxRetries?: number;
}

/**
 * テスト用のモック NotificationQueue を作成
 * @param config - オプション設定
 * @returns NotificationQueue
 */
export function createMockNotificationQueue(config?: MockQueueConfig): NotificationQueue {
  const maxRetries = config?.maxRetries ?? 3;
  const jobs = new Map<
    string,
    { data: NotificationJobData; status: JobStatus; attempts: number }
  >();
  let jobCounter = 0;

  return {
    enqueue(data: NotificationJobData): Promise<Result<string, NotificationError>> {
      jobCounter += 1;
      const jobId = `mock-job-${String(jobCounter)}`;
      jobs.set(jobId, {
        data,
        status: 'PENDING',
        attempts: 0,
      });
      return Promise.resolve(ok(jobId));
    },

    getJobStatus(jobId: string): Promise<Result<JobStatusInfo, NotificationError>> {
      const job = jobs.get(jobId);
      if (job === undefined) {
        return Promise.resolve(err({ type: 'JOB_NOT_FOUND', jobId }));
      }
      return Promise.resolve(
        ok({
          id: jobId,
          status: job.status,
          attempts: job.attempts,
          maxAttempts: maxRetries,
        })
      );
    },

    close(): Promise<void> {
      jobs.clear();
      return Promise.resolve();
    },
  };
}

// ============================================
// ワーカー作成
// ============================================

/** ジョブプロセッサ関数型 */
export type JobProcessor = (data: NotificationJobData) => Promise<Result<void, NotificationError>>;

/**
 * 通知ワーカーを作成
 * @param config - キュー設定
 * @param processor - ジョブ処理関数
 * @returns Worker インスタンス
 */
export function createNotificationWorker(
  config: NotificationQueueConfig,
  processor: JobProcessor
): Worker<NotificationJobData> {
  // Redis接続設定をURLからパース
  const connectionUrl = new URL(config.redisUrl);
  const connection = {
    host: connectionUrl.hostname,
    port: parseInt(connectionUrl.port || '6379', 10),
  };

  const worker = new Worker<NotificationJobData>(
    QUEUE_NAME,
    async (job: Job<NotificationJobData>) => {
      const result = await processor(job.data);
      if (!result.success) {
        const errorMessage =
          'message' in result.error
            ? (result.error as { message: string }).message
            : 'Unknown error';
        throw new Error(errorMessage);
      }
    },
    {
      connection,
      concurrency: 5,
    }
  );

  return worker;
}
