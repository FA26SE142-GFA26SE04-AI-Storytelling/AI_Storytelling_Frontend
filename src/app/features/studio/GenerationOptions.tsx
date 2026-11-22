"use client";

import { useId } from "react";
import type { GenerationMode } from "@/app/types/aiStory";

export default function GenerationOptions({ mode = "standard", quizCount = 3, hasQuiz, disabled, onChange }: {
  mode?: GenerationMode;
  quizCount?: number;
  hasQuiz: boolean;
  disabled?: boolean;
  onChange: (patch: { generationMode?: GenerationMode; quizQuestionCount?: number }) => void;
}) {
  const id = useId();
  return (
    <>
      <div className="field">
        <span className="lbl" id={id}>Chế độ tạo</span>
        <div className="seg" role="group" aria-labelledby={id}>
          <button type="button" disabled={disabled} aria-pressed={mode === "standard"} className={mode === "standard" ? "on" : ""} onClick={() => onChange({ generationMode: "standard" })}>Tiêu chuẩn</button>
          <button type="button" disabled={disabled} aria-pressed={mode === "quick"} className={mode === "quick" ? "on" : ""} onClick={() => onChange({ generationMode: "quick" })}>Tạo nhanh</button>
        </div>
        {mode === "quick" && <small className="hint">Mỗi cảnh có 1 tranh minh họa. Đoán tranh dùng bộ ảnh riêng nếu có.</small>}
      </div>
      {mode === "quick" && hasQuiz && (
        <div className="field">
          <label className="lbl" htmlFor={id + "-quiz"}>Số câu quiz</label>
          <select id={id + "-quiz"} className="inp" disabled={disabled} value={quizCount} onChange={(event) => onChange({ quizQuestionCount: Number(event.target.value) })}>
            {[3, 4, 5, 6].map((count) => <option key={count} value={count}>{count} câu</option>)}
          </select>
        </div>
      )}
    </>
  );
}
