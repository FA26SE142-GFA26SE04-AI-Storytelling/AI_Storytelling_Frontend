"use client";

import "@/app/features/review/review-tools.css";
import { useEffect, useState } from "react";
import { Route, X } from "lucide-react";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { childProfileService } from "@/app/services/childProfileService";
import { guardianService, type ChildRef } from "@/app/services/guardianService";
import type { RoadmapAddResult, RoadmapPosition, RoadmapStoryInput, RoadmapTemplate } from "@/app/types/progress";
import type { RoadmapCopyPlanDto } from '@/app/types/backendContracts';
import { ageLabel } from "@/app/lib/storyView";

/** Lấy thông tin cần kiểm tra cho từng bé (trạng thái, nhóm tuổi, độ dài tối đa). */
export function useChildRefs(): ChildRef[] {
  const { children } = useWorkspaceData();
  const [refs, setRefs] = useState<ChildRef[]>([]);
  useEffect(() => {
    let alive = true;
    void Promise.all(children.map(async (c) => {
      const p = await childProfileService.getSafetyPolicy(c.id);
      return { id: c.id, nickname: c.nickname, status: c.status, ageBand: c.ageBand, maxStoryLength: p.data?.maxStoryLength ?? 2000 };
    })).then((r) => { if (alive) setRefs(r); });
    return () => { alive = false; };
  }, [children]);
  return refs;
}

/**
 * Luồng 4 Bước 4.1 / 4.1c — thêm một truyện hoặc một bộ truyện mẫu vào lộ trình của một hoặc nhiều con.
 * Mỗi bé được kiểm tra riêng; bé không phù hợp bị bỏ qua và liệt kê lại (BR-4.A1).
 */
export default function AddToRoadmapDialog({ story, template, onClose, onDone }: {
  story?: RoadmapStoryInput;
  template?: RoadmapTemplate;
  onClose: () => void;
  onDone?: () => void;
}) {
  const { child } = useWorkspaceData();
  const refs = useChildRefs();
  const [preview, setPreview] = useState<RoadmapCopyPlanDto | null>(null);
  const [picked, setPicked] = useState<number[]>(child ? [child.id] : []);
  const [position, setPosition] = useState<RoadmapPosition>("next");
  const [days, setDays] = useState<number | null>(template?.defaultDaysPerStep ?? null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RoadmapAddResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const title = template ? `Thêm bộ “${template.title}”` : `Thêm “${story?.title}” vào lộ trình`;

  const selectionKey = picked.join(',');
  useEffect(() => { setPreview(null); }, [selectionKey, position, days, template?.id]);
  const submit = async () => {
    const chosen = refs.filter((r) => picked.includes(r.id));
    if (!chosen.length) { setErr("Hãy chọn ít nhất một bé."); return; }
    setBusy(true);
    setErr(null);
    if (template && !preview) {
      const p = await guardianService.previewTemplate(chosen, template, position, days);
      setBusy(false);
      if (p.success && p.data) setPreview(p.data); else setErr(p.message);
      return;
    }
    const r = template
      ? await guardianService.applyTemplate(chosen, template, position, days)
      : await guardianService.addToRoadmap(chosen, story!, position, days, note.trim() || null);
    setBusy(false);
    if (r.success && r.data) { setResult(r.data); onDone?.(); } else setErr(r.message);
  };

  const nameOf = (id: number) => refs.find((r) => r.id === id)?.nickname ?? `#${id}`;

  return (
    <div className="dlg-backdrop" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dlg">
        <div className="row"><b className="display grow" style={{ fontSize: 18 }}>{title}</b><button className="btn btn-g" aria-label="Đóng" onClick={onClose}><X className="ic" /></button></div>
        {result ? (
          <>
            {result.added.length > 0 && <div className="notice ok">Đã thêm cho {[...new Set(result.added.map((a) => nameOf(a.childProfileId)))].join(", ")}{result.added.some((a) => a.moved) ? " (truyện đã có được chuyển lên đọc tiếp theo)" : ""}.</div>}
            {result.warnings?.map((w,i) => <p className="notice" key={i}>{w}</p>)}
            {result.skipped.length > 0 && (
              <div className="notice err">
                <b>Bỏ qua:</b>
                <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>{result.skipped.map((s, i) => <li key={i}>{s.nickname}: {s.reason}</li>)}</ul>
              </div>
            )}
            <button className="btn btn-p" style={{ alignSelf: "flex-end" }} onClick={onClose}>Xong</button>
          </>
        ) : (
          <>
            {template && (
              <div className="sec" style={{ gap: 4 }}>
                <span className="sub">{template.description}</span>
                <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>{template.stories.map((s) => <li key={s.storyId}>{s.title}</li>)}</ol>
              </div>
            )}
            <div className="field">
              <span className="lbl">Cho bé</span>
              <div className="chips">
                {refs.map((r) => (
                  <button key={r.id} type="button" className={`chip${picked.includes(r.id) ? " on" : ""}`} onClick={() => setPicked(picked.includes(r.id) ? picked.filter((x) => x !== r.id) : [...picked, r.id])}>
                    {r.nickname} · {ageLabel(r.ageBand)}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <span className="lbl">Vị trí</span>
              <div className="seg">
                <button type="button" className={position === "next" ? "on" : ""} onClick={() => setPosition("next")}>Đọc tiếp theo</button>
                <button type="button" className={position === "end" ? "on" : ""} onClick={() => setPosition("end")}>Thêm vào cuối</button>
              </div>
            </div>
            <div className="field">
              <span className="lbl">{template ? "Số ngày cho mỗi truyện" : "Mong con đọc xong trong"} (không bắt buộc)</span>
              <div className="seg">
                {[null, 3, 5, 7].map((d) => <button key={String(d)} type="button" className={days === d ? "on" : ""} onClick={() => setDays(d)}>{d ? `${d} ngày` : "Không đặt"}</button>)}
              </div>
              <span className="sub">Tính từ lúc truyện được mở cho bé. Quá ngày chỉ nhắc bạn, bé không thấy chữ “quá hạn”.</span>
            </div>
            {!template && (
              <label className="field"><span className="lbl">Lời nhắn cho con (không bắt buộc)</span>
                <input className="inp" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: Truyện này mẹ thích lắm!" /></label>
            )}
            {preview && <div className="sec"><b>Kế hoạch sao chép</b>{preview.children.map(c => <div key={c.childProfileId}><b>{nameOf(c.childProfileId)}</b><p>{c.message ?? c.outcome}</p>{c.steps.map(s => <p key={s.storyId}>{s.title ?? s.storyId}: {s.action === 'Copy' ? 'Sẽ thêm' : s.message ?? s.skipCode ?? 'Bỏ qua'}</p>)}{c.warnings.map(w => <p key={w}>{w}</p>)}</div>)}<p className="sub">Điều kiện sẽ được kiểm tra lại khi xác nhận.</p></div>}
            {err && <div className="notice err" role="alert">{err}</div>}
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-g" onClick={onClose}>Hủy</button>
              <button className="btn btn-p" disabled={busy || !refs.length} onClick={() => void submit()}><Route className="ic" />{busy ? "Đang xử lý…" : template && !preview ? "Xem trước kế hoạch" : "Thêm vào lộ trình"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
