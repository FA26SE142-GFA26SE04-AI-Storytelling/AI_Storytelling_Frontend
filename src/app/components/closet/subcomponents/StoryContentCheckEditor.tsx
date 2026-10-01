'use client';

import React from 'react';
import {
  Sparkles,
  Edit3,
  Wand2,
  Lightbulb,
} from 'lucide-react';
import { AIProposalDto } from '../../../types/aiStory';
import { AIStoryProposalPreview } from './AIStoryProposalPreview';

export interface StoryContentCheckEditorProps {
  title: string;
  onTitleChange: (v: string) => void;
  content: string;
  onContentChange: (v: string) => void;
  lesson: string;
  onLessonChange: (v: string) => void;
  isEditing: boolean;
  onToggleEditing: () => void;
  busy: boolean;
  selection: { start: number; endExclusive: number; text: string } | null;
  onSelectionChange: (sel: { start: number; endExclusive: number; text: string } | null) => void;
  aiInstruction: string;
  onAiInstructionChange: (v: string) => void;
  onProposeAiEdit: () => void;
  proposal: AIProposalDto | null;
  onDecideProposal: (apply: boolean) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export const StoryContentCheckEditor: React.FC<StoryContentCheckEditorProps> = ({
  title,
  onTitleChange,
  content,
  onContentChange,
  lesson,
  onLessonChange,
  isEditing,
  onToggleEditing,
  busy,
  selection,
  onSelectionChange,
  aiInstruction,
  onAiInstructionChange,
  onProposeAiEdit,
  proposal,
  onDecideProposal,
  textareaRef,
}) => {
  return (
    <div className="space-y-4">
      {/* 1. Tiêu đề câu chuyện */}
      <div>
        <label className="block text-xs font-black uppercase text-tod-text-muted mb-1.5">
          Tiêu đề truyện
        </label>
        <input
          type="text"
          disabled={!isEditing && !busy}
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Nhập tên câu chuyện..."
          className="dashboard-input w-full p-3 text-base font-black text-tod-text rounded-2xl border border-tod-border bg-tod-card/60"
        />
      </div>

      {/* 2. Toàn văn câu chuyện */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-black uppercase text-tod-text-muted flex items-center gap-1.5">
            <span>Toàn văn câu chuyện</span>
            <span className="text-[11px] font-normal lowercase text-sky-500">(Bôi đen chữ để nhờ AI viết lại)</span>
          </label>
          <button
            type="button"
            onClick={onToggleEditing}
            className="text-xs font-bold text-sky-500 hover:text-sky-400 flex items-center gap-1 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Chế độ xem' : 'Sửa chữ trực tiếp'}</span>
          </button>
        </div>

        <textarea
          ref={textareaRef}
          readOnly={!isEditing}
          rows={10}
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          onSelect={(e) => {
            const node = e.currentTarget;
            const start = node.selectionStart;
            const endExclusive = node.selectionEnd;
            if (endExclusive > start) {
              onSelectionChange({
                start,
                endExclusive,
                text: content.slice(start, endExclusive),
              });
            } else {
              onSelectionChange(null);
            }
          }}
          className={`dashboard-input w-full p-4 text-sm leading-relaxed rounded-2xl border transition-all ${
            isEditing
              ? 'border-sky-500/80 bg-tod-surface shadow-inner'
              : 'border-tod-border bg-tod-card/40 cursor-text'
          }`}
        />
      </div>

      {/* 3. Bài học đạo đức */}
      <div>
        <label className="block text-xs font-black uppercase text-amber-500 mb-1.5 flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4" />
          <span>Bài học đạo đức gửi gắm cho bé</span>
        </label>
        <input
          type="text"
          disabled={!isEditing && !busy}
          value={lesson}
          onChange={(e) => onLessonChange(e.target.value)}
          placeholder="Bài học đạo đức rút ra từ câu chuyện..."
          className="dashboard-input w-full p-3 text-xs sm:text-sm font-medium text-tod-text rounded-2xl border border-tod-border bg-tod-card/60"
        />
      </div>

      {/* AI Partial Edit Prompt Bar (khi người dùng bôi đen đoạn văn) */}
      {selection && (
        <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold text-sky-500">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Đã chọn {selection.text.length} ký tự: &ldquo;{selection.text.slice(0, 45)}...&rdquo;</span>
            </span>
            <button
              type="button"
              onClick={() => onSelectionChange(null)}
              className="text-tod-text-muted hover:text-tod-text text-[11px] cursor-pointer"
            >
              Hủy chọn
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiInstruction}
              onChange={(e) => onAiInstructionChange(e.target.value)}
              placeholder="Nhập yêu cầu AI viết lại đoạn này (VD: Viết hài hước hơn, thêm chi tiết bạn Thỏ...)"
              className="dashboard-input flex-1 p-2.5 text-xs rounded-xl border border-tod-border"
            />
            <button
              type="button"
              disabled={busy || !aiInstruction.trim()}
              onClick={onProposeAiEdit}
              className="btn-dashboard-primary px-3.5 py-2 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Đề xuất viết lại</span>
            </button>
          </div>
        </div>
      )}

      {/* Preview đề xuất AI */}
      {proposal && (
        <div className="dashboard-card p-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-amber-500 uppercase">
            <Sparkles className="w-4 h-4" />
            <span>Xem trước bản đề xuất của AI</span>
          </div>
          <div className="max-h-48 overflow-y-auto rounded-xl p-3 bg-tod-surface border border-tod-border text-xs">
            <AIStoryProposalPreview proposal={proposal} />
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              disabled={busy}
              onClick={() => onDecideProposal(false)}
              className="dashboard-card px-3.5 py-1.5 text-xs font-bold cursor-pointer"
            >
              Bỏ qua
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onDecideProposal(true)}
              className="btn-dashboard-primary px-4 py-1.5 text-xs font-bold cursor-pointer"
            >
              Áp dụng thay đổi này
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
