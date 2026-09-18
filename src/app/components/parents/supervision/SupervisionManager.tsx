'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCheck,
  UserCheck,
  GraduationCap,
} from 'lucide-react';
import { SupervisionRelationship, SupervisionInvitation } from '../../../types/childProfile';
import { SupervisorsList } from './SupervisorsList';
import { SingleInvitationForm } from './SingleInvitationForm';
import { InvitationsTable } from './InvitationsTable';
import { BulkEnrollmentTab } from './BulkEnrollmentTab';

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
  onOpenAcceptInviteModal?: () => void;
  revokingRelId: number | null;
  handleRevokeSupervision: (relId: number, name: string) => void;
  cancellingInvId: number | null;
  handleCancelInvitation: (invId: number) => void;
  handleReissueInvitation?: (invitationId: number, inviteeEmail?: string, expiresInDays?: number) => void;
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
  onOpenAcceptInviteModal,
  revokingRelId,
  handleRevokeSupervision,
  cancellingInvId,
  handleCancelInvitation,
  handleReissueInvitation,
  copiedCode,
  handleCopyInviteCode,
  onRefresh,
}) => {
  // Chế độ quản lý: Mời đơn lẻ (Luồng 1) hoặc Ghi danh cả lớp học (Chừa sẵn cho Luồng 7)
  const [managerMode, setManagerMode] = useState<'single' | 'bulk'>('single');

  const onReissue = (invId: number, targetEmail?: string, days?: number) => {
    if (handleReissueInvitation) {
      handleReissueInvitation(invId, targetEmail, days || inviteExpiresDays);
    } else {
      handleCancelInvitation(invId);
      handleSendInvitation();
    }
  };

  return (
    <div className="space-y-4">
      {/* Navigation Switcher: Single vs Bulk Enrollment (Luồng 1 vs Chừa sẵn Luồng 7) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-2xl bg-zinc-950/80 border border-zinc-800">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setManagerMode('single')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              managerMode === 'single'
                ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Mời Giám Sát Đơn Lẻ</span>
          </button>

          <button
            type="button"
            onClick={() => setManagerMode('bulk')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              managerMode === 'bulk'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Ghi Danh Cả Lớp Học</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
              Sắp ra mắt
            </span>
          </button>
        </div>

        <span className="text-[11px] text-zinc-400 hidden sm:inline px-2">
          Hồ sơ bé: <strong className="text-white">{childNickname}</strong>
        </span>
      </div>

      {/* Feedback Alerts */}
      {supervisionSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{supervisionSuccessMsg}</span>
        </div>
      )}

      {supervisionError && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{supervisionError}</span>
        </div>
      )}

      {/* Main Content Areas */}
      {managerMode === 'bulk' ? (
        /* LUỒNG 7: BULK ENROLLMENT PLACEHOLDER */
        <BulkEnrollmentTab onSwitchToSingle={() => setManagerMode('single')} />
      ) : (
        /* LUỒNG 1: SINGLE SUPERVISION INVITATION FLOW */
        <div className="space-y-4">
          {/* 1. Active Supervisors List */}
          <SupervisorsList
            supervisors={supervisors}
            childNickname={childNickname}
            isLoadingSupervision={isLoadingSupervision}
            onOpenInvite={() => setIsInviting(true)}
            onOpenAcceptInviteModal={onOpenAcceptInviteModal}
            onOpenPermissionsModal={onOpenPermissionsModal}
            onOpenTransferOwnershipModal={onOpenTransferOwnershipModal}
            revokingRelId={revokingRelId}
            handleRevokeSupervision={handleRevokeSupervision}
            onRefresh={onRefresh}
          />

          {/* 2. Single Invitation Creator Form */}
          <SingleInvitationForm
            childNickname={childNickname}
            isInviting={isInviting}
            setIsInviting={setIsInviting}
            inviteContact={inviteEmail}
            setInviteContact={setInviteEmail}
            inviteExpiresDays={inviteExpiresDays}
            setInviteExpiresDays={setInviteExpiresDays}
            isSendingInvite={isSendingInvite}
            onSubmit={() => handleSendInvitation()}
          />

          {/* 3. Invitations List with Copy Tools, QR, Re-issue, Cancel */}
          <InvitationsTable
            childNickname={childNickname}
            invitations={invitations}
            copiedCode={copiedCode}
            handleCopyInviteCode={handleCopyInviteCode}
            cancellingInvId={cancellingInvId}
            handleCancelInvitation={handleCancelInvitation}
            handleReissueInvitation={onReissue}
          />
        </div>
      )}
    </div>
  );
};
