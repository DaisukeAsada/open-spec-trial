/**
 * データベース初期化スクリプト
 *
 * PostgreSQLにテーブルを作成します
 * マイグレーション管理テーブルを使用して冪等性を保証します
 */

import { DatabasePool, createDatabaseConfig } from '../infrastructure/database/database.js';
import { getAllMigrations } from '../infrastructure/database/schema.js';
import type { Migration } from '../infrastructure/database/migration.js';

/**
 * マイグレーション管理テーブルを作成（存在しない場合のみ）
 */
async function ensureSchemaMigrationsTable(pool: DatabasePool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  `);
}

/**
 * マイグレーションが適用済みかどうかをチェック
 */
async function isMigrationApplied(pool: DatabasePool, name: string): Promise<boolean> {
  const result = await pool.query<{ count: string }>(
    'SELECT COUNT(*) as count FROM schema_migrations WHERE name = $1',
    [name]
  );
  const row = result.rows[0];
  if (!row) return false;
  return parseInt(row.count, 10) > 0;
}

/**
 * マイグレーションを適用済みとして記録
 */
async function recordMigration(pool: DatabasePool, name: string): Promise<void> {
  await pool.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
}

/**
 * 単一のマイグレーションを実行（冪等性を保証）
 */
async function runMigration(pool: DatabasePool, migration: Migration): Promise<void> {
  // 適用済みかチェック
  const applied = await isMigrationApplied(pool, migration.name);
  if (applied) {
    console.log(`  ⏭️  ${migration.name} (already applied)`);
    return;
  }

  // マイグレーション実行
  await pool.query(migration.up);

  // 記録
  await recordMigration(pool, migration.name);

  console.log(`  ✅ ${migration.name}`);
}

async function initDatabase(): Promise<void> {
  const pool = new DatabasePool(
    createDatabaseConfig({
      host: process.env.POSTGRES_HOST ?? 'postgres',
      port: parseInt(process.env.POSTGRES_PORT ?? '5432', 10),
      database: process.env.POSTGRES_DB ?? 'library_db',
      user: process.env.POSTGRES_USER ?? 'library_user',
      password: process.env.POSTGRES_PASSWORD ?? 'library_password',
    })
  );

  console.log('🔌 Connecting to PostgreSQL...');

  try {
    // 接続テスト
    await pool.query('SELECT 1');
    console.log('✅ Connected to PostgreSQL');

    // マイグレーション管理テーブルの作成
    await ensureSchemaMigrationsTable(pool);

    // マイグレーション実行
    const migrations = getAllMigrations();

    console.log('📦 Running migrations...');

    for (const migration of migrations) {
      await runMigration(pool, migration);
    }

    console.log('🎉 Database initialization complete!');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const errorLog = console.error.bind(console);
    errorLog(`❌ Database initialization failed: ${message}`);
    process.exit(1);
  } finally {
    await pool.close();
  }
}

void initDatabase();
