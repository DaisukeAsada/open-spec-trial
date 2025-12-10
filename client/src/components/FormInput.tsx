import React, { useState, useCallback, type ChangeEvent } from 'react';

/**
 * バリデーションルールの定義
 */
export interface ValidationRule {
  /** バリデーション関数。trueなら有効、falseなら無効 */
  readonly validate: (value: string) => boolean;
  /** バリデーション失敗時のエラーメッセージ */
  readonly message: string;
}

/**
 * FormInput コンポーネントのプロパティ
 */
export interface FormInputProps {
  /** 入力フィールドのID */
  readonly id: string;
  /** ラベルテキスト */
  readonly label: string;
  /** 現在の値 */
  readonly value: string;
  /** 値変更時のコールバック */
  readonly onChange: (value: string) => void;
  /** 入力タイプ */
  readonly type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  /** プレースホルダー */
  readonly placeholder?: string;
  /** 無効状態 */
  readonly disabled?: boolean;
  /** 必須フィールド */
  readonly required?: boolean;
  /** バリデーションルール */
  readonly validationRules?: readonly ValidationRule[];
  /** 外部から渡されるエラーメッセージ */
  readonly error?: string;
  /** バリデーション結果変更時のコールバック */
  readonly onValidationChange?: (isValid: boolean) => void;
  /** 追加のCSSクラス */
  readonly className?: string;
}

/**
 * バリデーション付きフォーム入力コンポーネント
 */
export function FormInput({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled = false,
  required = false,
  validationRules = [],
  error: externalError,
  onValidationChange,
  className = '',
}: FormInputProps): React.ReactElement {
  const [touched, setTouched] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  // バリデーション実行
  const validate = useCallback((val: string): string | null => {
    // 必須チェック
    if (required && val.trim() === '') {
      return 'この項目は必須です';
    }

    // カスタムバリデーションルール
    for (const rule of validationRules) {
      if (!rule.validate(val)) {
        return rule.message;
      }
    }

    return null;
  }, [required, validationRules]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    // touchedの場合はリアルタイムバリデーション
    if (touched) {
      const validationError = validate(newValue);
      setInternalError(validationError);
      onValidationChange?.(validationError === null && (externalError === undefined || externalError === ''));
    }
  }, [onChange, touched, validate, externalError, onValidationChange]);

  const handleBlur = useCallback(() => {
    setTouched(true);
    const validationError = validate(value);
    setInternalError(validationError);
    onValidationChange?.(validationError === null && (externalError === undefined || externalError === ''));
  }, [value, validate, externalError, onValidationChange]);

  // 表示するエラーメッセージ（外部エラーを優先）
  const displayError = externalError ?? (touched ? internalError : null);
  const hasError = displayError !== null && displayError !== undefined && displayError !== '';

  return (
    <div className={`form-input-container ${className}`}>
      <label htmlFor={id} className="form-input-label">
        {label}
        {required && <span className="form-input-required">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`form-input ${hasError ? 'form-input-error' : ''}`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
      />
      {hasError && (
        <div id={`${id}-error`} className="form-input-error-message" role="alert">
          {displayError}
        </div>
      )}
    </div>
  );
}
