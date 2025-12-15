## 1. Implementation

### 1.1 バックエンド型定義の更新
- [x] `src/domains/book/types.ts` の `Book` インターフェースで `publisher` を `string` に変更
- [x] `src/domains/book/types.ts` の `CreateBookInput` で `publisher` を必須に変更
- [x] `src/domains/book/types.ts` の `UpdateBookInput` は任意のままとする（部分更新用）

### 1.2 バックエンドバリデーションの追加
- [x] `src/domains/book/book-service.ts` の `validateCreateBookInput` に出版社の必須チェックを追加

### 1.3 バックエンドコントローラーの更新
- [x] `src/domains/book/book-controller.ts` の `CreateBookBody` 型で `publisher` を必須に変更
- [x] `src/domains/book/book-controller.ts` の登録ロジックで `publisher` の null-coalescing を削除

### 1.4 データベースマイグレーションの追加
- [x] `src/infrastructure/database/schema.ts` に `008_alter_books_publisher_not_null` マイグレーションを追加
  - 既存データの publisher が NULL の場合はデフォルト値 '不明' で更新
  - publisher カラムに NOT NULL 制約を追加
- [x] `src/scripts/init-db.ts` にマイグレーション管理テーブル `schema_migrations` を導入
  - 適用済みマイグレーションを記録するテーブルを作成
  - 各マイグレーション実行前にテーブルをチェックして冪等性を保証
  - 新しいマイグレーションを適用順に追加

### 1.5 フロントエンド型定義の更新
- [x] `client/src/lib/book-api.ts` の `Book` インターフェースで `publisher` を `string` に変更
- [x] `client/src/lib/book-api.ts` の `CreateBookInput` で `publisher` を必須に変更

### 1.6 フロントエンドフォームの更新
- [x] `client/src/pages/BooksPage.tsx` でフォームバリデーションに出版社の必須チェックを追加

## 2. Testing

### 2.1 バックエンドテストの更新
- [x] `src/domains/book/book-service.test.ts` に出版社なしで登録エラーになるテストを追加
- [x] `src/domains/book/book-controller.test.ts` のテストデータを必要に応じて更新

### 2.2 フロントエンドテストの更新
- [x] `client/src/pages/BooksPage.test.tsx` に出版社必須バリデーションのテストを追加

## 3. Documentation

### 3.1 スペック更新
- [x] `openspec/specs/book-management/spec.md` を更新して変更を反映

## Dependencies

- 1.1 → 1.2, 1.3（型変更が先）
- 1.4 は他と並行可能（DB層の変更）
- 1.5 → 1.6（型変更が先）
- 1.x → 2.x（実装後にテスト）
- 全実装完了 → 3.1（スペック更新）

## Parallelizable Work

- バックエンド（1.1-1.4）とフロントエンド（1.5-1.6）は並行作業可能
- テスト（2.1, 2.2）は該当実装完了後に並行作業可能
