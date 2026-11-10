"use client";

import "@/app/features/review/review-tools.css";
import "./roadmap.css";
import { useEffect, useState } from "react";
import { AlertTriangle, BookOpen, Check, Library, Lock, Plus, X } from "lucide-react";
import InfoTip from "@/app/components/InfoTip";
import Dialog from "@/app/components/Dialog";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { childProfileService } from "@/app/services/childProfileService";
import { guardianService, type ChildRef } from "@/app/services/guardianService";
import { roadmapWarningText } from "@/app/services/roadmapAdapters";
import type { RoadmapAddResult, RoadmapPosition, RoadmapStoryInput, RoadmapTemplate } from "@/app/types/progress";
import type { RoadmapCopyPlanDto } from '@/app/types/backendContracts';
import { ageLabel } from "@/app/lib/storyView";
import { showToast } from "@/app/lib/toast";

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

const DAY_OPTIONS = [null, 3, 5, 7] as const;
const DAYS_HINT = "Tính từ lúc truyện được mở cho bé. Quá ngày chỉ nhắc bạn, bé không thấy chữ “quá hạn”.";

/**
 * Luồng 4 Bước 4.1 / 4.1c — thêm một truyện hoặc một lộ trình mẫu vào lộ trình của một hoặc nhiều con.
 * Với lộ trình mẫu, kế hoạch sao chép tự tải lại mỗi khi đổi lựa chọn để phụ huynh thấy trước truyện nào được thêm.
 * Mỗi bé được kiểm tra riêng; bé không phù hợp bị bỏ qua và liệt kê lại (BR-4.A1).
 */
export default function AddToRoadmapDialog({ story, template, childId, single, onClose, onDone }: {
  story?: RoadmapStoryInput;
  template?: RoadmapTemplate;
  /** Bé chọn sẵn; không truyền thì người dùng tự chọn bé trong hộp thoại. */
  childId?: number;
  /** Chỉ thêm cho bé `childId`: ẩn mục chọn bé. */
  single?: boolean;
  onClose: () => void;
  onDone?: () => void;
}) {
  const { children: kids } = useWorkspaceData();
  const refs = useChildRefs();
  const [preview, setPreview] = useState<RoadmapCopyPlanDto | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [picked, setPicked] = useState<number[]>(childId ? [childId] : []);
  const [position, setPosition] = useState<RoadmapPosition>("next");
  const [days, setDays] = useState<number | null>(template?.defaultDaysPerStep ?? null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RoadmapAddResult | null>(null);
  const fixed = single ? kids.find((k) => k.id === childId) : undefined;
  const title = `${template ? "Thêm lộ trình mẫu" : "Thêm vào lộ trình"}${fixed ? ` cho ${fixed.nickname}` : ""}`;
  const nameOf = (id: number) => refs.find((r) => r.id === id)?.nickname ?? kids.find((k) => k.id === id)?.nickname ?? `#${id}`;
  const chosen = refs.filter((r) => picked.includes(r.id));
  const chosenKey = chosen.map((c) => c.id).join(",");

  // Lộ trình mẫu: tải kế hoạch sao chép ngay khi đủ thông tin, không bắt bấm "Xem trước".
  useEffect(() => {
    if (!template || !chosenKey) { setPreview(null); return; }
    let alive = true;
    setPreviewing(true);
    const list = refs.filter((r) => chosenKey.split(",").map(Number).includes(r.id));
    const timer = setTimeout(() => {
      void guardianService.previewTemplate(list, template, position, days).then((p) => {
        if (!alive) return;
        setPreviewing(false);
        if (p.success && p.data) setPreview(p.data); else { setPreview(null); showToast(p.message, "err"); }
      });
    }, 250);
    return () => { alive = false; clearTimeout(timer); };
    // refs đổi tham chiếu mỗi lần tải lại; chosenKey đã đủ để biết bé nào được chọn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, chosenKey, position, days]);

  const willAdd = preview ? preview.children.reduce((n, c) => n + c.steps.filter((s) => s.action === "Copy").length, 0) : 0;
  const canSubmit = !busy && chosen.length > 0 && (!template || (!!preview && !previewing && willAdd > 0));

  const submit = async () => {
    if (!chosen.length) { showToast("Hãy chọn ít nhất một bé.", "warn"); return; }
    setBusy(true);
    const r = template
      ? await guardianService.applyTemplate(chosen, template, position, days)
      : await guardianService.addToRoadmap(chosen, story!, position, days, note.trim() || null);
    setBusy(false);
    if (!(r.success && r.data)) { showToast(r.message, "err"); return; }
    onDone?.();
    // Thêm trọn vẹn thì chỉ báo bằng toast rồi đóng; có bé bị bỏ qua hoặc có cảnh báo thì giữ hộp thoại để đọc chi tiết.
    if (r.data.skipped.length === 0 && !r.data.warnings?.length) {
      const names = [...new Set(r.data.added.map((a) => nameOf(a.childProfileId)))].join(", ");
      showToast(`Đã thêm cho ${names}${r.data.added.some((a) => a.moved) ? " (truyện đã có được chuyển lên đọc tiếp theo)" : ""}.`);
      onClose();
    } else setResult(r.data);
  };

  if (result) {
    // Gom kết quả theo từng bé: đã thêm hay bị bỏ qua, kèm các lưu ý của bé đó.
    const ids = [...new Set([...result.added.map((a) => a.childProfileId), ...result.skipped.map((s) => s.childProfileId), ...(result.warnings ?? []).map((w) => w.childProfileId)])];
    const many = ids.length > 1;
    return (
      <Dialog title={title} onClose={onClose}>
        <div className="atr">
          {ids.map((id) => {
            const added = result.added.filter((a) => a.childProfileId === id);
            const skipped = result.skipped.filter((s) => s.childProfileId === id);
            const warns = (result.warnings ?? []).filter((w) => w.childProfileId === id);
            return (
              <div key={id} className="atr-res">
                <div className="atr-res-h">
                  <span className={`atr-res-ic ${added.length ? "ok" : "no"}`} aria-hidden>{added.length ? <Check className="ic" /> : <X className="ic" />}</span>
                  <b className="grow">{added.length ? `Đã thêm${many ? ` cho ${nameOf(id)}` : ""}` : `Chưa thêm${many ? ` cho ${nameOf(id)}` : ""}`}</b>
                  {added.some((a) => a.moved) && <span className="pill wait">Chuyển lên đọc tiếp theo</span>}
                </div>
                {skipped.length > 0 && (
                  <ul className="atr-plan">
                    {skipped.map((s, i) => <li key={i}><span className="grow">{s.reason}</span><span className="pill flag">Bỏ qua</span></li>)}
                  </ul>
                )}
                {warns.length > 0 && (
                  <ul className="atr-warns" aria-label="Lưu ý">
                    {warns.map((w, i) => <li key={i}><AlertTriangle className="ic" aria-hidden /><span>{w.text}</span></li>)}
                  </ul>
                )}
              </div>
            );
          })}
          <div className="atr-foot"><button className="btn btn-p" onClick={onClose}><Check className="ic" />Xong</button></div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog title={title} onClose={onClose}>
      <div className="atr">
        {/* Thứ đang thêm: tên lộ trình mẫu (kèm số truyện) hoặc tên truyện */}
        <div className="atr-what">
          <span className="atr-what-ic" aria-hidden>{template ? <Library className="ic" /> : <BookOpen className="ic" />}</span>
          <span className="grow">
            <b className="display">{template ? template.title : story?.title}</b>
            {template && <span className="pill draft">{template.stories.length} truyện</span>}
          </span>
        </div>

        {!single && (
          <div className="field">
            <span className="lbl">Cho bé</span>
            <div className="chips">
              {/* Hồ sơ không Active thì không thêm truyện vào lộ trình được (quy tắc Luồng 4): khoá ô chọn và nói lý do. */}
              {refs.map((r) => {
                const off = r.status !== "Active";
                return (
                  <button key={r.id} type="button" disabled={off} title={off ? "Hồ sơ của bé không hoạt động nên chưa thêm được" : undefined}
                    className={`chip${picked.includes(r.id) ? " on" : ""}`} onClick={() => setPicked(picked.includes(r.id) ? picked.filter((x) => x !== r.id) : [...picked, r.id])}>
                    {off && <Lock className="ic" aria-hidden />}{r.nickname} · {ageLabel(r.ageBand)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="field">
          <span className="lbl">Thêm vào đâu</span>
          <div className="seg atr-seg" role="radiogroup" aria-label="Thêm vào đâu">
            <button type="button" role="radio" aria-checked={position === "next"} className={position === "next" ? "on" : ""} onClick={() => setPosition("next")}>Đọc tiếp theo</button>
            <button type="button" role="radio" aria-checked={position === "end"} className={position === "end" ? "on" : ""} onClick={() => setPosition("end")}>Cuối lộ trình</button>
          </div>
        </div>

        <div className="field">
          <span className="lbl atr-lbl">
            {template ? "Hạn đọc mỗi truyện" : "Hạn đọc"}
            <InfoTip text={DAYS_HINT} />
          </span>
          <div className="seg atr-seg" role="radiogroup" aria-label="Hạn đọc">
            {DAY_OPTIONS.map((d) => <button key={String(d)} type="button" role="radio" aria-checked={days === d} className={days === d ? "on" : ""} onClick={() => setDays(d)}>{d ? `${d} ngày` : "Không đặt"}</button>)}
          </div>
        </div>

        {!template && (
          <label className="field"><span className="lbl">Lời nhắn cho con</span>
            <input className="inp" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: Truyện này mẹ thích lắm!" /></label>
        )}

        {template && chosen.length > 0 && (
          <div className="field">
            <span className="lbl">Truyện sẽ được thêm</span>
            {!preview ? <p className="atr-loading">{previewing ? "Đang kiểm tra…" : "Chưa có kế hoạch."}</p> : (
              <div className={`atr-plans${previewing ? " stale" : ""}`}>
                {preview.children.map((c) => (
                  <div key={c.childProfileId} className="atr-plan-kid">
                    {(preview.children.length > 1 || c.outcome === "Skipped") && (
                      <div className="atr-plan-h">
                        <b>{nameOf(c.childProfileId)}</b>
                        {c.outcome === "Skipped" && <span className="pill flag">{c.message ?? "Không thêm được"}</span>}
                      </div>
                    )}
                    {c.steps.length > 0 && (
                      <ul className="atr-plan">
                        {c.steps.slice().sort((a, b) => a.position - b.position).map((s) => (
                          <li key={s.storyId}>
                            <span className="grow">{s.title ?? "Truyện không còn tên"}</span>
                            {s.action === "Copy" ? <span className="pill ok"><Check className="ic" aria-hidden />Sẽ thêm</span>
                              : <span className="pill flag" title={s.message ?? undefined}>Bỏ qua</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                    {c.warnings.length > 0 && <ul className="atr-warns">{c.warnings.map((w) => <li key={w}><AlertTriangle className="ic" aria-hidden /><span>{roadmapWarningText(w)}</span></li>)}</ul>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="atr-foot">
          <button className="btn btn-g" onClick={onClose}><X className="ic" />Hủy</button>
          <button className="btn btn-p" disabled={!canSubmit} onClick={() => void submit()}>
            <Plus className="ic" />{busy ? "Đang thêm…" : template && willAdd > 0 && chosen.length === 1 ? `Thêm ${willAdd} truyện` : "Thêm"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
