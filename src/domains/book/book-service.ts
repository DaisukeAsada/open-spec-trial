/**
 * BookService - 蔵書管理サービス
 *
 * 蔵書（書籍マスタ）のCRUD操作を提供します。
 */

import type { BookId, CopyId } from '../../shared/branded-types.js';
import type { Result } from '../../shared/result.js';
import { ok, err, isErr } from '../../shared/result.js';
import { validateISBN, validateRequired } from '../../shared/validation.js';
import type { BookRepository } from './book-repository.js';
import type {
  Book,
  CreateBookInput,
  UpdateBookInput,
  BookError,
  BookCopy,
  CreateCopyInput,
  BookCopyStatus,
} from './types.js';

// ============================================
// サービスインターフェース
// ============================================

/** BookService インターフェース */
export interface BookService {
  /**
   * 新しい書籍を登録
   * @param input - 書籍登録入力
   * @returns 作成された書籍またはエラー
   */
  createBook(input: CreateBookInput): Promise<Result<Book, BookError>>;

  /**
   * IDで書籍を取得
   * @param id - 書籍ID
   * @returns 書籍またはNOT_FOUNDエラー
   */
  getBookById(id: BookId): Promise<Result<Book, BookError>>;

  /**
   * 書籍情報を更新
   * @param id - 書籍ID
   * @param input - 更新入力
   * @returns 更新された書籍またはエラー
   */
  updateBook(id: BookId, input: UpdateBookInput): Promise<Result<Book, BookError>>;

  /**
   * 書籍を削除
   * @param id - 書籍ID
   * @returns 成功またはNOT_FOUNDエラー
   */
  deleteBook(id: BookId): Promise<Result<void, BookError>>;

  // ============================================
  // 蔵書コピー関連メソッド
  // ============================================

  /**
   * 蔵書コピーを登録
   * @param bookId - 書籍ID
   * @param input - 蔵書コピー登録入力
   * @returns 作成された蔵書コピーまたはエラー
   */
  createBookCopy(bookId: BookId, input: CreateCopyInput): Promise<Result<BookCopy, BookError>>;

  /**
   * 蔵書コピーのステータスを更新
   * @param copyId - 蔵書コピーID
   * @param status - 新しいステータス
   * @returns 更新された蔵書コピーまたはエラー
   */
  updateCopyStatus(copyId: CopyId, status: BookCopyStatus): Promise<Result<BookCopy, BookError>>;

  /**
   * 書籍に紐づく蔵書コピー一覧を取得
   * @param bookId - 書籍ID
   * @returns 蔵書コピー一覧またはエラー
   */
  getCopiesByBookId(bookId: BookId): Promise<Result<BookCopy[], BookError>>;
}

// ============================================
// バリデーション関数
// ============================================

/**
 * 書籍登録入力をバリデーション
 */
function validateCreateBookInput(input: CreateBookInput): Result<CreateBookInput, BookError> {
  // タイトル必須チェック
  const titleResult = validateRequired(input.title, 'title');
  if (isErr(titleResult)) {
    return err({
      type: 'VALIDATION_ERROR',
      field: 'title',
      message: titleResult.error.message,
    });
  }

  // 著者必須チェック
  const authorResult = validateRequired(input.author, 'author');
  if (isErr(authorResult)) {
    return err({
      type: 'VALIDATION_ERROR',
      field: 'author',
      message: authorResult.error.message,
    });
  }

  // ISBN必須チェック
  const isbnRequiredResult = validateRequired(input.isbn, 'isbn');
  if (isErr(isbnRequiredResult)) {
    return err({
      type: 'VALIDATION_ERROR',
      field: 'isbn',
      message: isbnRequiredResult.error.message,
    });
  }

  // ISBN形式チェック
  const isbnResult = validateISBN(input.isbn);
  if (isErr(isbnResult)) {
    return err({
      type: 'VALIDATION_ERROR',
      field: 'isbn',
      message: isbnResult.error.message,
    });
  }

  // 出版社必須チェック
  const publisherResult = validateRequired(input.publisher, 'publisher');
  if (isErr(publisherResult)) {
    return err({
      type: 'VALIDATION_ERROR',
      field: 'publisher',
      message: publisherResult.error.message,
    });
  }

  return ok(input);
}

/**
 * 書籍更新入力をバリデーション
 */
function validateUpdateBookInput(input: UpdateBookInput): Result<UpdateBookInput, BookError> {
  // タイトルが指定されていて空の場合はエラー
  if (input.title !== undefined && input.title.trim() === '') {
    return err({
      type: 'VALIDATION_ERROR',
      field: 'title',
      message: 'title cannot be empty',
    });
  }

  // 著者が指定されていて空の場合はエラー
  if (input.author !== undefined && input.author.trim() === '') {
    return err({
      type: 'VALIDATION_ERROR',
      field: 'author',
      message: 'author cannot be empty',
    });
  }

  // ISBNが指定されていて空の場合はエラー
  if (input.isbn !== undefined && input.isbn.trim() === '') {
    return err({
      type: 'VALIDATION_ERROR',
      field: 'isbn',
      message: 'isbn cannot be empty',
    });
  }

  // ISBNが指定されている場合は形式チェック
  if (input.isbn !== undefined && input.isbn.trim() !== '') {
    const isbnResult = validateISBN(input.isbn);
    if (isErr(isbnResult)) {
      return err({
        type: 'VALIDATION_ERROR',
        field: 'isbn',
        message: isbnResult.error.message,
      });
    }
  }

  return ok(input);
}

/**
 * 蔵書コピー登録入力をバリデーション
 */
function validateCreateCopyInput(input: CreateCopyInput): Result<CreateCopyInput, BookError> {
  // 所在場所必須チェック
  const locationResult = validateRequired(input.location, 'location');
  if (isErr(locationResult)) {
    return err({
      type: 'VALIDATION_ERROR',
      field: 'location',
      message: locationResult.error.message,
    });
  }

  return ok(input);
}

// ============================================
// サービス実装
// ============================================

/**
 * BookServiceを作成
 * @param repository - 書籍リポジトリ
 * @returns BookService
 */
export function createBookService(repository: BookRepository): BookService {
  return {
    async createBook(input: CreateBookInput): Promise<Result<Book, BookError>> {
      // 入力バリデーション
      const validationResult = validateCreateBookInput(input);
      if (isErr(validationResult)) {
        return validationResult;
      }

      // ISBN重複チェック
      const existingBook = await repository.findByIsbn(input.isbn);
      if (existingBook !== null) {
        return err({
          type: 'DUPLICATE_ISBN',
          isbn: input.isbn,
        });
      }

      // 書籍作成
      return repository.create(input);
    },

    async getBookById(id: BookId): Promise<Result<Book, BookError>> {
      return repository.findById(id);
    },

    async updateBook(id: BookId, input: UpdateBookInput): Promise<Result<Book, BookError>> {
      // 書籍存在チェック
      const existingResult = await repository.findById(id);
      if (isErr(existingResult)) {
        return existingResult;
      }

      // 入力バリデーション
      const validationResult = validateUpdateBookInput(input);
      if (isErr(validationResult)) {
        return validationResult;
      }

      // ISBN更新時の重複チェック
      if (input.isbn !== undefined && input.isbn !== existingResult.value.isbn) {
        const duplicateBook = await repository.findByIsbn(input.isbn);
        if (duplicateBook !== null && duplicateBook.id !== id) {
          return err({
            type: 'DUPLICATE_ISBN',
            isbn: input.isbn,
          });
        }
      }

      // 書籍更新
      return repository.update(id, input);
    },

    async deleteBook(id: BookId): Promise<Result<void, BookError>> {
      // 書籍存在チェック
      const existingResult = await repository.findById(id);
      if (isErr(existingResult)) {
        return existingResult;
      }

      // 書籍削除
      return repository.delete(id);
    },

    // ============================================
    // 蔵書コピー関連メソッド
    // ============================================

    async createBookCopy(
      bookId: BookId,
      input: CreateCopyInput
    ): Promise<Result<BookCopy, BookError>> {
      // 書籍存在チェック
      const bookResult = await repository.findById(bookId);
      if (isErr(bookResult)) {
        return bookResult;
      }

      // 入力バリデーション
      const validationResult = validateCreateCopyInput(input);
      if (isErr(validationResult)) {
        return validationResult;
      }

      // 蔵書コピー作成
      return repository.createCopy(bookId, input);
    },

    async updateCopyStatus(
      copyId: CopyId,
      status: BookCopyStatus
    ): Promise<Result<BookCopy, BookError>> {
      // 蔵書コピー存在チェック
      const copyResult = await repository.findCopyById(copyId);
      if (isErr(copyResult)) {
        return copyResult;
      }

      // ステータス更新
      return repository.updateCopy(copyId, status);
    },

    async getCopiesByBookId(bookId: BookId): Promise<Result<BookCopy[], BookError>> {
      // 書籍存在チェック
      const bookResult = await repository.findById(bookId);
      if (isErr(bookResult)) {
        return bookResult;
      }

      // 蔵書コピー一覧取得
      return repository.findCopiesByBookId(bookId);
    },
  };
}
