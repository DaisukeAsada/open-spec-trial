import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormInput, type ValidationRule } from './FormInput';

describe('FormInput', () => {
  describe('基本機能', () => {
    it('ラベルと入力フィールドをレンダリングする', () => {
      render(
        <FormInput
          id="test-input"
          label="テスト入力"
          value=""
          onChange={() => {}}
        />
      );

      expect(screen.getByLabelText('テスト入力')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('値の変更をonChangeに通知する', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();

      render(
        <FormInput
          id="test-input"
          label="テスト入力"
          value=""
          onChange={handleChange}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'a');

      expect(handleChange).toHaveBeenCalledWith('a');
    });

    it('プレースホルダーを表示する', () => {
      render(
        <FormInput
          id="test-input"
          label="テスト入力"
          value=""
          onChange={() => {}}
          placeholder="入力してください"
        />
      );

      expect(screen.getByPlaceholderText('入力してください')).toBeInTheDocument();
    });

    it('disabledの場合、入力を無効にする', () => {
      render(
        <FormInput
          id="test-input"
          label="テスト入力"
          value=""
          onChange={() => {}}
          disabled
        />
      );

      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('type属性を適用する', () => {
      render(
        <FormInput
          id="test-input"
          label="テスト入力"
          value=""
          onChange={() => {}}
          type="email"
        />
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
    });
  });

  describe('必須項目バリデーション', () => {
    it('required属性を持つ場合、ラベルに必須マークを表示する', () => {
      render(
        <FormInput
          id="test-input"
          label="テスト入力"
          value=""
          onChange={() => {}}
          required
        />
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('requiredフィールドが空の場合、エラーを表示する', async () => {
      const user = userEvent.setup();

      render(
        <FormInput
          id="test-input"
          label="テスト入力"
          value=""
          onChange={() => {}}
          required
        />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab(); // blur

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('この項目は必須です');
      });
    });

    it('requiredフィールドに値がある場合、エラーを表示しない', async () => {
      render(
        <FormInput
          id="test-input"
          label="テスト入力"
          value="test value"
          onChange={() => {}}
          required
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('カスタムバリデーション', () => {
    it('カスタムバリデーションルールを適用する', async () => {
      const user = userEvent.setup();
      const minLength: ValidationRule = {
        validate: (value) => value.length >= 3,
        message: '3文字以上入力してください',
      };

      render(
        <FormInput
          id="test-input"
          label="テスト入力"
          value="ab"
          onChange={() => {}}
          validationRules={[minLength]}
        />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab(); // blur

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('3文字以上入力してください');
      });
    });

    it('複数のバリデーションルールを適用し、最初のエラーのみ表示する', async () => {
      const user = userEvent.setup();
      const rules: ValidationRule[] = [
        {
          validate: (value) => value.length >= 3,
          message: '3文字以上入力してください',
        },
        {
          validate: (value) => /^[a-z]+$/i.test(value),
          message: 'アルファベットのみ入力してください',
        },
      ];

      render(
        <FormInput
          id="test-input"
          label="テスト入力"
          value="12"
          onChange={() => {}}
          validationRules={rules}
        />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab(); // blur

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('3文字以上入力してください');
      });
    });

    it('バリデーションが成功した場合、エラーを表示しない', async () => {
      const minLength: ValidationRule = {
        validate: (value) => value.length >= 3,
        message: '3文字以上入力してください',
      };

      render(
        <FormInput
          id="test-input"
          label="テスト入力"
          value="abc"
          onChange={() => {}}
          validationRules={[minLength]}
        />
      );

      const input = screen.getByRole('textbox');
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('外部エラー表示', () => {
    it('外部から渡されたエラーメッセージを表示する', () => {
      render(
        <FormInput
          id="test-input"
          label="テスト入力"
          value=""
          onChange={() => {}}
          error="サーバーエラーが発生しました"
        />
      );

      expect(screen.getByRole('alert')).toHaveTextContent('サーバーエラーが発生しました');
    });

    it('エラーがある場合、入力フィールドにエラースタイルを適用する', () => {
      render(
        <FormInput
          id="test-input"
          label="テスト入力"
          value=""
          onChange={() => {}}
          error="エラーです"
        />
      );

      expect(screen.getByRole('textbox')).toHaveClass('form-input-error');
    });
  });

  describe('onValidationChange', () => {
    it('バリデーション結果が変わった時にonValidationChangeを呼び出す', async () => {
      const user = userEvent.setup();
      const handleValidationChange = vi.fn();

      render(
        <FormInput
          id="test-input"
          label="テスト入力"
          value=""
          onChange={() => {}}
          required
          onValidationChange={handleValidationChange}
        />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab(); // blur

      await waitFor(() => {
        expect(handleValidationChange).toHaveBeenCalledWith(false);
      });
    });
  });
});
