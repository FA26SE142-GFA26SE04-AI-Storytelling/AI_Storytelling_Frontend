"use client";
import { avatarOf } from "@/app/lib/guardian";
import DenyCover from "@/app/components/DenyCover";
import { confirmDialog } from "@/app/lib/confirm";

import "./roadmap.css";
import "@/app/features/review/review-tools.css";
import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, Check, Crown, GripVertical, Plus, Trash2, X } from "lucide-react";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import { useAuth } from "@/app/context/AuthContext";
import { guardianService } from "@/app/services/guardianService";
import type { RoadmapItem, RoadmapStoryInput, RoadmapTemplate } from "@/app/types/progress";
import type { WorkspaceProps } from "@/app/components/shell/nav";
import { useMyRole } from "@/app/features/children/useMyRole";
import { ageLabel, statusKey } from "@/app/lib/storyView";
import { fmtDate } from "@/app/lib/guardian";
import Frog from "@/app/components/brand/Frog";
import AddToRoadmapDialog from "./AddToRoadmapDialog";
import HoldPanel from "./HoldPanel";

const SKIP_REASON: Record<string, string> = {
  blocked_category: "Thuộc chủ đề bị chặn",
  age_band_mismatch: "Không hợp nhóm tuổi",
  story_unavailable: "Truyện không còn đọc được",
  source_deleted: "Truyện gốc đã bị xoá",
  data_deletion: "Dữ liệu của bé đã bị xoá",
};
const SOURCE: Record<string, string> = { parent: "Bố mẹ chọn", template: "Bộ truyện mẫu", wish: "Từ điều ước của bé" };

/** Luồng 4 Bước 4.1–4.1d — "Lộ trình của con". */
export default function RoadmapWorkspace({ go }: WorkspaceProps) {
  const { child, children: kids, selectChild, stories } = useWorkspaceData();
  const meId = useAuth().user?.id ?? -1;
  const role = useMyRole(child);
  // Nhiều bé thì phải bấm chọn một bé trước khi hiện lộ trình; chỉ có một bé thì hiện luôn.
  const [picked, setPicked] = useState<number | null>(null);
  const showing = !!child && (kids.length === 1 || picked === child.id);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [counts, setCounts] = useState<{ completed: number; total: number } | null>(null);
  const [items, setItems] = useState<RoadmapItem[] | null>(null);
  const [dialog, setDialog] = useState<{ kind: "pick" } | { kind: "add"; story?: RoadmapStoryInput; template?: RoadmapTemplate } | null>(null);
  const [templates, setTemplates] = useState<RoadmapTemplate[] | null>(null);
  const [pickTab, setPickTab] = useState<"mine" | "sets">("mine");
  const [drag, setDrag] = useState<number | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const canEdit = !!role?.can("AssignActivity");

  const load = useCallback(async () => {
    if (!child || !showing) return;
    const r = await guardianService.roadmap(child.id);
    setItems(r.data ?? []);
    setCounts(r.counts ?? null);
    setLoadError(r.success ? null : r.message);
  }, [child, showing]);
  useEffect(() => { setItems(null); void load(); }, [load]);

  if (!child) return <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}><div className="pane"><div className="empty"><b className="display">Chưa có hồ sơ bé</b></div></div></section>;

  const choose = (id: number) => { setPicked(id); selectChild(id); setNote(null); setShowHistory(false); };
  const kidsBar = (
    <div className="rm-kids" role="tablist" aria-label="Chọn bé để xem lộ trình">
      {kids.slice().sort((a, b) => Number(b.ownerUserId === meId) - Number(a.ownerUserId === meId)).map((k) => (
        <button key={k.id} role="tab" aria-selected={showing && child.id === k.id} className={`rm-kid${showing && child.id === k.id ? " on" : ""}`} onClick={() => choose(k.id)}>
          <span className="av" aria-hidden>{avatarOf(k.avatarId).emoji}</span>
          <span className="grow"><b>{k.nickname}{k.ownerUserId === meId && <Crown className="ic kid-owner" aria-label="Bạn là người quản lý chính" />}</b><small>{ageLabel(k.ageBand)}</small></span>
          {showing && child.id === k.id && <Check className="ic" />}
        </button>
      ))}
    </div>
  );

  if (!showing) return (
    <section className="ws dock" style={{ gridTemplateColumns: "1fr", gridTemplateRows: "auto 1fr" }}>
      <div className="pane rm-pick-pane">
        <div className="pb rm-body">
          {kidsBar}
          <div className="empty" style={{ height: "auto", padding: 24 }}>
            <Frog size={80} mood="think" />
            <b className="display">Chọn bé để xem lộ trình</b>
            <span>Mỗi bé có một lộ trình riêng. Bấm vào tên bé ở trên.</span>
          </div>
        </div>
      </div>
    </section>
  );

  const open = items?.find((i) => i.status === "open") ?? null;
  const queued = (items ?? []).filter((i) => i.status === "queued").sort((a, b) => a.position - b.position);
  const history = (items ?? []).filter((i) => i.status === "completed" || i.status === "skipped" || i.status === "removed");
  const total = counts?.total ?? (items ?? []).filter((i) => i.status !== "removed" && i.status !== "skipped").length;
  const overdue = !!open?.dueAt && Date.parse(open.dueAt) < Date.now();
  const ready = stories.filter((s) => ["ready", "published"].includes(statusKey(s.raw)));

  const act = async (fn: () => Promise<{ success: boolean; message: string }>, okText?: string) => {
    const r = await fn();
    setNote(r.success ? (okText ? { ok: true, text: okText } : null) : { ok: false, text: r.message });
    await load();
  };

  const reorder = (ids: number[]) => void act(() => guardianService.reorderRoadmap(child.id, ids));
  const move = (id: number, delta: number) => {
    const ids = queued.map((q) => q.id);
    const i = ids.indexOf(id);
    const j = i + delta;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    reorder(ids);
  };
  const drop = (targetId: number) => {
    if (drag === null || drag === targetId) return;
    const ids = queued.map((q) => q.id).filter((x) => x !== drag);
    ids.splice(ids.indexOf(targetId), 0, drag);
    setDrag(null);
    reorder(ids);
  };

  const openPick = () => { setPickTab("mine"); setDialog({ kind: "pick" }); };
  const showSets = async () => {
    setPickTab("sets");
    if (templates === null) setTemplates((await guardianService.templates()).data ?? []);
  };

  return (
    <section className="ws dock" style={{ gridTemplateColumns: "1fr", gridTemplateRows: "auto 1fr" }}>
      <div className="pane rm-kids-pane"><div className="pb">{kidsBar}</div></div>
      <div className="pane rm-main">
        <div key={child.id} className="pb rm-body rm-swap">
          {loadError && <div className="notice err" role="alert">{loadError}</div>}
          <div className="rm-actions">
            <div className="rm-actions-edit">
              <DenyCover active={!!role && !canEdit} text="Bạn không đủ quyền hạn để thêm, gỡ hoặc sắp xếp lộ trình." />
              <button className="btn btn-p" disabled={!canEdit} onClick={openPick}><Plus className="ic" />Thêm truyện</button>
            </div>
            <button className="btn btn-s" onClick={() => go("library")}>Thư viện</button>
            {canEdit && (queued.length > 0 || open) && <button className="btn btn-no" onClick={async () => { if (await confirmDialog(`Gỡ toàn bộ truyện chưa đọc khỏi lộ trình của ${child.nickname}?`)) void act(() => guardianService.clearRoadmap(child.id), "Đã làm trống lộ trình."); }}><Trash2 className="ic" />Làm trống</button>}
          </div>
      {note && <div className={`notice ${note.ok ? "ok" : "err"}`} role="status">{note.text}</div>}
          <HoldPanel child={child} role={role} onChanged={() => void load()} />

          <h3 className="display rm-h">Đang đọc</h3>
          {items === null ? <p className="sub">Đang tải…</p> : open ? (
            <div className="rm-item open">
              <BookOpen className="ic" />
              <div className="grow">
                <b>{open.title}</b>
                <small>{SOURCE[open.source]} · mở ngày {fmtDate(open.openedAt)}{open.dueAt ? ` · mong đọc xong trước ${fmtDate(open.dueAt)}` : ""}</small>
                {open.note && <small>💌 {open.note}</small>}
                {overdue && <small className="warn">Đã qua ngày mong đọc xong — có thể nhắc nhẹ {child.nickname} nhé.</small>}
              </div>
              {canEdit && <button className="btn btn-g" aria-label="Gỡ" onClick={() => void act(() => guardianService.removeFromRoadmap(child.id, open.id), "Đã gỡ, truyện kế tiếp được mở.")}><Trash2 className="ic" /></button>}
            </div>
          ) : (
            <div className="empty" style={{ height: "auto", padding: 20 }}>
              <Frog size={80} mood="think" />
              <b className="display">{total ? `${child.nickname} đã đọc hết truyện bạn chọn` : "Lộ trình đang trống"}</b>
              <span>Thêm truyện hoặc một bộ truyện mẫu để {child.nickname} đọc tiếp.</span>
            </div>
          )}

          <h3 className="display rm-h">Tiếp theo <small>{queued.length}</small></h3>
          {queued.length === 0 && <p className="sub">Chưa có truyện nào đang chờ.</p>}
          <ol className="rm-list">
            {queued.map((q, i) => (
              <li key={q.id} className={`rm-item${drag === q.id ? " dragging" : ""}`} draggable={canEdit}
                onDragStart={() => setDrag(q.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(q.id)} onDragEnd={() => setDrag(null)}>
                {canEdit && <GripVertical className="ic grip" aria-hidden />}
                <span className="rm-n">{i + 1}</span>
                <div className="grow"><b>{q.title}</b><small>{SOURCE[q.source]}{q.dueDays ? ` · ${q.dueDays} ngày` : ""}{q.note ? ` · 💌 ${q.note}` : ""}</small></div>
                {canEdit && <>
                  <button className="btn btn-g" aria-label="Lên" disabled={i === 0} onClick={() => move(q.id, -1)}><ArrowUp className="ic" /></button>
                  <button className="btn btn-g" aria-label="Xuống" disabled={i === queued.length - 1} onClick={() => move(q.id, 1)}><ArrowDown className="ic" /></button>
                  <button className="btn btn-g" aria-label="Gỡ" onClick={() => void act(() => guardianService.removeFromRoadmap(child.id, q.id), "Đã gỡ truyện.")}><Trash2 className="ic" /></button>
                </>}
              </li>
            ))}
          </ol>

          <button className="btn btn-g" style={{ width: "fit-content" }} onClick={() => setShowHistory(!showHistory)}>{showHistory ? "Ẩn" : "Xem"} truyện đã đọc / bỏ qua ({history.length})</button>
          {showHistory && (
            <ul className="rm-list">
              {history.map((h) => (
                <li key={h.id} className="rm-item done">
                  <div className="grow"><b>{h.title}</b><small>{h.status === "completed" ? `Đã đọc xong ${fmtDate(h.completedAt)}` : h.status === "skipped" ? `Bỏ qua: ${SKIP_REASON[h.skipReason ?? ""] ?? "Không còn phù hợp"}` : "Đã gỡ"}</small></div>
                  <span className={`pill ${h.status === "completed" ? "ok" : "draft"}`}>{h.status === "completed" ? "Đã đọc" : h.status === "skipped" ? "Bỏ qua" : "Đã gỡ"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {dialog?.kind === "pick" && (
        <div className="dlg-backdrop" role="dialog" aria-modal="true" aria-label="Thêm truyện" onClick={(e) => { if (e.target === e.currentTarget) setDialog(null); }}>
          <div className="dlg wide">
            <div className="row"><b className="display grow" style={{ fontSize: 18 }}>Thêm truyện cho {child.nickname}</b><button className="btn btn-g" aria-label="Đóng" onClick={() => setDialog(null)}><X className="ic" /></button></div>
            <div className="seg" role="tablist">
              <button type="button" role="tab" aria-selected={pickTab === "mine"} className={pickTab === "mine" ? "on" : ""} onClick={() => setPickTab("mine")}>Truyện của tôi</button>
              <button type="button" role="tab" aria-selected={pickTab === "sets"} className={pickTab === "sets" ? "on" : ""} onClick={() => void showSets()}>Bộ truyện mẫu</button>
            </div>
            {pickTab === "mine" ? (
              <>
                {ready.length === 0 && <p className="sub">Chưa có truyện nào sẵn sàng. Truyện cần được duyệt và tạo xong minh hoạ.</p>}
                <div className="sec" style={{ gap: 6 }}>
                  {ready.map((s) => (
                    <button key={s.id} className="rm-pick" onClick={() => setDialog({ kind: "add", story: { storyId: s.id, title: s.title, ageBand: s.ageBand, length: s.words } })}>
                      <span className="cover-sm" style={{ background: s.gradient }} />
                      <span className="grow"><b>{s.title}</b><small>{ageLabel(s.ageBand)} · {s.words} tiếng</small></span>
                    </button>
                  ))}
                </div>
              </>
            ) : templates === null ? <p className="sub">Đang tải…</p> : (
              <>
                {templates.length === 0 && <p className="sub">Chưa có bộ truyện mẫu nào được duyệt.</p>}
                <div className="rm-templates">
                  {templates.filter((t) => t.targetAgeBand === child.ageBand).concat(templates.filter((t) => t.targetAgeBand !== child.ageBand)).map((t) => (
                    <div key={t.id} className="rm-template">
                      <b>{t.title}</b>
                      <small>{ageLabel(t.targetAgeBand)} · mức {t.readingLevelMin}–{t.readingLevelMax} · {t.topic} · {t.stories.length} truyện</small>
                      <span className="sub">{t.description}</span>
                      {t.targetAgeBand !== child.ageBand && <small className="warn">Bộ này dành cho {ageLabel(t.targetAgeBand)}.</small>}
                      <button className="btn btn-s" style={{ width: "fit-content" }} onClick={() => setDialog({ kind: "add", template: t })}>Xem và thêm</button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {dialog?.kind === "add" && <AddToRoadmapDialog single story={dialog.story} template={dialog.template} onClose={() => { setDialog(null); void load(); }} onDone={() => void load()} />}
    </section>
  );
}
