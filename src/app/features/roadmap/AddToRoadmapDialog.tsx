"use client";

import "@/app/features/review/review-tools.css";
import "./roadmap.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, BookOpen, Check, Library, Lock, Plus, X } from "lucide-react";
import InfoTip from "@/app/components/InfoTip";
import Dialog from "@/app/components/Dialog";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { childProfileService } from "@/app/services/childProfileService";
import { guardianService, type ChildRef } from "@/app/services/guardianService";
import { groupStages, mergeRoadmapResults, roadmapWarningText } from "@/app/services/roadmapAdapters";
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

/** Chặng mới luôn nằm ở cuối lộ trình ("Đọc tiếp theo" đã bỏ). */
const POSITION: RoadmapPosition = "end";
/** Backend từ chối khi chặng đã chọn không còn nhận thêm truyện (bé đã đọc xong, ...). */
const STALE_STAGE = /không còn nhận thêm truyện/i;
type StageOption = { number: number; label: string };
const DAY_OPTIONS = [null, 3, 5, 7] as const;
const DAYS_HINT = "Tính từ lúc truyện được mở cho bé. Quá ngày chỉ nhắc bạn, bé không thấy chữ “quá hạn”.";

/**
 * Luồng 4 Bước 4.1 / 4.1c — thêm một truyện hoặc một lộ trình mẫu vào lộ trình của một hoặc nhiều con.
 * Với lộ trình mẫu, kế hoạch sao chép tự tải lại mỗi khi đổi lựa chọn để phụ huynh thấy trước truyện nào được thêm.
 * Mỗi bé được kiểm tra riêng; bé không phù hợp bị bỏ qua và liệt kê lại (BR-4.A1).
 * Truyện luôn vào một chặng: với mỗi bé được chọn, một chặng có sẵn của bé đó hoặc chặng mới ở cuối (lộ trình mẫu: luôn chặng mới ở cuối).
 */
export default function AddToRoadmapDialog({ story, template, childId, single, targetStage, onClose, onDone }: {
  story?: RoadmapStoryInput;
  template?: RoadmapTemplate;
  /** Bé chọn sẵn; không truyền thì người dùng tự chọn bé trong hộp thoại. */
  childId?: number;
  /** Chỉ thêm cho bé `childId`: ẩn mục chọn bé. */
  single?: boolean;
  /** Đi từ một chặng trên bản đồ lộ trình: số chặng, hoặc "new" = chặng mới ở cuối. Có giá trị thì không hỏi "Thêm vào đâu". */
  targetStage?: number | "new";
  onClose: () => void;
  onDone?: () => void;
}) {
  const { children: kids } = useWorkspaceData();
  const refs = useChildRefs();
  const [preview, setPreview] = useState<RoadmapCopyPlanDto | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [picked, setPicked] = useState<number[]>(childId ? [childId] : []);
  // Chặng đã chọn từ bản đồ không còn nhận truyện nữa (bé đã đọc xong, ...): bỏ chặng cố định, hiện lại ô "Thêm vào đâu" với các chặng hiện có.
  const [staleStage, setStaleStage] = useState(false);
  const fixedStage = !template && targetStage !== undefined && !staleStage;
  // Chặng chọn riêng cho từng bé (null = chặng mới ở cuối) và danh sách chặng chưa đọc xong của từng bé (tải một lần cho mỗi bé).
  const [stageByChild, setStageByChild] = useState<Record<number, number | null>>({});
  const [optionsByChild, setOptionsByChild] = useState<Record<number, StageOption[]>>({});
  const stageRequests = useRef<Record<number, number>>({});
  const [days, setDays] = useState<number | null>(template?.defaultDaysPerStep ?? null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RoadmapAddResult | null>(null);
  const fixed = single ? kids.find((k) => k.id === childId) : undefined;
  const title = `${template ? "Thêm lộ trình mẫu" : "Thêm vào lộ trình"}${fixed ? ` cho ${fixed.nickname}` : ""}`;
  const nameOf = (id: number) => refs.find((r) => r.id === id)?.nickname ?? kids.find((k) => k.id === id)?.nickname ?? `#${id}`;
  const chosen = refs.filter((r) => picked.includes(r.id));
  const chosenKey = chosen.map((c) => c.id).join(",");
  // Tải lộ trình của bé để liệt kê chặng đang đọc và các chặng chờ; câu trả lời của lượt tải cũ hơn bị bỏ qua.
  const loadStages = useCallback((id: number) => {
    const seq = (stageRequests.current[id] ?? 0) + 1;
    stageRequests.current[id] = seq;
    void guardianService.roadmap(id).then((r) => {
      if (stageRequests.current[id] !== seq) return;
      if (!r.success || !r.data) { delete stageRequests.current[id]; return; } // lần chọn bé sau sẽ tải lại
      const list = groupStages(r.data).filter((s) => s.status !== "done")
        .map((s) => ({ number: s.number, label: `Chặng ${s.number}${s.status === "current" ? " · đang đọc" : ""}` }));
      setOptionsByChild((o) => ({ ...o, [id]: list }));
    });
  }, []);
  useEffect(() => {
    if (template || fixedStage || !chosenKey) return; // lộ trình mẫu / chặng đã chọn từ bản đồ: không cần liệt kê chặng
    for (const id of chosenKey.split(",").map(Number)) if (stageRequests.current[id] === undefined) loadStages(id);
  }, [template, fixedStage, chosenKey, loadStages]);
  /** Chặng đang chọn của bé; chặng không còn trong danh sách vừa tải thì coi như chọn chặng mới. */
  const stageOf = (id: number) => {
    const s = stageByChild[id] ?? null;
    return s !== null && (optionsByChild[id] ?? []).some((o) => o.number === s) ? s : null;
  };

  // Lộ trình mẫu: tải kế hoạch sao chép ngay khi đủ thông tin, không bắt bấm "Xem trước".
  useEffect(() => {
    if (!template || !chosenKey) { setPreview(null); return; }
    let alive = true;
    setPreviewing(true);
    const list = refs.filter((r) => chosenKey.split(",").map(Number).includes(r.id));
    const timer = setTimeout(() => {
      void guardianService.previewTemplate(list, template, POSITION, days).then((p) => {
        if (!alive) return;
        setPreviewing(false);
        if (p.success && p.data) setPreview(p.data); else { setPreview(null); showToast(p.message, "err"); }
      });
    }, 250);
    return () => { alive = false; clearTimeout(timer); };
    // refs đổi tham chiếu mỗi lần tải lại; chosenKey đã đủ để biết bé nào được chọn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, chosenKey, days]);

  const willAdd = preview ? preview.children.reduce((n, c) => n + c.steps.filter((s) => s.action === "Copy").length, 0) : 0;
  const canSubmit = !busy && chosen.length > 0 && (!template || (!!preview && !previewing && willAdd > 0));

  const submit = async () => {
    if (!chosen.length) { showToast("Hãy chọn ít nhất một bé.", "warn"); return; }
    setBusy(true);
    const noteValue = note.trim() || null;
    let data: RoadmapAddResult | null = null;
    let message = "";
    if (template) {
      const r = await guardianService.applyTemplate(chosen, template, POSITION, days);
      data = r.success ? r.data : null; message = r.message;
    } else if (fixedStage || chosen.every((c) => stageOf(c.id) === null)) {
      // Một lần gọi cho mọi bé: vào chặng đã chọn từ bản đồ, hoặc chặng mới ở cuối.
      const r = await guardianService.addToRoadmap(chosen, story!, POSITION, days, noteValue, fixedStage && typeof targetStage === "number" ? targetStage : null);
      data = r.success ? r.data : null; message = r.message;
    } else {
      // Mỗi bé một chặng riêng: gọi lần lượt từng bé rồi gộp kết quả; bé nào lỗi thì liệt kê như bị bỏ qua.
      const parts: RoadmapAddResult[] = [];
      let added = 0;
      for (const c of chosen) {
        const stage = stageOf(c.id);
        const r = await guardianService.addToRoadmap([c], story!, POSITION, days, noteValue, stage);
        if (r.success && r.data) { parts.push(r.data); added++; continue; }
        message ||= r.message;
        parts.push({ added: [], skipped: [{ childProfileId: c.id, nickname: c.nickname, reason: r.message }], warnings: [] });
        if (stage !== null && STALE_STAGE.test(r.message)) { // chặng của bé này đã đóng: về chặng mới và tải lại danh sách chặng
          setStageByChild((m) => ({ ...m, [c.id]: null }));
          loadStages(c.id);
        }
      }
      data = added > 0 ? mergeRoadmapResults(parts) : null;
    }
    setBusy(false);
    if (!data) {
      showToast(message, "err");
      if (fixedStage && typeof targetStage === "number" && STALE_STAGE.test(message)) setStaleStage(true);
      return;
    }
    onDone?.();
    // Thêm trọn vẹn thì chỉ báo bằng toast rồi đóng; có bé bị bỏ qua hoặc có cảnh báo thì giữ hộp thoại để đọc chi tiết.
    if (data.skipped.length === 0 && !data.warnings?.length) {
      const names = [...new Set(data.added.map((a) => nameOf(a.childProfileId)))].join(", ");
      showToast(`Đã thêm cho ${names}${data.added.some((a) => a.moved) ? " (truyện đã có được chuyển sang chặng đã chọn)" : ""}.`);
      onClose();
    } else setResult(data);
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
                  {added.some((a) => a.moved) && <span className="pill wait">Đã chuyển chỗ</span>}
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
    <Dialog title={title} onClose={onClose} className="atr-dialog">
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

        {fixedStage ? (
          <p className="sub" role="status" style={{ margin: 0, fontWeight: 800 }}>{targetStage === "new" ? "Thêm vào chặng mới ở cuối" : `Thêm vào Chặng ${targetStage}`}</p>
        ) : (
          <div className="field">
            <span className="lbl">Thêm vào đâu</span>
            {template ? (
              // Lộ trình mẫu: luôn thành các chặng mới ở cuối.
              <p className="atr-stage-summary">Các chặng mới sẽ được thêm ở cuối lộ trình.</p>
            ) : chosen.length === 0 ? (
              <p className="sub" style={{ margin: 0 }}>Chọn bé để chọn chặng</p>
            ) : chosen.map((c) => {
              const sel = stageOf(c.id);
              return (
                <div key={c.id} className="atr-stage-child">
                  <b className="atr-stage-name">{c.nickname}</b>
                  <div className="atr-stage-options" role="radiogroup" aria-label={`Chặng của ${c.nickname}`}>
                    {(optionsByChild[c.id] ?? []).map((o) => (
                      <button key={o.number} type="button" role="radio" aria-checked={sel === o.number} className={`atr-stage-option${sel === o.number ? " on" : ""}`} onClick={() => setStageByChild((m) => ({ ...m, [c.id]: o.number }))}>{o.label}</button>
                    ))}
                    <button type="button" role="radio" aria-checked={sel === null} className={`atr-stage-option atr-stage-new${sel === null ? " on" : ""}`} onClick={() => setStageByChild((m) => ({ ...m, [c.id]: null }))}><Plus className="ic" aria-hidden />Chặng mới ở cuối</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
