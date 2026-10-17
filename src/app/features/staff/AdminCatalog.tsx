"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, RotateCcw, Upload } from "lucide-react";
import { staffService } from "@/app/services/staffService";
import type { ContentCategory } from "@/app/types/childProfile";
import type { CatalogEntry, CatalogKind, PromptCatalogVersion } from "@/app/types/staff";
import { Notice, Page, fmtDay, useAction } from "./ui";

const KINDS: { id: CatalogKind; label: string }[] = [
  { id: "wish_card", label: "Thẻ ước" },
  { id: "moral_lesson", label: "Bài học gợi ý" },
  { id: "sample_character", label: "Nhân vật mẫu" },
];
const WISH_GROUP: Record<string, string> = { character: "Nhân vật", place: "Nơi chốn", challenge: "Thử thách", lesson: "Bài học" };
const VSTATUS: Record<string, [string, string]> = { draft: ["wait", "Nháp"], published: ["ok", "Đang dùng"], deprecated: ["draft", "Đã thay"], rolled_back: ["flag", "Đã quay lại"] };

/** Luồng 5 Bước 5.3 — danh mục nội dung (API thật), thẻ ước / bài học / nhân vật mẫu và Prompt Catalog. */
export default function AdminCatalog() {
  const [cats, setCats] = useState<ContentCategory[]>([]);
  const [kind, setKind] = useState<CatalogKind>("wish_card");
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  const [versions, setVersions] = useState<PromptCatalogVersion[]>([]);
  const [newCat, setNewCat] = useState({ code: "", displayName: "" });
  const [newEntry, setNewEntry] = useState({ label: "", emoji: "", group: "character" });
  const [draft, setDraft] = useState({ note: "", flag: 0.35, block: 0.8, date: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10) });

  const load = useCallback(async () => {
    const [c, e, v] = await Promise.all([staffService.categories(), staffService.catalog(kind), staffService.versions()]);
    setCats(c.data ?? []);
    setEntries(e.data ?? []);
    setVersions(v.data ?? []);
  }, [kind]);
  useEffect(() => { void load(); }, [load]);
  const { note, busy, run } = useAction(load);

  return (
    <Page title="Danh mục & Prompt Catalog" sub="Prompt Catalog là nguồn duy nhất cho prompt, bảng mức đọc, khung truyện theo thể loại, rubric bám ngữ cảnh, danh sách nhân vật có bản quyền, blocklist và ngưỡng kiểm duyệt. Mọi thay đổi được ghi nhật ký.">
      <Notice note={note} />

      <div className="st-card">
        <h3>Danh mục nội dung</h3>
        <p className="sub">Dùng chung cho cài đặt an toàn của bé, bộ lọc và nhãn nội dung. Ẩn danh mục chỉ bỏ khỏi lựa chọn mới, không xoá nhãn cũ.</p>
        <table className="st-table">
          <thead><tr><th>Mã</th><th>Tên hiển thị</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id}>
                <td><code>{c.code}</code></td>
                <td><input className="inp" defaultValue={c.displayName} aria-label={`Tên ${c.code}`} onBlur={(e) => { if (e.target.value.trim() && e.target.value !== c.displayName) void run(() => staffService.updateCategory(c.id, e.target.value.trim(), c.isActive)); }} /></td>
                <td><span className={`pill ${c.isActive ? "ok" : "draft"}`}>{c.isActive ? "Đang dùng" : "Đã ẩn"}</span></td>
                <td><button className="btn btn-g" disabled={busy} onClick={() => void run(() => staffService.updateCategory(c.id, c.displayName, !c.isActive))}>{c.isActive ? "Ẩn" : "Hiện lại"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="row">
          <input className="inp" style={{ maxWidth: 180 }} value={newCat.code} onChange={(e) => setNewCat({ ...newCat, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "") })} placeholder="MÃ_DANH_MỤC" aria-label="Mã" />
          <input className="inp" value={newCat.displayName} onChange={(e) => setNewCat({ ...newCat, displayName: e.target.value })} placeholder="Tên hiển thị" aria-label="Tên hiển thị" />
          <button className="btn btn-p" disabled={busy || !newCat.code || !newCat.displayName.trim()} onClick={() => void run(() => staffService.createCategory(newCat.code, newCat.displayName.trim(), true)).then((ok) => ok && setNewCat({ code: "", displayName: "" }))}><Plus className="ic" />Thêm</button>
        </div>
      </div>

      <div className="st-card">
        <div className="row"><h3 className="grow">Gợi ý cho phụ huynh và bé</h3>
          <div className="seg" style={{ minWidth: 330 }}>{KINDS.map((k) => <button key={k.id} className={kind === k.id ? "on" : ""} onClick={() => setKind(k.id)}>{k.label}</button>)}</div></div>
        {kind === "wish_card" && <p className="sub">Thẻ chỉ dùng hình tự tạo hoặc có giấy phép, không dùng nhân vật có bản quyền. Thêm thẻ mới chỉ khớp với truyện được ánh xạ sau đó.</p>}
        <div className="chips">
          {entries.map((e) => (
            <button key={e.id} className={`chip${e.isActive ? " on" : ""}`} title={e.isActive ? "Bấm để ẩn" : "Bấm để hiện lại"} onClick={() => void run(() => staffService.saveCatalog({ ...e, isActive: !e.isActive }))}>
              {e.emoji} {e.label}{e.group ? ` · ${WISH_GROUP[e.group] ?? e.group}` : ""}{!e.isActive && " (ẩn)"}
            </button>
          ))}
        </div>
        <div className="row">
          {kind === "wish_card" && <>
            <input className="inp" style={{ width: 70 }} value={newEntry.emoji} onChange={(e) => setNewEntry({ ...newEntry, emoji: e.target.value })} placeholder="🐸" aria-label="Biểu tượng" />
            <select className="inp" style={{ width: "auto" }} value={newEntry.group} onChange={(e) => setNewEntry({ ...newEntry, group: e.target.value })} aria-label="Nhóm">{Object.entries(WISH_GROUP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </>}
          <input className="inp" value={newEntry.label} onChange={(e) => setNewEntry({ ...newEntry, label: e.target.value })} placeholder="Tên" aria-label="Tên" />
          <button className="btn btn-p" disabled={busy || !newEntry.label.trim()} onClick={() => void run(() => staffService.saveCatalog({ kind, label: newEntry.label.trim(), emoji: kind === "wish_card" ? newEntry.emoji || null : null, group: kind === "wish_card" ? newEntry.group : null, ageBands: ["Age_6_8", "Age_9_10"], isActive: true })).then((ok) => ok && setNewEntry({ ...newEntry, label: "", emoji: "" }))}><Plus className="ic" />Thêm</button>
        </div>
      </div>

      <div className="st-card">
        <div className="row"><h3 className="grow">Phiên bản Prompt Catalog</h3>
          <button className="btn btn-s" disabled={busy} onClick={() => { if (confirm("Quay lại phiên bản trước?")) void run(() => staffService.rollback()); }}><RotateCcw className="ic" />Quay lại bản trước</button></div>
        <table className="st-table">
          <thead><tr><th>Phiên bản</th><th>Trạng thái</th><th>Hiệu lực</th><th>Ngưỡng vùng xám / chặn</th><th>Ghi chú</th><th /></tr></thead>
          <tbody>
            {versions.map((v) => (
              <tr key={v.id}>
                <td><b>{v.version}</b></td>
                <td><span className={`pill ${VSTATUS[v.status][0]}`}>{VSTATUS[v.status][1]}</span></td>
                <td>{fmtDay(v.effectiveDate)}</td>
                <td>{v.modelFlagThreshold} / {v.modelBlockThreshold}</td>
                <td>{v.note}</td>
                <td>{v.status === "draft" && <button className="btn btn-p" disabled={busy} onClick={() => void run(() => staffService.publishVersion(v.id))}><Upload className="ic" />Publish</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="sub">Trước khi publish, hãy chạy bộ đánh giá trên bản nháp ở trang “Đánh giá AI”. Hệ thống từ chối publish nếu còn case tấn công lọt qua hoặc điểm an toàn thấp hơn bản đang dùng.</p>
        <div className="st-form">
          <label className="field"><span className="lbl">Ngưỡng vùng xám</span><input className="inp" type="number" step={0.05} min={0} max={1} value={draft.flag} onChange={(e) => setDraft({ ...draft, flag: +e.target.value })} /></label>
          <label className="field"><span className="lbl">Ngưỡng chặn cứng</span><input className="inp" type="number" step={0.05} min={0} max={1} value={draft.block} onChange={(e) => setDraft({ ...draft, block: +e.target.value })} /></label>
          <label className="field"><span className="lbl">Ngày hiệu lực</span><input className="inp" type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></label>
          <label className="field"><span className="lbl">Ghi chú thay đổi</span><input className="inp" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} /></label>
          <button className="btn btn-s" disabled={busy || !draft.note.trim()} onClick={() => void run(() => staffService.draftVersion(draft.note.trim(), draft.flag, draft.block, draft.date))}><Plus className="ic" />Tạo bản nháp</button>
        </div>
      </div>
    </Page>
  );
}
