'use client';

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { animateModalPop } from '../../../utils/gsapAnimations';
import { X, KeyRound, ShieldCheck, Check, Sparkles, RefreshCw } from 'lucide-react';
import { ChildProfile } from '../../../types/childProfile';
import { CHILD_AVATAR_LIST, ChildAccessCredential } from '../../../types/childCredential';
import { childAccessCredentialService } from '../../../services/childAccessCredentialService';

gsap.registerPlugin(useGSAP);

export interface SetupChildPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  child: ChildProfile | null;
  onCredentialUpdated: (updated: ChildAccessCredential) => void;
}

export const SetupChildPinModal: React.FC<SetupChildPinModalProps> = ({
  isOpen,
  onClose,
  child,
  onCredentialUpdated,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('fox');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && child) {
      const cred = childAccessCredentialService.getCredential(child.id);
      setSelectedAvatarId(cred.avatarId || 'fox');
      setNewPin(cred.pinCode || '1234');
      setConfirmPin(cred.pinCode || '1234');
      setErrorMsg(null);
    }
  }, [isOpen, child]);

  useGSAP(() => {
    if (isOpen) {
      animateModalPop('.setup-pin-modal-card');
    }
  }, { scope: modalRef, dependencies: [isOpen] });

  if (!isOpen || !child) return null;

  const handleSave = () => {
    setErrorMsg(null);
    if (!/^\d{4}$/.test(newPin)) {
      setErrorMsg('Mã PIN của bé phải gồm đúng 4 chữ số (ví dụ: 1234, 0508).');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMsg('Mã PIN xác nhận không khớp. Vui lòng nhập lại.');
      return;
    }

    setIsSaving(true);
    const result = childAccessCredentialService.updateCredential(child.id, {
      avatarId: selectedAvatarId,
      pinCode: newPin,
    });

    if (result.success && result.data) {
      onCredentialUpdated(result.data);
      onClose();
    } else {
      setErrorMsg(result.message);
    }
    setIsSaving(false);
  };

  return (
    <div
      ref={modalRef}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="setup-pin-modal-card pointer-events-auto w-full max-w-lg rounded-3xl bg-zinc-950/95 border border-sky-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-5 sm:p-6 text-white space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                Thiết Lập Truy Cập Cho Bé {child.nickname}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Chọn linh vật nhận diện và đặt mã PIN 4 số dễ nhớ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Chọn Linh Vật / Avatar Cho Bé */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Chọn linh vật hoạt hình đại diện cho bé</span>
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-44 overflow-y-auto dashboard-scrollbar p-1">
            {CHILD_AVATAR_LIST.map((avatar) => {
              const isSelected = selectedAvatarId === avatar.id;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedAvatarId(avatar.id)}
                  className={`relative flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-tr from-sky-500/30 to-indigo-600/30 border-sky-400 ring-2 ring-sky-400/50 scale-105 shadow-md shadow-sky-500/20'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/60'
                  }`}
                  title={avatar.name}
                >
                  <span className="text-2xl sm:text-3xl filter drop-shadow">{avatar.emoji}</span>
                  <span className="text-[10px] font-bold text-zinc-300 truncate max-w-[55px] mt-1">
                    {avatar.name.split(' ')[0]}
                  </span>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-sky-500 text-zinc-950 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Đặt Mã PIN 4 Số */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-300">Mã PIN mới (4 chữ số)</label>
            <input
              type="password"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="VD: 1234"
              className="dashboard-input text-center text-lg font-mono tracking-widest"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-300">Nhập lại mã PIN</label>
            <input
              type="password"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="VD: 1234"
              className="dashboard-input text-center text-lg font-mono tracking-widest"
            />
          </div>
        </div>

        {/* Thông báo lỗi */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-sky-500/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all hover:scale-105"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            <span>Lưu Phương Thức Truy Cập</span>
          </button>
        </div>
      </div>
    </div>
  );
};
