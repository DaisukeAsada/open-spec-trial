import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Alert } from './Alert';

describe('Alert', () => {
  afterEach(() => {
    cleanup();
  });

  describe('基本機能', () => {
    it('アラートメッセージを表示する', () => {
      render(
        <Alert message="操作が完了しました" type="success" onClose={() => {}} />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('操作が完了しました')).toBeInTheDocument();
    });

    it('タイトルを表示できる', () => {
      render(
        <Alert
          message="操作が完了しました"
          type="success"
          title="成功"
          onClose={() => {}}
        />
      );

      expect(screen.getByText('成功')).toBeInTheDocument();
    });

    it('閉じるボタンを表示する', () => {
      render(
        <Alert message="操作が完了しました" type="success" onClose={() => {}} />
      );

      expect(screen.getByRole('button', { name: '閉じる' })).toBeInTheDocument();
    });

    it('閉じるボタンをクリックするとonCloseを呼び出す', async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();

      render(
        <Alert message="操作が完了しました" type="success" onClose={handleClose} />
      );

      await user.click(screen.getByRole('button', { name: '閉じる' }));

      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('アラートタイプ', () => {
    it('successタイプの場合、対応するスタイルを適用する', () => {
      render(
        <Alert message="メッセージ" type="success" onClose={() => {}} />
      );

      expect(screen.getByRole('alert')).toHaveClass('alert-success');
    });

    it('errorタイプの場合、対応するスタイルを適用する', () => {
      render(
        <Alert message="メッセージ" type="error" onClose={() => {}} />
      );

      expect(screen.getByRole('alert')).toHaveClass('alert-error');
    });

    it('warningタイプの場合、対応するスタイルを適用する', () => {
      render(
        <Alert message="メッセージ" type="warning" onClose={() => {}} />
      );

      expect(screen.getByRole('alert')).toHaveClass('alert-warning');
    });

    it('infoタイプの場合、対応するスタイルを適用する', () => {
      render(
        <Alert message="メッセージ" type="info" onClose={() => {}} />
      );

      expect(screen.getByRole('alert')).toHaveClass('alert-info');
    });

    it('successタイプの場合、チェックアイコンを表示する', () => {
      render(
        <Alert message="操作が完了しました" type="success" onClose={() => {}} />
      );

      expect(screen.getByTestId('alert-icon-success')).toBeInTheDocument();
    });

    it('errorタイプの場合、エラーアイコンを表示する', () => {
      render(
        <Alert message="エラーが発生しました" type="error" onClose={() => {}} />
      );

      expect(screen.getByTestId('alert-icon-error')).toBeInTheDocument();
    });

    it('warningタイプの場合、警告アイコンを表示する', () => {
      render(
        <Alert message="注意してください" type="warning" onClose={() => {}} />
      );

      expect(screen.getByTestId('alert-icon-warning')).toBeInTheDocument();
    });

    it('infoタイプの場合、情報アイコンを表示する', () => {
      render(
        <Alert message="お知らせです" type="info" onClose={() => {}} />
      );

      expect(screen.getByTestId('alert-icon-info')).toBeInTheDocument();
    });
  });

  describe('自動非表示', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });

    it('autoHideを設定すると指定時間後にonCloseを呼び出す', () => {
      const handleClose = vi.fn();

      render(
        <Alert
          message="操作が完了しました"
          type="success"
          onClose={handleClose}
          autoHide={3000}
        />
      );

      expect(handleClose).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('autoHideが設定されていない場合、自動で閉じない', () => {
      const handleClose = vi.fn();

      render(
        <Alert message="操作が完了しました" type="success" onClose={handleClose} />
      );

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('コンポーネントがアンマウントされるとタイマーをクリアする', () => {
      const handleClose = vi.fn();

      const { unmount } = render(
        <Alert
          message="操作が完了しました"
          type="success"
          onClose={handleClose}
          autoHide={3000}
        />
      );

      unmount();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('アクセシビリティ', () => {
    it('role="alert"を持つ', () => {
      render(
        <Alert message="メッセージ" type="info" onClose={() => {}} />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('errorタイプの場合、aria-live="assertive"を設定する', () => {
      render(
        <Alert message="エラーが発生しました" type="error" onClose={() => {}} />
      );

      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    });

    it('その他のタイプの場合、aria-live="polite"を設定する', () => {
      render(
        <Alert message="お知らせ" type="info" onClose={() => {}} />
      );

      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('閉じるボタンの非表示', () => {
    it('dismissible=falseの場合、閉じるボタンを表示しない', () => {
      render(
        <Alert
          message="操作が完了しました"
          type="success"
          onClose={() => {}}
          dismissible={false}
        />
      );

      expect(screen.queryByRole('button', { name: '閉じる' })).not.toBeInTheDocument();
    });
  });
});
