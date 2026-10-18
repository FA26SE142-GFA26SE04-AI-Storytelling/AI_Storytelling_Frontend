"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { creatorService, newOperationId } from "@/app/services/creatorService";
import type { CreateDraftInput, CreatorDraft } from "@/app/types/creator";
import { GENRES } from "@/app/lib/storyRules";
import { Notice, Page, fmt } from "./ui";
import CreatorEditor from "./CreatorEditor";

const AGE: Record<string, string> = { "6-8": "6–8 tuổi", "9-10": "9–10 tuổi" };
const MODE: Record<string, string> = { reading: "Đọc", listening: "Nghe", combined: "Đọc và nghe" };
const blank = (): CreateDraftInput => ({ title: "", description: "", ageBand: "6-8", genre: GENRES[0], experienceMode: "reading" });

/** Luồng 5 Bước 5.8 — truyện mẫu Content Creator soạn thủ công (`/creator/stories`), mỗi lần lưu là một phiên bản. */
export function CreatorStories() {
  const [list, setList] = useState<CreatorDraft[] | null>(null);
  const [form, setForm] = useState<CreateDraftInput | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  // Tạo truyện mất mạng thì thử lại đúng thao tác cũ (cùng operationId) để không tạo trùng.
  const createOp = useRef<{ op: string; input: CreateDraftInput } | null>(null);

  const load = useCallback(async () => {
    const r = await creatorService.list();
    setList(r.ok ? r.data?.items ?? [] : []);
    if (!r.ok) setNote({ ok: false, text: r.message });
  }, []);
  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    if (!form) return;
    const same = createOp.current && JSON.stringify(createOp.current.input) === JSON.stringify(form);
    if (!same) createOp.current = { op: newOperationId("create"), input: { ...form } };
    const { op, input } = createOp.current!;
    setBusy(true);
    setNote(null);
    const r = await creatorService.create(op, { ...input, title: input.title.trim(), description: input.description.trim() });
    setBusy(false);
    if (r.ok && r.data) {
      createOp.current = null;
      setForm(null);
      setOpenId(r.data.storyId);
      void load();
    } else setNote({ ok: false, text: r.status === 0 ? `${r.message}` : r.message });
  };

  if (openId !== null) {
    return (
      <Page title="Soạn truyện mẫu" sub="Truyện mẫu dành cho Thư viện chung, bằng tiếng Việt và không chứa thông tin cá nhân của người thật.">
        <CreatorEditor key={openId} storyId={openId} onBack={() => { setOpenId(null); void load(); }} />
      </Page>
    );
  }

  const set = (p: Partial<CreateDraftInput>) => setForm((f) => (f ? { ...f, ...p } : f));
  return (
    <Page title="Truyện mẫu của tôi" sub="Truyện bạn soạn sẽ vào Thư viện chung sau khi Moderator duyệt. Mỗi lần lưu tạo một phiên bản; có thể xem lại và khôi phục bản cũ."
      actions={<button className="btn btn-p" onClick={() => { setForm(blank()); setNote(null); }}><Plus className="ic" />Truyện mới</button>}>
      <Notice note={note} />
      <div className="notice warn">Backend chưa có gửi duyệt, rút yêu cầu, gỡ khỏi Thư viện chung và xoá truyện của Content Creator. Truyện hiện ở trạng thái Nháp.</div>
      {form && (
        <div className="st-card">
          <h3>Truyện mới</h3>
          <div className="st-form">
            <label className="field"><span className="lbl">Tên truyện</span><input className="inp" maxLength={200} value={form.title} onChange={(e) => set({ title: e.target.value })} /></label>
            <label className="field"><span className="lbl">Nhóm tuổi</span>
              <select className="inp" value={form.ageBand} onChange={(e) => set({ ageBand: e.target.value as CreateDraftInput["ageBand"] })}><option value="6-8">6–8 tuổi</option><option value="9-10">9–10 tuổi</option></select></label>
            <label className="field"><span className="lbl">Thể loại</span>
              <select className="inp" value={form.genre} onChange={(e) => set({ genre: e.target.value })}>{GENRES.map((g) => <option key={g}>{g}</option>)}</select></label>
            <label className="field"><span className="lbl">Trải nghiệm</span>
              <select className="inp" value={form.experienceMode} onChange={(e) => set({ experienceMode: e.target.value as CreateDraftInput["experienceMode"] })}>
                {Object.entries(MODE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          </div>
          <label className="field"><span className="lbl">Mô tả ngắn</span><textarea className="inp" rows={2} maxLength={1000} value={form.description} onChange={(e) => set({ description: e.target.value })} /></label>
          <p className="sub">Nhóm tuổi và trải nghiệm chưa đổi được sau khi tạo. “Nghe” và “Đọc và nghe” chưa tự tạo giọng đọc.</p>
          <div className="row">
            <button className="btn btn-g" onClick={() => setForm(null)}>Đóng</button>
            <span className="grow" />
            <button className="btn btn-p" disabled={busy} onClick={() => void create()}>{busy ? "Đang tạo…" : "Tạo và mở trình soạn"}</button>
          </div>
        </div>
      )}
      <div className="st-card st-scroll">
        <table className="st-table">
          <thead><tr><th>Truyện</th><th>Tuổi</th><th>Trải nghiệm</th><th>Phiên bản</th><th>Cập nhật</th><th /></tr></thead>
          <tbody>
            {list === null && <tr><td colSpan={6} className="sub">Đang tải…</td></tr>}
            {list?.map((s) => (
              <tr key={s.storyId}>
                <td><b>{s.title || "Truyện chưa đặt tên"}</b><br /><small className="sub">{s.genre || "—"}{s.description ? ` · ${s.description}` : ""}</small></td>
                <td>{AGE[s.ageBand] ?? s.ageBand}</td>
                <td>{MODE[s.experienceMode] ?? s.experienceMode}</td>
                <td>{s.lastVersionNo ? `V${s.lastVersionNo}` : "Chưa lưu"}</td>
                <td>{fmt(s.updatedAt ?? s.createdAt)}</td>
                <td><button className="btn btn-g" onClick={() => setOpenId(s.storyId)}>Mở</button></td>
              </tr>
            ))}
            {list?.length === 0 && <tr><td colSpan={6} className="sub">Chưa có truyện nào.</td></tr>}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
