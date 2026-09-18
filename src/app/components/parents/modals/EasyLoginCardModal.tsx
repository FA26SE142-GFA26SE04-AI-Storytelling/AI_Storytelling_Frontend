'use client';

import React, { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { animateModalPop } from '../../../utils/gsapAnimations';
import { X, QrCode, Printer, Download, Sparkles, BookOpen, ShieldCheck } from 'lucide-react';
import { ChildProfile } from '../../../types/childProfile';
import { CHILD_AVATAR_LIST, ChildAccessCredential } from '../../../types/childCredential';

gsap.registerPlugin(useGSAP);

export interface EasyLoginCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  child: ChildProfile | null;
  credential: ChildAccessCredential | null;
}

export const EasyLoginCardModal: React.FC<EasyLoginCardModalProps> = ({
  isOpen,
  onClose,
  child,
  credential,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (isOpen) {
      animateModalPop('.easy-login-card-modal');
    }
  }, { scope: modalRef, dependencies: [isOpen] });

  if (!isOpen || !child || !credential) return null;

  const avatar =
    CHILD_AVATAR_LIST.find((a) => a.id === credential.avatarId) || CHILD_AVATAR_LIST[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      ref={modalRef}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="easy-login-card-modal pointer-events-auto w-full max-w-md rounded-3xl bg-tod-card border border-sky-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-5 sm:p-6 text-tod-text space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-tod-border">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-sky-500" />
            <h3 className="text-sm sm:text-base font-black text-tod-text">
              Thẻ Đọc Sách EasyLogin Của Bé
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-tod-surface hover:bg-tod-card border border-tod-border text-tod-text-muted hover:text-tod-text transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* The Kid Badge / Card (Printable) */}
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-indigo-900/90 via-slate-900/90 to-sky-950/90 border-2 border-amber-400/40 shadow-2xl flex flex-col items-center text-center space-y-3 print:bg-white print:text-black print:border-black text-white"
        >
          {/* Top Brand Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-wider text-amber-300">
            <BookOpen className="w-3 h-3 text-amber-400" />
            <span>MagicTales • Thẻ Bé Đọc Sách</span>
          </div>

          {/* Avatar Icon */}
          <div
            className={`w-20 h-20 rounded-3xl bg-gradient-to-tr ${avatar.bgColor} border-2 ${avatar.borderColor} flex items-center justify-center shadow-lg shadow-sky-500/20`}
          >
            <span className="text-5xl filter drop-shadow-md">{avatar.emoji}</span>
          </div>

          {/* Child Nickname */}
          <div>
            <h4 className="text-xl font-black text-white drop-shadow">{child.nickname}</h4>
            <span className="text-xs font-bold text-sky-300">Hồ sơ bé #{child.id} • {avatar.name}</span>
          </div>

          {/* EasyLogin Badge Code Display */}
          <div className="w-full p-3 rounded-2xl bg-black/50 border border-white/20 flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
              Mã Nhận Diện Nhanh (EasyLogin)
            </span>
            <span className="font-mono text-base font-black text-amber-400 tracking-wider">
              {credential.easyLoginBadgeCode}
            </span>
            <span className="text-[10px] text-zinc-300">
              Mã PIN bảo mật: <strong className="text-white">{credential.pinCode}</strong>
            </span>
          </div>

          {/* Friendly Note */}
          <p className="text-[11px] text-zinc-200 leading-relaxed max-w-xs">
            Bé chỉ cần bấm vào hình <strong className="text-amber-300">{avatar.name} ({avatar.emoji})</strong> và nhập 4 số PIN trên máy tính bảng để đọc truyện!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-tod-border">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-tod-surface hover:bg-tod-card border border-tod-border text-tod-text font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-sky-500" />
            <span>In Thẻ Đọc Sách</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-sky-500/25 transition-all hover:scale-105 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
