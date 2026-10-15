"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { LearningProfile, SetLearningProfileRequest } from "@/app/types/childProfile";
import { FOCUS_AREAS, READING_LEVELS, TOPIC_SUGGESTIONS } from "@/app/lib/guardian";

export type LearningValue = { readingLevel: number; comprehensionGoal: string; favorites: string[]; focus: string[] };

export const learningFrom = (lp: LearningProfile | null, fallbackLevel: number): LearningValue => ({
  readingLevel: lp?.readingLevel ?? fallbackLevel,
  comprehensionGoal: lp?.comprehensionGoal ?? "",
  favorites: lp?.topics.filter((t) => t.relation === "FavoriteTopic").map((t) => t.topic) ?? [],
  focus: lp?.topics.filter((t) => t.relation === "PriorityFocusArea").map((t) => t.topic) ?? [],
});

export const learningRequest = (v: LearningValue): SetLearningProfileRequest => ({
  readingLevel: v.readingLevel,
  comprehensionGoal: v.comprehensionGoal.trim(),
  topics: [
    ...v.favorites.map((topic) => ({ topic, relation: "FavoriteTopic" as const })),
    ...v.focus.map((topic) => ({ topic, relation: "PriorityFocusArea" as const })),
  ],
});

/** Bước 1.3 — mức đọc, mục tiêu đọc hiểu, chủ đề yêu thích, lĩnh vực ưu tiên. */
export default function LearningForm({ value, onChange, disabled }: { value: LearningValue; onChange: (v: LearningValue) => void; disabled?: boolean }) {
  const [topic, setTopic] = useState("");
  const set = (patch: Partial<LearningValue>) => onChange({ ...value, ...patch });
  const addTopic = (t: string) => {
    const clean = t.trim().slice(0, 150);
    if (clean && !value.favorites.includes(clean)) set({ favorites: [...value.favorites, clean] });
    setTopic("");
  };
  const toggleFocus = (f: string) => set({ focus: value.focus.includes(f) ? value.focus.filter((x) => x !== f) : [...value.focus, f] });

  return (
    <div className="sec" style={{ gap: 18 }}>
      <div className="field">
        <span className="lbl">Mức đọc</span>
        <div className="level-row" role="radiogroup" aria-label="Mức đọc">
          {READING_LEVELS.map((l) => (
            <button key={l.level} type="button" role="radio" aria-checked={value.readingLevel === l.level} disabled={disabled}
              className={`level${value.readingLevel === l.level ? " on" : ""}`} onClick={() => set({ readingLevel: l.level })}>
              <b className="display">{l.level}</b><small>{l.grade}</small>
            </button>
          ))}
        </div>
        <span className="sub">AI dùng mức đọc để chỉnh độ dài truyện, độ dài câu và số từ mới.</span>
      </div>

      <label className="field"><span className="lbl">Mục tiêu đọc hiểu (không bắt buộc)</span>
        <textarea className="inp" rows={2} maxLength={500} disabled={disabled} value={value.comprehensionGoal}
          onChange={(e) => set({ comprehensionGoal: e.target.value })} placeholder="Ví dụ: hiểu ý chính, nhớ tên nhân vật" /></label>

      <div className="field">
        <span className="lbl">Chủ đề bé yêu thích</span>
        <div className="chips">
          {value.favorites.map((t) => (
            <span key={t} className="chip on">{t}{!disabled && <button type="button" aria-label={`Bỏ ${t}`} onClick={() => set({ favorites: value.favorites.filter((x) => x !== t) })}><X size={12} /></button>}</span>
          ))}
        </div>
        {!disabled && (
          <>
            <div className="row">
              <input className="inp" value={topic} maxLength={150} onChange={(e) => setTopic(e.target.value)} placeholder="Thêm chủ đề"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTopic(topic); } }} />
              <button type="button" className="btn btn-s" disabled={!topic.trim()} onClick={() => addTopic(topic)}><Plus className="ic" />Thêm</button>
            </div>
            <div className="chips">
              {TOPIC_SUGGESTIONS.filter((t) => !value.favorites.includes(t)).map((t) => <button type="button" key={t} className="chip" onClick={() => addTopic(t)}>+ {t}</button>)}
            </div>
          </>
        )}
      </div>

      <div className="field">
        <span className="lbl">Kỹ năng muốn ưu tiên</span>
        <div className="chips">
          {FOCUS_AREAS.map((f) => <button type="button" key={f} disabled={disabled} className={`chip${value.focus.includes(f) ? " on" : ""}`} onClick={() => toggleFocus(f)}>{f}</button>)}
        </div>
      </div>
    </div>
  );
}
