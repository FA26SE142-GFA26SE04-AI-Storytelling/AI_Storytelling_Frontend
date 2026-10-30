"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import type { ContentCategory, LearningProfile, ReadingMode, SetLearningProfileRequest } from "@/app/types/childProfile";
import { childProfileService } from "@/app/services/childProfileService";
import { READING_LEVELS, READING_MODES, defaultReadingLevel, defaultReadingMode } from "@/app/lib/guardian";

export type LearningValue = { readingLevel: number; readingMode: ReadingMode; comprehensionGoal: string; favorites: string[]; focus: string[] };

const isMode = (m?: string | null): m is ReadingMode => READING_MODES.some((x) => x.id === m);

// Danh mục nội dung lấy từ backend, dùng chung cho mọi form để khỏi tải lại.
let categoryCache: Promise<ContentCategory[]> | null = null;
const loadCategories = () => (categoryCache ??= childProfileService.getContentCategories().then((r) => (r.success ? r.data ?? [] : [])).catch(() => []).then((list) => { if (list.length === 0) categoryCache = null; return list; }));

/** Gợi ý chủ đề: danh mục đang bật và không bị chặn mặc định cho nhóm tuổi của bé. Backend lỗi thì không có gợi ý, phụ huynh vẫn tự nhập được. */
function useTopicSuggestions(ageBand?: string): string[] {
  const [cats, setCats] = useState<ContentCategory[] | null>(null);
  useEffect(() => { let alive = true; void loadCategories().then((c) => { if (alive) setCats(c); }); return () => { alive = false; }; }, []);
  if (!cats) return [];
  return cats.filter((c) => c.isActive && !(ageBand && c.defaultBlockedAgeBands?.includes(ageBand))).map((c) => c.displayName);
}

/** Hồ sơ học tập đang lưu, hoặc giá trị mặc định theo nhóm tuổi khi bé chưa có hồ sơ học tập. */
export const learningFrom = (lp: LearningProfile | null, ageBand: string): LearningValue => ({
  readingLevel: lp?.readingLevel ?? defaultReadingLevel(ageBand),
  readingMode: isMode(lp?.readingMode) ? (lp?.readingMode as ReadingMode) : defaultReadingMode(ageBand),
  comprehensionGoal: lp?.comprehensionGoal ?? "",
  favorites: lp?.topics.filter((t) => t.relation === "FavoriteTopic").map((t) => t.topic) ?? [],
  focus: lp?.topics.filter((t) => t.relation === "PriorityFocusArea").map((t) => t.topic) ?? [],
});

export const learningRequest = (v: LearningValue): SetLearningProfileRequest => ({
  readingLevel: v.readingLevel,
  readingMode: v.readingMode,
  comprehensionGoal: v.comprehensionGoal.trim(),
  topics: [
    ...v.favorites.map((topic) => ({ topic, relation: "FavoriteTopic" as const })),
    ...v.focus.map((topic) => ({ topic, relation: "PriorityFocusArea" as const })),
  ],
});

/** Bước 1.3 — mức đọc, chế độ đọc, mục tiêu đọc hiểu, chủ đề yêu thích, lĩnh vực ưu tiên. */
export default function LearningForm({ value, onChange, disabled, ageBand }: { value: LearningValue; onChange: (v: LearningValue) => void; disabled?: boolean; ageBand?: string }) {
  const suggestions = useTopicSuggestions(ageBand);
  const [topic, setTopic] = useState("");
  const [skill, setSkill] = useState("");
  const set = (patch: Partial<LearningValue>) => onChange({ ...value, ...patch });
  // Chip bị xoá thu nhỏ trước (160ms) rồi mới bỏ khỏi danh sách.
  const [leaving, setLeaving] = useState<string[]>([]);
  const latest = useRef(value);
  // Cập nhật sau mỗi lần render để timeout xoá chip đọc giá trị mới nhất (không gán ref trong lúc render).
  useEffect(() => {
    latest.current = value;
  });
  const removeChip = (kind: "favorites" | "focus", text: string) => {
    const key = `${kind}:${text}`;
    setLeaving((l) => [...l, key]);
    window.setTimeout(() => {
      onChange({ ...latest.current, [kind]: latest.current[kind].filter((x) => x !== text) });
      setLeaving((l) => l.filter((k) => k !== key));
    }, 160);
  };
  const chipClass = (kind: "favorites" | "focus", text: string) => `chip on${leaving.includes(`${kind}:${text}`) ? " leaving" : ""}`;
  const addTopic = (t: string) => {
    const clean = t.trim().slice(0, 150);
    if (clean && !value.favorites.includes(clean)) set({ favorites: [...value.favorites, clean] });
    setTopic("");
  };
  const addSkill = (s: string) => {
    const clean = s.trim().slice(0, 150);
    if (clean && !value.focus.includes(clean)) set({ focus: [...value.focus, clean] });
    setSkill("");
  };

  return (
    <div className="learn-grid">
      <div className="learn-col">
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

      <div className="field">
        <span className="lbl">Chế độ đọc</span>
        <div className="mode-row" role="radiogroup" aria-label="Chế độ đọc">
          {READING_MODES.map((m) => (
            <label key={m.id} className={`opt${value.readingMode === m.id ? " on" : ""}`}>
              <input type="radio" name="reading-mode" disabled={disabled} checked={value.readingMode === m.id} onChange={() => set({ readingMode: m.id })} />
              <span><b>{m.label}</b><small>{m.hint}</small></span>
            </label>
          ))}
        </div>
      </div>

      <label className="field"><span className="lbl">Mục tiêu đọc hiểu (không bắt buộc)</span>
        <textarea className="inp" rows={2} maxLength={500} disabled={disabled} value={value.comprehensionGoal}
          onChange={(e) => set({ comprehensionGoal: e.target.value })} placeholder="Ví dụ: hiểu ý chính, nhớ tên nhân vật" /></label>

      </div>

      <div className="learn-col">

      <div className="field">
        <span className="lbl">Chủ đề bé yêu thích</span>
        <div className="chips">
          {value.favorites.map((t) => (
            <span key={t} className={chipClass("favorites", t)}>{t}{!disabled && <button type="button" aria-label={`Bỏ ${t}`} onClick={() => removeChip("favorites", t)}><X size={12} /></button>}</span>
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
              {suggestions.filter((t) => !value.favorites.includes(t)).map((t) => <button type="button" key={t} className="chip" onClick={() => addTopic(t)}>+ {t}</button>)}
            </div>
          </>
        )}
      </div>

      <div className="field">
        <span className="lbl">Kỹ năng muốn ưu tiên</span>
        <div className="chips">
          {value.focus.map((s) => (
            <span key={s} className={chipClass("focus", s)}>{s}{!disabled && <button type="button" aria-label={`Bỏ ${s}`} onClick={() => removeChip("focus", s)}><X size={12} /></button>}</span>
          ))}
        </div>
        {!disabled && (
          <div className="row">
            <input className="inp" value={skill} maxLength={150} onChange={(e) => setSkill(e.target.value)} placeholder="Thêm kỹ năng, ví dụ: đọc hiểu, phát âm"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(skill); } }} />
            <button type="button" className="btn btn-s" disabled={!skill.trim()} onClick={() => addSkill(skill)}><Plus className="ic" />Thêm</button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
