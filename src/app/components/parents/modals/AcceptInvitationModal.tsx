'use client';

import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  X,
  AlertCircle,
  QrCode,
  Clipboard,
  Check,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { QRCodeScannerTab } from './subcomponents/QRCodeScannerTab';
import { InvitationDecisionCard } from './subcomponents/InvitationDecisionCard';

export interface AcceptInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  acceptCodeInput: string;
  setAcceptCodeInput: (val: string) => void;
  isAcceptingInvite: boolean;
  acceptInviteError: string | null;
  onAcceptSubmit: (code?: string) => void;
  onRejectSubmit?: (code: string) => void;
}

export const AcceptInvitationModal: React.FC<AcceptInvitationModalProps> = ({
  isOpen,
  onClose,
  acceptCodeInput,
  setAcceptCodeInput,
  isAcceptingInvite,
  acceptInviteError,
  onAcceptSubmit,
  onRejectSubmit,
}) => {
  const [inputTab, setInputTab] = useState<'manual' | 'qr'>('manual');
  const [step, setStep] = useState<'input' | 'confirm'>('input');
  const [localValidationErr, setLocalValidationErr] = useState<string | null>(null);
  const [isCopiedFromClip, setIsCopiedFromClip] = useState<boolean>(false);

  useEffect(() => {
    if (acceptCodeInput.trim()) {
      setStep('confirm');
    } else {
      setStep('input');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setAcceptCodeInput(text.trim());
        setIsCopiedFromClip(true);
        setTimeout(() => setIsCopiedFromClip(false), 2000);
        setLocalValidationErr(null);
      }
    } catch {
      setLocalValidationErr('Không thể đọc bộ nhớ tạm. Vui lòng dán thủ công.');
    }
  };

  const handleProceedToConfirm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = acceptCodeInput.trim();
    if (!clean) {
      setLocalValidationErr('Vui lòng nhập hoặc quét mã mời để tiếp tục.');
      return;
    }
    setLocalValidationErr(null);
    setStep('confirm');
  };

  const handleCodeFromQR = (code: string) => {
    setAcceptCodeInput(code.trim());
    setLocalValidationErr(null);
    setStep('confirm');
  };

  const handleReject = () => {
    if (onRejectSubmit) {
      onRejectSubmit(acceptCodeInput.trim());
    } else {
      onClose();
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isAcceptingInvite) onClose();
      }}
      className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-zinc-950 border border-sky-500/40 shadow-2xl flex flex-col overflow-hidden text-white animate-in zoom-in-95 duration-150 pointer-events-auto"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 bg-gradient-to-r from-sky-950/60 via-zinc-900 to-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-300 shadow-md">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                Xác Nhận Tham Gia Giám Sát
              </h3>
              <p className="text-[11px] text-zinc-400">
                Xác minh mã mời để liên kết quyền giám sát hồ sơ của bé
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isAcceptingInvite}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 pb-1 text-[11px] font-bold">
            <div
              className={`px-3 py-1 rounded-full flex items-center gap-1.5 ${
                step === 'input'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'bg-zinc-900 text-zinc-400'
              }`}
            >
              <span>1. Nhập / Quét mã</span>
            </div>
            <ArrowRight className="w-3 h-3 text-zinc-600" />
            <div
              className={`px-3 py-1 rounded-full flex items-center gap-1.5 ${
                step === 'confirm'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'bg-zinc-900 text-zinc-400'
              }`}
            >
              <span>2. Xác nhận thông tin</span>
            </div>
          </div>

          {/* Feedback error alert */}
          {(acceptInviteError || localValidationErr) && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{acceptInviteError || localValidationErr}</span>
            </div>
          )}

          {/* STEP 1: INPUT OR QR SCAN */}
          {step === 'input' ? (
            <div className="space-y-4">
              {/* Method Switcher */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                <button
                  type="button"
                  onClick={() => setInputTab('manual')}
                  className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    inputTab === 'manual'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Nhập / Dán Mã
                </button>
                <button
                  type="button"
                  onClick={() => setInputTab('qr')}
                  className={`py-1.5 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    inputTab === 'qr'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Quét Mã QR</span>
                </button>
              </div>

              {inputTab === 'manual' ? (
                <form onSubmit={handleProceedToConfirm} className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                      <span>Mã Mời (Invitation Code) *</span>
                      <button
                        type="button"
                        onClick={handlePasteClipboard}
                        className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer font-normal"
                      >
                        {isCopiedFromClip ? <Check className="w-3 h-3 text-emerald-400" /> : <Clipboard className="w-3 h-3" />}
                        <span>{isCopiedFromClip ? 'Đã dán' : 'Dán từ clipboard'}</span>
                      </button>
                    </label>
                    <input
                      type="text"
                      required
                      value={acceptCodeInput}
                      onChange={(e) => {
                        setAcceptCodeInput(e.target.value);
                        setLocalValidationErr(null);
                      }}
                      placeholder="Dán hoặc nhập mã mời từ người gửi..."
                      className="dashboard-input font-mono tracking-wider text-center text-sm py-2.5"
                    />
                    <span className="text-[10px] text-zinc-500">
                      Mỗi mã mời gắn duy nhất với 1 hồ sơ bé và chỉ được sử dụng đúng 1 lần.
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={!acceptCodeInput.trim()}
                      className="btn-dashboard-primary text-xs flex items-center gap-1.5"
                    >
                      <span>Kiểm tra &amp; Tiếp tục</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              ) : (
                <QRCodeScannerTab onCodeDetected={handleCodeFromQR} />
              )}
            </div>
          ) : (
            /* STEP 2: PREVIEW CONFIRMATION & DECISION (ACCEPT / REJECT) */
            <InvitationDecisionCard
              invitationCode={acceptCodeInput.trim()}
              isProcessing={isAcceptingInvite}
              onAccept={() => onAcceptSubmit(acceptCodeInput.trim())}
              onReject={handleReject}
              onBackToEdit={() => setStep('input')}
            />
          )}
        </div>
      </div>
    </div>
  );
};
