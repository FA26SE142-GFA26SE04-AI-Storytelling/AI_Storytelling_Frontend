'use client';

import React from 'react';
import {
  Users,
  ShieldCheck,
  Crown,
  KeyRound,
  ArrowRightLeft,
  Trash2,
  Mail,
  Copy,
  Check,
  RefreshCw,
  Plus,
  AlertTriangle,
  CheckCheck,
} from 'lucide-react';
import { SupervisionRelationship, SupervisionInvitation } from '../../../types/childProfile';

export interface SupervisionManagerProps {
  childNickname: string;
  supervisors: SupervisionRelationship[];
  invitations: SupervisionInvitation[];
  isLoadingSupervision: boolean;
  supervisionError: string | null;
  supervisionSuccessMsg: string | null;
  isInviting: boolean;
  setIsInviting: (val: boolean) => void;
  inviteEmail: string;
  setInviteEmail: (val: string) => void;
  inviteExpiresDays: number;
  setInviteExpiresDays: (val: number) => void;
  isSendingInvite: boolean;
  handleSendInvitation: () => void;
  onOpenPermissionsModal: (supervisor: SupervisionRelationship) => void;
  onOpenTransferOwnershipModal: (supervisor: SupervisionRelationship) => void;
  revokingRelId: number | null;
  handleRevokeSupervision: (relId: number, name: string) => void;
  cancellingInvId: number | null;
  handleCancelInvitation: (invId: number) => void;
  copiedCode: string | null;
  handleCopyInviteCode: (code: string) => void;
  onRefresh: () => void;
}

export const SupervisionManager: React.FC<SupervisionManagerProps> = ({
  childNickname,
  supervisors,
  invitations,
  isLoadingSupervision,
  supervisionError,
  supervisionSuccessMsg,
  isInviting,
  setIsInviting,
  inviteEmail,
  setInviteEmail,
  inviteExpiresDays,
  setInviteExpiresDays,
  isSendingInvite,
  handleSendInvitation,
  onOpenPermissionsModal,
  onOpenTransferOwnershipModal,
  revokingRelId,
  handleRevokeSupervision,
  cancellingInvId,
  handleCancelInvitation,
  copiedCode,
  handleCopyInviteCode,
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
          label: 'Giáo viên',
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
    <div className="space-y-4">
      {/* Feedback Alerts */}
      {supervisionSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{supervisionSuccessMsg}</span>
        </div>
      )}

      {supervisionError && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{supervisionError}</span>
        </div>
      )}

      {/* SECTION 1: ACTIVE SUPERVISORS LIST */}
      <div className="laptop-tab-content-row p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-zinc-200">
              Danh Sách Người Giám Sát Của Bé ({supervisors.length})
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onRefresh}
              title="Làm mới danh sách"
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSupervision ? 'animate-spin text-sky-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setIsInviting(!isInviting)}
              className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-md shadow-indigo-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Mời Người Giám Sát</span>
            </button>
          </div>
        </div>

        {/* List of Supervisors */}
        {isLoadingSupervision ? (
          <div className="py-8 flex items-center justify-center gap-2 text-zinc-500 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
            <span>Đang tải danh sách người giám sát...</span>
          </div>
        ) : supervisors.length === 0 ? (
          <div className="text-center py-6 text-xs text-zinc-500 italic">
            Chưa có người giám sát nào được ghi nhận.
          </div>
        ) : (
          <div className="space-y-2">
            {supervisors.map((rel) => {
              const roleMeta = getSupervisorRoleBadge(rel.supervisorRole);
              const RoleIcon = roleMeta.icon;
              const isOwner = rel.supervisorRole?.toLowerCase() === 'owner';
              const isRevoking = revokingRelId === rel.id;

              return (
                <div
                  key={rel.id}
                  className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-white text-xs">
                      {rel.supervisorFullName ? rel.supervisorFullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {rel.supervisorFullName || 'Người dùng'}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-bold flex items-center gap-1 ${roleMeta.className}`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          <span>{roleMeta.label}</span>
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400 block">{rel.supervisorEmail}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenPermissionsModal(rel)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3 text-sky-400" />
                      <span>Phân quyền</span>
                    </button>

                    {!isOwner && (
                      <button
                        type="button"
                        onClick={() => onOpenTransferOwnershipModal(rel)}
                        title="Chuyển giao quyền Owner"
                        className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-amber-500/50 text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {!isOwner && (
                      <button
                        type="button"
                        disabled={isRevoking}
                        onClick={() =>
                          handleRevokeSupervision(
                            rel.id,
                            rel.supervisorFullName || rel.supervisorEmail || `Giám sát viên #${rel.supervisorUserId}`
                          )
                        }
                        title="Hủy quyền giám sát"
                        className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-rose-500/50 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isRevoking ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: SEND INVITATION FORM */}
      {isInviting && (
        <div className="laptop-tab-content-row p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-indigo-400" />
              Mời Người Giám Sát Mới Cho Bé {childNickname}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                Email người nhận lời mời
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="dashboard-input"
                placeholder="VD: grandparent@example.com hoặc teacher@school.edu.vn"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-400 block mb-1">
                Thời hạn hiệu lực của mã mời
              </label>
              <select
                value={inviteExpiresDays}
                onChange={(e) => setInviteExpiresDays(Number(e.target.value))}
                className="dashboard-input cursor-pointer"
              >
                <option value={3}>3 ngày</option>
                <option value={7}>7 ngày (Mặc định)</option>
                <option value={14}>14 ngày</option>
                <option value={30}>30 ngày</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsInviting(false)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={isSendingInvite}
              onClick={handleSendInvitation}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-500/20"
            >
              {isSendingInvite ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5" />
                  <span>Tạo Lời Mời</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* SECTION 3: PENDING INVITATIONS LIST */}
      <div className="laptop-tab-content-row p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-zinc-200">
              Lời Mời Giám Sát Đang Chờ Chấp Nhận ({invitations.length})
            </h3>
          </div>
        </div>

        {invitations.length === 0 ? (
          <div className="text-center py-4 text-xs text-zinc-500 italic">
            Không có lời mời nào đang chờ xử lý.
          </div>
        ) : (
          <div className="space-y-2">
            {invitations.map((inv) => {
              const isCancelling = cancellingInvId === inv.id;
              const isCopied = copiedCode === inv.invitationCode;

              return (
                <div
                  key={inv.id}
                  className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">
                        {inv.targetEmail || inv.inviteeEmail || 'Mã mời công khai'}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5 font-mono">
                        <span>Mã mời: {inv.invitationCode}</span>
                        <span>•</span>
                        <span>
                          Hết hạn:{' '}
                          {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyInviteCode(inv.invitationCode)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Đã chép' : 'Chép mã'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={() => handleCancelInvitation(inv.id)}
                      className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-rose-500/50 text-zinc-400 hover:text-rose-400 font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isCancelling ? 'Đang hủy...' : 'Hủy lời mời'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
