import React, { useEffect, useRef, useCallback, type KeyboardEvent } from 'react';

/**
 * ダイアログのバリアント
 */
export type DialogVariant = 'default' | 'danger' | 'warning';

/**
 * ConfirmDialog コンポーネントのプロパティ
 */
export interface ConfirmDialogProps {
  /** ダイアログの表示状態 */
  readonly isOpen: boolean;
  /** ダイアログタイトル */
  readonly title: string;
  /** ダイアログメッセージ */
  readonly message: string;
  /** 確認ボタンクリック時のコールバック */
  readonly onConfirm: () => void;
  /** キャンセルボタンクリック時のコールバック */
  readonly onCancel: () => void;
  /** 確認ボタンのラベル */
  readonly confirmLabel?: string;
  /** キャンセルボタンのラベル */
  readonly cancelLabel?: string;
  /** ダイアログのバリアント */
  readonly variant?: DialogVariant;
  /** ローディング状態 */
  readonly loading?: boolean;
  /** 追加のCSSクラス */
  readonly className?: string;
}

/**
 * 確認ダイアログコンポーネント
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = '確認',
  cancelLabel = 'キャンセル',
  variant = 'default',
  loading = false,
  className = '',
}: ConfirmDialogProps): React.ReactElement | null {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // ダイアログを開いた時にキャンセルボタンにフォーカス
  useEffect(() => {
    if (isOpen && cancelButtonRef.current !== null) {
      cancelButtonRef.current.focus();
    }
  }, [isOpen]);

  // Escapeキーでダイアログを閉じる
  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && !loading) {
      onCancel();
    }
  }, [onCancel, loading]);

  // オーバーレイクリックでダイアログを閉じる
  const handleOverlayClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) {
      onCancel();
    }
  }, [onCancel, loading]);

  const handleConfirmClick = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  const handleCancelClick = useCallback(() => {
    onCancel();
  }, [onCancel]);

  if (!isOpen) {
    return null;
  }

  const getButtonVariantClass = (): string => {
    switch (variant) {
      case 'danger':
        return 'confirm-dialog-button-danger';
      case 'warning':
        return 'confirm-dialog-button-warning';
      default:
        return 'confirm-dialog-button-default';
    }
  };

  const titleId = 'confirm-dialog-title';
  const descriptionId = 'confirm-dialog-description';

  return (
    <div
      className={`confirm-dialog-overlay ${className}`}
      data-testid="dialog-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        ref={dialogRef}
        className="confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <h2 id={titleId} className="confirm-dialog-title">
          {title}
        </h2>
        <p id={descriptionId} className="confirm-dialog-message">
          {message}
        </p>
        <div className="confirm-dialog-actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="confirm-dialog-button confirm-dialog-button-cancel"
            onClick={handleCancelClick}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-dialog-button ${getButtonVariantClass()}`}
            onClick={handleConfirmClick}
            disabled={loading}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
