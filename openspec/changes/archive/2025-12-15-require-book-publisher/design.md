# Design: 書籍マスタの出版社必須化

## 概要

書籍マスタの `publisher` フィールドを必須項目に変更するにあたり、データベースマイグレーションと冪等性保証の設計を行います。

## 設計判断

### 1. データベースマイグレーション戦略

#### 問題
- 既存の `books` テーブルでは `publisher` カラムが `NULL` 許容
- 既存データに `publisher` が NULL のレコードが存在する可能性がある

#### 解決策
新しいマイグレーション `008_alter_books_publisher_not_null` を追加：

1. **既存データの更新**: `publisher` が NULL のレコードにデフォルト値 `'不明'` を設定
2. **NOT NULL 制約の追加**: `ALTER TABLE` で制約を追加

```sql
-- 既存データの更新
UPDATE books SET publisher = '不明' WHERE publisher IS NULL;

-- NOT NULL 制約の追加
ALTER TABLE books ALTER COLUMN publisher SET NOT NULL;
```

#### 代替案（不採用）
- 初期マイグレーションを直接変更：既にデプロイ済みの環境に影響を与える可能性があるため不採用

### 2. init-db.ts の冪等性保証

#### 現状の問題
- 現在の実装は PostgreSQL の `42P07` エラーコード（テーブル既存）をキャッチしてスキップ
- これは限定的な冪等性保証であり、以下の問題がある：
  - カラム変更（ALTER TABLE）は検出できない
  - 部分的に適用されたマイグレーションを検出できない
  - どのマイグレーションが適用済みか追跡できない

#### 解決策
マイグレーション管理テーブル `schema_migrations` を導入：

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  name VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

#### 処理フロー
1. `schema_migrations` テーブルが存在しなければ作成
2. 各マイグレーション実行前に `schema_migrations` を確認
3. 未適用のマイグレーションのみ実行
4. 成功後に `schema_migrations` に記録

```typescript
async function runMigration(pool: DatabasePool, migration: Migration): Promise<void> {
  // 適用済みかチェック
  const result = await pool.query(
    'SELECT 1 FROM schema_migrations WHERE name = $1',
    [migration.name]
  );
  
  if (result.rows.length > 0) {
    console.log(`  ⏭️  ${migration.name} (already applied)`);
    return;
  }
  
  // マイグレーション実行
  await pool.query(migration.up);
  
  // 記録
  await pool.query(
    'INSERT INTO schema_migrations (name) VALUES ($1)',
    [migration.name]
  );
  
  console.log(`  ✅ ${migration.name}`);
}
```

### 3. 既存データの取り扱い

#### 考慮事項
- 本番環境に `publisher` が NULL のデータが存在する場合、アプリケーションが正常に動作しなくなる可能性
- デフォルト値 `'不明'` は一時的な措置であり、運用チームによる手動更新を推奨

#### 推奨運用手順
1. マイグレーション適用前に、`publisher` が NULL のレコード数を確認
2. 可能であれば手動で正しい出版社名を設定
3. マイグレーション適用

## トレードオフ

| 項目 | 選択 | 理由 |
|------|------|------|
| マイグレーション方式 | 追加マイグレーション | 既存環境の互換性維持 |
| NULL データ処理 | デフォルト値設定 | データ欠損防止、後から修正可能 |
| 冪等性保証 | 管理テーブル方式 | 明確な適用履歴、信頼性向上 |

## 影響範囲

- `src/infrastructure/database/schema.ts`: 新マイグレーション追加
- `src/scripts/init-db.ts`: マイグレーション管理ロジック変更
- 本番DB: スキーマ変更、既存データ更新
