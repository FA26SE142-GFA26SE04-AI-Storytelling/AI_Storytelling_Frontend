'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  X,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { flow4Service } from '../../../services/flow4Service';
import { ContentReportReason } from '../../../types/flow4Types';
import { useAuth } from '../../../context/AuthContext';

interface ContentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyId: number;
  storyTitle: string;
}

export const ContentReportModal: React.FC<ContentReportModalProps> = ({
  isOpen,
  onClose,
  storyId,
  storyTitle,
}) => {
  const { user } = useAuth();
  const [reason, setReason] = useState<ContentReportReason>(ContentReportReason.SafetyConcern);
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      flow4Service.createContentReport({
        storyId,
        storyTitle,
        reporterUserId: user?.id ? Number(user.id) : 1,
        reporterName: user?.fullName || user?.username || 'Phụ Huynh',
        reason,
        description: description.trim() || undefined,
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setDescription('');
        setReason(ContentReportReason.SafetyConcern);
      }, 2000);
    } catch (err) {
      console.error('Error submitting content report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 font-sans pointer-events-auto">
      <div className="w-full max-w-lg rounded-3xl bg-tod-surface border border-tod-border shadow-2xl p-6 relative backdrop-blur-2xl text-tod-text">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-tod-text-muted hover:text-tod-text hover:bg-tod-card transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-tod-text">Báo Cáo Nội Dung Truyện</h3>
            <p className="text-xs text-tod-text-muted truncate max-w-xs sm:max-w-sm">
              Tác phẩm: <span className="font-bold text-tod-text">{storyTitle}</span>
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-tod-text">Đã Tiếp Nhận Báo Cáo Thành Công!</h4>
            <p className="text-xs text-tod-text-muted max-w-sm mx-auto leading-relaxed">
              Hội đồng kiểm duyệt và an toàn sư phạm sẽ rà soát nội dung trong vòng 48 giờ. Cảm ơn bạn đã chung tay bảo vệ môi trường đọc cho các bé!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-tod-text mb-1.5">
                Lý do báo cáo <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { value: ContentReportReason.SafetyConcern, label: 'Lo ngại an toàn / Bạo lực' },
                  { value: ContentReportReason.Inappropriate, label: 'Nội dung không lành mạnh' },
                  { value: ContentReportReason.WrongAgeBand, label: 'Sai độ tuổi nhận thức' },
                  { value: ContentReportReason.Other, label: 'Lý do khác' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setReason(item.value)}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                      reason === item.value
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                        : 'bg-tod-card/60 border-tod-border text-tod-text-muted hover:text-tod-text hover:bg-tod-card'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${reason === item.value ? 'bg-rose-400' : 'bg-zinc-600'}`} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-tod-text mb-1.5">
                Chi tiết phản ánh (tùy chọn)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả cụ thể trang hoặc phân đoạn bạn thấy chưa phù hợp..."
                rows={3}
                className="w-full p-3 rounded-xl bg-tod-card border border-tod-border text-xs text-tod-text placeholder:text-tod-text-muted/60 focus:outline-none focus:border-rose-500/50 resize-none"
              />
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                Quy trình cam kết SLA: Mọi phản hồi an toàn sẽ được chuyên gia giáo dục xử lý và phản hồi tình trạng qua mục thông báo.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-tod-card hover:bg-tod-surface border border-tod-border text-xs font-bold text-tod-text-muted hover:text-tod-text transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Gửi báo cáo</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
