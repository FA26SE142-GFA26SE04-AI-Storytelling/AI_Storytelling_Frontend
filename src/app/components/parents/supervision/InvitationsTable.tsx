'use client';

import React, { useState } from 'react';
import {
  Mail,
  Copy,
  Check,
  QrCode,
  RotateCcw,
  Trash2,
  ExternalLink,
  Clock,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { SupervisionInvitation } from '../../../types/childProfile';
import { QRCodeModal } from './QRCodeModal';

export interface InvitationsTableProps {
  childNickname: string;
  invitations: SupervisionInvitation[];
  copiedCode: string | null;
  handleCopyInviteCode: (code: string) => void;
  cancellingInvId: number | null;
  handleCancelInvitation: (invId: number) => void;
  handleReissueInvitation: (invitationId: number, inviteeEmail?: string, expiresInDays?: number) => void;
}

export const InvitationsTable: React.FC<InvitationsTableProps> = ({
  childNickname,
  invitations,
  copiedCode,
  handleCopyInviteCode,
  cancellingInvId,
  handleCancelInvitation,
  handleReissueInvitation,
}) => {
  const [selectedQRInvite, setSelectedQRInvite] = useState<SupervisionInvitation | null>(null);
  const [copiedLinkMap, setCopiedLinkMap] = useState<Record<number, boolean>>({});

  const handleCopyDirectLink = (inv: SupervisionInvitation) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const inviteUrl = `${baseUrl}/?code=${encodeURIComponent(inv.invitationCode)}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLinkMap((prev) => ({ ...prev, [inv.id]: true }));
    setTimeout(() => {
      setCopiedLinkMap((prev) => ({ ...prev, [inv.id]: false }));
    }, 2000);
  };

  const getStatusBadge = (status: string, expiresAt?: string | null) => {
    const isExpired = expiresAt && new Date(expiresAt).getTime() < Date.now();

    if (status === 'Accepted') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Đã chấp nhận</span>
        </span>
      );
    }
    if (status === 'Revoked') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-900 border border-zinc-700 text-zinc-500 flex items-center gap-1">
          <Trash2 className="w-3 h-3" />
          <span>Đã thu hồi</span>
        </span>
      );
    }
    if (isExpired || status === 'Expired') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 border border-rose-500/50 text-rose-300 flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-rose-400" />
          <span>Hết hạn</span>
        </span>
      );
    }

    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-950/80 border border-sky-500/50 text-sky-300 flex items-center gap-1 animate-pulse">
        <Clock className="w-3 h-3 text-sky-400" />
        <span>Đang chờ nhận</span>
      </span>
    );
  };

  return (
    <div className="laptop-tab-content-row p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold text-zinc-200">
            Danh Sách Mã Mời Giám Sát Của Bé ({invitations.length})
          </h3>
        </div>
        <span className="text-[10px] text-zinc-400">
          Mỗi mã gắn duy nhất với bé <span className="text-sky-300 font-semibold">{childNickname}</span>
        </span>
      </div>

      {invitations.length === 0 ? (
        <div className="text-center py-5 text-xs text-zinc-500 italic flex flex-col items-center gap-1">
          <Clock className="w-5 h-5 text-zinc-600" />
          <span>Chưa có mã mời nào được tạo cho bé. Nhấn &quot;Mời người giám sát&quot; ở trên để khởi tạo mã mới.</span>
        </div>
      ) : (
        <div className="space-y-2">
          {invitations.map((inv) => {
            const isCancelling = cancellingInvId === inv.id;
            const isCopied = copiedCode === inv.invitationCode;
            const isLinkCopied = !!copiedLinkMap[inv.id];
            const isPending = inv.status === 'Pending';
            const isExpired = inv.expiresAt && new Date(inv.expiresAt).getTime() < Date.now();

            return (
              <div
                key={inv.id}
                className={`p-3 rounded-xl border flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs transition-colors ${
                  isPending && !isExpired
                    ? 'bg-zinc-950/80 border-sky-500/30 hover:border-sky-500/60'
                    : 'bg-zinc-950/50 border-zinc-800'
                }`}
              >
                {/* Left Info */}
                <div className="flex items-start sm:items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white">
                        {inv.targetEmail || inv.inviteeEmail || 'Mã mời trực tiếp (Chưa gán liên hệ)'}
                      </span>
                      {getStatusBadge(inv.status, inv.expiresAt)}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 font-mono">
                      <span className="text-sky-300 font-bold bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-500/30">
                        {inv.invitationCode}
                      </span>
                      <span>•</span>
                      <span>
                        Hết hạn:{' '}
                        {inv.expiresAt
                          ? new Date(inv.expiresAt).toLocaleDateString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                          : 'Vô thời hạn'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action Tools */}
                <div className="flex flex-wrap items-center gap-1.5 self-end lg:self-center pt-1 lg:pt-0">
                  {/* Copy Code */}
                  <button
                    type="button"
                    onClick={() => handleCopyInviteCode(inv.invitationCode)}
                    title="Sao chép chuỗi mã mời"
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-sky-400 text-zinc-200 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-sky-400" />}
                    <span>{isCopied ? 'Đã chép' : 'Chép mã'}</span>
                  </button>

                  {/* Copy Direct Link */}
                  <button
                    type="button"
                    onClick={() => handleCopyDirectLink(inv)}
                    title="Sao chép đường link gửi qua Zalo / SMS / Messenger"
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-indigo-400 text-zinc-200 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {isLinkCopied ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <ExternalLink className="w-3 h-3 text-indigo-400" />
                    )}
                    <span>{isLinkCopied ? 'Đã chép link' : 'Chép link'}</span>
                  </button>

                  {/* Show QR Modal */}
                  <button
                    type="button"
                    onClick={() => setSelectedQRInvite(inv)}
                    title="Xem mã QR để quét hoặc in ra giấy"
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-amber-300 transition-colors cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>

                  {/* Re-issue Button (Cấp lại mã mới nếu làm mất hoặc hết hạn) */}
                  <button
                    type="button"
                    disabled={isCancelling}
                    onClick={() => handleReissueInvitation(inv.id, inv.targetEmail || inv.inviteeEmail || undefined)}
                    title="Cấp lại mã mới (Hủy mã cũ và sinh mã mới ngay nếu phụ huynh làm mất)"
                    className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-700 hover:border-amber-500/70 text-amber-300 font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Cấp lại mã</span>
                  </button>

                  {/* Cancel Button */}
                  {isPending && !isExpired && (
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={() => handleCancelInvitation(inv.id)}
                      title="Thu hồi lời mời này"
                      className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-rose-500/50 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Viewer Modal */}
      {selectedQRInvite && (
        <QRCodeModal
          isOpen={true}
          onClose={() => setSelectedQRInvite(null)}
          childNickname={childNickname}
          invitationCode={selectedQRInvite.invitationCode}
          expiresAt={selectedQRInvite.expiresAt}
          targetEmail={selectedQRInvite.targetEmail || selectedQRInvite.inviteeEmail}
        />
      )}
    </div>
  );
};
