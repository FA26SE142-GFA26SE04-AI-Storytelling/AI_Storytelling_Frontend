"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Lock, Plus, Search, Trash2, X } from "lucide-react";
import { guardianService } from "@/app/services/guardianService";
import { moveInLayout, roadmapTemplate, type RoadmapStage } from "@/app/services/roadmapAdapters";
import { confirmDialog } from "@/app/lib/confirm";
import { showToast } from "@/app/lib/toast";
import type * as B from "@/app/types/backendContracts";
import type { ChildProfile } from "@/app/types/childProfile";
import type { RoadmapItem, RoadmapTemplate } from "@/app/types/progress";
import type { WorkspaceId } from "@/app/components/shell/nav";
import AddToRoadmapDialog from "@/app/features/roadmap/AddToRoadmapDialog";
import RoadmapAlbum from "@/app/features/roadmap/RoadmapAlbum";
import TemplateDialog from "@/app/features/roadmap/TemplateDialog";
import { useRoadmapTemplates, useStoryCovers } from "@/app/features/roadmap/roadmapData";
import { splitRoadmap } from "./learningData";
import { pickStoryInLibrary } from "./learningIntent";
import LilyPondRoadmap, { type LilyStep } from "@/app/components/roadmap/LilyPondRoadmap";
import Dialog from "@/app/components/Dialog";

const SOURCE: Record<string, string> = { parent: "Bố mẹ chọn", template: "Lộ trình mẫu", wish: "Điều ước của bé" };
const SKIP_REASON: Record<string, string> = {
  blocked_category: "Thuộc chủ đề bị chặn", age_band_mismatch: "Không hợp nhóm tuổi",
  story_unavailable: "Truyện không còn đọc được", source_deleted: "Truyện gốc đã bị xoá", data_deletion: "Dữ liệu của bé đã bị xoá",
};
const CHILD_STATUS: Record<string, string> = { Draft: "chưa kích hoạt", Suspended: "đang tạm dừng", Archived: "đã lưu trữ" };

/** Nhóm tuổi của lộ trình mẫu ("6-8") và của hồ sơ bé ("Age_6_8") viết khác nhau; đưa về một dạng để so. */
const band = (v: string) => v.replace(/^Age_/, "").replace("_", "-");

/**
 * Luồng 4a — lộ trình đọc của một bé: các truyện theo thứ tự, bé đã đọc tới đâu.
 * Chủ hồ sơ sắp xếp, gỡ, làm trống, thêm truyện hoặc thêm cả một lộ trình mẫu. Hồ sơ không Active thì không thêm được.
 */
export default function RoadmapTab({ child, items, error, canEdit, onChanged, go }: {
  child: ChildProfile;
  items: RoadmapItem[] | undefined;
  error: string | null;
  canEdit: boolean;
  onChanged: () => void;
  go: (id: WorkspaceId) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [showOff, setShowOff] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [emptyStage, setEmptyStage] = useState(false);

  const { done, opens, queued, off, stages, total } = splitRoadmap(items);
  const all = [...done, ...opens, ...queued];
  const cover = useStoryCovers(all.map((i) => i.storyId));
  const active = child.status === "Active";
  const current = stages.find((s) => s.status === "current") ?? null;
  const waitingStages = stages.filter((s) => s.status === "next");

  const act = async (fn: () => Promise<{ success: boolean; message: string }>, okText: string) => {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    showToast(r.success ? okText : r.message, r.success ? "ok" : "err");
    onChanged();
  };
  const layout = () => waitingStages.map((s) => s.items.filter((i) => i.status === "queued").map((i) => i.id));
  const reorder = (next: number[][]) => act(() => guardianService.reorderRoadmap(child.id, next.filter((g) => g.length > 0)), "Đã đổi thứ tự.");
  const moveStage = (number: number, delta: number) => {
    const i = waitingStages.findIndex((s) => s.number === number), j = i + delta;
    if (i < 0 || j < 0 || j >= waitingStages.length) return;
    void reorder(moveInLayout(layout(), i, j));
  };
  /** Kéo thả một chặng chờ trên bản đồ sang vị trí của chặng chờ khác (toIndex = chỉ số trong `steps`). */
  const dropStage = (fromKey: number, toIndex: number) => {
    const to = waitingStages.findIndex((s) => s.number === steps[toIndex]?.stage);
    const from = waitingStages.findIndex((s) => s.number === fromKey);
    if (from < 0 || to < 0 || from === to) return;
    void reorder(moveInLayout(layout(), from, to));
  };
  /** target: số chặng (chặng đang đọc hoặc chặng chờ) hoặc "new" = tách ra chặng mới ngay sau chặng cũ của truyện. */
  const moveItem = (item: RoadmapItem, target: number | "new") => {
    if (current && target === current.number) { void act(() => guardianService.moveToStage(child.id, item.storyId, current.number), "Đã chuyển truyện vào chặng đang đọc."); return; }
    const from = waitingStages.findIndex((s) => s.items.some((i) => i.id === item.id));
    const next = layout().map((g) => g.filter((id) => id !== item.id));
    if (target === "new") next.splice(from + 1, 0, [item.id]);
    else next[waitingStages.findIndex((s) => s.number === target)].push(item.id);
    void reorder(next);
  };
  const remove = async (item: RoadmapItem) => {
    const lastOpen = item.status === "open" && opens.length === 1;
    const text = lastOpen ? `Gỡ “${item.title}” khỏi lộ trình? Chặng kế tiếp sẽ được mở cho ${child.nickname}.` : `Gỡ “${item.title}” khỏi lộ trình?`;
    if (await confirmDialog(text)) void act(() => guardianService.removeFromRoadmap(child.id, item.id), "Đã gỡ truyện.");
  };
  const clear = async () => {
    if (await confirmDialog(`Gỡ mọi truyện chưa đọc khỏi lộ trình của ${child.nickname}? Truyện đã đọc vẫn được giữ.`)) void act(() => guardianService.clearRoadmap(child.id), "Đã làm trống lộ trình.");
  };

  const canAddStage = canEdit && active;
  const steps: LilyStep[] = stages.map((s) => ({
    key: s.number, stage: s.number, storyId: s.items[0].storyId,
    title: s.items.length > 1 ? `${s.items[0].title} +${s.items.length - 1}` : s.items[0].title,
    cover: cover(s.items[0].storyId), status: s.status, count: s.items.length,
    parentPick: s.items.some((i) => i.source === "parent"),
  }));
  // Chặng trống chỉ có ở máy này (chưa lưu lên server) cho tới khi có truyện; luôn nằm cuối bản đồ.
  if (canAddStage && emptyStage) steps.push({ key: -1, stage: (stages[stages.length - 1]?.number ?? 0) + 1, storyId: 0, title: "Chặng trống", cover: "", status: "next", empty: true });
  const pickedIndex = stages.findIndex((s) => s.number === picked);
  const pickedStage = pickedIndex >= 0 ? stages[pickedIndex] : null;
  const label = (s: RoadmapStage) => `Chặng ${s.number}${s.status === "current" ? " · đang đọc" : ""}`;

  return (
    <>
      <section className="lr-card">
        <div className="lr-card-h">
          <h3 className="display">Các truyện theo thứ tự</h3>
          {canEdit && (
            <div className="lr-actions">
              {(queued.length > 0 || opens.length > 0) && <button className="btn btn-no icon-only" aria-label="Làm trống lộ trình" title="Làm trống lộ trình" disabled={busy} onClick={() => void clear()}><Trash2 className="ic" /></button>}
              <button className="btn btn-p" disabled={busy || !active} onClick={() => pickStoryInLibrary(go, child.id)}><Plus className="ic" />Thêm truyện</button>
            </div>
          )}
        </div>

        {!active && <p className="notice warn lr-notice" role="status" data-inline-notice><Lock className="ic" aria-hidden /> Hồ sơ của {child.nickname} {CHILD_STATUS[child.status] ?? "không hoạt động"} nên chưa thêm truyện được.</p>}
        {error && <p className="notice err lr-notice" role="alert">{error}</p>}

        {items === undefined ? <p className="sub">Đang tải lộ trình…</p> : <LilyPondRoadmap steps={steps} mode="parent" storageKey={`parent:${child.id}`} done={done.length} total={total} emptyText="Lộ trình đang trống. Thêm một truyện hoặc chọn một lộ trình mẫu bên dưới."
          onStepClick={(s) => { if (s.empty) pickStoryInLibrary(go, child.id, "new"); else setPicked(s.key); }}
          onAddStage={canAddStage && !emptyStage ? () => setEmptyStage(true) : undefined}
          draggable={(s) => canEdit && !busy && s.status === "next" && !s.empty}
          onReorder={canEdit ? dropStage : undefined} />}

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
      </section>

      {canEdit && <TemplateShelf child={child} disabled={!active} onAdded={onChanged} />}

      {pickedStage && (
        <Dialog title={label(pickedStage)} onClose={() => setPicked(null)}>
          {canEdit && ((active && pickedStage.status !== "done") || pickedStage.status === "next") && (
            <div className="row" style={{ gap: 8, justifyContent: "flex-end" }}>
              {active && (
                <button className="btn btn-p" disabled={busy} onClick={() => { setPicked(null); pickStoryInLibrary(go, child.id, pickedStage.number); }}><Plus className="ic" />Thêm truyện vào chặng này</button>
              )}
              {pickedStage.status === "next" && (
                <>
                  <button className="btn btn-g icon-only" aria-label="Đưa chặng lên trước" title="Đưa chặng lên trước" disabled={busy || waitingStages[0]?.number === pickedStage.number} onClick={() => { setPicked(null); moveStage(pickedStage.number, -1); }}><ArrowUp className="ic" /></button>
                  <button className="btn btn-g icon-only" aria-label="Đưa chặng xuống sau" title="Đưa chặng xuống sau" disabled={busy || waitingStages[waitingStages.length - 1]?.number === pickedStage.number} onClick={() => { setPicked(null); moveStage(pickedStage.number, 1); }}><ArrowDown className="ic" /></button>
                </>
              )}
            </div>
          )}
          <ul className="rm-steps">
            {pickedStage.items.map((item) => (
              <li key={item.id} className="rm-step">
                <span className="rm-step-cover" style={{ background: cover(item.storyId) }} aria-hidden />
                <span className="grow">
                  <b>{item.title}</b>
                  {item.note && <span className="sub"> · 💌 {item.note}</span>}
                </span>
                {item.status === "completed" && <span className="pill ok">Đã đọc</span>}
                {item.status === "open" && <span className="pill wait">Đang đọc</span>}
                {item.status === "queued" && <span className="pill draft">Chưa tới</span>}
                <span className="pill draft">{SOURCE[item.source]}</span>
                {canEdit && item.status === "queued" && (
                  <select className="inp" aria-label={`Chuyển “${item.title}” sang chặng khác`} disabled={busy} value=""
                    onChange={(e) => { const v = e.target.value; setPicked(null); moveItem(item, v === "new" ? "new" : Number(v)); }}>
                    <option value="" disabled>Chuyển sang…</option>
                    {[...(current ? [current] : []), ...waitingStages].filter((s) => s.number !== pickedStage.number).map((s) => <option key={s.number} value={s.number}>{label(s)}</option>)}
                    {pickedStage.items.length > 1 && <option value="new">Tách ra chặng mới</option>}
                  </select>
                )}
                {canEdit && (item.status === "queued" || item.status === "open") && (
                  <button className="btn btn-no icon-only" aria-label="Gỡ khỏi lộ trình" title="Gỡ khỏi lộ trình" disabled={busy} onClick={() => { setPicked(null); void remove(item); }}><Trash2 className="ic" /></button>
                )}
              </li>
            ))}
          </ul>
          {!canEdit && <p className="sub">Chỉ chủ hồ sơ mới sắp xếp được lộ trình.</p>}
        </Dialog>
      )}

    </>
  );
}

/** Lộ trình mẫu do Moderator soạn: mặc định chỉ hiện các bộ hợp nhóm tuổi của bé, tìm được theo tên. */
function TemplateShelf({ child, disabled, onAdded }: { child: ChildProfile; disabled: boolean; onAdded: () => void }) {
  const { templates, error } = useRoadmapTemplates();
  const [q, setQ] = useState("");
  const [all, setAll] = useState(false);
  const [opened, setOpened] = useState<B.RoadmapLibraryItemDto | null>(null);
  const [adding, setAdding] = useState<RoadmapTemplate | null>(null);

  const list = useMemo(() => templates ?? [], [templates]);
  const fits = list.filter((t) => band(t.ageBand) === band(child.ageBand));
  const needle = q.trim().toLowerCase();
  const base = all || !fits.length ? list : fits;
  const shown = needle ? list.filter((t) => `${t.name} ${t.description ?? ""}`.toLowerCase().includes(needle)) : base;

  return (
    <section className="lr-card">
      <div className="lr-card-h">
        <h3 className="display">Lộ trình mẫu</h3>
        <div className="lr-actions">
          <label className="lsearch lr-search">
            <Search className="ic" aria-hidden />
            <input className="inp grow" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên" aria-label="Tìm lộ trình mẫu theo tên" style={{ border: 0, background: "none" }} />
            {q && <button className="btn btn-g icon-only" aria-label="Xoá tìm kiếm" onClick={() => setQ("")}><X className="ic" /></button>}
          </label>
          {!needle && fits.length > 0 && fits.length < list.length && (
            <button className="btn btn-g" aria-pressed={all} onClick={() => setAll(!all)}>{all ? "Hợp tuổi bé" : "Tất cả"}</button>
          )}
        </div>
      </div>
      {error && <p className="notice err lr-notice" role="alert">{error}</p>}
      {templates === null ? <p className="sub">Đang tải lộ trình mẫu…</p>
        : shown.length === 0 ? <p className="rm-empty">{needle ? "Không tìm thấy lộ trình phù hợp." : "Chưa có lộ trình mẫu nào."}</p>
        : <div className="shelf-grid lr-albums">{shown.map((t) => <RoadmapAlbum key={t.id} item={t} onOpen={() => setOpened(t)} />)}</div>}

      {opened && <TemplateDialog item={opened} onClose={() => setOpened(null)} onAdd={(d) => { setOpened(null); if (disabled) showToast(`Hồ sơ của ${child.nickname} chưa hoạt động nên chưa thêm truyện được.`, "warn"); else setAdding(roadmapTemplate(d)); }} />}
      {adding && <AddToRoadmapDialog single childId={child.id} template={adding} onClose={() => setAdding(null)} onDone={onAdded} />}
    </section>
  );
}
