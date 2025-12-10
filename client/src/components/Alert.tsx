import React, { useEffect, useCallback } from 'react';

/**
 * アラートタイプ
 */
export type AlertType = 'success' | 'error' | 'warning' | 'info';

/**
 * Alert コンポーネントのプロパティ
 */
export interface AlertProps {
  /** アラートメッセージ */
  readonly message: string;
  /** アラートタイプ */
  readonly type: AlertType;
  /** 閉じるボタンクリック時のコールバック */
  readonly onClose: () => void;
  /** アラートタイトル（オプション） */
  readonly title?: string;
  /** 自動非表示までの時間（ミリ秒） */
  readonly autoHide?: number;
  /** 閉じるボタンを表示するかどうか */
  readonly dismissible?: boolean;
  /** 追加のCSSクラス */
  readonly className?: string;
}

/**
 * アラートアイコンコンポーネント
 */
function AlertIcon({ type }: { readonly type: AlertType }): React.ReactElement {
  const iconMap: Record<AlertType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <span className={`alert-icon alert-icon-${type}`} data-testid={`alert-icon-${type}`}>
      {iconMap[type]}
    </span>
  );
}

/**
 * 通知・アラートコンポーネント
 */
export function Alert({
  message,
  type,
  onClose,
  title,
  autoHide,
  dismissible = true,
  className = '',
}: AlertProps): React.ReactElement {
  // 自動非表示タイマー
  useEffect(() => {
    if (autoHide === undefined || autoHide <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      onClose();
    }, autoHide);

    return () => {
      clearTimeout(timer);
    };
  }, [autoHide, onClose]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // aria-live属性：エラーの場合はassertive、その他はpolite
  const ariaLive = type === 'error' ? 'assertive' : 'polite';

  return (
    <div
      className={`alert alert-${type} ${className}`}
      role="alert"
      aria-live={ariaLive}
    >
      <div className="alert-content">
        <AlertIcon type={type} />
        <div className="alert-text">
          {title !== undefined && (
            <div className="alert-title">{title}</div>
          )}
          <div className="alert-message">{message}</div>
        </div>
      </div>
      {dismissible && (
        <button
          type="button"
          className="alert-close"
          onClick={handleClose}
          aria-label="閉じる"
        >
          ×
        </button>
      )}
    </div>
  );
}
