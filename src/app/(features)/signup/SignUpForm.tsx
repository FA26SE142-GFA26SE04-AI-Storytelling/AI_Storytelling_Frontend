'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight, BookOpen, ShieldCheck, Wand2, ArrowLeft, CheckCircle2, Edit2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const SignUpForm: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Step 1: Submit Email -> Proceed to Profile & Password Step
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setStep(2);
    }
  };

  // Step 2: Submit Profile & Passwords -> Complete Registration
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Vui lòng nhập tên người dùng');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu nhập lại không trùng khớp');
      return;
    }

    setStep(3);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] w-full flex items-center justify-center relative py-4 sm:py-10 px-3 sm:px-4 overflow-hidden">
      {/* Background Animated Glowing Blobs */}
      <div
        className="absolute top-1/4 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none animate-float-blob-1 opacity-30 dark:opacity-25"
        style={{ background: 'var(--badge-gradient-3)' }}
      />
      <div
        className="absolute bottom-1/4 -left-20 w-96 h-96 rounded-full blur-3xl pointer-events-none animate-float-blob-2 opacity-30 dark:opacity-25"
        style={{ background: 'var(--badge-gradient-1)' }}
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
            <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-secondary-container/30 text-on-secondary-container dark:text-amber-300 text-[10px] sm:text-[11px] font-extrabold flex items-center gap-1 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              Tạo tài khoản miễn phí
            </span>
          </div>

          {/* Brand Header */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20 mb-1">
              <Wand2 className="w-6 h-6 text-white" />
            </div>

            <h1 className="heading-section text-2xl sm:text-3xl font-black">
              {step === 1 && 'Tạo Tài Khoản Mới ✨'}
              {step === 2 && 'Hoàn Thiện Thông Tin 📝'}
              {step === 3 && 'Đăng Ký Thành Công! 🎉'}
            </h1>

            <p className="text-subtitle text-xs sm:text-sm max-w-xs">
              {step === 1 && 'Nhập email phụ huynh để xác minh và khởi tạo tài khoản'}
              {step === 2 && 'Điền tên người dùng và cài đặt mật khẩu an toàn'}
              {step === 3 && 'Tài khoản của bạn đã được thiết lập sẵn sàng sử dụng.'}
            </p>
          </div>

          {/* STEP 1: EMAIL VERIFICATION */}
          {step === 1 && (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="signup-email" className="badge-eyebrow-label text-on-surface-variant">
                  Địa chỉ Email của Phụ huynh
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-5 h-5 text-on-surface-variant/60 pointer-events-none" />
                  <input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ví dụ: phuhuynh@gmail.com"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface-container/60 dark:bg-[#172038] border border-outline-variant/40 dark:border-[#283556] text-on-surface text-sm font-medium placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2 justify-center py-3.5 text-sm sm:text-base font-black shadow-lg"
                icon={<BookOpen className="w-4 h-4 text-secondary-container fill-current" />}
              >
                Tiếp Tục & Xác Minh Email
              </Button>
            </form>
          )}

          {/* STEP 2: FULL NAME + PASSWORD + CONFIRM PASSWORD FORM */}
          {step === 2 && (
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
              {/* Verified Email Summary Badge */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container/70 dark:bg-[#172038] border border-outline-variant/30 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-4 h-4 text-tertiary-container shrink-0" />
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

              {/* Error Alert Box */}
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Field 1: User / Parent Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="signup-name" className="badge-eyebrow-label text-on-surface-variant">
                  Tên người dùng / Tên phụ huynh
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3.5 w-5 h-5 text-on-surface-variant/60 pointer-events-none" />
                  <input
                    id="signup-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Mẹ Thu Thông Thái"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-surface-container/60 dark:bg-[#172038] border border-outline-variant/40 dark:border-[#283556] text-on-surface text-sm font-medium placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="signup-password" className="badge-eyebrow-label text-on-surface-variant">
                  Nhập mật khẩu (Tối thiểu 6 ký tự)
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-5 h-5 text-on-surface-variant/60 pointer-events-none" />
                  <input
                    id="signup-password"
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

              {/* Field 3: Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="signup-confirm-password" className="badge-eyebrow-label text-on-surface-variant">
                  Nhập lại mật khẩu
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-5 h-5 text-on-surface-variant/60 pointer-events-none" />
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3 rounded-2xl bg-surface-container/60 dark:bg-[#172038] border border-outline-variant/40 dark:border-[#283556] text-on-surface text-sm font-medium placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary-container focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 p-1 text-on-surface-variant/70 hover:text-on-surface cursor-pointer"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Registration Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2 justify-center py-3.5 text-sm sm:text-base font-black shadow-lg"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Hoàn Tất Đăng Ký Tài Khoản
              </Button>
            </form>
          )}

          {/* STEP 3: REGISTRATION SUCCESS STATE */}
          {step === 3 && (
            <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-tertiary-container/15 border border-tertiary-container/30 gap-4">
              <CheckCircle2 className="w-12 h-12 text-tertiary-container animate-bounce" />
              <div className="flex flex-col gap-1">
                <h3 className="font-extrabold text-on-surface text-base">
                  Chúc mừng {fullName}! 🎉
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Tài khoản gia đình với email <strong className="text-on-surface">{email}</strong> đã được khởi tạo thành công. Bạn đã nhận ngay 120 xu thưởng!
                </p>
              </div>
              <Link href="/" className="w-full">
                <Button variant="primary" size="md" className="w-full justify-center">
                  Khám Phá MagicTales Ngay!
                </Button>
              </Link>
            </div>
          )}

          {/* Footer Navigation Link */}
          <div className="pt-3 border-t border-outline-variant/30 text-center text-xs font-medium text-on-surface-variant flex items-center justify-center gap-1.5">
            <span>Đã có tài khoản gia đình?</span>
            <Link
              href="/signin"
              className="font-extrabold text-primary-container hover:underline inline-flex items-center gap-0.5"
            >
              <span>Đăng nhập tại đây</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};
