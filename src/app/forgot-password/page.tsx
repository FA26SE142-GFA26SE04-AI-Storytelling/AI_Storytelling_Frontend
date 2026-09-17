'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, ArrowLeft, RefreshCw, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    errors?: string[];
  }>({ type: null, message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setFeedback({ type: 'error', message: 'Vui lòng nhập địa chỉ email.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: null, message: '' });

    try {
      const response = await forgotPassword({ email: email.trim() });
      if (response.success) {
        setFeedback({
          type: 'success',
          message: response.message || 'Nếu email tồn tại trong hệ thống, hướng dẫn và mã đặt lại mật khẩu đã được gửi đến hòm thư của bạn.',
        });
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
        message: 'Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại.',
        errors: [(err as Error).message],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950 text-white select-none">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col gap-2 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Key className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Quên Mật Khẩu</h1>
          <p className="text-xs text-zinc-400">
            Nhập email của bạn để nhận mã xác nhận đặt lại mật khẩu mới.
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
                href={`/reset-password?email=${encodeURIComponent(email.trim())}`}
                className="mt-2 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 font-bold transition-all"
              >
                <span>Chuyển tới trang Đặt lại mật khẩu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
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
                <span>Đang Gửi Mã...</span>
              </>
            ) : (
              <>
                <span>Gửi Mã Đặt Lại Mật Khẩu</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footers */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80 text-xs">
          <Link
            href="/"
            className="text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Trang Chủ</span>
          </Link>
          <Link
            href={`/reset-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
            className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
          >
            Đã có mã? Đặt lại MK →
          </Link>
        </div>
      </div>
    </div>
  );
}
