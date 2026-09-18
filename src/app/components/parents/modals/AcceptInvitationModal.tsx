'use client';

import React from 'react';
import { KeyRound, X, AlertCircle, RefreshCw, Check } from 'lucide-react';

export interface AcceptInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  acceptCodeInput: string;
  setAcceptCodeInput: (val: string) => void;
  isAcceptingInvite: boolean;
  acceptInviteError: string | null;
  onAcceptSubmit: (e: React.FormEvent) => void;
}

export const AcceptInvitationModal: React.FC<AcceptInvitationModalProps> = ({
  isOpen,
  onClose,
  acceptCodeInput,
  setAcceptCodeInput,
  isAcceptingInvite,
  acceptInviteError,
  onAcceptSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-zinc-950 border border-sky-500/40 shadow-2xl flex flex-col overflow-hidden text-white"
      >
        <div className="p-5 border-b border-zinc-800 bg-gradient-to-r from-sky-950/60 via-zinc-900 to-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-300 shadow-md">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">
                Nhập Mã Mời Giám Sát
              </h3>
              <p className="text-[11px] text-zinc-400">
                Liên kết tài khoản của bạn với hồ sơ của bé
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onAcceptSubmit} className="p-5 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-zinc-300">
              Mã Mời (Invitation Code) *
            </label>
            <input
              type="text"
              required
              value={acceptCodeInput}
              onChange={(e) => setAcceptCodeInput(e.target.value.trim())}
              placeholder="Dán hoặc nhập chính xác mã mời"
              className="dashboard-input font-mono tracking-wide"
            />
            <span className="text-[10px] text-zinc-400">
              Nhập mã mời bạn nhận được từ phụ huynh chính của bé.
            </span>
          </div>

          {acceptInviteError && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{acceptInviteError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isAcceptingInvite}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isAcceptingInvite || !acceptCodeInput.trim()}
              className="btn-dashboard-primary text-xs"
            >
              {isAcceptingInvite ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xác nhận mã...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Chấp Nhận Lời Mời</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
