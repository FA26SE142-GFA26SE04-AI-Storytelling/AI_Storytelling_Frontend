'use client';

import React, { useState, useEffect } from 'react';
import { User, Lock, Eye, EyeOff, LogIn, RefreshCw } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export interface LoginFormProps {
  initialEmail?: string;
  setFeedback: (feedback: { type: 'success' | 'error' | 'info' | null; message: string; errors?: string[] }) => void;
  onNavigateToForgot: (email?: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  initialEmail = '',
  setFeedback,
  onNavigateToForgot,
}) => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState<string>(initialEmail);
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialEmail) {
      setIdentifier(initialEmail);
    }
  }, [initialEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setFeedback({
        type: 'error',
        message: 'Vui lòng điền đầy đủ Email/Tên đăng nhập và Mật khẩu.',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: 'info', message: 'Đang gửi yêu cầu đăng nhập tới Backend API...' });

    try {
      const response = await login({ identifier, password });
      if (response.success && response.data) {
        setFeedback({
          type: 'success',
          message: response.message || 'Đăng nhập thành công! Đã nhận JWT Access Token.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: response.message || 'Đăng nhập không thành công.',
          errors: response.errors || [],
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Lỗi không xác định khi đăng nhập.',
        errors: [(err as Error).message],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="auth-form-field flex flex-col gap-1">
        <label className="text-[11px] font-bold text-zinc-300">Tên Đăng Nhập hoặc Email *</label>
        <div className="relative flex items-center">
          <User className="absolute left-3 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="vd: parent_demo hoặc email@example.com"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors font-medium"
          />
        </div>
      </div>

      <div className="auth-form-field flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-zinc-300">Mật khẩu *</label>
          <button
            type="button"
            onClick={() => onNavigateToForgot(identifier)}
            className="text-[10px] text-sky-400 hover:text-sky-300 transition-colors cursor-pointer"
          >
            Quên mật khẩu?
          </button>
        </div>
        <div className="relative flex items-center">
          <Lock className="absolute left-3 w-4 h-4 text-zinc-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Nhập mật khẩu..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-zinc-400 hover:text-white cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="auth-form-field w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Đang Xác Thực...</span>
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            <span>Đăng Nhập Ngay</span>
          </>
        )}
      </button>
    </form>
  );
};
