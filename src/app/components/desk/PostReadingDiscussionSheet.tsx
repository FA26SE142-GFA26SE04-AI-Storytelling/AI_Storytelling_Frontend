'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  HelpCircle,
  Award,
  CheckCircle2,
  Clock,
  Star,
  X,
  Heart,
} from 'lucide-react';

interface PostReadingDiscussionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle: string;
  moralLesson?: string;
  readingDurationSeconds: number;
  onCompleteSession: (comprehensionScore: number, reflections: string) => void;
}

export const PostReadingDiscussionSheet: React.FC<PostReadingDiscussionSheetProps> = ({
  isOpen,
  onClose,
  bookTitle,
  moralLesson,
  readingDurationSeconds,
  onCompleteSession,
}) => {
  const [comprehensionScore, setComprehensionScore] = useState<number>(5);
  const [reflectionText, setReflectionText] = useState<string>('');
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  if (!isOpen) return null;

  const minutes = Math.floor(readingDurationSeconds / 60);
  const seconds = readingDurationSeconds % 60;
  const timeFormatted = minutes > 0 ? `${minutes} phút ${seconds} giây` : `${seconds} giây`;

  const defaultMoral = moralLesson || 'Sự trung thực, lòng tốt và tinh thần dũng cảm vượt qua thử thách.';

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCompleted(true);
    setTimeout(() => {
      onCompleteSession(comprehensionScore * 20, reflectionText);
      setIsCompleted(false);
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200 pointer-events-auto font-sans">
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-tod-surface border border-tod-border shadow-2xl p-5 sm:p-6 backdrop-blur-2xl relative dashboard-scrollbar text-tod-text">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-tod-text-muted hover:text-tod-text hover:bg-tod-card transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-tod-text">Thảo Luận Sau Khi Đọc</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                Bước 4.3b
              </span>
            </div>
            <p className="text-xs text-tod-text-muted truncate max-w-xs sm:max-w-md">
              Tác phẩm: <span className="font-bold text-tod-text">{bookTitle}</span>
            </p>
          </div>
        </div>

        {isCompleted ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto animate-bounce">
              <Award className="w-10 h-10" />
            </div>
            <h4 className="text-base font-extrabold text-tod-text">Tuyệt Vời! Bé Đã Hoàn Thành Bài Đọc</h4>
            <p className="text-xs text-tod-text-muted max-w-sm mx-auto leading-relaxed">
              Điểm đọc hiểu và tương tác đã được cập nhật vào hồ sơ học tập của bé. Bé nhận thêm 1 Ngôi Sao Thần Kỳ! ⭐
            </p>
          </div>
        ) : (
          <form onSubmit={handleFinish} className="space-y-4">
            {/* 1. Telemetry Bar (Step 4.3) */}
            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-tod-card border border-tod-border">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-tod-text-muted block">Thời gian tương tác</span>
                  <span className="text-xs font-black text-tod-text">{timeFormatted}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-tod-text-muted block">Tiến độ câu chuyện</span>
                  <span className="text-xs font-black text-emerald-400">100% Hoàn thành</span>
                </div>
              </div>
            </div>

            {/* 2. Moral Lesson Callout */}
            <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-1.5">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
                <Heart className="w-4 h-4 text-pink-400 shrink-0" />
                <span>Bài học đạo đức cốt lõi</span>
              </div>
              <p className="text-xs text-tod-text leading-relaxed italic bg-tod-surface/40 p-2.5 rounded-xl border border-tod-border">
                &ldquo;{defaultMoral}&rdquo;
              </p>
            </div>

            {/* 3. Discussion Questions */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-tod-text">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Gợi ý câu hỏi tương tác phụ huynh & bé:</span>
              </div>
              <div className="space-y-1.5 text-xs text-tod-text-muted">
                <div className="p-2.5 rounded-xl bg-tod-card/70 border border-tod-border">
                  1. Em thích nhân vật nào nhất trong câu chuyện và tại sao?
                </div>
                <div className="p-2.5 rounded-xl bg-tod-card/70 border border-tod-border">
                  2. Nếu gặp tình huống tương tự, em sẽ xử lý như thế nào?
                </div>
              </div>
            </div>

            {/* 4. Child Reflection Input */}
            <div>
              <label className="block text-xs font-bold text-tod-text mb-1.5">
                Cảm nghĩ & chia sẻ của bé sau câu chuyện:
              </label>
              <textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="Ghi lại những câu nói hồn nhiên hoặc cảm xúc của bé..."
                rows={2}
                className="w-full p-3 rounded-xl bg-tod-card border border-tod-border text-xs text-tod-text placeholder:text-tod-text-muted/60 focus:outline-none focus:border-indigo-500/50 resize-none"
              />
            </div>

            {/* 5. Rating stars */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-tod-card border border-tod-border">
              <span className="text-xs font-bold text-tod-text">Mức độ hứng thú & hiểu bài:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setComprehensionScore(s)}
                    className="p-1 transition-transform hover:scale-125 cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        s <= comprehensionScore ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-tod-card hover:bg-tod-surface border border-tod-border text-xs font-bold text-tod-text-muted hover:text-tod-text transition-colors cursor-pointer"
              >
                Để sau
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Hoàn tất & Nhận Sao Thần Kỳ</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
