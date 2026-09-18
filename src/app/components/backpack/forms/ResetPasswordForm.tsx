'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Key, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export interface ResetPasswordFormProps {
  initialEmail?: string;
  initialToken?: string;
  onSuccess: (email: string) => void;
  onNavigateToForgot: () => void;
  onNavigateToLogin: () => void;
  setFeedback: (feedback: { type: 'success' | 'error' | 'info' | null; message: string; errors?: string[] }) => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  initialEmail = '',
  initialToken = '',
  onSuccess,
  onNavigateToForgot,
  onNavigateToLogin,
  setFeedback,
}) => {
  const { resetPassword } = useAuth();
  const [resetEmailInput, setResetEmailInput] = useState<string>(initialEmail);
  const [resetTokenInput, setResetTokenInput] = useState<string>(initialToken);
  const [resetNewPassword, setResetNewPassword] = useState<string>('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState<string>('');
  const [showResetPassword, setShowResetPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialEmail) setResetEmailInput(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (initialToken) setResetTokenInput(initialToken);
  }, [initialToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmailInput.trim() || !resetTokenInput.trim() || !resetNewPassword || !resetConfirmPassword) {
      setFeedback({
        type: 'error',
        message: 'Vui lòng điền đầy đủ tất cả các trường.',
      });
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setFeedback({
        type: 'error',
        message: 'Mật khẩu xác nhận không khớp với mật khẩu mới.',
      });
      return;
    }

    if (resetNewPassword.length < 6) {
      setFeedback({
        type: 'error',
        message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: 'info', message: 'Đang đặt lại mật khẩu mới...' });

    try {
      const response = await resetPassword({
        email: resetEmailInput.trim(),
        resetToken: resetTokenInput.trim(),
        newPassword: resetNewPassword,
        confirmPassword: resetConfirmPassword,
      });

      if (response.success) {
        setFeedback({
          type: 'success',
          message: response.message || 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.',
        });
        setTimeout(() => {
          onSuccess(resetEmailInput.trim());
        }, 2000);
      } else {
        setFeedback({
          type: 'error',
          message: response.message || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại mã Token.',
          errors: response.errors || [],
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Lỗi không xác định khi đặt lại mật khẩu.',
        errors: [(err as Error).message],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="auth-form-field p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs flex flex-col gap-1">
        <span className="font-bold text-amber-600 dark:text-amber-300 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          Bước 2: Thiết lập mật khẩu mới
        </span>
        <p className="text-[11px] text-tod-text-muted leading-relaxed">
          Dán <strong>Reset Token</strong> nhận được trong Email và nhập mật khẩu mới của bạn.
        </p>
      </div>

      <div className="auth-form-field flex flex-col gap-1">
        <label className="text-[11px] font-bold text-tod-text">Địa chỉ Email *</label>
        <div className="relative flex items-center">
          <Mail className="absolute left-3 w-4 h-4 text-tod-text-muted" />
          <input
            type="email"
            required
            value={resetEmailInput}
            onChange={(e) => setResetEmailInput(e.target.value)}
            placeholder="email@example.com"
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-tod-card border border-tod-border text-xs text-tod-text placeholder-tod-text-muted focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
      </div>

      <div className="auth-form-field flex flex-col gap-1">
        <label className="text-[11px] font-bold text-tod-text">Mã đặt lại mật khẩu (Token từ Gmail) *</label>
        <div className="relative flex items-center">
          <Key className="absolute left-3 w-4 h-4 text-amber-500 dark:text-amber-400" />
          <input
            type="text"
            required
            value={resetTokenInput}
            onChange={(e) => setResetTokenInput(e.target.value)}
            placeholder="Dán mã Token từ email tại đây..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-tod-card border border-tod-border text-xs text-tod-text placeholder-tod-text-muted focus:outline-none focus:border-amber-500 transition-colors font-mono"
          />
        </div>
      </div>

      <div className="auth-form-field grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-tod-text">Mật khẩu mới *</label>
          <div className="relative flex items-center">
            <Lock className="absolute left-2.5 w-3.5 h-3.5 text-tod-text-muted" />
            <input
              type={showResetPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={resetNewPassword}
              onChange={(e) => setResetNewPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              className="w-full pl-8 pr-7 py-2 rounded-xl bg-tod-card border border-tod-border text-xs text-tod-text placeholder-tod-text-muted focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowResetPassword(!showResetPassword)}
              className="absolute right-2 text-tod-text-muted hover:text-tod-text cursor-pointer"
            >
              {showResetPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-bold text-tod-text">Xác nhận MK *</label>
          <div className="relative flex items-center">
            <Lock className="absolute left-2.5 w-3.5 h-3.5 text-tod-text-muted" />
            <input
              type={showResetPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={resetConfirmPassword}
              onChange={(e) => setResetConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-tod-card border border-tod-border text-xs text-tod-text placeholder-tod-text-muted focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
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
            <span>Đang Đặt Lại...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            <span>Xác Nhận Đổi Mật Khẩu</span>
          </>
        )}
      </button>

      <div className="flex items-center justify-between pt-2 border-t border-tod-border text-[11px]">
        <button
          type="button"
          onClick={onNavigateToForgot}
          className="text-tod-text-muted hover:text-tod-text flex items-center gap-1 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Gửi lại mã Token
        </button>
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="text-amber-500 hover:text-amber-400 font-semibold cursor-pointer transition-colors"
        >
          Đăng nhập ngay →
        </button>
      </div>
    </form>
  );
};
