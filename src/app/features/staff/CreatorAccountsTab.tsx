"use client";

import { useEffect, useState } from "react";
import { RotateCcw, UserX, Award } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import Pager from "@/app/components/Pager";
import Select from "@/app/components/Select";
import { confirmDialog } from "@/app/lib/confirm";
import { useRiseIn } from "@/app/lib/motion";
import { showToast } from "@/app/lib/toast";
import { CreatorPartnerTierDialog } from "./CreatorPartnerTierDialog";
import { adminCreatorService as svc, type CreatorAccount, type CreatorAccountStatus } from "@/app/services/adminCreatorService";
import type { PagedResult } from "@/app/types/story";
import { Pill, ReasonField, fmt } from "./ui";

const STATUS_FILTER: { value: CreatorAccountStatus | ""; label: string }[] = [
  { value: "", label: "Tất cả" }, { value: "Active", label: "Đang hoạt động" }, { value: "AwaitingApproval", label: "Chờ duyệt" },
  { value: "Registered", label: "Chưa xác thực" }, { value: "Suspended", label: "Đã vô hiệu hoá" },
];

/** Tab Tài khoản: tìm, lọc Content Creator; vô hiệu hoá (lý do bắt buộc) hoặc kích hoạt lại. */
export function CreatorAccountsTab() {
  const [status, setStatus] = useState<CreatorAccountStatus | "">("");
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [list, setList] = useState<PagedResult<CreatorAccount> | null>(null);
  const [deact, setDeact] = useState<CreatorAccount | null>(null);
  const [tierOf, setTierOf] = useState<CreatorAccount | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRiseIn<HTMLTableSectionElement>("tr", [list]);

  // Gõ xong 400 ms mới tìm, tránh gọi API mỗi phím.
  useEffect(() => { const id = setTimeout(() => { setSearch(searchText.trim()); setPage(1); }, 400); return () => clearTimeout(id); }, [searchText]);
  useEffect(() => {
    let alive = true;
    void svc.creators({ status: status || undefined, search, pageIndex: page, pageSize: 20 }).then((r) => {
      if (!alive) return;
      setList(r.success ? r.data : null);
      if (!r.success) showToast(r.message || "Không tải được danh sách nhà sáng tạo nội dung.", "err");
    });
    return () => { alive = false; };
  }, [status, search, page, reload]);

  const deactivate = async (c: CreatorAccount) => {
    if (!(await confirmDialog(`Vô hiệu hoá ${c.fullName}? Nhà sáng tạo không đăng nhập được, yêu cầu gửi duyệt đang mở bị rút. Truyện đã xuất bản vẫn giữ nguyên.`))) return;
    setBusy(true);
    const r = await svc.deactivate(c.id, reason.trim());
    setBusy(false);
    if (!r.success || !r.data) { showToast(r.message || "Không vô hiệu hoá được tài khoản.", "err"); return; }
    const { withdrawnSubmissions: w, closedSubmissions: cl } = r.data;
    const extra = [w && `rút ${w} yêu cầu chờ duyệt`, cl && `đóng ${cl} yêu cầu đang duyệt`].filter(Boolean).join(", ");
    showToast(`${r.message || "Đã vô hiệu hoá tài khoản."}${extra ? ` Đã ${extra}.` : ""}`);
    setDeact(null);
    setReload((n) => n + 1);
  };
  const reactivate = async (c: CreatorAccount) => {
    if (!(await confirmDialog(`Kích hoạt lại ${c.fullName}? Nhà sáng tạo đăng nhập và gửi duyệt truyện lại được.`))) return;
    setBusy(true);
    const r = await svc.reactivate(c.id);
    setBusy(false);
    showToast(r.message || (r.success ? "Đã kích hoạt lại tài khoản." : "Không kích hoạt lại được tài khoản."), r.success ? "ok" : "err");
    if (r.success) setReload((n) => n + 1);
  };

  return <>
    <div className="st-filters">
      <input className="inp" style={{ flex: "1 1 200px", maxWidth: 320 }} placeholder="Tìm tên, tên đăng nhập, email" aria-label="Tìm nhà sáng tạo nội dung" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
      <Select<CreatorAccountStatus | ""> ariaLabel="Lọc trạng thái" value={status} options={STATUS_FILTER} onChange={(v) => { setStatus(v); setPage(1); }} />
    </div>
    <div className="st-card st-scroll">
      <table className="st-table stack-table">
        <thead><tr><th>Họ tên</th><th className="st-col-wide">Tên đăng nhập</th><th>Email</th><th>Trạng thái</th><th>Đã xuất bản</th><th>Đăng nhập gần nhất</th><th /></tr></thead>
        <tbody ref={bodyRef}>
          {list?.items.map((c) => (
            <tr key={c.id}>
              <td data-label="Họ tên">{c.fullName}</td>
              <td data-label="Tên đăng nhập" className="st-col-wide">{c.username}</td>
              <td data-label="Email">{c.email}</td>
              <td data-label="Trạng thái"><Pill status={c.status} /></td>
              <td data-label="Đã xuất bản">{c.publishedStoryCount}</td>
              <td data-label="Đăng nhập gần nhất">{fmt(c.lastLoginAt)}</td>
              <td data-label="" style={{ whiteSpace: "nowrap" }}>
                <button className="btn btn-g" onClick={() => setTierOf(c)}><Award className="ic" />Cấp đối tác</button>
                {c.status === "Active" && <button className="btn btn-g" disabled={busy} onClick={() => { setReason(""); setDeact(c); }}><UserX className="ic" />Vô hiệu hoá</button>}
                {c.status === "Suspended" && <button className="btn btn-g" disabled={busy} onClick={() => void reactivate(c)}><RotateCcw className="ic" />Kích hoạt lại</button>}
              </td>
            </tr>
          ))}
          {list && list.items.length === 0 && <tr><td colSpan={7} className="sub">Không có nhà sáng tạo nội dung phù hợp.</td></tr>}
        </tbody>
      </table>
      {tierOf && <CreatorPartnerTierDialog creator={tierOf} onClose={() => setTierOf(null)} />}
      {list && <Pager page={list.pageIndex} totalPages={list.totalPages} hasPrev={list.hasPreviousPage} hasNext={list.hasNextPage} onPage={setPage} />}
    </div>
    {deact && <Dialog title={`Vô hiệu hoá ${deact.fullName}`} onClose={() => setDeact(null)} className="st-dlg">
      <ReasonField label="Lý do vô hiệu hoá" value={reason} onChange={setReason} />
      <div className="row">
        <button type="button" className="btn btn-s" disabled={busy} onClick={() => setDeact(null)}>Huỷ</button>
        <button type="button" className="btn btn-no" disabled={busy || !reason.trim()} onClick={() => void deactivate(deact)}><UserX className="ic" />Vô hiệu hoá</button>
      </div>
    </Dialog>}
  </>;
}
