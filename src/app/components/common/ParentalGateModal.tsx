'use client';

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { animateModalPop } from '../../utils/gsapAnimations';
import { Lock, ShieldAlert, X, CheckCircle, RefreshCw, KeyRound, Calculator, Loader2 } from 'lucide-react';
import { parentalGateService } from '../../services/parentalGateService';
import { useAuth } from '../../context/AuthContext';

gsap.registerPlugin(useGSAP);

export interface ParentalGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export const ParentalGateModal: React.FC<ParentalGateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Cổng Bảo Vệ Phụ Huynh (Parental Gate)',
  description = 'Để thoát phiên đọc của bé hoặc quay lại khu vực quản trị người lớn, vui lòng hoàn thành thử thách bảo vệ:',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [authMode, setAuthMode] = useState<'math' | 'account'>('math');
  const [numA, setNumA] = useState<number>(7);
  const [numB, setNumB] = useState<number>(8);
  const [answerInput, setAnswerInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [isVerifyingAccount, setIsVerifyingAccount] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const generateProblem = () => {
    const a = Math.floor(6 + Math.random() * 7); // 6 to 12
    const b = Math.floor(4 + Math.random() * 9); // 4 to 12
    setNumA(a);
    setNumB(b);
    setAnswerInput('');
    setErrorMsg(null);
  };

  useEffect(() => {
    if (isOpen) {
      generateProblem();
      if (user?.email) {
        setEmailInput(user.email);
      }
      setPasswordInput('');
      setErrorMsg(null);
    }
  }, [isOpen, user]);

  useGSAP(() => {
    if (isOpen) {
      animateModalPop('.parental-gate-card');
    }
  }, { scope: modalRef, dependencies: [isOpen] });

  if (!isOpen) return null;

  const correctAnswer = numA * numB;

  const handleMathSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseInt(answerInput.trim(), 10);
    if (isNaN(val) || val !== correctAnswer) {
      setErrorMsg('Kết quả phép tính chưa chính xác. Vui lòng thử lại!');
      return;
    }
    onSuccess();
  };

  const handleAccountSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!emailInput.trim() || !passwordInput.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ email và mật khẩu phụ huynh.');
      return;
    }

    setIsVerifyingAccount(true);
    setErrorMsg(null);

    try {
      const res = await parentalGateService.verify({
        email: emailInput.trim(),
        password: passwordInput,
      });

      if (res.success) {
        onSuccess();
      } else {
        setErrorMsg(res.message || 'Mật khẩu phụ huynh không chính xác.');
      }
    } catch {
      setErrorMsg('Lỗi kết nối máy chủ xác thực.');
    } finally {
      setIsVerifyingAccount(false);
    }
  };

  return (
    <div
      ref={modalRef}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-lg overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="parental-gate-card pointer-events-auto w-full max-w-md rounded-3xl bg-tod-card border border-indigo-500/40 shadow-[0_25px_60px_rgba(0,0,0,0.5)] p-5 sm:p-6 text-tod-text space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-tod-border">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-tod-text">{title}</h3>
              <span className="text-[10px] text-tod-text-muted">Xác thực người lớn giám sát (COPPA)</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-tod-surface hover:bg-tod-card border border-tod-border text-tod-text-muted hover:text-tod-text transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex p-1 rounded-xl bg-tod-surface border border-tod-border gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setAuthMode('math');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              authMode === 'math'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-tod-text-muted hover:text-tod-text'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Phép Tính Nhanh</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('account');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              authMode === 'account'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-tod-text-muted hover:text-tod-text'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Xác Thực Mật Khẩu</span>
          </button>
        </div>

        {/* Prompt Description */}
        <p className="text-xs text-tod-text-muted leading-relaxed">{description}</p>

        {/* MODE 1: MATH CHALLENGE */}
        {authMode === 'math' && (
          <form onSubmit={handleMathSubmit} className="space-y-3">
            <div className="p-4 rounded-2xl bg-tod-surface border border-tod-border flex flex-col items-center justify-center gap-2">
              <span className="text-[11px] font-bold text-tod-text-muted uppercase tracking-wider">
                Câu hỏi xác minh
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-500 dark:text-amber-400 tracking-wider">
                {numA} × {numB} = ?
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-tod-text">Nhập kết quả phép nhân:</label>
              <input
                type="number"
                value={answerInput}
                onChange={(e) => {
                  setAnswerInput(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="VD: 56"
                autoFocus
                className="dashboard-input text-center text-lg font-black font-mono tracking-widest"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-600 dark:text-rose-300 text-xs font-medium text-center">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={generateProblem}
                className="px-3 py-2 rounded-xl bg-tod-surface hover:bg-tod-card border border-tod-border text-tod-text-muted hover:text-tod-text font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Đổi câu khác</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 rounded-xl bg-tod-surface hover:bg-tod-card border border-tod-border text-tod-text-muted hover:text-tod-text font-bold text-xs transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-indigo-500/25 cursor-pointer transition-all hover:scale-105"
                >
                  Xác Nhận Mở Khóa
                </button>
              </div>
            </div>
          </form>
        )}

        {/* MODE 2: ACCOUNT PASSWORD VERIFICATION */}
        {authMode === 'account' && (
          <form onSubmit={handleAccountSubmit} className="space-y-3">
            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-bold text-tod-text block mb-1">Email phụ huynh:</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="name@example.com"
                  className="dashboard-input text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-tod-text block mb-1">Mật khẩu tài khoản:</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="••••••••"
                  autoFocus
                  className="dashboard-input text-xs"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-600 dark:text-rose-300 text-xs font-medium text-center">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-tod-surface hover:bg-tod-card border border-tod-border text-tod-text-muted hover:text-tod-text font-bold text-xs transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isVerifyingAccount}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-indigo-500/25 cursor-pointer transition-all hover:scale-105 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isVerifyingAccount && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isVerifyingAccount ? 'Đang xác thực...' : 'Xác Thực API'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
