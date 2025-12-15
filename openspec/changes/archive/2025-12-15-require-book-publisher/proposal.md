# Change: 書籍マスタの「出版社」を必須項目に変更

## Why

書籍マスタの出版社情報は、図書館システムにおいて書籍の識別・検索・管理において重要なメタデータです。現在はオプション項目ですが、データ品質向上のため必須項目に変更します。

## What Changes

- **BREAKING**: 書籍登録時に出版社（publisher）フィールドが必須になる
- **BREAKING**: 既存データで出版社が未設定の書籍は更新が必要になる可能性がある
- バックエンドの型定義・バリデーションを変更
- フロントエンドの型定義・フォームバリデーションを変更
- データベーススキーマのマイグレーションを追加（NOT NULL制約）
- init-db.ts の冪等性を保証するマイグレーション管理テーブルを導入

## Impact

- Affected specs: book-management（新規作成）
- Affected code:
  - `src/domains/book/types.ts` - 型定義
  - `src/domains/book/book-service.ts` - バリデーション
  - `src/domains/book/book-controller.ts` - コントローラー型
  - `client/src/lib/book-api.ts` - クライアント型定義
  - `client/src/pages/BooksPage.tsx` - フォームバリデーション
  - `src/infrastructure/database/schema.ts` - マイグレーション追加
  - `src/scripts/init-db.ts` - 冪等性保証のマイグレーション管理
  - 関連テストファイル
