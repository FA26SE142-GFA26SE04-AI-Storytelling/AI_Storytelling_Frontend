'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, ArrowRight, BookOpen, ShieldCheck, Sparkles, ArrowLeft, CheckCircle2, Edit2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function SignInPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Step 1: Submit Email -> Proceed to Password Step
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setStep(2);
    }
  };

  // Step 2: Submit Password -> Complete Login
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      setStep(3);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] w-full flex items-center justify-center relative py-4 sm:py-10 px-3 sm:px-4 overflow-hidden">
      {/* Background Animated Glowing Blobs */}
      <div
        className="absolute top-1/4 -left-20 w-80 h-80 rounded-full blur-3xl pointer-events-none animate-float-blob-1 opacity-30 dark:opacity-25"
        style={{ background: 'var(--badge-gradient-1)' }}
      />
      <div
        className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full blur-3xl pointer-events-none animate-float-blob-2 opacity-30 dark:opacity-25"
        style={{ background: 'var(--badge-gradient-2)' }}
      />

      {/* Main Glassmorphic Card */}
      <div className="relative w-full max-w-md group z-10">
        {/* Ambient Radiant Glow Aura */}
        <div className="radiant-glow-aura" />

        {/* Card Content Container */}
        <div className="relative w-full bg-surface-container-lowest/95 dark:bg-[#0F1626]/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl border border-outline-variant/40 dark:border-[#283556] flex flex-col gap-4 sm:gap-6">
          
          {/* Top Bar / Back to Home */}
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant hover:text-primary-container transition-colors group/back"
            >
              <ArrowLeft className="w-4 h-4 group-hover/back:-translate-x-1 transition-transform" />
              <span>Trang chủ</span>
            </Link>
            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-tertiary-container/20 text-on-tertiary-container text-[10px] sm:text-[11px] font-extrabold flex items-center gap-1 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-tertiary-container" />
              Bảo mật cho trẻ
            </span>
          </div>

          {/* Brand Header */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-rose-500/20 mb-1">
              <BookOpen className="w-6 h-6 fill-white/20" />
            </div>

            <h1 className="heading-section text-2xl sm:text-3xl font-black">
              {step === 1 && 'Đăng Nhập Tài Khoản 🔑'}
              {step === 2 && 'Nhập Mật Khẩu 🔒'}
              {step === 3 && 'Chào Mừng Trở Lại! 🌟'}
            </h1>

            <p className="text-subtitle text-xs sm:text-sm max-w-xs">
              {step === 1 && 'Nhập địa chỉ email gia đình của bạn để tiếp tục xác minh'}
              {step === 2 && 'Nhập mật khẩu để truy cập vào kho truyện phép thuật'}
              {step === 3 && 'Xác thực tài khoản thành công! Rất vui được gặp lại bạn.'}
            </p>
          </div>

          {/* STEP 1: EMAIL INPUT & VERIFICATION */}
          {step === 1 && (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="signin-email" className="badge-eyebrow-label text-on-surface-variant">
                  Địa chỉ Email của bạn
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-5 h-5 text-on-surface-variant/60 pointer-events-none" />
                  <input
                    id="signin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ví dụ: baobo@gmail.com"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface-container/60 dark:bg-[#172038] border border-outline-variant/40 dark:border-[#283556] text-on-surface text-sm font-medium placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2 justify-center py-3.5 text-sm sm:text-base font-black shadow-lg"
                icon={<Sparkles className="w-4 h-4 text-amber-300 fill-current" />}
              >
                Tiếp Tục & Xác Minh Email
              </Button>
            </form>
          )}

          {/* STEP 2: PASSWORD INPUT FORM */}
          {step === 2 && (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              {/* Confirmed Email Badge with Edit Option */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container/70 dark:bg-[#172038] border border-outline-variant/30 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-4 h-4 text-primary-container shrink-0" />
                  <span className="font-bold text-on-surface truncate">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 font-bold text-primary-container hover:underline shrink-0 ml-2 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Sửa</span>
                </button>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="signin-password" className="badge-eyebrow-label text-on-surface-variant">
                  Mật khẩu tài khoản
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-5 h-5 text-on-surface-variant/60 pointer-events-none" />
                  <input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3 rounded-2xl bg-surface-container/60 dark:bg-[#172038] border border-outline-variant/40 dark:border-[#283556] text-on-surface text-sm font-medium placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 p-1 text-on-surface-variant/70 hover:text-on-surface cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-on-surface-variant font-semibold">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-outline-variant text-primary-container focus:ring-primary-container w-4 h-4 cursor-pointer"
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <a href="#forgot" className="font-bold text-primary-container hover:underline">
                  Quên mật khẩu?
                </a>
              </div>

              {/* Submit Sign In Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2 justify-center py-3.5 text-sm sm:text-base font-black shadow-lg"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Đăng Nhập
              </Button>
            </form>
          )}

          {/* STEP 3: LOGIN SUCCESS STATE */}
          {step === 3 && (
            <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-tertiary-container/15 border border-tertiary-container/30 gap-4">
              <CheckCircle2 className="w-12 h-12 text-tertiary-container animate-bounce" />
              <div className="flex flex-col gap-1">
                <h3 className="font-extrabold text-on-surface text-base">
                  Đăng nhập thành công!
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Xin chào tài khoản <strong className="text-on-surface">{email}</strong>. Bạn đã có thể tiếp tục tạo & nghe các câu chuyện tuyệt vời.
                </p>
              </div>
              <Link href="/" className="w-full">
                <Button variant="primary" size="md" className="w-full justify-center">
                  Về Trang Chủ & Khám Phá
                </Button>
              </Link>
            </div>
          )}

          {/* Footer Navigation Link */}
          <div className="pt-3 border-t border-outline-variant/30 text-center text-xs font-medium text-on-surface-variant flex items-center justify-center gap-1.5">
            <span>Chưa có tài khoản gia đình?</span>
            <Link
              href="/signup"
              className="font-extrabold text-primary-container hover:underline inline-flex items-center gap-0.5"
            >
              <span>Đăng ký ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
