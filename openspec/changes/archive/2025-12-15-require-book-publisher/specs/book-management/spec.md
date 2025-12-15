# Capability: 書籍管理

書籍マスタの登録・更新・削除・検索機能を提供します。

## ADDED Requirements

### Requirement: 出版社は必須項目である

書籍を登録する際、システムは出版社（publisher）フィールドを必須入力として検証しなければならない（SHALL）。

#### Scenario: 出版社ありで書籍を登録する
- **GIVEN** ユーザーが書籍登録画面を開いている
- **WHEN** タイトル、著者、ISBN、出版社を入力して登録ボタンを押す
- **THEN** 書籍が正常に登録される
- **AND** 書籍一覧に登録した書籍が表示される

#### Scenario: 出版社なしで書籍を登録しようとする
- **GIVEN** ユーザーが書籍登録画面を開いている
- **WHEN** タイトル、著者、ISBNを入力し、出版社を空のまま登録ボタンを押す
- **THEN** バリデーションエラーが表示される
- **AND** 「出版社は必須です」というエラーメッセージが表示される
- **AND** 書籍は登録されない

#### Scenario: API経由で出版社なしの書籍登録リクエストを送信する
- **GIVEN** クライアントがAPIを呼び出す
- **WHEN** `POST /api/books` に `publisher` フィールドなしでリクエストを送信する
- **THEN** ステータスコード 400 が返される
- **AND** エラータイプ `VALIDATION_ERROR` とフィールド `publisher` が返される

### Requirement: データベースマイグレーションは冪等でなければならない

データベース初期化スクリプト（init-db.ts）は、複数回実行しても同一の結果を保証しなければならない（SHALL）。

#### Scenario: 初回のデータベース初期化
- **GIVEN** データベースにテーブルが存在しない
- **WHEN** init-db.ts を実行する
- **THEN** すべてのテーブルとマイグレーションが正常に適用される
- **AND** schema_migrations テーブルに適用履歴が記録される

#### Scenario: 2回目以降のデータベース初期化
- **GIVEN** データベースにすでにテーブルが存在する
- **WHEN** init-db.ts を再度実行する
- **THEN** 適用済みマイグレーションはスキップされる
- **AND** 新しいマイグレーションのみが適用される
- **AND** エラーは発生しない

#### Scenario: 出版社がNULLの既存データがある場合のマイグレーション
- **GIVEN** books テーブルに publisher が NULL のレコードが存在する
- **WHEN** 008_alter_books_publisher_not_null マイグレーションを適用する
- **THEN** NULL の publisher は「不明」に更新される
- **AND** publisher カラムに NOT NULL 制約が追加される
