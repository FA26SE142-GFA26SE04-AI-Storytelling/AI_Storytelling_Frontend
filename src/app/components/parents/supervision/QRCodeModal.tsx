'use client';

import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Printer, ShieldCheck, Sparkles } from 'lucide-react';

export interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  childNickname: string;
  invitationCode: string;
  expiresAt?: string | null;
  targetEmail?: string | null;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  childNickname,
  invitationCode,
  expiresAt,
  targetEmail,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const inviteUrl = `${baseUrl}/?code=${encodeURIComponent(invitationCode)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
    inviteUrl
  )}&size=240x240&bgcolor=09090b&color=38bdf8&margin=10`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(invitationCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-zinc-950 border border-sky-500/40 shadow-2xl flex flex-col overflow-hidden text-white animate-in zoom-in-95 duration-150 pointer-events-auto"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 bg-gradient-to-r from-sky-950/60 via-zinc-900 to-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                Mã QR Lời Mời Giám Sát
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              </h3>
              <p className="text-[11px] text-zinc-400">
                Dành cho bé <span className="text-sky-300 font-semibold">{childNickname}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center gap-4 text-center">
          {/* QR Card */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-sky-500/30 shadow-inner flex flex-col items-center gap-3">
            <div className="w-52 h-52 rounded-xl overflow-hidden bg-black p-2 border border-zinc-800 flex items-center justify-center">
              {/* Fallback to simple QR image */}
              <img
                src={qrImageUrl}
                alt={`QR code cho mã mời ${invitationCode}`}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">
                Mã Mời Dùng 1 Lần
              </span>
              <div className="px-3 py-1 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs font-bold text-sky-300 tracking-wider">
                {invitationCode}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="w-full space-y-1 text-xs text-zinc-300">
            {targetEmail && (
              <p className="text-zinc-400 text-[11px]">
                Người nhận: <span className="text-zinc-200 font-medium">{targetEmail}</span>
              </p>
            )}
            <p className="text-[11px] text-zinc-400">
              Thời hạn hiệu lực:{' '}
              <span className="text-amber-300 font-medium">
                {expiresAt ? new Date(expiresAt).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
              </span>
            </p>
            <p className="text-[10px] text-zinc-500 italic pt-1">
              Phụ huynh hoặc Giáo viên chỉ cần quét mã QR hoặc truy cập đường link để nhận quyền giám sát ngay lập tức.
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 w-full pt-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-sky-500 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
              <span>{copiedLink ? 'Đã chép link' : 'Chép link mời'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-amber-500 text-zinc-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copiedCode ? 'Đã chép mã' : 'Chép mã số'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-sky-500/20"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In Phiếu Lời Mời Cho Bé</span>
          </button>
        </div>
      </div>
    </div>
  );
};
