'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Check,
  Ban,
  Sparkles,
  Info,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';

export interface InvitationDecisionCardProps {
  invitationCode: string;
  isProcessing: boolean;
  onAccept: () => void;
  onReject: () => void;
  onBackToEdit: () => void;
}

export const InvitationDecisionCard: React.FC<InvitationDecisionCardProps> = ({
  invitationCode,
  isProcessing,
  onAccept,
  onReject,
  onBackToEdit,
}) => {
  const [showRejectConfirm, setShowRejectConfirm] = useState<boolean>(false);

  return (
    <div className="space-y-4 text-xs animate-in fade-in duration-200 text-tod-text">
      {/* Code Badge Card */}
      <div className="p-4 rounded-2xl bg-tod-card border border-indigo-500/30 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-tod-text-muted uppercase tracking-wider">
            Mã Mời Đã Sẵn Sàng
          </span>
          <button
            type="button"
            onClick={onBackToEdit}
            disabled={isProcessing}
            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Đổi mã khác</span>
          </button>
        </div>

        <div className="p-3 rounded-xl bg-tod-surface border border-tod-border flex items-center justify-between gap-2">
          <div className="font-mono text-sm font-black text-sky-600 dark:text-sky-300 tracking-wider">
            {invitationCode}
          </div>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/15 border border-sky-500/30 text-sky-600 dark:text-sky-300">
            Dùng 1 lần
          </span>
        </div>

        {/* Scope and Role detail */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2 text-tod-text font-semibold">
            <Users className="w-4 h-4 text-indigo-500" />
            <span>Vai trò tiếp nhận: <strong>Đồng phụ huynh / Người giám sát bổ sung</strong></span>
          </div>

          <p className="text-[11px] text-tod-text-muted pl-6 leading-relaxed">
            Bạn sẽ được quyền theo dõi lộ trình đọc truyện, phê duyệt nội dung AI và thiết lập các nguyên tắc an toàn cho bé.
          </p>
        </div>
      </div>

      {/* Automatic Activation Notice (BR-1.9 Rule Explanation) */}
      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-emerald-700 dark:text-emerald-300 text-[11px] block">
            Tự Động Kích Hoạt Hồ Sơ (BR-1.9)
          </span>
          <p className="text-[11px] text-tod-text leading-normal">
            Nếu hồ sơ được khởi tạo bởi Giáo viên và đang ở trạng thái <em>Chờ phụ huynh xác nhận</em>, việc bạn Chấp nhận với tư cách Phụ huynh sẽ <strong>tự động chuyển trạng thái hồ sơ sang Hoạt Động (Active) ngay lập tức</strong> trong cùng lượt xử lý.
          </p>
        </div>
      </div>

      {/* Reject Confirmation Dialog */}
      {showRejectConfirm ? (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>Xác nhận từ chối lời mời này?</span>
          </div>
          <p className="text-[11px] text-tod-text">
            Mã mời sẽ bị đánh dấu là đã từ chối và không thể sử dụng lại. Nếu muốn kết nối sau này, Giáo viên hoặc Nhà trường sẽ cần phát sinh một mã mới cho bạn.
          </p>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setShowRejectConfirm(false)}
              className="px-3 py-1.5 rounded-xl bg-tod-surface border border-tod-border text-tod-text text-xs font-semibold cursor-pointer hover:bg-tod-card"
            >
              Quay lại
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={onReject}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shadow-rose-600/30"
            >
              {isProcessing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Ban className="w-3.5 h-3.5" />
              )}
              <span>Xác Nhận Từ Chối</span>
            </button>
          </div>
        </div>
      ) : (
        /* Action Buttons: Accept & Reject */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-tod-border">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => setShowRejectConfirm(true)}
            className="py-2.5 px-3 rounded-xl bg-tod-surface hover:bg-tod-card border border-tod-border hover:border-rose-500/50 text-tod-text-muted hover:text-rose-500 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Từ Chối Lời Mời</span>
          </button>

          <button
            type="button"
            disabled={isProcessing}
            onClick={onAccept}
            className="btn-dashboard-primary py-2.5 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý kích hoạt...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Chấp Nhận Giám Sát</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
