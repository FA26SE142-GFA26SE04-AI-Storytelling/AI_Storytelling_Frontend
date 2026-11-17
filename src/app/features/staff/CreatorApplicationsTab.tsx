"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import IconButton from "@/app/components/IconButton";
import Pager from "@/app/components/Pager";
import { useRiseIn } from "@/app/lib/motion";
import { showToast } from "@/app/lib/toast";
import { adminCreatorService as svc, type AdminCreatorApplication, type CreatorApplicationStatus } from "@/app/services/adminCreatorService";
import type { PagedResult } from "@/app/types/story";
import { CreatorApplicationDialog } from "./CreatorApplicationDialog";
import { Pill, fmt } from "./ui";

const FILTERS: [CreatorApplicationStatus, string][] = [["Pending", "Chờ duyệt"], ["Approved", "Đã duyệt"], ["Rejected", "Từ chối"]];
const EMPTY: Record<CreatorApplicationStatus, string> = { Pending: "Không có đơn nào chờ duyệt.", Approved: "Chưa có đơn nào được duyệt.", Rejected: "Chưa có đơn nào bị từ chối." };

/** Tab Đơn đăng ký: lọc theo trạng thái đơn, mở popup để xem, duyệt hoặc từ chối. `onChanged` để trang cha đếm lại đơn chờ. */
export function CreatorApplicationsTab({ onChanged }: { onChanged: () => void }) {
  const [status, setStatus] = useState<CreatorApplicationStatus>("Pending");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [list, setList] = useState<PagedResult<AdminCreatorApplication> | null>(null);
  const [open, setOpen] = useState<AdminCreatorApplication | null>(null);
  const bodyRef = useRiseIn<HTMLTableSectionElement>("tr", [list]);

  useEffect(() => {
    let alive = true;
    void svc.applications({ status, pageIndex: page, pageSize: 20 }).then((r) => {
      if (!alive) return;
      setList(r.success ? r.data : null);
      if (!r.success) showToast(r.message || "Không tải được danh sách đơn đăng ký.", "err");
    });
    return () => { alive = false; };
  }, [status, page, reload]);

  return <>
    <div className="st-filters">
      <div className="seg" role="radiogroup" aria-label="Lọc đơn theo trạng thái" style={{ maxWidth: 360, flex: 1 }}>
        {FILTERS.map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={status === v} className={status === v ? "on" : ""} onClick={() => { setStatus(v); setPage(1); }}>{l}</button>)}
      </div>
    </div>
    <div className="st-card st-scroll">
      <table className="st-table stack-table">
        <thead><tr><th>Họ tên</th><th>Email</th><th>Nộp lúc</th><th>Tài khoản</th><th /></tr></thead>
        <tbody ref={bodyRef}>
          {list?.items.map((a) => (
            <tr key={a.id}>
              <td data-label="Họ tên">{a.applicantFullName}</td>
              <td data-label="Email">{a.applicantEmail}</td>
              <td data-label="Nộp lúc">{fmt(a.createdAt)}</td>
              <td data-label="Tài khoản"><Pill status={a.applicantStatus} /></td>
              <td data-label=""><IconButton icon={Eye} label={`Xem đơn của ${a.applicantFullName}`} onClick={() => setOpen(a)} /></td>
            </tr>
          ))}
          {list && list.items.length === 0 && <tr><td colSpan={5} className="sub">{EMPTY[status]}</td></tr>}
        </tbody>
      </table>
      {list && <Pager page={list.pageIndex} totalPages={list.totalPages} hasPrev={list.hasPreviousPage} hasNext={list.hasNextPage} onPage={setPage} />}
    </div>
    {open && <CreatorApplicationDialog app={open} onClose={() => setOpen(null)} onDone={() => { setOpen(null); setReload((n) => n + 1); onChanged(); }} />}
  </>;
}
