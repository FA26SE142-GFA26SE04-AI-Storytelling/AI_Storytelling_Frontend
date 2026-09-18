'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Key, ShieldCheck, RefreshCw } from 'lucide-react';
import { authService } from '../../../services/authService';

export interface VerifyEmailFormProps {
  initialEmail?: string;
  initialToken?: string;
  onSuccess: (email: string) => void;
  setFeedback: (feedback: { type: 'success' | 'error' | 'info' | null; message: string; errors?: string[] }) => void;
}

export const VerifyEmailForm: React.FC<VerifyEmailFormProps> = ({
  initialEmail = '',
  initialToken = '',
  onSuccess,
  setFeedback,
}) => {
  const [verifyEmailInput, setVerifyEmailInput] = useState<string>(initialEmail);
  const [verifyTokenInput, setVerifyTokenInput] = useState<string>(initialToken);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialEmail) setVerifyEmailInput(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (initialToken) setVerifyTokenInput(initialToken);
  }, [initialToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyEmailInput.trim() || !verifyTokenInput.trim()) {
      setFeedback({
        type: 'error',
        message: 'Vui lòng nhập đầy đủ Email và Mã xác thực (Token).',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: 'info', message: 'Đang gửi yêu cầu xác thực email tới Backend API...' });

    try {
      const res = await authService.verifyEmail({
        email: verifyEmailInput.trim(),
        token: verifyTokenInput.trim(),
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message || 'Xác thực Email thành công! Bạn có thể đăng nhập ngay.',
        });
        setTimeout(() => {
          onSuccess(verifyEmailInput.trim());
        }, 1500);
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Mã xác thực không hợp lệ hoặc đã hết hạn.',
          errors: res.errors || [],
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Lỗi khi xác thực Email.',
        errors: [(err as Error).message],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="auth-form-field p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs flex flex-col gap-1">
        <span className="font-bold text-indigo-300 flex items-center gap-1.5">
          <Key className="w-4 h-4 text-amber-300" />
          Kích hoạt tài khoản bằng mã bảo mật
        </span>
        <p className="text-[11px] text-zinc-300 leading-relaxed">
          Hệ thống đã gửi một <strong>Token xác thực</strong> đến hòm thư của bạn khi đăng ký.
        </p>
      </div>

      <div className="auth-form-field flex flex-col gap-1">
        <label className="text-[11px] font-bold text-zinc-300">Địa chỉ Email *</label>
        <div className="relative flex items-center">
          <Mail className="absolute left-3 w-4 h-4 text-zinc-400" />
          <input
            type="email"
            required
            value={verifyEmailInput}
            onChange={(e) => setVerifyEmailInput(e.target.value)}
            placeholder="email@example.com"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors font-medium"
          />
        </div>
      </div>

      <div className="auth-form-field flex flex-col gap-1">
        <label className="text-[11px] font-bold text-zinc-300">Mã Xác Thực (Token từ Gmail) *</label>
        <div className="relative flex items-center">
          <Key className="absolute left-3 w-4 h-4 text-amber-400" />
          <input
            type="text"
            required
            value={verifyTokenInput}
            onChange={(e) => setVerifyTokenInput(e.target.value)}
            placeholder="Dán mã Token nhận được từ email vào đây..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors font-mono"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="auth-form-field w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Đang Kiểm Tra Mã...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            <span>Xác Thực Tài Khoản</span>
          </>
        )}
      </button>
    </form>
  );
};
