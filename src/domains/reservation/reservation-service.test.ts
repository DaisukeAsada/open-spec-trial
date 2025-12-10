/**
 * ReservationService テスト
 *
 * 予約サービスのユニットテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createReservationService, type ReservationService } from './reservation-service.js';
import type { ReservationRepository } from './reservation-repository.js';
import type { BookRepository } from '../book/book-repository.js';
import type { UserRepository } from '../user/user-repository.js';
import type { Reservation, ReservationError } from './types.js';
import type { Book, BookCopy } from '../book/types.js';
import type { User } from '../user/types.js';
import type { Result } from '../../shared/result.js';
import { ok, err, isOk, isErr } from '../../shared/result.js';
import {
  createUserId,
  createBookId,
  createReservationId,
  createCopyId,
} from '../../shared/branded-types.js';

// ============================================
// モック作成ヘルパー
// ============================================

function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: createUserId('user-1'),
    name: 'テスト利用者',
    email: 'test@example.com',
    address: '東京都',
    phone: '03-1234-5678',
    registeredAt: new Date('2024-01-01'),
    loanLimit: 5,
    ...overrides,
  };
}

function createMockBook(overrides: Partial<Book> = {}): Book {
  return {
    id: createBookId('book-1'),
    title: 'テスト書籍',
    author: 'テスト著者',
    publisher: 'テスト出版社',
    publicationYear: 2024,
    isbn: '9784000000001',
    category: 'プログラミング',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function createMockBookCopy(overrides: Partial<BookCopy> = {}): BookCopy {
  return {
    id: createCopyId('copy-1'),
    bookId: createBookId('book-1'),
    location: 'A-1-1',
    status: 'BORROWED',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

function createMockReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: createReservationId('reservation-1'),
    userId: createUserId('user-1'),
    bookId: createBookId('book-1'),
    reservedAt: new Date('2024-01-15'),
    notifiedAt: null,
    expiresAt: null,
    status: 'PENDING',
    queuePosition: 1,
    ...overrides,
  };
}

// ============================================
// モックリポジトリ
// ============================================

function createMockReservationRepository(
  overrides: Partial<ReservationRepository> = {}
): ReservationRepository {
  return {
    create: (input, queuePosition): Promise<Result<Reservation, ReservationError>> => {
      return Promise.resolve(
        ok(
          createMockReservation({
            userId: input.userId,
            bookId: input.bookId,
            queuePosition,
          })
        )
      );
    },
    findById: (): Promise<Result<Reservation, ReservationError>> => {
      return Promise.resolve(ok(createMockReservation()));
    },
    findActiveByBookId: (): Promise<Reservation[]> => {
      return Promise.resolve([]);
    },
    countActiveByBookId: (): Promise<number> => {
      return Promise.resolve(0);
    },
    hasActiveReservation: (): Promise<boolean> => {
      return Promise.resolve(false);
    },
    updateStatus: (): Promise<Result<Reservation, ReservationError>> => {
      return Promise.resolve(ok(createMockReservation()));
    },
    findByUserId: (): Promise<Reservation[]> => {
      return Promise.resolve([]);
    },
    ...overrides,
  };
}

function createMockBookRepository(
  overrides: Partial<Pick<BookRepository, 'findById' | 'findCopiesByBookId'>> = {}
): Pick<BookRepository, 'findById' | 'findCopiesByBookId'> {
  return {
    findById: (): Promise<Result<Book, { type: 'NOT_FOUND'; id: string }>> => {
      return Promise.resolve(ok(createMockBook()));
    },
    findCopiesByBookId: (): Promise<Result<BookCopy[], { type: 'NOT_FOUND'; id: string }>> => {
      return Promise.resolve(ok([createMockBookCopy({ status: 'BORROWED' })]));
    },
    ...overrides,
  };
}

function createMockUserRepository(
  overrides: Partial<Pick<UserRepository, 'findById'>> = {}
): Pick<UserRepository, 'findById'> {
  return {
    findById: (): Promise<Result<User, { type: 'NOT_FOUND'; id: string }>> => {
      return Promise.resolve(ok(createMockUser()));
    },
    ...overrides,
  };
}

// ============================================
// テストスイート
// ============================================

describe('ReservationService', () => {
  let service: ReservationService;
  let reservationRepo: ReservationRepository;
  let bookRepo: Pick<BookRepository, 'findById' | 'findCopiesByBookId'>;
  let userRepo: Pick<UserRepository, 'findById'>;

  beforeEach(() => {
    reservationRepo = createMockReservationRepository();
    bookRepo = createMockBookRepository();
    userRepo = createMockUserRepository();
    service = createReservationService(reservationRepo, bookRepo, userRepo);
  });

  describe('createReservation', () => {
    it('貸出中の書籍に対して予約を作成できる', async () => {
      // Arrange
      const input = {
        userId: createUserId('user-1'),
        bookId: createBookId('book-1'),
      };

      // Act
      const result = await service.createReservation(input);

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.userId).toBe(input.userId);
        expect(result.value.bookId).toBe(input.bookId);
        expect(result.value.status).toBe('PENDING');
        expect(result.value.queuePosition).toBe(1);
      }
    });

    it('予約番号（ID）が発行される', async () => {
      // Arrange
      const input = {
        userId: createUserId('user-1'),
        bookId: createBookId('book-1'),
      };

      // Act
      const result = await service.createReservation(input);

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.id).toBeDefined();
        expect(typeof result.value.id).toBe('string');
      }
    });

    it('予約キューの順番がFIFOで設定される（2番目の予約はqueuePosition=2）', async () => {
      // Arrange
      reservationRepo = createMockReservationRepository({
        countActiveByBookId: (): Promise<number> => Promise.resolve(1), // 既に1件予約あり
        create: (input, queuePosition) =>
          Promise.resolve(
            ok(
              createMockReservation({
                userId: input.userId,
                bookId: input.bookId,
                queuePosition,
              })
            )
          ),
      });
      service = createReservationService(reservationRepo, bookRepo, userRepo);

      const input = {
        userId: createUserId('user-2'),
        bookId: createBookId('book-1'),
      };

      // Act
      const result = await service.createReservation(input);

      // Assert
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.queuePosition).toBe(2);
      }
    });

    it('存在しない利用者の場合、USER_NOT_FOUNDエラーを返す', async () => {
      // Arrange
      userRepo = createMockUserRepository({
        findById: () => Promise.resolve(err({ type: 'NOT_FOUND' as const, id: 'user-999' })),
      });
      service = createReservationService(reservationRepo, bookRepo, userRepo);

      const input = {
        userId: createUserId('user-999'),
        bookId: createBookId('book-1'),
      };

      // Act
      const result = await service.createReservation(input);

      // Assert
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.type).toBe('USER_NOT_FOUND');
      }
    });

    it('存在しない書籍の場合、BOOK_NOT_FOUNDエラーを返す', async () => {
      // Arrange
      bookRepo = createMockBookRepository({
        findById: () => Promise.resolve(err({ type: 'NOT_FOUND' as const, id: 'book-999' })),
      });
      service = createReservationService(reservationRepo, bookRepo, userRepo);

      const input = {
        userId: createUserId('user-1'),
        bookId: createBookId('book-999'),
      };

      // Act
      const result = await service.createReservation(input);

      // Assert
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.type).toBe('BOOK_NOT_FOUND');
      }
    });

    it('同一ユーザーが同じ書籍に重複予約しようとした場合、ALREADY_RESERVEDエラーを返す', async () => {
      // Arrange
      reservationRepo = createMockReservationRepository({
        hasActiveReservation: () => Promise.resolve(true),
      });
      service = createReservationService(reservationRepo, bookRepo, userRepo);

      const input = {
        userId: createUserId('user-1'),
        bookId: createBookId('book-1'),
      };

      // Act
      const result = await service.createReservation(input);

      // Assert
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.type).toBe('ALREADY_RESERVED');
        if (result.error.type === 'ALREADY_RESERVED') {
          expect(result.error.userId).toBe(input.userId);
          expect(result.error.bookId).toBe(input.bookId);
        }
      }
    });

    it('貸出可能な蔵書コピーがある場合、BOOK_AVAILABLEエラーを返す（予約不可）', async () => {
      // Arrange
      bookRepo = createMockBookRepository({
        findCopiesByBookId: () =>
          Promise.resolve(ok([createMockBookCopy({ status: 'AVAILABLE' })])),
      });
      service = createReservationService(reservationRepo, bookRepo, userRepo);

      const input = {
        userId: createUserId('user-1'),
        bookId: createBookId('book-1'),
      };

      // Act
      const result = await service.createReservation(input);

      // Assert
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.type).toBe('BOOK_AVAILABLE');
      }
    });

    it('すべての蔵書コピーが貸出中またはメンテナンス中の場合、予約が可能', async () => {
      // Arrange
      bookRepo = createMockBookRepository({
        findCopiesByBookId: () =>
          Promise.resolve(
            ok([
              createMockBookCopy({ id: createCopyId('copy-1'), status: 'BORROWED' }),
              createMockBookCopy({ id: createCopyId('copy-2'), status: 'MAINTENANCE' }),
            ])
          ),
      });
      service = createReservationService(reservationRepo, bookRepo, userRepo);

      const input = {
        userId: createUserId('user-1'),
        bookId: createBookId('book-1'),
      };

      // Act
      const result = await service.createReservation(input);

      // Assert
      expect(isOk(result)).toBe(true);
    });
  });
});
