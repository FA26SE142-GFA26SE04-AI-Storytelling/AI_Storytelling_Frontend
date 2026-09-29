'use client';

import React, { useState } from 'react';
import { X, Award, Sparkles, Heart } from 'lucide-react';
import { flow4Service } from '../../../services/flow4Service';
import { AssignmentItem, AssignmentRecipientItem } from '../../../types/flow4Types';

import { useAuth } from '../../../context/AuthContext';

interface O2OScoringModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: AssignmentItem | null;
  recipient: AssignmentRecipientItem | null;
  onSuccess: () => void;
}

export const O2OScoringModal: React.FC<O2OScoringModalProps> = ({
  isOpen,
  onClose,
  assignment,
  recipient,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<string>('Bé đọc hiểu rất tốt và nhiệt tình phát biểu thảo luận trên lớp!');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !assignment || !recipient) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const teacherUserId = user?.id ? Number(user.id) : 12;
    const teacherName = user?.fullName || user?.username || 'Giáo viên phụ trách';

    flow4Service.saveO2OAssessment({
      assignmentId: assignment.id,
      recipientId: recipient.id,
      teacherUserId,
      teacherName,
      bonusPoints: 1,
      notes,
    });

    setIsSubmitting(false);
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto">
      <div className="w-full max-w-md p-6 rounded-3xl border border-amber-500/30 bg-tod-surface/95 backdrop-blur-2xl shadow-2xl relative text-tod-text">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-tod-text-muted hover:text-tod-text hover:bg-tod-surface transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-tod-text">Đánh Giá Tương Tác Trên Lớp</h3>
            <p className="text-xs text-tod-text-muted">
              Cộng điểm thưởng sao chăm chỉ cho học sinh sau giờ đọc
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 rounded-2xl bg-tod-surface/70 border border-tod-border text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-tod-text-muted">Học sinh:</span>
              <span className="font-extrabold text-tod-text">{recipient.childName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tod-text-muted">Tác phẩm:</span>
              <span className="font-extrabold text-tod-text truncate max-w-[200px]">
                {assignment.storyTitle}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-tod-border/40">
              <span className="text-tod-text-muted">Điểm thưởng sao:</span>
              <span className="inline-flex items-center gap-1 font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                <Sparkles className="w-3 h-3" /> +1 Sao Thành Tích
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-tod-text mb-1.5">
              Lời nhận xét & động viên của giáo viên:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="dashboard-input w-full p-3 rounded-xl text-xs resize-none"
              placeholder="Nhập nhận xét về sự tự tin, phát âm hoặc câu trả lời của bé..."
              required
            />
          </div>

          <div className="pt-3 border-t border-tod-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-tod-text-muted hover:text-tod-text hover:bg-tod-surface transition-all cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-zinc-950 flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Lưu & Gửi lời khen</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
