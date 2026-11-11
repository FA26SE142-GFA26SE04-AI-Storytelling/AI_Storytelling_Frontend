"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Lock, Plus, Search, Trash2, X } from "lucide-react";
import { guardianService } from "@/app/services/guardianService";
import { roadmapTemplate } from "@/app/services/roadmapAdapters";
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

  const { done, open, queued, off, total } = splitRoadmap(items);
  const cover = useStoryCovers([...done, ...(open ? [open] : []), ...queued].map((i) => i.storyId));
  const active = child.status === "Active";

  const act = async (fn: () => Promise<{ success: boolean; message: string }>, okText: string) => {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    showToast(r.success ? okText : r.message, r.success ? "ok" : "err");
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

  const steps: LilyStep[] = [
    ...done.map(d => ({ key: d.id, storyId: d.storyId, title: d.title, cover: cover(d.storyId), status: "done" as const, parentPick: d.source === "parent" })),
    ...(open ? [{ key: open.id, storyId: open.storyId, title: open.title, cover: cover(open.storyId), status: "current" as const, parentPick: open.source === "parent" }] : []),
    ...queued.map(q => ({ key: q.id, storyId: q.storyId, title: q.title, cover: cover(q.storyId), status: "next" as const, parentPick: q.source === "parent" })),
  ];

  const pickedItem = [...done, ...(open ? [open] : []), ...queued].find((i) => i.id === picked) ?? null;
  const qi = queued.findIndex((q) => q.id === pickedItem?.id);

  return (
    <>
      <section className="lr-card">
        <div className="lr-card-h">
          <h3 className="display">Các truyện theo thứ tự</h3>
          {canEdit && (
            <div className="lr-actions">
              {(queued.length > 0 || open) && <button className="btn btn-no icon-only" aria-label="Làm trống lộ trình" title="Làm trống lộ trình" disabled={busy} onClick={() => void clear()}><Trash2 className="ic" /></button>}
              <button className="btn btn-p" disabled={busy || !active} onClick={() => pickStoryInLibrary(go, child.id)}><Plus className="ic" />Thêm truyện</button>
            </div>
          )}
        </div>

        {!active && <p className="notice warn lr-notice" role="status" data-inline-notice><Lock className="ic" aria-hidden /> Hồ sơ của {child.nickname} {CHILD_STATUS[child.status] ?? "không hoạt động"} nên chưa thêm truyện được.</p>}
        {error && <p className="notice err lr-notice" role="alert">{error}</p>}

        {items === undefined ? <p className="sub">Đang tải lộ trình…</p> : <LilyPondRoadmap steps={steps} mode="parent" storageKey={`parent:${child.id}`} done={done.length} total={total} emptyText="Lộ trình đang trống. Thêm một truyện hoặc chọn một lộ trình mẫu bên dưới." onStepClick={(s) => setPicked(s.key)} />}

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

      {pickedItem && (
        <Dialog title={pickedItem.title} onClose={() => setPicked(null)}>
          <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span className="rm-step-cover" style={{ background: cover(pickedItem.storyId) }} aria-hidden />
            {pickedItem.status === "completed" && <span className="pill ok">Đã đọc</span>}
            {pickedItem.status === "open" && <span className="pill wait">Đang đọc</span>}
            {pickedItem.status === "queued" && <span className="pill draft">Chưa tới</span>}
            <span className="pill draft">{SOURCE[pickedItem.source]}</span>
          </div>
          {pickedItem.note && <p className="sub">💌 {pickedItem.note}</p>}
          {canEdit && (pickedItem.status === "queued" || pickedItem.status === "open") ? (
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
              {canEdit && pickedItem.status === "queued" && (
                <button
                  className="btn btn-g icon-only"
                  aria-label="Lên"
                  title="Đưa lên trước"
                  disabled={busy || qi <= 0}
                  onClick={() => { setPicked(null); move(pickedItem.id, -1); }}
                >
                  <ArrowUp className="ic" />
                </button>
              )}
              {canEdit && pickedItem.status === "queued" && (
                <button
                  className="btn btn-g icon-only"
                  aria-label="Xuống"
                  title="Đưa xuống sau"
                  disabled={busy || qi === queued.length - 1}
                  onClick={() => { setPicked(null); move(pickedItem.id, 1); }}
                >
                  <ArrowDown className="ic" />
                </button>
              )}
              {canEdit && (pickedItem.status === "queued" || pickedItem.status === "open") && (
                <button
                  className="btn btn-no icon-only"
                  aria-label="Gỡ khỏi lộ trình"
                  title="Gỡ khỏi lộ trình"
                  disabled={busy}
                  onClick={() => { setPicked(null); void remove(pickedItem); }}
                >
                  <Trash2 className="ic" />
                </button>
              )}
            </div>
          ) : pickedItem.status === "completed" ? (
            <p className="sub">Truyện đã đọc xong, không đổi được.</p>
          ) : !canEdit ? (
            <p className="sub">Chỉ chủ hồ sơ mới sắp xếp được lộ trình.</p>
          ) : null}
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
