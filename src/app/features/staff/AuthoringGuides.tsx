"use client";

import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { authoringGuideService } from "@/app/services/assistanceService";
import type { AuthoringGuide } from "@/app/types/assistance";

const GROUPS: [string, string][] = [
  ["starting_point", "Tìm ý"], ["opening", "Mở đầu"], ["events", "Diễn biến"], ["emotion", "Cảm xúc"],
  ["dialogue", "Lời thoại"], ["transition", "Chuyển cảnh"], ["ending", "Kết thúc"],
];
const PLACEHOLDER: Record<string, string> = {
  person: "Ai", companion: "Cùng ai", activity: "Làm gì", place: "Ở đâu", event: "Chuyện gì xảy ra", action: "Hành động",
  feeling: "Cảm xúc", detail: "Chi tiết", thought: "Suy nghĩ", words: "Câu nói", question: "Câu hỏi",
};

/**
 * Gợi ý cách viết cho phụ huynh (`/authoring-guides`): câu gợi nghĩ và mẫu câu có chỗ điền. Không dùng AI.
 * Mẫu câu điền xong được chèn vào vị trí con trỏ; chỉ khi bấm Lưu mới tạo phiên bản.
 */
export default function AuthoringGuides({ purpose, onInsert }: { purpose: string; onInsert: (text: string) => void }) {
  const [group, setGroup] = useState("starting_point");
  const [items, setItems] = useState<AuthoringGuide[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [preview, setPreview] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    setItems(null);
    void authoringGuideService.list(purpose, group).then((r) => {
      if (!alive) return;
      setItems(r.data?.items ?? []);
      setError(r.ok ? null : r.message);
    });
    return () => { alive = false; };
  }, [purpose, group]);

  const render = async (g: AuthoringGuide) => {
    const r = await authoringGuideService.render(g.id, values[g.id] ?? {});
    if (r.ok && r.data) setPreview({ ...preview, [g.id]: r.data.text });
    else setError(r.message);
  };

  return (
    <div className="st-card">
      <h3><Lightbulb className="ic" /> Gợi ý cách viết</h3>
      <div className="chips">{GROUPS.map(([id, label]) => <button key={id} type="button" className={`chip${group === id ? " on" : ""}`} onClick={() => setGroup(id)}>{label}</button>)}</div>
      {items === null && <p className="sub">Đang tải…</p>}
      {items?.length === 0 && <p className="sub">Chưa có gợi ý cho mục này.</p>}
      {error && <div className="notice err">{error}</div>}
      <div className="st-list">
        {items?.map((g) => (
          <div key={g.id} className="st-item" style={{ cursor: "default" }}>
            <b>{g.title}</b>
            <small className="sub">{g.instruction}</small>
            {g.example && <small>Ví dụ: {g.example}</small>}
            {g.templateText && (
              <>
                <small><i>{g.templateText.replace(/\{\{(\w+)\}\}/g, (_, k: string) => `[${PLACEHOLDER[k] ?? k}]`)}</i></small>
                <div className="st-form">
                  {g.placeholderDefinitions.map((k) => (
                    <label key={k} className="field"><span className="lbl">{PLACEHOLDER[k] ?? k}</span>
                      <input className="inp" maxLength={200} value={values[g.id]?.[k] ?? ""}
                        onChange={(e) => setValues({ ...values, [g.id]: { ...values[g.id], [k]: e.target.value } })} /></label>
                  ))}
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn btn-s" disabled={!g.placeholderDefinitions.every((k) => values[g.id]?.[k]?.trim())} onClick={() => void render(g)}>Xem trước</button>
                  {preview[g.id] && <button className="btn btn-p" onClick={() => onInsert(preview[g.id])}>Chèn vào bản nháp</button>}
                </div>
                {preview[g.id] && <div className="st-content">{preview[g.id]}</div>}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
