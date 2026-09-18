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
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isTransferringOwnership) onClose();
      }}
      className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-tod-card border border-amber-500/40 shadow-2xl flex flex-col overflow-hidden text-tod-text pointer-events-auto">
        <div className="p-5 border-b border-tod-border bg-tod-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500 dark:text-amber-300 shadow-md">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-tod-text">
                Hoán Đổi Vai Trò Chủ Sở Hữu (Role Swap)
              </h3>
              <p className="text-[11px] text-tod-text-muted">
                Hồ sơ bé: <strong className="text-tod-text">{childNickname}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-3.5 text-xs text-tod-text leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-700 dark:text-amber-200 text-[11px] space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Quy tắc hoán đổi vai trò (BR-1.13):</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-tod-text-muted text-[11px] pl-1">
              <li>
                <strong>Người nhận:</strong>{' '}
                <span className="text-tod-text font-semibold">
                  {targetSupervisor.supervisorFullName || targetSupervisor.supervisorEmail || `Tài khoản #${targetSupervisor.supervisorUserId}`}
                </span>{' '}
                sẽ trở thành <strong>Chủ sở hữu mới (Owner)</strong> với toàn quyền quản lý.
              </li>
              <li>
                <strong>Bạn:</strong> Sẽ chuyển xuống vai trò <strong>Giám sát viên phụ (Additional Supervisor)</strong>. Quyền hạn cũ sẽ được làm mới và cần được Owner mới phân quyền lại từ đầu (Least Privilege).
              </li>
              <li>
                <strong>Điều kiện an toàn:</strong> Giao dịch sẽ bị từ chối nếu việc hoán đổi làm vi phạm quy định bảo vệ dữ liệu trẻ em (thiếu phụ huynh bảo hộ).
              </li>
            </ul>
          </div>

          <p className="text-tod-text">
            Bạn có chắc chắn muốn gửi yêu cầu chuyển giao quyền Owner hồ sơ bé{' '}
            <strong className="text-amber-600 dark:text-amber-400">"{childNickname}"</strong> không?
          </p>

          {transferError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{transferError}</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-tod-border bg-tod-surface flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isTransferringOwnership}
            className="px-4 py-2 rounded-xl bg-tod-surface hover:bg-tod-card border border-tod-border text-tod-text-muted hover:text-tod-text text-xs font-semibold cursor-pointer transition-colors"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={onConfirmTransfer}
            disabled={isTransferringOwnership}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 transition-all whitespace-nowrap"
          >
            {isTransferringOwnership ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý hoán đổi...</span>
              </>
            ) : (
              <>
                <Crown className="w-3.5 h-3.5" />
                <span>Xác Nhận Hoán Đổi Vai Trò</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
