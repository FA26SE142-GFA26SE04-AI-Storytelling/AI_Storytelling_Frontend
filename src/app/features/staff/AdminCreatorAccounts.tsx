"use client";

import { useCallback, useEffect, useState } from "react";
import { Award, Search, UserCheck, UserX } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import Pager from "@/app/components/Pager";
import { creatorAdminService } from "@/app/services/creatorAdminService";
import type { CreatorAccount } from "@/app/types/creatorAdmin";
import { CreatorPartnerTierDialog } from "./CreatorPartnerTierDialog";
import { Notice, fmt, fmtDay, useAction } from "./ui";

const FILTERS = [
  { id: "all", label: "Tất cả" }, { id: "Active", label: "Đang hoạt động" }, { id: "Suspended", label: "Đã vô hiệu hoá" },
  { id: "AwaitingApproval", label: "Chờ duyệt" },
] as const;
const STATUS: Record<string, [string, string]> = {
  Active: ["ok", "Đang hoạt động"], Suspended: ["draft", "Đã vô hiệu hoá"], AwaitingApproval: ["wait", "Chờ duyệt"],
  Registered: ["draft", "Chưa xác thực"], Locked: ["wait", "Khoá đăng nhập"],
};

/**
 * Danh sách Content Creator: vô hiệu hoá (lý do bắt buộc; bài đang chờ duyệt được rút và hoàn lượt, bài đang được duyệt
 * bị đóng; truyện đã công khai giữ nguyên), kích hoạt lại, xem và thu hồi cấp đối tác.
 */
export function AdminCreatorAccounts() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<CreatorAccount[]>([]);
  const [paging, setPaging] = useState({ totalPages: 1, hasPrev: false, hasNext: false });
  const [loadError, setLoadError] = useState("");
  const [deactivating, setDeactivating] = useState<CreatorAccount | null>(null);
  const [reason, setReason] = useState("");
  const [tierOf, setTierOf] = useState<CreatorAccount | null>(null);

  const load = useCallback(async () => {
    const r = await creatorAdminService.creators(filter === "all" ? undefined : filter, query || undefined, page);
    setLoadError(r.success ? "" : r.message);
    setItems(r.data?.items ?? []);
    setPaging({ totalPages: r.data?.totalPages ?? 1, hasPrev: r.data?.hasPreviousPage ?? false, hasNext: r.data?.hasNextPage ?? false });
  }, [filter, query, page]);
  useEffect(() => { void load(); }, [load]);
  const { note, setNote, busy, run } = useAction(load);

  const deactivate = async () => {
    const target = deactivating;
    if (!target) return;
    const r = await creatorAdminService.deactivate(target.id, reason.trim());
    if (r.success && r.data) {
      setNote({ ok: true, text: `Đã vô hiệu hoá ${target.fullName}: rút ${r.data.withdrawnSubmissions} bài chờ duyệt (đã hoàn lượt), đóng ${r.data.closedSubmissions} bài đang được duyệt.` });
      setDeactivating(null);
      await load();
    } else {
      setNote({ ok: false, text: r.message });
    }
  };

  return (
    <div className="st-card st-scroll">
      <Notice note={note} />
      {loadError && <div className="notice err" role="status">{loadError}</div>}
      <div className="row">
        <h3 className="grow">Content Creator</h3>
        <form className="row" onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search.trim()); }}>
          <input className="inp" placeholder="Tên, email, tên đăng nhập" aria-label="Tìm Creator" value={search} onChange={(e) => setSearch(e.target.value)} />
          <button className="btn btn-s" type="submit"><Search className="ic" />Tìm</button>
        </form>
        <div className="seg" role="radiogroup" aria-label="Lọc theo trạng thái" style={{ maxWidth: 480 }}>
          {FILTERS.map((f) => (
            <button key={f.id} type="button" role="radio" aria-checked={filter === f.id} className={filter === f.id ? "on" : ""}
              onClick={() => { setFilter(f.id); setPage(1); }}>{f.label}</button>
          ))}
        </div>
      </div>

      {deactivating && <Dialog title={`Vô hiệu hoá ${deactivating.fullName}`} onClose={() => setDeactivating(null)}>
        <p>Creator bị đăng xuất khỏi mọi thiết bị. Bài đang chờ duyệt được rút và hoàn lượt gửi duyệt; bài đang được duyệt bị đóng.
          Truyện đã công khai vẫn giữ nguyên.</p>
        <label className="field"><span className="lbl">Lý do (bắt buộc, tối đa 500 ký tự)</span>
          <textarea className="inp" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <div className="row"><button className="btn btn-no" disabled={busy || !reason.trim()} onClick={() => void deactivate()}><UserX className="ic" />Vô hiệu hoá</button></div>
      </Dialog>}
      {tierOf && <CreatorPartnerTierDialog creator={tierOf} onClose={() => setTierOf(null)} />}

      <table className="st-table stack-table">
        <thead><tr><th>Creator</th><th>Trạng thái</th><th>Truyện công khai</th><th>Tham gia</th><th>Đăng nhập gần nhất</th><th /></tr></thead>
        <tbody>
          {items.map((c) => {
            const [tone, label] = STATUS[c.status] ?? ["draft", c.status];
            return (
              <tr key={c.id}>
                <td data-label="Creator"><b>{c.fullName}</b><br /><small className="sub">{c.username} · {c.email}</small></td>
                <td data-label="Trạng thái"><span className={`pill ${tone}`}>{label}</span></td>
                <td data-label="Truyện công khai">{c.publishedStoryCount}</td>
                <td data-label="Tham gia">{fmtDay(c.createdAt)}</td>
                <td data-label="Đăng nhập gần nhất">{fmt(c.lastLoginAt)}</td>
                <td data-label="" style={{ whiteSpace: "nowrap" }}>
                  <button className="btn btn-g" onClick={() => setTierOf(c)}><Award className="ic" />Cấp đối tác</button>
                  {c.status === "Active" && <button className="btn btn-g" disabled={busy} onClick={() => { setReason(""); setDeactivating(c); }}><UserX className="ic" />Vô hiệu hoá</button>}
                  {c.status === "Suspended" && <button className="btn btn-g" disabled={busy}
                    onClick={() => void run(() => creatorAdminService.reactivate(c.id), `Đã kích hoạt lại ${c.fullName}.`)}><UserCheck className="ic" />Kích hoạt lại</button>}
                </td>
              </tr>
            );
          })}
          {items.length === 0 && !loadError && <tr><td colSpan={6} className="sub">Không có Creator nào.</td></tr>}
        </tbody>
      </table>
      <Pager page={page} totalPages={paging.totalPages} hasPrev={paging.hasPrev} hasNext={paging.hasNext} onPage={setPage} />
    </div>
  );
}
