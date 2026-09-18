'use client';

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { animateModalPop, animateStaggerList } from '../../utils/gsapAnimations';
import { useAuth } from '../../context/AuthContext';
import { TimeOfDay } from '../three/RoomCanvas';
import {
  X,
  LogIn,
  UserPlus,
  ArrowLeft,
  RefreshCw,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

// Subcomponents
import { LoginForm } from './forms/LoginForm';
import { RegisterForm } from './forms/RegisterForm';
import { VerifyEmailForm } from './forms/VerifyEmailForm';
import { ForgotPasswordForm } from './forms/ForgotPasswordForm';
import { ResetPasswordForm } from './forms/ResetPasswordForm';
import { UserProfileView } from './profile/UserProfileView';

gsap.registerPlugin(useGSAP);

export interface BackpackAuthZoomOverlayProps {
  currentStage: number;
  onStageChange: (stageIndex: number) => void;
  timeOfDay?: TimeOfDay;
  onTimeOfDayChange?: (time: TimeOfDay) => void;
  initialAuthTab?: 'signin' | 'signup' | 'verify' | 'forgot' | 'reset';
  initialEmail?: string;
  initialToken?: string;
}

export const BackpackAuthZoomOverlay: React.FC<BackpackAuthZoomOverlayProps> = ({
  currentStage: _currentStage,
  onStageChange,
  initialAuthTab = 'signin',
  initialEmail = '',
  initialToken = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [authTab, setAuthTab] = useState<'signin' | 'signup' | 'verify' | 'forgot' | 'reset'>(initialAuthTab);
  const [activeEmail, setActiveEmail] = useState<string>(initialEmail);
  const [activeToken, setActiveToken] = useState<string>(initialToken);

  const {
    user,
    accessToken,
    isLoggedIn,
    changePassword,
    logout,
    refreshProfile,
    refreshToken,
  } = useAuth();

  // Feedback Alert State
  const [apiFeedback, setApiFeedback] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
    errors?: string[];
  }>({ type: null, message: '' });

  // Sync initial props if changed externally
  useEffect(() => {
    if (initialAuthTab) setAuthTab(initialAuthTab);
  }, [initialAuthTab]);

  useEffect(() => {
    if (initialEmail) setActiveEmail(initialEmail);
  }, [initialEmail]);

  useEffect(() => {
    if (initialToken) setActiveToken(initialToken);
  }, [initialToken]);

  // Refresh profile if logged in
  useEffect(() => {
    if (isLoggedIn && refreshProfile) {
      refreshProfile();
    }
  }, [isLoggedIn, refreshProfile]);

  // GSAP: Modal entrance animation
  useGSAP(() => {
    animateModalPop('.auth-modal-card');
    animateStaggerList('.auth-form-field', { delay: 0.12, stagger: 0.04 });
  }, { scope: containerRef });

  // GSAP: Stagger animation on tab change
  useGSAP(() => {
    animateStaggerList('.auth-form-field', { stagger: 0.035, duration: 0.3 });
  }, { scope: containerRef, dependencies: [authTab] });

  return (
    <div ref={containerRef} className="fixed inset-y-0 left-4 sm:left-10 z-30 flex items-center pointer-events-none">
      <div className="auth-modal-card pointer-events-auto w-[92vw] sm:w-[440px] max-h-[88vh] overflow-y-auto p-5 sm:p-6 rounded-3xl bg-zinc-900/95 dark:bg-zinc-950/95 backdrop-blur-2xl border border-sky-500/40 shadow-[0_0_60px_rgba(56,189,248,0.25)] text-white scrollbar-thin scrollbar-thumb-zinc-700">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md">
              {isLoggedIn ? (
                <ShieldCheck className="w-4 h-4" />
              ) : authTab === 'signin' ? (
                <LogIn className="w-4 h-4" />
              ) : authTab === 'verify' ? (
                <Key className="w-4 h-4 text-amber-300" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="font-black text-base tracking-tight text-white flex items-center gap-2">
                <span className="text-white drop-shadow-sm font-black">
                  {isLoggedIn
                    ? 'Hồ Sơ & Thông Tin Tài Khoản'
                    : authTab === 'signin'
                    ? 'Đăng Nhập MagicTales'
                    : authTab === 'verify'
                    ? 'Xác Thực Email'
                    : 'Đăng Ký Tài Khoản'}
                </span>
              </h2>
              <p className="text-[10px] text-zinc-300 font-medium">
                {isLoggedIn ? 'Thông tin cá nhân & Quản lý gia đình MagicTales' : 'Cặp Sách Nobita 3D Auth'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onStageChange(0)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Quay lại góc nhìn toàn cảnh"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* IF USER IS LOGGED IN: DISPLAY ALL USER PROFILE INFORMATION */}
        {isLoggedIn && user ? (
          <UserProfileView
            user={user}
            accessToken={accessToken}
            onStageChange={onStageChange}
            logout={logout}
            changePassword={changePassword}
            refreshToken={refreshToken}
          />
        ) : (
          /* IF NOT LOGGED IN: DISPLAY LOGIN, REGISTER OR VERIFY MAIL FORM */
          <div>
            {/* Notice for incoming invitation claim */}
            {typeof window !== 'undefined' && sessionStorage.getItem('pendingInvitationCode') && (
              <div className="mb-3 p-3 rounded-2xl bg-gradient-to-r from-sky-950/70 to-indigo-950/70 border border-sky-500/40 text-xs flex items-start gap-2.5 shadow-md">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-sky-300">Xác nhận danh tính Phụ huynh</span>
                  <p className="text-[11px] text-zinc-300 leading-normal">
                    Bạn đang có mã mời kết nối giám sát bé. Vui lòng tạo tài khoản bằng Email/SĐT cá nhân và xác thực OTP để đảm bảo quyền lợi bảo vệ dữ liệu cho con.
                  </p>
                </div>
              </div>
            )}

            {/* Tab Selector */}
            {authTab === 'forgot' || authTab === 'reset' ? (
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('signin');
                    setApiFeedback({ type: null, message: '' });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Đăng Nhập</span>
                </button>
                <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800/80 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('forgot');
                      setApiFeedback({ type: null, message: '' });
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      authTab === 'forgot'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    1. Gửi Mã
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthTab('reset');
                      setApiFeedback({ type: null, message: '' });
                    }}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      authTab === 'reset'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    2. Đặt Lại MK
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 bg-zinc-950/80 p-1 rounded-2xl border border-zinc-800/80 mb-4 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('signin');
                    setApiFeedback({ type: null, message: '' });
                  }}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    authTab === 'signin'
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Đăng Nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('signup');
                    setApiFeedback({ type: null, message: '' });
                  }}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    authTab === 'signup'
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Đăng Ký
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('verify');
                    setApiFeedback({ type: null, message: '' });
                  }}
                  className={`py-2 rounded-xl transition-all cursor-pointer ${
                    authTab === 'verify'
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md shadow-sky-500/20'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Xác Thực
                </button>
              </div>
            )}

            {/* General Feedback Alert Box */}
            {apiFeedback.type && (
              <div
                className={`auth-form-field mb-4 p-3 rounded-2xl text-xs flex items-start gap-2.5 shadow-lg ${
                  apiFeedback.type === 'success'
                    ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
                    : apiFeedback.type === 'error'
                    ? 'bg-rose-950/80 border border-rose-500/50 text-rose-200'
                    : 'bg-sky-950/80 border border-sky-500/50 text-sky-200'
                }`}
              >
                {apiFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : apiFeedback.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                ) : (
                  <RefreshCw className="w-4 h-4 shrink-0 text-sky-400 animate-spin mt-0.5" />
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold leading-tight">{apiFeedback.message}</span>
                  {apiFeedback.errors && apiFeedback.errors.length > 0 && (
                    <ul className="list-disc list-inside text-[11px] text-rose-300 mt-1">
                      {apiFeedback.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* FORM TAB 1: SIGN IN */}
            {authTab === 'signin' && (
              <LoginForm
                initialEmail={activeEmail}
                setFeedback={setApiFeedback}
                onNavigateToForgot={(email) => {
                  setAuthTab('forgot');
                  if (email) setActiveEmail(email);
                  setApiFeedback({ type: null, message: '' });
                }}
              />
            )}

            {/* FORM TAB 2: REGISTER */}
            {authTab === 'signup' && (
              <RegisterForm
                setFeedback={setApiFeedback}
                onSuccess={(email) => {
                  setActiveEmail(email);
                  setAuthTab('verify');
                }}
              />
            )}

            {/* FORM TAB 3: VERIFY EMAIL */}
            {authTab === 'verify' && (
              <VerifyEmailForm
                initialEmail={activeEmail}
                initialToken={activeToken}
                setFeedback={setApiFeedback}
                onSuccess={(email) => {
                  setActiveEmail(email);
                  setAuthTab('signin');
                  setApiFeedback({
                    type: 'success',
                    message: 'Email đã kích hoạt. Vui lòng nhập mật khẩu để đăng nhập.',
                  });
                }}
              />
            )}

            {/* FORM TAB 4: FORGOT PASSWORD */}
            {authTab === 'forgot' && (
              <ForgotPasswordForm
                initialEmail={activeEmail}
                setFeedback={setApiFeedback}
                onSuccess={(email) => {
                  setActiveEmail(email);
                  setAuthTab('reset');
                }}
                onNavigateToLogin={() => {
                  setAuthTab('signin');
                  setApiFeedback({ type: null, message: '' });
                }}
                onNavigateToReset={(email) => {
                  setAuthTab('reset');
                  if (email) setActiveEmail(email);
                  setApiFeedback({ type: null, message: '' });
                }}
              />
            )}

            {/* FORM TAB 5: RESET PASSWORD */}
            {authTab === 'reset' && (
              <ResetPasswordForm
                initialEmail={activeEmail}
                initialToken={activeToken}
                setFeedback={setApiFeedback}
                onSuccess={(email) => {
                  setActiveEmail(email);
                  setActiveToken('');
                  setAuthTab('signin');
                }}
                onNavigateToForgot={() => {
                  setAuthTab('forgot');
                  setApiFeedback({ type: null, message: '' });
                }}
                onNavigateToLogin={() => {
                  setAuthTab('signin');
                  setApiFeedback({ type: null, message: '' });
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
