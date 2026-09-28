'use client';

import React, { useState } from 'react';
import { Sparkles, X, Check, ArrowRight, Loader2 } from 'lucide-react';

export interface PartialAiEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  onApply: (newText: string) => void;
  onAiRewrite: (prompt: string, selectedText: string) => Promise<string | null>;
}

export const PartialAiEditModal: React.FC<PartialAiEditModalProps> = ({
  isOpen,
  onClose,
  selectedText,
  onApply,
  onAiRewrite,
}) => {
  const [instruction, setInstruction] = useState<string>('Làm câu văn ngắn gọn, dễ thương và sinh động hơn');
  const [proposedText, setProposedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const res = await onAiRewrite(instruction, selectedText);
      if (res) {
        setProposedText(res);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    if (proposedText.trim()) {
      onApply(proposedText);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-3xl bg-tod-card border border-tod-border shadow-2xl p-6 text-tod-text space-y-4 transition-colors duration-500">
        <div className="flex items-center justify-between pb-3 border-b border-tod-border">
          <div className="flex items-center gap-2 text-sky-500">
            <Sparkles className="w-5 h-5" />
            <h3 className="text-sm font-extrabold text-tod-text">Nhờ Bút Thần AI Viết Lại Đoạn Này</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-tod-text-muted hover:text-tod-text hover:bg-tod-surface transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected original text */}
        <div>
          <span className="text-[11px] font-bold text-tod-text-muted uppercase tracking-wider block mb-1">
            Đoạn văn gốc được chọn
          </span>
          <div className="p-3 rounded-xl bg-tod-surface/80 border border-tod-border text-xs text-tod-text-muted italic max-h-24 overflow-y-auto">
            &ldquo;{selectedText}&rdquo;
          </div>
        </div>

        {/* Instruction Input */}
        <div>
          <span className="text-[11px] font-bold text-tod-text-muted uppercase tracking-wider block mb-1">
            Bạn muốn AI điều chỉnh như thế nào?
          </span>
          <input
            type="text"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            className="w-full text-xs text-tod-text bg-tod-surface/90 border border-tod-border rounded-xl px-3 py-2.5 focus:outline-none focus:border-sky-500 transition-colors"
            placeholder="Ví dụ: Làm câu văn hài hước hơn, giải thích từ vựng..."
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[
              'Rút ngắn câu văn',
              'Thêm cảm xúc vui tươi',
              'Dễ hiểu cho bé 6 tuổi',
              'Kịch tính hơn',
            ].map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => setInstruction(quick)}
                className="px-2 py-0.5 rounded-full text-[10px] bg-tod-surface hover:bg-tod-card text-tod-text-muted hover:text-tod-text border border-tod-border transition-colors cursor-pointer"
              >
                {quick}
              </button>
            ))}
          </div>
        </div>

        {/* Proposed AI rewrite result */}
        {proposedText && (
          <div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Gợi ý mới từ AI
            </span>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-emerald-200 font-medium">
              {proposedText}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-tod-text-muted hover:text-tod-text transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          {!proposedText ? (
            <button
              type="button"
              disabled={isLoading || !instruction.trim()}
              onClick={handleGenerate}
              className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-lg shadow-sky-900/20 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tinh chỉnh...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Tạo gợi ý mới
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAccept}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-900/20 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Áp dụng vào truyện
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
