'use client';

import React from 'react';
import {
  Users,
  ShieldCheck,
  Crown,
  KeyRound,
  ArrowRightLeft,
  Trash2,
  RefreshCw,
  Plus,
  QrCode,
} from 'lucide-react';
import { SupervisionRelationship } from '../../../types/childProfile';

export interface SupervisorsListProps {
  supervisors: SupervisionRelationship[];
  childNickname: string;
  isLoadingSupervision: boolean;
  onOpenInvite: () => void;
  onOpenAcceptInviteModal?: () => void;
  onOpenPermissionsModal: (supervisor: SupervisionRelationship) => void;
  onOpenTransferOwnershipModal: (supervisor: SupervisionRelationship) => void;
  revokingRelId: number | null;
  handleRevokeSupervision: (relId: number, name: string) => void;
  onRefresh: () => void;
}

export const SupervisorsList: React.FC<SupervisorsListProps> = ({
  supervisors,
  childNickname,
  isLoadingSupervision,
  onOpenInvite,
  onOpenAcceptInviteModal,
  onOpenPermissionsModal,
  onOpenTransferOwnershipModal,
  revokingRelId,
  handleRevokeSupervision,
  onRefresh,
}) => {
  const getSupervisorRoleBadge = (role: string) => {
    switch (role) {
      case 'Owner':
      case 'owner':
        return {
          label: 'Chủ tài khoản (Owner)',
          className: 'bg-amber-950/80 border-amber-500/50 text-amber-300',
          icon: Crown,
        };
      case 'CoParent':
      case 'co_parent':
        return {
          label: 'Đồng phụ huynh',
          className: 'bg-sky-950/80 border-sky-500/50 text-sky-300',
          icon: Users,
        };
      case 'Guardian':
      case 'guardian':
        return {
          label: 'Người giám hộ',
          className: 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300',
          icon: ShieldCheck,
        };
      case 'Teacher':
      case 'teacher':
        return {
          label: 'Giáo viên phụ trách',
          className: 'bg-purple-950/80 border-purple-500/50 text-purple-300',
          icon: ShieldCheck,
        };
      default:
        return {
          label: role || 'Giám sát viên',
          className: 'bg-zinc-800 border-zinc-700 text-zinc-300',
          icon: Users,
        };
    }
  };

  return (
    <div className="laptop-tab-content-row p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400 shrink-0" />
          <h3 className="text-xs font-black text-white whitespace-nowrap">
            Người Đang Giám Sát Bé ({supervisors.length})
          </h3>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          <button
            type="button"
            onClick={onRefresh}
            title="Làm mới"
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSupervision ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          {onOpenAcceptInviteModal && (
            <button
              type="button"
              onClick={onOpenAcceptInviteModal}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm whitespace-nowrap shrink-0"
              title="Nhập mã mời hoặc quét QR để nhận giám sát"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Nhập mã lời mời</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenInvite}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Mời người giám sát</span>
          </button>
        </div>
      </div>

      {isLoadingSupervision && supervisors.length === 0 ? (
        <div className="flex items-center justify-center py-6 text-zinc-400 text-xs gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
          <span>Đang tải thông tin người giám sát...</span>
        </div>
      ) : supervisors.length === 0 ? (
        <div className="text-center py-4 text-xs text-zinc-400 italic">
          Chưa có thông tin người giám sát nào cho bé {childNickname}.
        </div>
      ) : (
        <div className="space-y-2">
          {supervisors.map((sup) => {
            const roleBadge = getSupervisorRoleBadge(sup.supervisorRole);
            const RoleIcon = roleBadge.icon;
            const isOwner = sup.supervisorRole === 'Owner' || sup.supervisorRole === 'owner';
            const isRevoking = revokingRelId === sup.id;

            return (
              <div
                key={sup.id}
                className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-200">
                    {(sup.supervisorFullName || sup.supervisorEmail || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">
                        {sup.supervisorFullName || sup.supervisorEmail || `Tài khoản #${sup.supervisorUserId}`}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${roleBadge.className}`}
                      >
                        <RoleIcon className="w-3 h-3" />
                        <span>{roleBadge.label}</span>
                      </span>
                    </div>
                    {sup.supervisorEmail && (
                      <span className="text-[11px] text-zinc-400 block mt-0.5">
                        {sup.supervisorEmail}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  {!isOwner && (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenPermissionsModal(sup)}
                        title="Tùy chỉnh quyền hạn an toàn & nội dung"
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 text-indigo-300 hover:text-indigo-200 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <KeyRound className="w-3 h-3 text-indigo-400" />
                        <span>Phân quyền</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenTransferOwnershipModal(sup)}
                        title="Chuyển nhượng quyền Chủ sở hữu hồ sơ"
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-amber-300 hover:text-amber-200 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <ArrowRightLeft className="w-3 h-3 text-amber-400" />
                        <span>Chuyển quyền</span>
                      </button>

                      <button
                        type="button"
                        disabled={isRevoking}
                        onClick={() =>
                          handleRevokeSupervision(
                            sup.id,
                            sup.supervisorFullName || sup.supervisorEmail || `Người dùng #${sup.supervisorUserId}`
                          )
                        }
                        title="Thu hồi quyền giám sát của người này"
                        className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-rose-500/50 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
