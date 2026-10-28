"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { wishCardService } from "@/app/services/wishCardService";
import { staffService } from "@/app/services/staffService";
import type { ContentCategory } from "@/app/types/childProfile";
import type { PagedResult } from "@/app/types/backendContracts";
import type { ManagedWishCardGroup, WishCardDto } from "@/app/types/storyWish";
import { Notice, Page, useAction } from "./ui";

export const WISH_GROUPS: { id: ManagedWishCardGroup; label: string; wish: boolean }[] = [
  { id: "Character", label: "Nhân vật", wish: true },
  { id: "Place", label: "Nơi chốn", wish: true },
  { id: "Challenge", label: "Thử thách", wish: true },
  { id: "Lesson", label: "Bài học", wish: true },
  { id: "Desire", label: "Bạn ấy muốn gì (Bé sáng tác)", wish: false },
  { id: "Event", label: "Chuyện gì xảy ra (Bé sáng tác)", wish: false },
  { id: "Ending", label: "Kết thúc (Bé sáng tác)", wish: false },
];
export const groupLabel = (g: string) => WISH_GROUPS.find((x) => x.id === g)?.label ?? g;
const AGE_OPTIONS = [["", "Mọi nhóm tuổi"], ["6-8", "6–8 tuổi"], ["9-10", "9–10 tuổi"]] as const;
const LABEL_MAX = 100, URL_MAX = 500;

type Form = { group: ManagedWishCardGroup; label: string; imageUrl: string; audioUrl: string; ageBand: string; contentCategoryId: string; sortOrder: string };
const EMPTY: Form = { group: "Character", label: "", imageUrl: "", audioUrl: "", ageBand: "", contentCategoryId: "", sortOrder: "0" };
const isUrl = (v: string) => /^https?:\/\/\S+$/i.test(v) && v.length <= URL_MAX;

/** Moderator/Administrator quản lý bộ thẻ cho "Bé ước". Thẻ chỉ ẩn, không xóa; muốn đổi nhóm thì tạo thẻ mới rồi ẩn thẻ cũ. */
export default function WishCardManagement() {
  const [group, setGroup] = useState<ManagedWishCardGroup | "">("");
  const [active, setActive] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);
  const [list, setList] = useState<PagedResult<WishCardDto> | null>(null);
  const [cats, setCats] = useState<ContentCategory[]>([]);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState<WishCardDto | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);

  const load = useCallback(async () => {
    const r = await wishCardService.list({ group: group || undefined, isActive: active === "" ? undefined : active === "true", pageIndex: page, pageSize: 20 });
    setList(r.data);
    setLoadError(r.success ? "" : r.message);
  }, [group, active, page]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { void staffService.categories().then((r) => setCats(r.data ?? [])); }, []);
  const { note, busy, run } = useAction(load);

  const edit = (c: WishCardDto) => {
    setEditing(c);
    setForm({ group: c.group as ManagedWishCardGroup, label: c.label, imageUrl: c.imageUrl, audioUrl: c.audioUrl ?? "", ageBand: c.ageBand ?? "", contentCategoryId: c.contentCategoryId?.toString() ?? "", sortOrder: String(c.sortOrder) });
  };
  const reset = () => { setEditing(null); setForm(EMPTY); };

  const label = form.label.trim(), image = form.imageUrl.trim(), audio = form.audioUrl.trim();
  const problem = !label ? "Nhập nhãn thẻ." : label.length > LABEL_MAX ? `Nhãn tối đa ${LABEL_MAX} ký tự.`
    : !isUrl(image) ? "Đường dẫn hình phải bắt đầu bằng http:// hoặc https://."
    : audio && !isUrl(audio) ? "Đường dẫn âm thanh phải bắt đầu bằng http:// hoặc https://."
    : !/^-?\d+$/.test(form.sortOrder.trim()) ? "Thứ tự phải là số nguyên." : null;
  const save = async () => {
    if (problem) return;
    const body = { label, imageUrl: image, audioUrl: audio || null, ageBand: form.ageBand || null, contentCategoryId: form.contentCategoryId ? Number(form.contentCategoryId) : null, sortOrder: Number(form.sortOrder) };
    const ok = await run(() => editing ? wishCardService.update(editing.id, body) : wishCardService.create({ ...body, group: form.group }));
    if (ok) reset();
  };
  const catName = (id: number | null) => (id == null ? "—" : cats.find((c) => c.id === id)?.displayName ?? `#${id}`);

  return <Page title="Thẻ ước" sub="Thẻ hình bé chọn khi ước một câu chuyện. Ẩn thẻ chỉ bỏ khỏi lựa chọn mới, điều ước và truyện đã gắn thẻ vẫn giữ nguyên.">
    <Notice note={note} />
    {loadError && <p className="notice err">{loadError}</p>}
    <div className="row">
      <select className="inp" aria-label="Lọc theo nhóm" value={group} onChange={(e) => { setGroup(e.target.value as ManagedWishCardGroup | ""); setPage(1); }}>
        <option value="">Mọi nhóm</option>{WISH_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
      </select>
      <select className="inp" aria-label="Lọc theo trạng thái" value={active} onChange={(e) => { setActive(e.target.value as "" | "true" | "false"); setPage(1); }}>
        <option value="">Đang dùng và đã ẩn</option><option value="true">Đang dùng</option><option value="false">Đã ẩn</option>
      </select>
    </div>
    <div className="st-card">
      <table className="st-table">
        <thead><tr><th>Hình</th><th>Nhãn</th><th>Nhóm</th><th>Tuổi</th><th>Nhãn nội dung</th><th>Thứ tự</th><th>Trạng thái</th><th /></tr></thead>
        <tbody>
          {list?.items.map((c) => <tr key={c.id} className={editing?.id === c.id ? "on" : undefined}>
            <td><img src={c.imageUrl} alt="" width={44} height={44} style={{ objectFit: "contain", borderRadius: 8 }} /></td>
            <td><b>{c.label}</b>{c.audioUrl && <div><audio controls preload="none" src={c.audioUrl} style={{ height: 28, maxWidth: 180 }} /></div>}</td>
            <td>{groupLabel(c.group)}</td>
            <td>{c.ageBand ?? "Mọi tuổi"}</td>
            <td>{catName(c.contentCategoryId)}</td>
            <td>{c.sortOrder}</td>
            <td><span className={`pill ${c.isActive ? "ok" : "draft"}`}>{c.isActive ? "Đang dùng" : "Đã ẩn"}</span></td>
            <td><div className="row">
              <button className="btn btn-s" disabled={busy} onClick={() => edit(c)}>Sửa</button>
              <button className="btn btn-g" disabled={busy} onClick={() => void run(() => wishCardService.setActive(c.id, !c.isActive))}>{c.isActive ? "Ẩn" : "Hiện lại"}</button>
            </div></td>
          </tr>)}
          {list && !list.items.length && <tr><td colSpan={8} className="sub">Chưa có thẻ nào khớp bộ lọc.</td></tr>}
        </tbody>
      </table>
      <div className="row"><button className="btn btn-s" disabled={busy || page === 1} onClick={() => setPage((p) => p - 1)}>Trước</button><span>Trang {page}{list ? `/${Math.max(1, list.totalPages)}` : ""}</span><button className="btn btn-s" disabled={busy || !list?.hasNextPage} onClick={() => setPage((p) => p + 1)}>Tiếp</button></div>
    </div>

    <div className="st-card">
      <h3>{editing ? `Sửa thẻ "${editing.label}"` : "Thêm thẻ mới"}</h3>
      <div className="st-form">
        <label className="field">Nhóm
          <select className="inp" value={form.group} disabled={!!editing} onChange={(e) => setForm({ ...form, group: e.target.value as ManagedWishCardGroup })}>
            {WISH_GROUPS.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </label>
        <label className="field">Nhãn<input className="inp" maxLength={LABEL_MAX} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Ví dụ: Thỏ con" /></label>
        <label className="field">Đường dẫn hình<input className="inp" maxLength={URL_MAX} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" /></label>
        <label className="field">Đường dẫn âm thanh (không bắt buộc)<input className="inp" maxLength={URL_MAX} value={form.audioUrl} onChange={(e) => setForm({ ...form, audioUrl: e.target.value })} placeholder="https://…" /></label>
        <label className="field">Nhóm tuổi<select className="inp" value={form.ageBand} onChange={(e) => setForm({ ...form, ageBand: e.target.value })}>{AGE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="field">Nhãn nội dung<select className="inp" value={form.contentCategoryId} onChange={(e) => setForm({ ...form, contentCategoryId: e.target.value })}>
          <option value="">Không gắn</option>{cats.filter((c) => c.isActive || String(c.id) === form.contentCategoryId).map((c) => <option key={c.id} value={c.id}>{c.displayName}</option>)}
        </select></label>
        <label className="field">Thứ tự hiển thị<input className="inp" inputMode="numeric" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></label>
      </div>
      {editing && <small className="sub">Không đổi được nhóm của thẻ đã tạo. Muốn đổi nhóm, hãy tạo thẻ mới rồi ẩn thẻ này.</small>}
      {isUrl(image) && <div className="row"><img src={image} alt="Xem trước hình thẻ" width={88} height={88} style={{ objectFit: "contain", borderRadius: 12 }} /><span className="sub">Xem trước hình thẻ</span></div>}
      {problem && (label || image) && <small className="sub">{problem}</small>}
      <div className="row">
        <button className="btn btn-p" disabled={busy || !!problem} onClick={() => void save()}>{editing ? "Lưu thay đổi" : <><Plus className="ic" />Thêm thẻ</>}</button>
        {editing && <button className="btn btn-g" disabled={busy} onClick={reset}>Hủy sửa</button>}
      </div>
    </div>
  </Page>;
}
