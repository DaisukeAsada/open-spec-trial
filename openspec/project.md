# Project Context

## Purpose
図書館蔵書管理システム（Library Inventory System）

図書館の蔵書、利用者、貸出、予約を管理するフルスタックWebアプリケーション。書籍の登録・検索、利用者管理、貸出・返却処理、予約管理、レポート生成などの機能を提供する。

## Tech Stack

### バックエンド (`/src`)
- **言語**: TypeScript 5.9+ (ES2022, ESM)
- **ランタイム**: Node.js + ts-node
- **Webフレームワーク**: Express 5
- **データベース**: PostgreSQL (pg)
- **キャッシュ/キュー**: Redis (ioredis), BullMQ
- **テスト**: Vitest, Supertest

### フロントエンド (`/client`)
- **言語**: TypeScript 5.9+
- **UIフレームワーク**: React 19
- **ビルドツール**: Vite 7
- **ルーティング**: React Router DOM 7
- **状態管理/データフェッチ**: TanStack React Query 5
- **テスト**: Vitest, Testing Library (React)

### 開発ツール
- **リンター**: ESLint 9 (typescript-eslint)
- **フォーマッター**: Prettier
- **型チェック**: TypeScript strict mode

## Project Conventions

### Code Style
- **明示的な戻り値型**: 関数には必ず戻り値型を明記 (`@typescript-eslint/explicit-function-return-type`)
- **厳格なboolean式**: `@typescript-eslint/strict-boolean-expressions` を遵守
- **readonly推奨**: `@typescript-eslint/prefer-readonly` を適用
- **未使用変数**: `_` プレフィックスで除外可能
- **言語**: コメント・ドキュメントは日本語、コード（変数名・関数名）は英語

### Architecture Patterns

#### ドメイン駆動設計（DDD）風レイヤー構造
```
src/
├── domains/           # ドメイン層（ビジネスロジック）
│   ├── auth/          # 認証・認可
│   ├── book/          # 書籍管理
│   ├── loan/          # 貸出管理
│   ├── user/          # 利用者管理
│   ├── reservation/   # 予約管理
│   ├── report/        # レポート
│   └── notification/  # 通知
├── infrastructure/    # インフラ層
│   ├── database/      # DB接続・マイグレーション
│   └── repositories/  # PostgreSQLリポジトリ実装
└── shared/            # 共有ユーティリティ
```

#### 主要パターン
- **Result型パターン**: 例外の代わりに `Result<T, E>` で成功/失敗を型表現 (`src/shared/result.ts`)
- **Branded Types**: 型安全なID管理 (`BookId`, `UserId`, `LoanId` など)
- **ファクトリ関数**: `createXxxService()`, `createXxxController()` でDI対応
- **RBAC**: ロールベースアクセス制御 (admin, librarian, patron)

#### フロントエンド構造
```
client/src/
├── components/        # 再利用可能UIコンポーネント
├── contexts/          # React Context (認証など)
├── lib/               # APIクライアント
├── pages/             # ページコンポーネント
└── routes/            # ルート定義
```

### Testing Strategy
- **テストフレームワーク**: Vitest
- **テストファイル配置**: プロダクションコードと同一ディレクトリに `*.test.ts` / `*.test.tsx`
- **テストスタイル**: `describe` / `it` でBDD風に記述、日本語テスト名を使用
- **バックエンドテスト**: ユニットテスト中心、Supertestで統合テスト
- **フロントエンドテスト**: Testing Library + jsdom

### Git Workflow
- **変更提案**: OpenSpecを使用した仕様駆動開発
  - 大きな変更は `openspec/changes/` に提案を作成
  - 承認後、`openspec/specs/` に仕様を保存
- **コミット前チェック**:
  ```bash
  npm run lint        # ESLintチェック
  npx tsc --noEmit    # 型チェック
  npm run test:run    # テスト実行
  ```

## Domain Context

### エンティティ
- **Book（書籍）**: タイトル、著者、出版社（必須）、ISBN、カテゴリ
- **BookCopy（蔵書コピー）**: 書籍の物理的なコピー、配置場所、状態
- **User（利用者）**: 名前、メールアドレス、役割（admin/librarian/patron）
- **Loan（貸出）**: 利用者が書籍コピーを借りる記録、貸出日、返却期限、返却日
- **Reservation（予約）**: 利用者の書籍予約
- **OverdueRecord（延滞記録）**: 延滞履歴

### ビジネスルール
- 出版社（publisher）は書籍登録時の必須項目
- ISBNは重複不可
- データベースマイグレーションは冪等性を保証

## Important Constraints

### TypeScript厳格設定
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`
- `noImplicitReturns: true`

### セキュリティ
- CSPヘッダー設定 (`securityHeadersMiddleware`)
- 入力サニタイズ (`sanitizeInputMiddleware`)
- セッションベース認証

## External Dependencies

### 必須サービス
- **PostgreSQL**: メインデータベース
- **Redis**: セッション管理、キューイング（BullMQ）

### パスエイリアス（バックエンド）
```typescript
"@book/*"         → "./src/domains/book/*"
"@loan/*"         → "./src/domains/loan/*"
"@user/*"         → "./src/domains/user/*"
"@reservation/*"  → "./src/domains/reservation/*"
"@report/*"       → "./src/domains/report/*"
"@shared/*"       → "./src/shared/*"
"@infrastructure/*" → "./src/infrastructure/*"
```
