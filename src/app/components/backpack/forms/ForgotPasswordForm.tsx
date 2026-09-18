'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Key, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export interface ForgotPasswordFormProps {
  initialEmail?: string;
  onSuccess: (email: string) => void;
  onNavigateToLogin: () => void;
  onNavigateToReset: (email: string) => void;
  setFeedback: (feedback: { type: 'success' | 'error' | 'info' | null; message: string; errors?: string[] }) => void;
}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  initialEmail = '',
  onSuccess,
  onNavigateToLogin,
  onNavigateToReset,
  setFeedback,
}) => {
  const { forgotPassword } = useAuth();
  const [forgotEmailInput, setForgotEmailInput] = useState<string>(initialEmail);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialEmail) setForgotEmailInput(initialEmail);
  }, [initialEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmailInput.trim()) {
      setFeedback({
        type: 'error',
        message: 'Vui lòng nhập địa chỉ email đã đăng ký.',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: 'info', message: 'Đang gửi yêu cầu đặt lại mật khẩu tới máy chủ...' });

    try {
      const response = await forgotPassword({
        email: forgotEmailInput.trim(),
      });

      if (response.success) {
        setFeedback({
          type: 'success',
          message: response.message || 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi đến hòm thư của bạn!',
        });
        setTimeout(() => {
          onSuccess(forgotEmailInput.trim());
        }, 1200);
      } else {
        setFeedback({
          type: 'error',
          message: response.message || 'Yêu cầu không thành công.',
          errors: response.errors || [],
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Lỗi khi gửi yêu cầu đặt lại mật khẩu.',
        errors: [(err as Error).message],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <div className="auth-form-field p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs flex flex-col gap-1">
        <span className="font-bold text-amber-600 dark:text-amber-300 flex items-center gap-1.5">
          <Key className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          Bước 1: Yêu cầu mã đặt lại mật khẩu
        </span>
        <p className="text-[11px] text-tod-text-muted leading-relaxed">
          Nhập địa chỉ email tài khoản của bạn. Hệ thống sẽ gửi một <strong>Reset Token</strong> qua email.
        </p>
      </div>

      <div className="auth-form-field flex flex-col gap-1">
        <label className="text-[11px] font-bold text-tod-text">Email tài khoản *</label>
        <div className="relative flex items-center">
          <Mail className="absolute left-3 w-4 h-4 text-tod-text-muted" />
          <input
            type="email"
            required
            value={forgotEmailInput}
            onChange={(e) => setForgotEmailInput(e.target.value)}
            placeholder="Nhập email của bạn (vd: email@example.com)"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-tod-card border border-tod-border text-xs text-tod-text placeholder-tod-text-muted focus:outline-none focus:border-amber-500 transition-colors font-medium"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="auth-form-field w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Đang Gửi Yêu Cầu...</span>
          </>
        ) : (
          <>
            <Mail className="w-4 h-4" />
            <span>Gửi Mã Đặt Lại Qua Email</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-between pt-2 border-t border-tod-border text-[11px]">
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="text-tod-text-muted hover:text-tod-text flex items-center gap-1 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Quay lại Đăng nhập
        </button>
        <button
          type="button"
          onClick={() => onNavigateToReset(forgotEmailInput.trim())}
          className="text-amber-500 hover:text-amber-400 font-semibold cursor-pointer transition-colors"
        >
          Đã có mã? Đặt lại MK →
        </button>
      </div>
    </form>
  );
};
