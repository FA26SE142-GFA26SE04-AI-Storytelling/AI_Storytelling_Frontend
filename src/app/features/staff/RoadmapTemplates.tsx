"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Copy, Plus, Send, Trash2, Undo2 } from "lucide-react";
import { staffService } from "@/app/services/staffService";
import type { ContentCategory } from "@/app/types/childProfile";
import type { RoadmapCandidateStory, RoadmapTemplateDetail, RoadmapTemplateGroup, RoadmapTemplateInput, RoadmapTemplateListItem } from "@/app/types/staff";
import { Notice, Page, fmt, useAction } from "./ui";

const GROUPS: [RoadmapTemplateGroup, string][] = [
  ["Drafts", "Nháp của tôi"], ["Pending", "Chờ duyệt"], ["Published", "Đang công khai"], ["Archived", "Đã lưu trữ"], ["Orphaned", "Nháp bị bỏ dở"],
];
const STATUS: Record<string, [string, string]> = {
  Draft: ["draft", "Nháp"], PendingReview: ["wait", "Chờ duyệt"], Published: ["ok", "Đang công khai"], Archived: ["draft", "Đã lưu trữ"],
};
const DECISION: Record<string, string> = { approved: "Đã duyệt", changes_requested: "Yêu cầu sửa", rejected: "Từ chối" };
const AGE: Record<string, string> = { "6-8": "6–8 tuổi", "9-10": "9–10 tuổi" };
const EMPTY: RoadmapTemplateInput = { name: "", description: "", ageBand: "6-8", mainCategoryId: 0, readingLevelMin: 1, readingLevelMax: 2, defaultDaysPerStory: 3 };

/**
 * Luồng 5 Bước 5.9 — bộ truyện mẫu. Backend chỉ cho Moderator soạn; bộ được Moderator khác duyệt rồi mới công khai.
 * Bản đã công khai không sửa được: nhân bản thành nháp mới, sửa, gửi duyệt lại (bản mới thay bản cũ khi được duyệt).
 */
export function RoadmapTemplates() {
  const [group, setGroup] = useState<RoadmapTemplateGroup>("Drafts");
  const [list, setList] = useState<RoadmapTemplateListItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [archiving, setArchiving] = useState<{ id: number; reason: string } | null>(null);

  const load = useCallback(async () => {
    const r = await staffService.roadmapTemplates.list(group);
    setList(r.data?.items ?? []);
    setLoadError(r.success ? null : r.message);
  }, [group]);
  useEffect(() => { void load(); }, [load]);
  const { note, busy, run } = useAction(load);
  const t = staffService.roadmapTemplates;

  const clone = async (id: number) => {
    const r = await t.clone(id);
    if (r.success && r.data) { setGroup("Drafts"); setEditing(r.data.roadmapId); }
    return r;
  };

  if (editing !== null) {
    return <TemplateEditor id={editing === "new" ? null : editing} onClose={() => { setEditing(null); void load(); }} onCreated={(id) => setEditing(id)} />;
  }

  return (
    <Page title="Bộ truyện mẫu" sub="Phụ huynh chép bộ truyện mẫu vào lộ trình của con. Bộ của bạn được một Moderator khác duyệt. Bản đã công khai không sửa trực tiếp: hãy nhân bản, sửa rồi gửi duyệt lại."
      actions={<button className="btn btn-p" onClick={() => setEditing("new")}><Plus className="ic" />Bộ mới</button>}>
      <div className="seg" style={{ width: "fit-content" }}>
        {GROUPS.map(([g, label]) => <button key={g} className={group === g ? "on" : ""} onClick={() => setGroup(g)}>{label}</button>)}
      </div>
      <Notice note={note} />
      {loadError && <div className="notice err">{loadError}</div>}
      {archiving && (
        <div className="st-card">
          <label className="field"><span className="lbl">Lý do lưu trữ (3–500 ký tự)</span>
            <textarea className="inp" rows={2} maxLength={500} value={archiving.reason} onChange={(e) => setArchiving({ ...archiving, reason: e.target.value })} /></label>
          <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
            <button className="btn btn-g" onClick={() => setArchiving(null)}>Hủy</button>
            <button className="btn btn-no" disabled={busy || archiving.reason.trim().length < 3}
              onClick={() => void run(() => t.archive(archiving.id, archiving.reason.trim()), "Đã lưu trữ bộ truyện mẫu.").then((ok) => ok && setArchiving(null))}>Lưu trữ</button>
          </div>
        </div>
      )}
      <div className="st-card st-scroll">
        <table className="st-table">
          <thead><tr><th>Bộ truyện</th><th>Tuổi · chủ đề</th><th>Truyện</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td><b>{r.name}</b><br /><small className="sub">{r.createdByName ?? ""}{r.isMine ? " (bạn)" : ""}{r.publishedAt ? ` · công khai ${fmt(r.publishedAt)}` : r.submittedAt ? ` · gửi ${fmt(r.submittedAt)}` : ""}</small>
                  {r.needsUpdate && <><br /><small style={{ color: "var(--danger)" }}>Có {r.retiredStoryCount} truyện không còn dùng được — cần cập nhật</small></>}</td>
                <td>{AGE[r.ageBand] ?? r.ageBand}{r.mainCategory ? ` · ${r.mainCategory.displayName}` : ""}</td>
                <td>{r.storyCount}</td>
                <td><span className={`pill ${STATUS[r.status]?.[0] ?? "draft"}`}>{STATUS[r.status]?.[1] ?? r.status}</span></td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="btn btn-g" onClick={() => setEditing(r.id)}>{group === "Drafts" ? "Sửa" : "Xem"}</button>
                  {group === "Pending" && r.isMine && <button className="btn btn-g" disabled={busy} onClick={() => void run(() => t.withdraw(r.id), "Đã rút, bộ trở về nháp.")}><Undo2 className="ic" />Rút</button>}
                  {(group === "Published" || group === "Orphaned") && (r.openCloneId
                    ? <button className="btn btn-g" onClick={() => setEditing(r.openCloneId!)}><Copy className="ic" />Mở bản nhân bản</button>
                    : <button className="btn btn-g" disabled={busy} onClick={() => void run(() => clone(r.id), "Đã nhân bản thành nháp mới.")}><Copy className="ic" />Nhân bản</button>)}
                  {group === "Published" && <button className="btn btn-g" disabled={busy} onClick={() => setArchiving({ id: r.id, reason: "" })}>Lưu trữ</button>}
                </td>
              </tr>
            ))}
            {list.length === 0 && !loadError && <tr><td colSpan={5} className="sub">Không có bộ truyện nào.</td></tr>}
          </tbody>
        </table>
      </div>
    </Page>
  );
}

type Item = { storyId: number; title: string; days: number | null; eligible: boolean };

/** Soạn một bộ: thông tin chung, danh sách truyện theo thứ tự, kiểm tra trước khi gửi duyệt. */
function TemplateEditor({ id, onClose, onCreated }: { id: number | null; onClose: () => void; onCreated: (id: number) => void }) {
  const [detail, setDetail] = useState<RoadmapTemplateDetail | null>(null);
  const [form, setForm] = useState<RoadmapTemplateInput>(EMPTY);
  const [items, setItems] = useState<Item[]>([]);
  const [itemsDirty, setItemsDirty] = useState(false);
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [candidates, setCandidates] = useState<RoadmapCandidateStory[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const t = staffService.roadmapTemplates;

  const load = useCallback(async () => {
    if (id === null) return;
    const r = await t.get(id);
    setLoadError(r.success ? null : r.message);
    if (!r.data) return;
    const d = r.data;
    setDetail(d);
    setForm({ name: d.name, description: d.description ?? "", ageBand: d.ageBand === "9-10" ? "9-10" : "6-8", mainCategoryId: d.mainCategory?.id ?? 0,
      readingLevelMin: d.readingLevelMin, readingLevelMax: d.readingLevelMax, defaultDaysPerStory: d.defaultDaysPerStory });
    setItems([...d.stories].sort((a, b) => a.position - b.position).map((s) => ({ storyId: s.storyId, title: s.title ?? `Truyện #${s.storyId}`, days: s.days, eligible: s.isEligible })));
    setItemsDirty(false);
  }, [id, t]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void staffService.categories().then((r) => setCategories((r.data ?? []).filter((c) => c.isActive))); }, []);
  const { note, busy, run } = useAction(load);

  const editable = id === null || (detail?.status === "Draft" && detail.isMine);

  // Ứng viên theo tuổi, mức đọc, chủ đề đang chọn (chỉ khi đang sửa danh sách truyện).
  useEffect(() => {
    if (!editable || id === null) return;
    void t.candidates({ ageBand: form.ageBand, readingLevelMin: form.readingLevelMin, readingLevelMax: form.readingLevelMax, contentCategoryId: form.mainCategoryId || undefined })
      .then((r) => setCandidates(r.data?.items ?? []));
  }, [editable, id, form.ageBand, form.readingLevelMin, form.readingLevelMax, form.mainCategoryId, t]);

  const set = (p: Partial<RoadmapTemplateInput>) => setForm((f) => ({ ...f, ...p }));
  const changeItems = (next: Item[]) => { setItems(next); setItemsDirty(true); };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    changeItems(next);
  };

  const saveInfo = async () => {
    const body = { ...form, description: form.description?.trim() || null, name: form.name.trim() };
    if (id === null) {
      const r = await t.create(body);
      if (r.success && r.data) onCreated(r.data.id);
      return r;
    }
    return t.update(id, body);
  };
  const levels = Array.from({ length: 10 }, (_, i) => i + 1);
  const infoValid = form.name.trim().length > 0 && form.mainCategoryId > 0 && form.readingLevelMin <= form.readingLevelMax;

  return (
    <Page title={id === null ? "Bộ truyện mẫu mới" : detail?.name || "Bộ truyện mẫu"}
      sub={detail ? `${STATUS[detail.status]?.[1] ?? detail.status}${detail.createdByName ? ` · ${detail.createdByName}` : ""}${detail.clonedFromId ? ` · nhân bản từ bộ #${detail.clonedFromId}` : ""}` : undefined}
      actions={<button className="btn btn-g" onClick={onClose}>Về danh sách</button>}>
      <Notice note={note} />
      {loadError && <div className="notice err">{loadError}</div>}

      {detail?.lastReview && (
        <div className={`notice ${detail.lastReview.decision === "approved" ? "ok" : "warn"}`}>
          <b>{DECISION[detail.lastReview.decision] ?? detail.lastReview.decision}</b>{detail.lastReview.reviewerName ? ` · ${detail.lastReview.reviewerName}` : ""} · {fmt(detail.lastReview.decidedAt)}
          {(detail.lastReview.generalNote || detail.lastReview.reason) && <p style={{ margin: "4px 0 0" }}>{detail.lastReview.generalNote ?? detail.lastReview.reason}</p>}
          {detail.lastReview.parts.length > 0 && <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>{detail.lastReview.parts.map((p, i) => <li key={i}>{p.note}</li>)}</ul>}
        </div>
      )}

      <div className="st-card">
        <h3>Thông tin chung</h3>
        <div className="st-form">
          <label className="field"><span className="lbl">Tên bộ</span><input className="inp" maxLength={200} disabled={!editable} value={form.name} onChange={(e) => set({ name: e.target.value })} /></label>
          <label className="field"><span className="lbl">Nhóm tuổi</span>
            <select className="inp" disabled={!editable} value={form.ageBand} onChange={(e) => set({ ageBand: e.target.value as RoadmapTemplateInput["ageBand"] })}><option value="6-8">6–8 tuổi</option><option value="9-10">9–10 tuổi</option></select></label>
          <label className="field"><span className="lbl">Chủ đề chính</span>
            <select className="inp" disabled={!editable} value={form.mainCategoryId} onChange={(e) => set({ mainCategoryId: +e.target.value })}>
              <option value={0}>Chọn chủ đề</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
            </select></label>
          <label className="field"><span className="lbl">Mức đọc từ</span><select className="inp" disabled={!editable} value={form.readingLevelMin} onChange={(e) => set({ readingLevelMin: +e.target.value })}>{levels.map((n) => <option key={n}>{n}</option>)}</select></label>
          <label className="field"><span className="lbl">đến</span><select className="inp" disabled={!editable} value={form.readingLevelMax} onChange={(e) => set({ readingLevelMax: +e.target.value })}>{levels.map((n) => <option key={n}>{n}</option>)}</select></label>
          <label className="field"><span className="lbl">Số ngày mỗi truyện</span><input className="inp" type="number" min={1} max={30} disabled={!editable} value={form.defaultDaysPerStory} onChange={(e) => set({ defaultDaysPerStory: Math.min(30, Math.max(1, +e.target.value || 1)) })} /></label>
        </div>
        <label className="field"><span className="lbl">Mô tả</span><textarea className="inp" rows={2} maxLength={2000} disabled={!editable} value={form.description ?? ""} onChange={(e) => set({ description: e.target.value })} /></label>
        {editable && <div className="row"><span className="grow" /><button className="btn btn-p" disabled={busy || !infoValid} onClick={() => void run(saveInfo, id === null ? "Đã tạo bộ nháp." : "Đã lưu thông tin.")}>{id === null ? "Tạo bộ nháp" : "Lưu thông tin"}</button></div>}
      </div>

      {id !== null && (
        <div className="st-card">
          <h3>Truyện theo thứ tự <small className="sub">{items.length} truyện</small></h3>
          {items.length === 0 && <p className="sub">Chưa có truyện nào.</p>}
          <ol style={{ margin: 0, paddingLeft: 18 }}>
            {items.map((s, i) => (
              <li key={s.storyId} style={{ marginBottom: 4 }}>
                <span className="row" style={{ gap: 6 }}>
                  <span className="grow">{s.title}{!s.eligible && <span className="pill flag" style={{ marginLeft: 6 }}>Không còn dùng được</span>}</span>
                  {editable && <>
                    <input className="inp" style={{ width: 90 }} type="number" min={1} max={30} placeholder={`${form.defaultDaysPerStory} ngày`} aria-label="Số ngày"
                      value={s.days ?? ""} onChange={(e) => changeItems(items.map((x, j) => (j === i ? { ...x, days: e.target.value ? Math.min(30, Math.max(1, +e.target.value)) : null } : x)))} />
                    <button className="btn btn-g" aria-label="Lên" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="ic" /></button>
                    <button className="btn btn-g" aria-label="Xuống" disabled={i === items.length - 1} onClick={() => move(i, 1)}><ArrowDown className="ic" /></button>
                    <button className="btn btn-g" aria-label="Bỏ" onClick={() => changeItems(items.filter((_, j) => j !== i))}><Trash2 className="ic" /></button>
                  </>}
                </span>
              </li>
            ))}
          </ol>
          {editable && (
            <>
              <span className="lbl">Thêm truyện đang công khai phù hợp tuổi, mức đọc và chủ đề</span>
              <div className="chips">
                {candidates.filter((c) => !items.some((x) => x.storyId === c.storyId)).map((c) => (
                  <button key={c.storyId} type="button" className="chip" onClick={() => changeItems([...items, { storyId: c.storyId, title: c.title ?? `Truyện #${c.storyId}`, days: null, eligible: true }])}>
                    + {c.title ?? `#${c.storyId}`}{c.readingLevel ? ` · mức ${c.readingLevel}` : ""}
                  </button>
                ))}
              </div>
              {candidates.length === 0 && <span className="sub">Chưa có truyện công khai nào phù hợp. Thử đổi mức đọc hoặc chủ đề (nhớ bấm Lưu thông tin).</span>}
              <div className="row"><span className="grow" />
                <button className="btn btn-p" disabled={busy || !itemsDirty} onClick={() => void run(() => t.setItems(id, items.map((x) => ({ storyId: x.storyId, days: x.days }))), "Đã lưu danh sách truyện.")}>Lưu danh sách truyện</button></div>
            </>
          )}
        </div>
      )}

      {detail && detail.checks.length > 0 && (
        <div className="st-card">
          <h3>Kiểm tra trước khi gửi duyệt</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>{detail.checks.map((c) => <li key={c.code} style={{ color: c.passed ? undefined : "var(--danger)" }}>{c.passed ? "✓" : "✗"} {c.message}</li>)}</ul>
          {editable && (
            <div className="row"><span className="grow" />
              {itemsDirty && <small className="sub">Lưu danh sách truyện trước khi gửi.</small>}
              <button className="btn btn-p" disabled={busy || !detail.canSubmit || itemsDirty} onClick={() => void run(() => t.submit(id!), "Đã gửi duyệt.").then((ok) => ok && onClose())}><Send className="ic" />Gửi duyệt</button>
            </div>
          )}
        </div>
      )}
    </Page>
  );
}
