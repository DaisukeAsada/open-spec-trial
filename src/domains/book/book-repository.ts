/**
 * Book Repository Interface
 *
 * 書籍データの永続化を担当するリポジトリのインターフェース定義。
 * 具体的な実装は Infrastructure 層で行います。
 */

import type { BookId, CopyId } from '../../shared/branded-types.js';
import type { Result } from '../../shared/result.js';
import type { Book, CreateBookInput, UpdateBookInput, BookError, BookCopy, CreateCopyInput, BookCopyStatus } from './types.js';

// ============================================
// リポジトリインターフェース
// ============================================

/** 書籍リポジトリ */
export interface BookRepository {
  /**
   * 新しい書籍を作成
   * @param input - 書籍登録入力
   * @returns 作成された書籍または重複エラー
   */
  create(input: CreateBookInput): Promise<Result<Book, BookError>>;

  /**
   * IDで書籍を取得
   * @param id - 書籍ID
   * @returns 書籍またはNOT_FOUNDエラー
   */
  findById(id: BookId): Promise<Result<Book, BookError>>;

  /**
   * ISBNで書籍を検索
   * @param isbn - ISBN
   * @returns 書籍またはnull
   */
  findByIsbn(isbn: string): Promise<Book | null>;

  /**
   * 書籍を更新
   * @param id - 書籍ID
   * @param input - 更新入力
   * @returns 更新された書籍またはエラー
   */
  update(id: BookId, input: UpdateBookInput): Promise<Result<Book, BookError>>;

  /**
   * 書籍を削除
   * @param id - 書籍ID
   * @returns 成功またはNOT_FOUNDエラー
   */
  delete(id: BookId): Promise<Result<void, BookError>>;

  // ============================================
  // 蔵書コピー関連メソッド
  // ============================================

  /**
   * 新しい蔵書コピーを作成
   * @param bookId - 書籍ID
   * @param input - 蔵書コピー登録入力
   * @returns 作成された蔵書コピーまたはエラー
   */
  createCopy(bookId: BookId, input: CreateCopyInput): Promise<Result<BookCopy, BookError>>;

  /**
   * IDで蔵書コピーを取得
   * @param copyId - 蔵書コピーID
   * @returns 蔵書コピーまたはNOT_FOUNDエラー
   */
  findCopyById(copyId: CopyId): Promise<Result<BookCopy, BookError>>;

  /**
   * 蔵書コピーを更新
   * @param copyId - 蔵書コピーID
   * @param status - 新しいステータス
   * @returns 更新された蔵書コピーまたはエラー
   */
  updateCopy(copyId: CopyId, status: BookCopyStatus): Promise<Result<BookCopy, BookError>>;

  /**
   * 書籍IDで蔵書コピー一覧を取得
   * @param bookId - 書籍ID
   * @returns 蔵書コピー一覧
   */
  findCopiesByBookId(bookId: BookId): Promise<Result<BookCopy[], BookError>>;
}
