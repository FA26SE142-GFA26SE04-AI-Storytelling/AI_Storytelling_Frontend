"use client";

import { useState } from "react";
import {
  Baby, Expand, Feather, Flower2, Lightbulb, MessagesSquare, PenLine, Shrink, Smile, WandSparkles, type LucideIcon,
} from "lucide-react";
import { buildRevisionInstruction, REVISION_INTENTS, type RevisionIntent } from "@/app/features/story-workflow/revisionIntents";
import { FREE_TEXT_MAX } from "@/app/features/story-workflow/aiStoryInputFlowUtils";
import type { StorySelection } from "@/app/features/story-workflow/storySelection";

const ICON: Record<RevisionIntent, LucideIcon> = {
  simplify: Feather, shorten: Shrink, lengthen: Expand, more_dialogue: MessagesSquare, less_scary: Smile,
  emphasize_lesson: Lightbulb, age_fit: Baby, change_ending: Flower2, custom: PenLine,
};

type Props = {
  selection: StorySelection | null;
  wholeStory: boolean;
  disabled: boolean;
  onSelectAll: () => void;
  onClear: () => void;
  onSubmit: (instruction: string) => void;
};

/** Chỉnh sửa theo chủ đích (Luồng 2 mục 5.8): chọn phạm vi, chọn mục đích, AI tạo đề xuất để xem trước. */
export default function RevisionPanel({ selection, wholeStory, disabled, onSelectAll, onClear, onSubmit }: Props) {
  const [intent, setIntent] = useState<RevisionIntent | null>(null);
  const [note, setNote] = useState("");
  const instruction = intent ? buildRevisionInstruction(intent, note) : null;
  const excerpt = selection ? (selection.text.length > 90 ? `${selection.text.slice(0, 90)}…` : selection.text) : null;

  return (
    <div className="sec revise">
      <div className="sec-h">Chỉnh sửa theo chủ đích</div>
      <div className="seg">
        <button className={selection && !wholeStory ? "on" : ""} onClick={onClear} disabled={disabled}>Một đoạn</button>
        <button className={wholeStory ? "on" : ""} onClick={onSelectAll} disabled={disabled}>Cả truyện</button>
      </div>
      {excerpt && !wholeStory
        ? <blockquote className="excerpt">“{excerpt}”</blockquote>
        : !wholeStory && <p className="hint">Bôi đen một đoạn trong bản thảo, hoặc chạm vào một đoạn văn để chọn.</p>}

      <div className="intents" role="radiogroup" aria-label="Mục đích chỉnh sửa">
        {REVISION_INTENTS.map((o) => {
          const Icon = ICON[o.id];
          return (
            <button key={o.id} role="radio" aria-checked={intent === o.id} title={o.hint} disabled={disabled}
              className={`intent${intent === o.id ? " on" : ""}`} onClick={() => setIntent(o.id)}>
              <Icon /><span>{o.label}</span>
            </button>
          );
        })}
      </div>
      {intent && (
        <label className="field">
          <span className="lbl row" style={{ justifyContent: "space-between" }}>
            {intent === "custom" ? "Bạn muốn AI sửa thế nào?" : "Ghi chú thêm (không bắt buộc)"}<em className="count">{note.length}/{FREE_TEXT_MAX}</em>
          </span>
          <input className="inp" maxLength={FREE_TEXT_MAX} value={note} disabled={disabled} onChange={(e) => setNote(e.target.value)}
            placeholder={intent === "custom" ? "Ví dụ: cho Thỏ Trắng nói lời cảm ơn" : ""} />
        </label>
      )}
      <button className="btn btn-p btn-c" disabled={disabled || !selection || !instruction}
        onClick={() => instruction && onSubmit(instruction)}>
        <WandSparkles className="ic" />Nhờ AI sửa
      </button>
      <p className="hint">AI giữ nguyên nhân vật, diễn biến chính và bài học. Bạn được xem trước trước khi áp dụng.</p>
    </div>
  );
}
