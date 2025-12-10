import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  describe('基本機能', () => {
    it('ダイアログタイトルとメッセージを表示する', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="削除の確認"
          message="本当にこの書籍を削除しますか？"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('削除の確認')).toBeInTheDocument();
      expect(screen.getByText('本当にこの書籍を削除しますか？')).toBeInTheDocument();
    });

    it('isOpenがfalseの場合、ダイアログを表示しない', () => {
      render(
        <ConfirmDialog
          isOpen={false}
          title="削除の確認"
          message="本当にこの書籍を削除しますか？"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('確認ボタンとキャンセルボタンを表示する', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="削除の確認"
          message="本当にこの書籍を削除しますか？"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      );

      expect(screen.getByRole('button', { name: '確認' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeInTheDocument();
    });

    it('カスタムボタンラベルを表示できる', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="削除の確認"
          message="本当にこの書籍を削除しますか？"
          onConfirm={() => {}}
          onCancel={() => {}}
          confirmLabel="削除する"
          cancelLabel="戻る"
        />
      );

      expect(screen.getByRole('button', { name: '削除する' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '戻る' })).toBeInTheDocument();
    });
  });

  describe('ユーザーインタラクション', () => {
    it('確認ボタンをクリックするとonConfirmを呼び出す', async () => {
      const handleConfirm = vi.fn();
      const user = userEvent.setup();

      render(
        <ConfirmDialog
          isOpen={true}
          title="削除の確認"
          message="本当にこの書籍を削除しますか？"
          onConfirm={handleConfirm}
          onCancel={() => {}}
        />
      );

      await user.click(screen.getByRole('button', { name: '確認' }));

      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it('キャンセルボタンをクリックするとonCancelを呼び出す', async () => {
      const handleCancel = vi.fn();
      const user = userEvent.setup();

      render(
        <ConfirmDialog
          isOpen={true}
          title="削除の確認"
          message="本当にこの書籍を削除しますか？"
          onConfirm={() => {}}
          onCancel={handleCancel}
        />
      );

      await user.click(screen.getByRole('button', { name: 'キャンセル' }));

      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('オーバーレイをクリックするとonCancelを呼び出す', async () => {
      const handleCancel = vi.fn();
      const user = userEvent.setup();

      render(
        <ConfirmDialog
          isOpen={true}
          title="削除の確認"
          message="本当にこの書籍を削除しますか？"
          onConfirm={() => {}}
          onCancel={handleCancel}
        />
      );

      // オーバーレイ領域をクリック
      const overlay = screen.getByTestId('dialog-overlay');
      await user.click(overlay);

      expect(handleCancel).toHaveBeenCalledTimes(1);
    });

    it('Escapeキーを押すとonCancelを呼び出す', async () => {
      const handleCancel = vi.fn();
      const user = userEvent.setup();

      render(
        <ConfirmDialog
          isOpen={true}
          title="削除の確認"
          message="本当にこの書籍を削除しますか？"
          onConfirm={() => {}}
          onCancel={handleCancel}
        />
      );

      await user.keyboard('{Escape}');

      expect(handleCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe('バリアント', () => {
    it('dangerバリアントの場合、確認ボタンにdangerスタイルを適用する', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="削除の確認"
          message="本当にこの書籍を削除しますか？"
          onConfirm={() => {}}
          onCancel={() => {}}
          variant="danger"
        />
      );

      expect(screen.getByRole('button', { name: '確認' })).toHaveClass('confirm-dialog-button-danger');
    });

    it('warningバリアントの場合、確認ボタンにwarningスタイルを適用する', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="警告"
          message="この操作は取り消せません。"
          onConfirm={() => {}}
          onCancel={() => {}}
          variant="warning"
        />
      );

      expect(screen.getByRole('button', { name: '確認' })).toHaveClass('confirm-dialog-button-warning');
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中は確認ボタンを無効にする', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="削除の確認"
          message="本当にこの書籍を削除しますか？"
          onConfirm={() => {}}
          onCancel={() => {}}
          loading
        />
      );

      expect(screen.getByRole('button', { name: '確認' })).toBeDisabled();
    });

    it('ローディング中はキャンセルボタンを無効にする', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="削除の確認"
          message="本当にこの書籍を削除しますか？"
          onConfirm={() => {}}
          onCancel={() => {}}
          loading
        />
      );

      expect(screen.getByRole('button', { name: 'キャンセル' })).toBeDisabled();
    });
  });

  describe('アクセシビリティ', () => {
    it('ダイアログにaria-labelledbyを設定する', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="削除の確認"
          message="本当にこの書籍を削除しますか？"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('ダイアログにaria-describedbyを設定する', () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="削除の確認"
          message="本当にこの書籍を削除しますか？"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('ダイアログを開いた時にフォーカスをキャンセルボタンに移動する', async () => {
      render(
        <ConfirmDialog
          isOpen={true}
          title="削除の確認"
          message="本当にこの書籍を削除しますか？"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'キャンセル' })).toHaveFocus();
      });
    });
  });
});
