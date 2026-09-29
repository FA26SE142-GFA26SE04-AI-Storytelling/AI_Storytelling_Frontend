'use client';

import React from 'react';
import {
  BookOpen,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Ban,
  Award,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import {
  AssignmentItem,
  AssignmentStatus,
  AssignmentRecipientItem,
} from '../../../types/flow4Types';

interface AssignmentCardProps {
  assignment: AssignmentItem;
  onCancelAssignment: (assignmentId: number, recipientId?: number) => void;
  onOpenO2OModal: (assignment: AssignmentItem, recipient: AssignmentRecipientItem) => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({
  assignment,
  onCancelAssignment,
  onOpenO2OModal,
}) => {
  const isCancelled = assignment.status === AssignmentStatus.Cancelled;
  const isCompleted = assignment.status === AssignmentStatus.Completed;

  const formatDate = (isoStr?: string | null) => {
    if (!isoStr) return 'Không có';
    return new Date(isoStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: AssignmentStatus) => {
    switch (status) {
      case AssignmentStatus.Completed:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Đã hoàn thành
          </span>
        );
      case AssignmentStatus.InProgress:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" /> Đang đọc
          </span>
        );
      case AssignmentStatus.Cancelled:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 line-through">
            <Ban className="w-3 h-3" /> Đã rút lại (Hủy)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <BookOpen className="w-3 h-3" /> Được giao đọc
          </span>
        );
    }
  };

  return (
    <div
      className={`dashboard-card-interactive p-4 rounded-2xl flex flex-col justify-between transition-all duration-300 ${
        isCancelled ? 'opacity-65 bg-zinc-900/40 border-zinc-800' : 'bg-tod-card border-tod-border'
      }`}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </span>
            <div>
              <h4 className="font-extrabold text-sm text-tod-text leading-tight line-clamp-1">
                {assignment.storyTitle}
              </h4>
              <p className="text-[11px] text-tod-text-muted flex items-center gap-1 mt-0.5">
                <Users className="w-3 h-3 text-indigo-400" />
                <span>
                  {assignment.classGroupName
                    ? `${assignment.classGroupName}`
                    : `Giao riêng cho bé: ${assignment.childName || 'Bé'}`}
                </span>
              </p>
            </div>
          </div>
          {getStatusBadge(assignment.status)}
        </div>

        {/* Date and Assigner Meta */}
        <div className="flex items-center gap-4 text-[11px] text-tod-text-muted my-2 py-2 border-y border-tod-border/40">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>Hạn nộp: {formatDate(assignment.dueAt)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span>Bởi: {assignment.assignedByName}</span>
          </div>
        </div>

        {/* Recipient Details & O2O Status */}
        <div className="space-y-2 mt-3">
          <p className="text-[11px] font-bold text-tod-text-muted uppercase tracking-wider">
            Tiến độ học sinh ({assignment.recipients.length}):
          </p>
          <div className="space-y-1.5">
            {assignment.recipients.map((rec) => {
              const isRecCompleted = rec.status === AssignmentStatus.Completed;
              const isRecCancelled = rec.status === AssignmentStatus.Cancelled;

              return (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-tod-surface/60 border border-tod-border/50 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isRecCompleted
                          ? 'bg-emerald-400'
                          : isRecCancelled
                          ? 'bg-zinc-600'
                          : 'bg-sky-400 animate-pulse'
                      }`}
                    />
                    <span className={`font-semibold ${isRecCancelled ? 'line-through text-zinc-500' : 'text-tod-text'}`}>
                      {rec.childName}
                    </span>
                    {rec.o2oAssessment && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-extrabold border border-amber-500/20">
                        <Sparkles className="w-2.5 h-2.5" /> +{rec.o2oAssessment.bonusPoints} sao O2O
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Bước 4.4: Nút chấm O2O khi học sinh đã hoàn thành */}
                    {isRecCompleted && !rec.o2oAssessment && (
                      <button
                        onClick={() => onOpenO2OModal(assignment, rec)}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 transition-all flex items-center gap-1 cursor-pointer"
                        title="Đánh giá tương tác trên lớp và cộng 1 điểm sao thưởng"
                      >
                        <Award className="w-3 h-3" />
                        <span>Chấm O2O</span>
                      </button>
                    )}

                    {/* Bước 4.1b: Nút hủy bài tập cho cá nhân này nếu chưa hoàn thành */}
                    {!isRecCompleted && !isRecCancelled && (
                      <button
                        onClick={() => onCancelAssignment(assignment.id, rec.id)}
                        className="px-2 py-1 rounded-lg text-[11px] font-bold text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all cursor-pointer"
                        title="Hủy bài tập riêng cho học sinh này"
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Card Actions Footer */}
      {!isCancelled && !isCompleted && (
        <div className="mt-4 pt-3 border-t border-tod-border/40 flex items-center justify-between">
          <p className="text-[10px] text-tod-text-muted flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            <span>Có thể rút lại bài nếu chưa hoàn thành</span>
          </p>

          {/* Bước 4.1b: Hủy bài tập toàn bộ lớp/nhóm */}
          <button
            onClick={() => onCancelAssignment(assignment.id)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Hủy bài tập</span>
          </button>
        </div>
      )}
    </div>
  );
};
