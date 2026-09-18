'use client';

import React from 'react';
import { Crown, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';
import { SupervisionRelationship } from '../../../types/childProfile';

export interface TransferOwnershipModalProps {
  targetSupervisor: SupervisionRelationship | null;
  childNickname: string;
  onClose: () => void;
  isTransferringOwnership: boolean;
  transferError: string | null;
  onConfirmTransfer: () => void;
}

export const TransferOwnershipModal: React.FC<TransferOwnershipModalProps> = ({
  targetSupervisor,
  childNickname,
  onClose,
  isTransferringOwnership,
  transferError,
  onConfirmTransfer,
}) => {
  if (!targetSupervisor) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-3xl bg-zinc-950 border border-amber-500/40 shadow-2xl flex flex-col overflow-hidden text-white">
        <div className="p-5 border-b border-zinc-800 bg-gradient-to-r from-amber-950/60 via-zinc-900 to-zinc-950 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-md">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">
              Chuyển Nhượng Quyền Chủ Sở Hữu (Owner)
            </h3>
            <p className="text-[11px] text-zinc-400">
              Hồ sơ bé: <strong>{childNickname}</strong>
            </p>
          </div>
        </div>

        <div className="p-5 space-y-3.5 text-xs text-zinc-300 leading-relaxed">
          <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200/90 text-[11px] flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Lưu ý quan trọng:</strong> Sau khi chuyển quyền Owner cho{' '}
              <strong>
                {targetSupervisor.supervisorFullName || `Supervisor #${targetSupervisor.supervisorUserId}`}
              </strong>
              , bạn sẽ trở thành <strong>Giám sát viên phụ</strong> với quyền xem tiến độ cơ bản. Bạn sẽ không
              còn quyền thu hồi hoặc đổi vai trò của người nhận nữa.
            </div>
          </div>

          <p>
            Bạn có chắc chắn muốn chuyển giao toàn quyền quản lý hồ sơ bé{' '}
            <strong>"{childNickname}"</strong> không?
          </p>

          {transferError && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{transferError}</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-800 bg-zinc-950/90 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isTransferringOwnership}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer transition-colors"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={onConfirmTransfer}
            disabled={isTransferringOwnership}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 transition-all"
          >
            {isTransferringOwnership ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang chuyển quyền...</span>
              </>
            ) : (
              <>
                <Crown className="w-3.5 h-3.5" />
                <span>Xác Nhận Chuyển Owner</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
