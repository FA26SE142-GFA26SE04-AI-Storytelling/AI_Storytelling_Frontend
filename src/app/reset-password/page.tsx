'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, ArrowRight, ArrowLeft, RefreshCw, Key, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const initialToken = searchParams.get('token') || '';

  const { resetPassword } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [resetToken, setResetToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    errors?: string[];
  }>({ type: null, message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !resetToken.trim() || !newPassword || !confirmPassword) {
      setFeedback({ type: 'error', message: 'Vui lòng điền đầy đủ tất cả các trường.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Mật khẩu xác nhận không khớp với mật khẩu mới.' });
      return;
    }

    if (newPassword.length < 6) {
      setFeedback({ type: 'error', message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: null, message: '' });

    try {
      const response = await resetPassword({
        email: email.trim(),
        resetToken: resetToken.trim(),
        newPassword,
        confirmPassword,
      });

      if (response.success) {
        setFeedback({
          type: 'success',
          message: response.message || 'Đặt lại mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới để đăng nhập.',
        });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setFeedback({
          type: 'error',
          message: response.message || 'Đặt lại mật khẩu không thành công. Vui lòng kiểm tra lại mã Token.',
          errors: response.errors || [],
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Có lỗi xảy ra khi đặt lại mật khẩu. Vui lòng thử lại.',
        errors: [(err as Error).message],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2 text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white">Đặt Lại Mật Khẩu</h1>
        <p className="text-xs text-zinc-400">
          Nhập mã token từ email và thiết lập mật khẩu mới cho tài khoản của bạn.
        </p>
      </div>

      {/* Feedback Alert */}
      {feedback.type && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex flex-col gap-1.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2 font-bold">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          {feedback.errors && feedback.errors.length > 0 && (
            <ul className="pl-6 list-disc text-[11px] opacity-90">
              {feedback.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          )}
          {feedback.type === 'success' && (
            <Link
              href="/"
              className="mt-2 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 font-bold transition-all"
            >
              <span>Về Trang Chủ Đăng Nhập Ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-zinc-300">Địa chỉ Email</label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 w-4 h-4 text-zinc-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {/* Token */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-zinc-300">Mã Token Đặt Lại (từ Gmail)</label>
          <div className="relative flex items-center">
            <Key className="absolute left-3.5 w-4 h-4 text-amber-400" />
            <input
              type="text"
              required
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              placeholder="Dán mã Token nhận được từ email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors font-mono"
            />
          </div>
        </div>

        {/* New Password */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-300">Mật khẩu mới</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-zinc-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full pl-9 pr-9 py-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 p-1 text-zinc-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-300">Xác nhận mật khẩu</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-zinc-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại MK"
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Đang Cập Nhật Mật Khẩu...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Cập Nhật Mật Khẩu Mới</span>
            </>
          )}
        </button>
      </form>

      {/* Footers */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80 text-xs">
        <Link
          href="/forgot-password"
          className="text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Gửi lại mã mới</span>
        </Link>
        <Link
          href="/"
          className="text-sky-400 hover:text-sky-300 font-semibold transition-colors"
        >
          Quay lại Đăng nhập →
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950 text-white select-none">
      <Suspense fallback={<div className="text-zinc-400 text-sm">Đang tải biểu mẫu...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
