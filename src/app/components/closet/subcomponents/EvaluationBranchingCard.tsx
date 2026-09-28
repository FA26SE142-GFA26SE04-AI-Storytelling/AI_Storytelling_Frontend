'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Edit3,
  BookmarkCheck,
  Archive,
  ArrowRight,
} from 'lucide-react';
import { ExistingStoryEvaluationDto } from '../../../types/story';

export interface EvaluationBranchingCardProps {
  evaluation: ExistingStoryEvaluationDto;
  onKeepOriginal: () => void;
  onAdapt: () => void;
  onManualEdit: () => void;
  onArchive: () => void;
  isLoadingAction: boolean;
}

export const EvaluationBranchingCard: React.FC<EvaluationBranchingCardProps> = ({
  evaluation,
  onKeepOriginal,
  onAdapt,
  onManualEdit,
  onArchive,
  isLoadingAction,
}) => {
  const { decision, decisionText, safetyScore, feedbackNotes } = evaluation;

  // Decision 1: Suitable (Phù hợp)
  if (decision === 1 || decisionText?.toLowerCase() === 'suitable') {
    return (
      <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-xl space-y-4 transition-colors duration-500">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                Đạt chuẩn an toàn & độ tuổi
              </span>
              <span className="text-xs text-tod-text-muted">
                Điểm an toàn: <b className="text-emerald-600 dark:text-emerald-400 font-black">{Math.round((safetyScore || 1) * 100)}%</b>
              </span>
            </div>
            <h4 className="text-base font-extrabold text-tod-text mt-1">
              Câu chuyện rất phù hợp với lứa tuổi của bé!
            </h4>
            <p className="text-xs text-tod-text-muted mt-1 leading-relaxed">
              {feedbackNotes || 'Nội dung trong sáng, câu từ ngắn gọn và từ vựng thích hợp với khả năng đọc hiểu hiện tại.'}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-emerald-500/20 flex flex-wrap items-center justify-end gap-2.5">
          <button
            onClick={onManualEdit}
            disabled={isLoadingAction}
            className="px-4 py-2 rounded-xl bg-tod-surface hover:bg-tod-card text-tod-text border border-tod-border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" /> Chỉnh sửa thêm
          </button>
          <button
            onClick={onKeepOriginal}
            disabled={isLoadingAction}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <BookmarkCheck className="w-4 h-4" /> Sử dụng ngay bản gốc
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Decision 2: AdaptRecommended (Khuyến nghị tinh chỉnh)
  if (decision === 2 || decisionText?.toLowerCase() === 'adaptrecommended' || decisionText?.toLowerCase() === 'needsadaptation') {
    return (
      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-xl space-y-4 transition-colors duration-500">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                Gợi ý tinh chỉnh cho bé
              </span>
              <span className="text-xs text-tod-text-muted">
                Điểm an toàn: <b className="text-amber-600 dark:text-amber-400 font-black">{Math.round((safetyScore || 0.85) * 100)}%</b>
              </span>
            </div>
            <h4 className="text-base font-extrabold text-tod-text mt-1">
              Câu chuyện có thể hơi dài hoặc chứa từ vựng nâng cao
            </h4>
            <p className="text-xs text-tod-text-muted mt-1 leading-relaxed">
              {feedbackNotes || 'Nội dung hoàn toàn lành mạnh, nhưng một số đoạn có thể được AI hỗ trợ rút gọn và làm câu từ dễ hiểu hơn đối với bé.'}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-amber-500/20 flex flex-wrap items-center justify-end gap-2.5">
          <button
            onClick={onKeepOriginal}
            disabled={isLoadingAction}
            className="px-3.5 py-2 rounded-xl bg-tod-surface hover:bg-tod-card text-tod-text-muted hover:text-tod-text border border-tod-border text-xs font-medium transition-all cursor-pointer"
          >
            Vẫn giữ bản gốc
          </button>
          <button
            onClick={onManualEdit}
            disabled={isLoadingAction}
            className="px-3.5 py-2 rounded-xl bg-tod-surface hover:bg-tod-card text-tod-text border border-tod-border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" /> Tự sửa tay
          </button>
          <button
            onClick={onAdapt}
            disabled={isLoadingAction}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-900/30 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4" /> Nhờ AI tinh chỉnh lời văn cho bé
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Decision 3: Blocked (Bị chặn an toàn)
  return (
    <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 shadow-xl space-y-4 transition-colors duration-500">
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 shrink-0">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40">
            Chưa phù hợp quy tắc an toàn
          </span>
          <h4 className="text-base font-extrabold text-tod-text mt-1">
            Nội dung có một số yếu tố chưa phù hợp với trẻ em
          </h4>
          <p className="text-xs text-tod-text-muted mt-1 leading-relaxed">
            {feedbackNotes || 'Hệ thống phát hiện một số từ ngữ hoặc tình tiết nhạy cảm. Để bảo vệ không gian an toàn cho bé, câu chuyện này tạm thời không thể phát hành.'}
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-rose-500/20 flex items-center justify-end gap-2.5">
        <button
          onClick={onArchive}
          disabled={isLoadingAction}
          className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-200 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Archive className="w-3.5 h-3.5" /> Lưu trữ & Bỏ qua truyện này
        </button>
      </div>
    </div>
  );
};
