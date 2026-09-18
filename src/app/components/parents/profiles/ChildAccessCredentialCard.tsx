'use client';

import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  QrCode,
  Play,
  RotateCcw,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { ChildProfile } from '../../../types/childProfile';
import { CHILD_AVATAR_LIST, ChildAccessCredential } from '../../../types/childCredential';
import { childAccessCredentialService } from '../../../services/childAccessCredentialService';

export interface ChildAccessCredentialCardProps {
  child: ChildProfile;
  onOpenSetupModal: () => void;
  onOpenBadgeModal: () => void;
  onStartChildSession: (child: ChildProfile) => void;
  credentialVersion?: number;
}

export const ChildAccessCredentialCard: React.FC<ChildAccessCredentialCardProps> = ({
  child,
  onOpenSetupModal,
  onOpenBadgeModal,
  onStartChildSession,
  credentialVersion = 0,
}) => {
  const [credential, setCredential] = useState<ChildAccessCredential | null>(null);
  const [showPin, setShowPin] = useState<boolean>(false);

  useEffect(() => {
    const cred = childAccessCredentialService.getCredential(child.id);
    setCredential(cred);
  }, [child.id, credentialVersion]);

  if (!credential) return null;

  const avatar =
    CHILD_AVATAR_LIST.find((a) => a.id === credential.avatarId) || CHILD_AVATAR_LIST[0];

  const isLocked = credential.lockedUntil && new Date(credential.lockedUntil).getTime() > Date.now();

  return (
    <div className="laptop-tab-content-row p-4 rounded-2xl bg-tod-card border border-tod-border shadow-sm space-y-3 text-tod-text transition-colors duration-500">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-tod-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-zinc-950 font-black shadow-md shadow-amber-500/20">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-tod-text flex items-center gap-1.5">
              <span>Phương Thức Truy Cập Của Bé (Child Credential)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                Độc Lập
              </span>
            </h3>
            <p className="text-[10px] text-tod-text-muted">
              Trẻ không dùng email/mật khẩu — truy cập nhanh qua Avatar và mã PIN ngắn
            </p>
          </div>
        </div>

        {/* Action Button 1: Launch Child Session */}
        <button
          type="button"
          onClick={() => onStartChildSession(child)}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-xs shadow-md shadow-orange-500/25 flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer whitespace-nowrap"
          title="Khởi chạy giao diện đọc truyện dành riêng cho bé và khóa khu vực phụ huynh"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Bắt Đầu Phiên Đọc</span>
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* 1. Linh vật nhận diện */}
        <div className="p-2.5 rounded-xl bg-tod-surface border border-tod-border flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${avatar.bgColor} border ${avatar.borderColor} flex items-center justify-center text-2xl shadow-sm`}
          >
            {avatar.emoji}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-tod-text-muted font-medium">Linh vật của bé</span>
            <span className="text-xs font-bold text-tod-text truncate">{avatar.name}</span>
          </div>
        </div>

        {/* 2. Mã PIN 4 Số */}
        <div className="p-2.5 rounded-xl bg-tod-surface border border-tod-border flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-tod-text-muted font-medium flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-500" />
              Mã PIN bảo mật
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-sm font-black text-amber-500 dark:text-amber-300 tracking-wider">
                {showPin ? credential.pinCode : '••••'}
              </span>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="p-1 text-tod-text-muted hover:text-tod-text transition-colors cursor-pointer"
                title={showPin ? 'Ẩn mã PIN' : 'Hiện mã PIN'}
              >
                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          {isLocked && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-300 text-[10px] font-bold border border-rose-500/30">
              Đang tạm khóa
            </span>
          )}
        </div>

        {/* 3. Thẻ EasyLogin Badge */}
        <div className="p-2.5 rounded-xl bg-tod-surface border border-tod-border flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-tod-text-muted font-medium flex items-center gap-1">
              <QrCode className="w-3 h-3 text-sky-500" />
              Mã EasyLogin
            </span>
            <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-300 truncate">
              {credential.easyLoginBadgeCode}
            </span>
          </div>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSetupModal}
            className="px-3 py-1.5 rounded-xl bg-tod-surface hover:bg-tod-card text-tod-text border border-tod-border font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
            <span>Đổi Linh Vật & Đặt Lại PIN</span>
          </button>
          <button
            type="button"
            onClick={onOpenBadgeModal}
            className="px-3 py-1.5 rounded-xl bg-tod-surface hover:bg-tod-card text-tod-text border border-tod-border font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5 text-sky-500" />
            <span>Xem / In Thẻ Đọc Sách</span>
          </button>
        </div>

        <span className="text-[10px] text-tod-text-muted">
          Chỉ có Phụ huynh/Owner mới có quyền sửa mã truy cập
        </span>
      </div>
    </div>
  );
};
