import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable, type Column } from './DataTable';

interface TestItem {
  id: string;
  name: string;
  age: number;
  email: string;
}

const testData: TestItem[] = [
  { id: '1', name: '田中太郎', age: 30, email: 'tanaka@example.com' },
  { id: '2', name: '鈴木花子', age: 25, email: 'suzuki@example.com' },
  { id: '3', name: '佐藤次郎', age: 35, email: 'sato@example.com' },
];

const columns: Column<TestItem>[] = [
  { key: 'name', header: '名前' },
  { key: 'age', header: '年齢' },
  { key: 'email', header: 'メールアドレス' },
];

describe('DataTable', () => {
  describe('基本機能', () => {
    it('テーブルヘッダーをレンダリングする', () => {
      render(<DataTable data={testData} columns={columns} keyField="id" />);

      expect(screen.getByRole('columnheader', { name: '名前' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: '年齢' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'メールアドレス' })).toBeInTheDocument();
    });

    it('データ行をレンダリングする', () => {
      render(<DataTable data={testData} columns={columns} keyField="id" />);

      const rows = screen.getAllByRole('row');
      // ヘッダー行 + データ行3件
      expect(rows).toHaveLength(4);

      expect(screen.getByText('田中太郎')).toBeInTheDocument();
      expect(screen.getByText('鈴木花子')).toBeInTheDocument();
      expect(screen.getByText('佐藤次郎')).toBeInTheDocument();
    });

    it('データが空の場合、空メッセージを表示する', () => {
      render(<DataTable data={[]} columns={columns} keyField="id" />);

      expect(screen.getByText('データがありません')).toBeInTheDocument();
    });

    it('カスタム空メッセージを表示できる', () => {
      render(
        <DataTable
          data={[]}
          columns={columns}
          keyField="id"
          emptyMessage="検索結果がありません"
        />
      );

      expect(screen.getByText('検索結果がありません')).toBeInTheDocument();
    });
  });

  describe('カスタムセルレンダリング', () => {
    it('カスタムレンダラーを使用してセルを表示する', () => {
      const columnsWithRenderer: Column<TestItem>[] = [
        { key: 'name', header: '名前' },
        {
          key: 'age',
          header: '年齢',
          render: (item) => <span data-testid="age-cell">{item.age}歳</span>,
        },
      ];

      render(<DataTable data={testData} columns={columnsWithRenderer} keyField="id" />);

      const ageCells = screen.getAllByTestId('age-cell');
      expect(ageCells[0]).toHaveTextContent('30歳');
      expect(ageCells[1]).toHaveTextContent('25歳');
    });
  });

  describe('行クリック', () => {
    it('行をクリックした時にonRowClickを呼び出す', async () => {
      const handleRowClick = vi.fn();
      const user = userEvent.setup();

      render(
        <DataTable
          data={testData}
          columns={columns}
          keyField="id"
          onRowClick={handleRowClick}
        />
      );

      const rows = screen.getAllByRole('row');
      // 最初のデータ行をクリック（インデックス1はヘッダー行の次）
      await user.click(rows[1]);

      expect(handleRowClick).toHaveBeenCalledWith(testData[0]);
    });

    it('クリック可能な行にポインターカーソルを適用する', () => {
      render(
        <DataTable
          data={testData}
          columns={columns}
          keyField="id"
          onRowClick={() => {}}
        />
      );

      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveClass('data-table-row-clickable');
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中はスピナーを表示する', () => {
      render(
        <DataTable data={[]} columns={columns} keyField="id" loading />
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    it('ローディング中はデータを表示しない', () => {
      render(
        <DataTable data={testData} columns={columns} keyField="id" loading />
      );

      expect(screen.queryByText('田中太郎')).not.toBeInTheDocument();
    });
  });

  describe('ソート機能', () => {
    it('ソート可能なカラムヘッダーをクリックした時にonSortを呼び出す', async () => {
      const handleSort = vi.fn();
      const user = userEvent.setup();

      const sortableColumns: Column<TestItem>[] = [
        { key: 'name', header: '名前', sortable: true },
        { key: 'age', header: '年齢', sortable: true },
      ];

      render(
        <DataTable
          data={testData}
          columns={sortableColumns}
          keyField="id"
          onSort={handleSort}
        />
      );

      const nameHeader = screen.getByRole('columnheader', { name: '名前' });
      await user.click(nameHeader);

      expect(handleSort).toHaveBeenCalledWith('name', 'asc');
    });

    it('同じカラムを再度クリックすると降順になる', async () => {
      const handleSort = vi.fn();
      const user = userEvent.setup();

      const sortableColumns: Column<TestItem>[] = [
        { key: 'name', header: '名前', sortable: true },
      ];

      render(
        <DataTable
          data={testData}
          columns={sortableColumns}
          keyField="id"
          onSort={handleSort}
          sortKey="name"
          sortDirection="asc"
        />
      );

      // ソートインジケーターが表示されているため、アクセシブル名に含まれる
      const nameHeader = screen.getByRole('columnheader', { name: /名前/ });
      await user.click(nameHeader);

      expect(handleSort).toHaveBeenCalledWith('name', 'desc');
    });

    it('ソート中のカラムにソートインジケーターを表示する', () => {
      const sortableColumns: Column<TestItem>[] = [
        { key: 'name', header: '名前', sortable: true },
      ];

      render(
        <DataTable
          data={testData}
          columns={sortableColumns}
          keyField="id"
          onSort={() => {}}
          sortKey="name"
          sortDirection="asc"
        />
      );

      const nameHeader = screen.getByRole('columnheader', { name: /名前/ });
      expect(within(nameHeader).getByText('↑')).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('テーブルにariaラベルを設定できる', () => {
      render(
        <DataTable
          data={testData}
          columns={columns}
          keyField="id"
          ariaLabel="ユーザー一覧テーブル"
        />
      );

      expect(screen.getByRole('table', { name: 'ユーザー一覧テーブル' })).toBeInTheDocument();
    });
  });
});
