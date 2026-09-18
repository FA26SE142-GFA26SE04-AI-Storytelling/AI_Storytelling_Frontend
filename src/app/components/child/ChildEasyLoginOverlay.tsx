'use client';

import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { animateModalPop } from '../../utils/gsapAnimations';
import {
  Sparkles,
  X,
  Lock,
  ArrowLeft,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Delete,
  BookOpen,
} from 'lucide-react';
import { ChildProfile } from '../../types/childProfile';
import { CHILD_AVATAR_LIST, ChildAccessCredential } from '../../types/childCredential';
import { childAccessCredentialService } from '../../services/childAccessCredentialService';

gsap.registerPlugin(useGSAP);

export interface ChildEasyLoginOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  childProfiles: ChildProfile[];
  onLoginSuccess: (child: ChildProfile) => void;
}

export const ChildEasyLoginOverlay: React.FC<ChildEasyLoginOverlayProps> = ({
  isOpen,
  onClose,
  childProfiles,
  onLoginSuccess,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'avatar' | 'scan'>('avatar');
  const [badgeCodeInput, setBadgeCodeInput] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setSelectedChild(null);
      setEnteredPin('');
      setErrorMsg(null);
      setIsSuccess(false);
      setBadgeCodeInput('');
    }
  }, [isOpen]);

  useGSAP(() => {
    if (isOpen) {
      animateModalPop('.child-login-card');
    }
  }, { scope: overlayRef, dependencies: [isOpen, selectedChild, activeTab] });

  if (!isOpen) return null;

  const handleSelectChild = (child: ChildProfile) => {
    setSelectedChild(child);
    setEnteredPin('');
    setErrorMsg(null);
  };

  const handleDigitClick = (digit: string) => {
    if (enteredPin.length >= 4) return;
    const nextPin = enteredPin + digit;
    setEnteredPin(nextPin);
    setErrorMsg(null);

    // Tự động kiểm tra khi nhập đủ 4 số
    if (nextPin.length === 4 && selectedChild) {
      submitPin(selectedChild, nextPin);
    }
  };

  const handleDeleteDigit = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleClearPin = () => {
    setEnteredPin('');
    setErrorMsg(null);
  };

  const submitPin = (child: ChildProfile, pin: string) => {
    const result = childAccessCredentialService.verifyPin(child.id, pin);
    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        onLoginSuccess(child);
      }, 700);
    } else {
      setErrorMsg(result.message);
      setEnteredPin('');
    }
  };

  const handleBadgeCodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!badgeCodeInput.trim()) return;
    const res = childAccessCredentialService.verifyEasyBadgeCode(childProfiles, badgeCodeInput);
    if (res.success && res.childProfileId) {
      const foundChild = childProfiles.find((c) => c.id === res.childProfileId);
      if (foundChild) {
        setIsSuccess(true);
        setTimeout(() => {
          onLoginSuccess(foundChild);
        }, 700);
        return;
      }
    }
    setErrorMsg(res.message || 'Mã thẻ không hợp lệ.');
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-zinc-950/90 backdrop-blur-xl overflow-y-auto"
    >
      <div className="child-login-card w-full max-w-lg rounded-3xl bg-gradient-to-br from-indigo-950/95 via-zinc-950/95 to-slate-950/95 border-2 border-amber-400/40 shadow-[0_25px_70px_rgba(0,0,0,0.95)] p-5 sm:p-7 text-white space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/25">
              <Sparkles className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black bg-gradient-to-r from-amber-300 via-rose-300 to-sky-300 bg-clip-text text-transparent">
                Xin Chào Bé Yêu!
              </h2>
              <p className="text-xs text-zinc-300">
                Hãy chọn ảnh đại diện của bé hoặc quét thẻ để đọc truyện nhé
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Chọn Avatar hoặc Nhập Thẻ */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-zinc-900/80 border border-zinc-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('avatar');
              setSelectedChild(null);
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'avatar'
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Chọn Hình Đại Diện Của Bé</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('scan');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'scan'
                ? 'bg-sky-500 text-zinc-950 shadow-md shadow-sky-500/20'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Thẻ Đọc Sách EasyLogin</span>
          </button>
        </div>

        {/* SUCCESS CELEBRATION */}
        {isSuccess && (
          <div className="py-10 flex flex-col items-center justify-center gap-3 text-center animate-in zoom-in-90 duration-300">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/30 border-2 border-emerald-400 flex items-center justify-center text-4xl shadow-xl shadow-emerald-500/30">
              🎉
            </div>
            <h3 className="text-xl font-black text-emerald-300">Đăng Nhập Thành Công!</h3>
            <p className="text-xs text-zinc-300">Đang đưa bé vào Kệ Sách Thần Kỳ...</p>
          </div>
        )}

        {/* TAB 1: AVATAR SELECTION & PIN PAD */}
        {!isSuccess && activeTab === 'avatar' && (
          <>
            {!selectedChild ? (
              /* Bước 1: Danh sách hồ sơ các bé */
              <div className="space-y-3">
                <span className="text-xs font-bold text-zinc-300 block">
                  Bấm vào tên và linh vật của bé:
                </span>
                {childProfiles.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto dashboard-scrollbar p-1">
                    {childProfiles.map((child) => {
                      const cred = childAccessCredentialService.getCredential(child.id);
                      const avatar =
                        CHILD_AVATAR_LIST.find((a) => a.id === cred.avatarId) || CHILD_AVATAR_LIST[0];
                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => handleSelectChild(child)}
                          className="p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800/90 border border-zinc-700 hover:border-amber-400 hover:scale-105 transition-all flex flex-col items-center gap-2 cursor-pointer shadow-md group"
                        >
                          <div
                            className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${avatar.bgColor} border ${avatar.borderColor} flex items-center justify-center text-3xl shadow-md group-hover:scale-110 transition-transform`}
                          >
                            {avatar.emoji}
                          </div>
                          <div className="text-center">
                            <span className="text-sm font-black text-white block group-hover:text-amber-300 transition-colors">
                              {child.nickname}
                            </span>
                            <span className="text-[10px] text-zinc-400">{avatar.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-400">
                    Chưa có hồ sơ bé nào. Vui lòng nhờ bố mẹ đăng nhập vào Laptop để tạo hồ sơ cho bé nhé!
                  </div>
                )}
              </div>
            ) : (
              /* Bước 2: Bàn phím PIN to tròn cho bé */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedChild(null);
                      setEnteredPin('');
                      setErrorMsg(null);
                    }}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white font-bold cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Chọn bé khác</span>
                  </button>
                  <span className="text-xs font-bold text-amber-300">
                    Bé: <strong>{selectedChild.nickname}</strong>
                  </span>
                </div>

                {/* Ô hiển thị 4 chấm PIN */}
                <div className="flex items-center justify-center gap-3 py-2">
                  {[0, 1, 2, 3].map((idx) => {
                    const filled = enteredPin.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-5 h-5 rounded-full border-2 transition-all ${
                          filled
                            ? 'bg-amber-400 border-amber-300 scale-125 shadow-lg shadow-amber-400/50'
                            : 'bg-zinc-900 border-zinc-700'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Thông báo lỗi */}
                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs font-bold text-center">
                    {errorMsg}
                  </div>
                )}

                {/* Bàn phím số to tròn */}
                <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto pt-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleDigitClick(digit)}
                      className="h-12 rounded-2xl bg-zinc-900/90 hover:bg-amber-500 hover:text-zinc-950 active:scale-95 text-white font-black text-xl border border-zinc-700 hover:border-amber-400 transition-all shadow-md cursor-pointer flex items-center justify-center"
                    >
                      {digit}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClearPin}
                    className="h-12 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs border border-zinc-800 transition-all cursor-pointer flex items-center justify-center"
                  >
                    Xóa hết
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDigitClick('0')}
                    className="h-12 rounded-2xl bg-zinc-900/90 hover:bg-amber-500 hover:text-zinc-950 active:scale-95 text-white font-black text-xl border border-zinc-700 hover:border-amber-400 transition-all shadow-md cursor-pointer flex items-center justify-center"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteDigit}
                    className="h-12 rounded-2xl bg-zinc-900/60 hover:bg-rose-900/60 text-zinc-300 hover:text-rose-300 font-bold text-xs border border-zinc-800 transition-all cursor-pointer flex items-center justify-center"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: QUÉT THẺ EASYLOGIN */}
        {!isSuccess && activeTab === 'scan' && (
          <form onSubmit={handleBadgeCodeSubmit} className="space-y-3">
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center space-y-2">
              <QrCode className="w-12 h-12 text-sky-400 mx-auto" />
              <p className="text-xs text-zinc-300 leading-relaxed max-w-xs mx-auto">
                Nhập mã in trên Thẻ Đọc Sách của bé (Ví dụ: <strong className="text-amber-400">KID-1-FOX-8921</strong>)
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">Mã Thẻ EasyLogin:</label>
              <input
                type="text"
                value={badgeCodeInput}
                onChange={(e) => {
                  setBadgeCodeInput(e.target.value.toUpperCase());
                  setErrorMsg(null);
                }}
                placeholder="VD: KID-1-FOX-8921"
                className="dashboard-input uppercase font-mono text-center tracking-wider font-bold"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs font-bold text-center">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02] cursor-pointer"
            >
              Xác Nhận Thẻ & Đọc Sách Ngay
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
