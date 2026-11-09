"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, BookOpen, Check, ChevronDown, Lock, Plus, Trash2 } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { guardianService } from "@/app/services/guardianService";
import { confirmDialog } from "@/app/lib/confirm";
import { showToast } from "@/app/lib/toast";
import { fmtDate } from "@/app/lib/guardian";
import { statusKey } from "@/app/lib/storyView";
import type { ChildProfile } from "@/app/types/childProfile";
import type { RoadmapItem, RoadmapStoryInput } from "@/app/types/progress";
import AddToRoadmapDialog from "./AddToRoadmapDialog";
import { useStoryCovers } from "./roadmapData";

const SOURCE: Record<string, string> = { parent: "Bố mẹ chọn", template: "Lộ trình mẫu", wish: "Điều ước của bé" };
const SKIP_REASON: Record<string, string> = {
  blocked_category: "Thuộc chủ đề bị chặn", age_band_mismatch: "Không hợp nhóm tuổi",
  story_unavailable: "Truyện không còn đọc được", source_deleted: "Truyện gốc đã bị xoá", data_deletion: "Dữ liệu của bé đã bị xoá",
};
const CHILD_STATUS: Record<string, string> = { Draft: "chưa kích hoạt", Suspended: "đang tạm dừng", Archived: "đã lưu trữ" };

/**
 * Popup lộ trình của một bé: các truyện theo thứ tự đọc và bé đã đọc tới đâu.
 * Chủ hồ sơ sắp xếp, gỡ, làm trống và thêm truyện ngay trong popup. Hồ sơ không Active thì không thêm được truyện (quy tắc Luồng 4).
 */
export default function ChildRoadmapDialog({ child, canEdit, onClose, onChanged }: { child: ChildProfile; canEdit: boolean; onClose: () => void; onChanged: () => void }) {
  const { stories } = useWorkspaceData();
  const [items, setItems] = useState<RoadmapItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [adding, setAdding] = useState<RoadmapStoryInput | null>(null);
  const [showOff, setShowOff] = useState(false);

  const load = useCallback(async () => {
    const r = await guardianService.roadmap(child.id);
    setItems(r.data ?? []);
    setError(r.success ? null : r.message);
  }, [child.id]);
  useEffect(() => { void load(); }, [load]);

  const active = child.status === "Active";
  const done = (items ?? []).filter((i) => i.status === "completed").sort((a, b) => Date.parse(a.completedAt ?? "") - Date.parse(b.completedAt ?? ""));
  const open = items?.find((i) => i.status === "open") ?? null;
  const queued = (items ?? []).filter((i) => i.status === "queued").sort((a, b) => a.position - b.position);
  const off = (items ?? []).filter((i) => i.status === "skipped" || i.status === "removed");
  const total = done.length + (open ? 1 : 0) + queued.length;
  const cover = useStoryCovers([...done, ...(open ? [open] : []), ...queued].map((i) => i.storyId));
  const ready = stories.filter((s) => ["ready", "published"].includes(statusKey(s.raw)));

  const act = async (fn: () => Promise<{ success: boolean; message: string }>, okText: string) => {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    showToast(r.success ? okText : r.message, r.success ? "ok" : "err");
    await load();
    onChanged();
  };
  const move = (id: number, delta: number) => {
    const ids = queued.map((q) => q.id);
    const i = ids.indexOf(id), j = i + delta;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    void act(() => guardianService.reorderRoadmap(child.id, ids), "Đã đổi thứ tự.");
  };
  const remove = async (item: RoadmapItem) => {
    const text = item.status === "open" ? `Gỡ “${item.title}” khỏi lộ trình? Truyện kế tiếp sẽ được mở cho ${child.nickname}.` : `Gỡ “${item.title}” khỏi lộ trình?`;
    if (await confirmDialog(text)) void act(() => guardianService.removeFromRoadmap(child.id, item.id), "Đã gỡ truyện.");
  };
  const clear = async () => {
    if (await confirmDialog(`Gỡ mọi truyện chưa đọc khỏi lộ trình của ${child.nickname}? Truyện đã đọc vẫn được giữ.`)) void act(() => guardianService.clearRoadmap(child.id), "Đã làm trống lộ trình.");
  };

  const percent = total ? Math.round((done.length / total) * 100) : 0;

  return (
    <>
      <Dialog title={`Lộ trình của ${child.nickname}`} onClose={onClose} wide>
        <div className="rm-kd">
          {picking ? (
            <>
              <button className="shelf-back" onClick={() => setPicking(false)}><ArrowLeft className="ic" />Quay lại lộ trình</button>
              {ready.length === 0 ? <p className="sub">Chưa có truyện nào sẵn sàng để thêm.</p> : (
                <div className="rm-pickgrid">
                  {ready.map((s) => (
                    <button key={s.id} className="bk" onClick={() => setAdding({ storyId: s.id, title: s.title, ageBand: s.ageBand, length: s.words })}>
                      <span className="bk-cover" style={{ background: s.cover }}><span className="bk-name display">{s.title}</span></span>
                      <span className="bk-title">{s.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="rm-progress">
                <div className="rm-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done.length} aria-label="Tiến độ đọc">
                  <i style={{ width: `${percent}%` }} />
                </div>
                <b>Đã đọc {done.length}/{total}</b>
              </div>
              {!active && <p className="notice warn" role="status" data-inline-notice><Lock className="ic" aria-hidden /> Hồ sơ của {child.nickname} {CHILD_STATUS[child.status] ?? "không hoạt động"} nên chưa thêm truyện được.</p>}
              {error && <p className="notice err" role="alert" data-inline-notice>{error}</p>}

              {items === null ? <p className="sub">Đang tải lộ trình…</p> : total === 0 ? (
                <p className="rm-empty">Lộ trình đang trống. Thêm một truyện, hoặc chọn một lộ trình mẫu ở thư viện.</p>
              ) : (
                <ol className="rm-steps">
                  {done.map((d) => (
                    <li key={d.id} className="rm-step done">
                      <span className="rm-step-n"><Check className="ic" aria-hidden /></span>
                      <span className="rm-step-cover" style={{ background: cover(d.storyId) }} aria-hidden />
                      <span className="grow"><b>{d.title}</b></span>
                      <span className="pill ok" title={`Đọc xong ${fmtDate(d.completedAt)}`}>Đã đọc</span>
                    </li>
                  ))}
                  {open && (
                    <li className="rm-step now">
                      <span className="rm-step-n"><BookOpen className="ic" aria-hidden /></span>
                      <span className="rm-step-cover" style={{ background: cover(open.storyId) }} aria-hidden />
                      <span className="grow"><b>{open.title}</b>{open.note && <em>💌 {open.note}</em>}</span>
                      <span className="pill wait">Đang đọc</span>
                      {open.dueAt && <span className={`pill ${Date.parse(open.dueAt) < Date.now() ? "flag" : "draft"}`}>Hạn {fmtDate(open.dueAt)}</span>}
                      <span className="pill draft">{SOURCE[open.source]}</span>
                      {canEdit && <button className="btn btn-g icon-only" aria-label="Gỡ" title="Gỡ" disabled={busy} onClick={() => void remove(open)}><Trash2 className="ic" /></button>}
                    </li>
                  )}
                  {queued.map((q, i) => (
                    <li key={q.id} className="rm-step">
                      <span className="rm-step-n">{done.length + (open ? 1 : 0) + i + 1}</span>
                      <span className="rm-step-cover" style={{ background: cover(q.storyId) }} aria-hidden />
                      <span className="grow"><b>{q.title}</b>{q.note && <em>💌 {q.note}</em>}</span>
                      <span className="pill draft">{SOURCE[q.source]}</span>
                      {canEdit && <>
                        <button className="btn btn-g icon-only" aria-label="Lên" title="Lên" disabled={busy || i === 0} onClick={() => move(q.id, -1)}><ArrowUp className="ic" /></button>
                        <button className="btn btn-g icon-only" aria-label="Xuống" title="Xuống" disabled={busy || i === queued.length - 1} onClick={() => move(q.id, 1)}><ArrowDown className="ic" /></button>
                        <button className="btn btn-g icon-only" aria-label="Gỡ" title="Gỡ" disabled={busy} onClick={() => void remove(q)}><Trash2 className="ic" /></button>
                      </>}
                    </li>
                  ))}
                </ol>
              )}

              {off.length > 0 && (
                <div className="rm-off">
                  <button className="btn btn-g" aria-expanded={showOff} onClick={() => setShowOff(!showOff)}><ChevronDown className="ic" style={{ transform: showOff ? "rotate(180deg)" : undefined }} />Đã gỡ hoặc bỏ qua ({off.length})</button>
                  {showOff && <ul className="rm-steps">{off.map((o) => (
                    <li key={o.id} className="rm-step off">
                      <span className="grow"><b>{o.title}</b></span>
                      <span className="pill draft" title={o.status === "skipped" ? SKIP_REASON[o.skipReason ?? ""] ?? "Không còn phù hợp" : undefined}>{o.status === "skipped" ? "Bỏ qua" : "Đã gỡ"}</span>
                    </li>
                  ))}</ul>}
                </div>
              )}

              {canEdit && (
                <div className="rm-kd-foot">
                  {(queued.length > 0 || open) && <button className="btn btn-no" disabled={busy} onClick={() => void clear()}><Trash2 className="ic" />Làm trống</button>}
                  <button className="btn btn-p" disabled={busy || !active} onClick={() => setPicking(true)}><Plus className="ic" />Thêm truyện</button>
                </div>
              )}
            </>
          )}
        </div>
      </Dialog>
      {adding && <AddToRoadmapDialog single childId={child.id} story={adding} onClose={() => setAdding(null)} onDone={() => { setPicking(false); void load(); onChanged(); }} />}
    </>
  );
}
