'use client';

import React, { useState } from 'react';
import {
  Mail,
  UserPlus,
  RefreshCw,
  Clock,
  Share2,
  GraduationCap,
  Users,
  Info,
  Sparkles,
  Phone,
} from 'lucide-react';

export interface SingleInvitationFormProps {
  childNickname: string;
  isInviting: boolean;
  setIsInviting: (val: boolean) => void;
  inviteContact: string; // Có thể là email, SĐT, hoặc ghi chú người nhận
  setInviteContact: (val: string) => void;
  inviteExpiresDays: number;
  setInviteExpiresDays: (val: number) => void;
  isSendingInvite: boolean;
  onSubmit: (targetRole: 'Guardian' | 'Teacher') => void;
}

export const SingleInvitationForm: React.FC<SingleInvitationFormProps> = ({
  childNickname,
  isInviting,
  setIsInviting,
  inviteContact,
  setInviteContact,
  inviteExpiresDays,
  setInviteExpiresDays,
  isSendingInvite,
  onSubmit,
}) => {
  const [targetType, setTargetType] = useState<'Guardian' | 'Teacher'>('Guardian');

  if (!isInviting) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(targetType);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="laptop-tab-content-row p-4 rounded-2xl bg-tod-card border border-indigo-500/30 flex flex-col gap-4 text-xs text-tod-text animate-in fade-in duration-200 shadow-sm"
    >
      {/* Title & Target Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-tod-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-500">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-tod-text block">
              Tạo Lời Mời Giám Sát Đơn Lẻ
            </span>
            <span className="text-[11px] text-tod-text-muted">
              Sinh mã mời ngẫu nhiên bảo mật 1-1 cho bé <span className="text-indigo-600 dark:text-indigo-300 font-semibold">{childNickname}</span>
            </span>
          </div>
        </div>

        {/* Target role selector */}
        <div className="flex items-center bg-tod-surface p-1 rounded-xl border border-tod-border self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTargetType('Guardian')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
              targetType === 'Guardian'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-tod-text-muted hover:text-tod-text'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Người thân / Phụ huynh</span>
          </button>
          <button
            type="button"
            onClick={() => setTargetType('Teacher')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
              targetType === 'Teacher'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-tod-text-muted hover:text-tod-text'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Giáo viên phụ trách</span>
          </button>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="text-[11px] font-bold text-tod-text block mb-1">
            Thông tin người nhận (Tùy chọn)
          </label>
          <div className="relative">
            <input
              type="text"
              value={inviteContact}
              onChange={(e) => setInviteContact(e.target.value)}
              className="dashboard-input pl-8"
              placeholder={
                targetType === 'Teacher'
                  ? 'VD: teacher@school.edu.vn hoặc Cô Lan (Lớp Chồi 1)'
                  : 'VD: grandparent@gmail.com, SĐT 0901xxx hoặc Tên người thân'
              }
            />
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tod-text-muted">
              {inviteContact.includes('@') ? (
                <Mail className="w-3.5 h-3.5" />
              ) : (
                <Phone className="w-3.5 h-3.5" />
              )}
            </div>
          </div>
          <span className="text-[10px] text-tod-text-muted mt-1 block">
            Không bắt buộc là email. Chỉ dùng để ghi chú tham khảo hiển thị; hệ thống sẽ sinh mã độc lập để bạn tự gửi qua Zalo, SMS hoặc in QR.
          </span>
        </div>

        <div>
          <label className="text-[11px] font-bold text-tod-text block mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-500" />
            <span>Thời hạn mã</span>
          </label>
          <select
            value={inviteExpiresDays}
            onChange={(e) => setInviteExpiresDays(Number(e.target.value))}
            className="dashboard-input cursor-pointer"
          >
            <option value={3}>3 ngày</option>
            <option value={7}>7 ngày (Tiêu chuẩn)</option>
            <option value={14}>14 ngày</option>
            <option value={30}>30 ngày</option>
          </select>
          <span className="text-[10px] text-tod-text-muted mt-1 block">
            Mã sẽ tự hủy sau thời gian này nếu chưa claim.
          </span>
        </div>
      </div>

      {/* Multi-channel hints */}
      <div className="p-2.5 rounded-xl bg-tod-surface border border-tod-border text-[11px] text-tod-text-muted flex items-start gap-2">
        <Share2 className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-sky-600 dark:text-sky-300">Tự do lựa chọn kênh gửi:</span> Sau khi tạo, bạn có thể bấm{' '}
          <strong className="text-tod-text">Chép mã</strong>,{' '}
          <strong className="text-tod-text">Chép liên kết trực tiếp</strong> hoặc mở{' '}
          <strong className="text-tod-text">Mã QR</strong> để gửi qua Zalo, Messenger, SMS hoặc in ra giấy.
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => setIsInviting(false)}
          className="px-3 py-1.5 rounded-xl bg-tod-surface hover:bg-tod-card border border-tod-border text-tod-text-muted hover:text-tod-text font-bold transition-colors cursor-pointer"
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          disabled={isSendingInvite}
          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-400 hover:to-sky-400 text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-500/20"
        >
          {isSendingInvite ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Đang khởi tạo mã...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tạo Mã Mời Đơn Lẻ</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
