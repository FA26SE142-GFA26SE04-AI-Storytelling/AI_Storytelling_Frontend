"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, X } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import Pager from "@/app/components/Pager";
import { confirmDialog } from "@/app/lib/confirm";
import { creatorAdminService } from "@/app/services/creatorAdminService";
import type { CreatorApplication, CreatorApplicationStatus } from "@/app/types/creatorAdmin";
import { Notice, fmt, useAction } from "./ui";

const FILTERS: { id: CreatorApplicationStatus | "all"; label: string }[] = [
  { id: "Pending", label: "Chờ duyệt" }, { id: "Approved", label: "Đã duyệt" }, { id: "Rejected", label: "Đã từ chối" }, { id: "all", label: "Tất cả" },
];
const STATUS: Record<CreatorApplicationStatus, [string, string]> = {
  Pending: ["wait", "Chờ duyệt"], Approved: ["ok", "Đã duyệt"], Rejected: ["flag", "Đã từ chối"],
};

/** Đơn đăng ký Content Creator (M5): Creator tự đăng ký, xác thực email, Administrator duyệt hoặc từ chối kèm lý do. */
export function AdminCreatorApplications() {
  const [filter, setFilter] = useState<CreatorApplicationStatus | "all">("Pending");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<CreatorApplication[]>([]);
  const [paging, setPaging] = useState({ totalPages: 1, hasPrev: false, hasNext: false });
  const [loadError, setLoadError] = useState("");
  const [rejecting, setRejecting] = useState<CreatorApplication | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    const r = await creatorAdminService.applications(filter === "all" ? undefined : filter, page);
    setLoadError(r.success ? "" : r.message);
    setItems(r.data?.items ?? []);
    setPaging({ totalPages: r.data?.totalPages ?? 1, hasPrev: r.data?.hasPreviousPage ?? false, hasNext: r.data?.hasNextPage ?? false });
  }, [filter, page]);
  useEffect(() => { void load(); }, [load]);
  const { note, busy, run } = useAction(load);

  const approve = async (a: CreatorApplication) => {
    if (!(await confirmDialog(`Duyệt ${a.applicantFullName} làm Content Creator? Tài khoản được kích hoạt và nhận email kết quả.`))) return;
    void run(() => creatorAdminService.approve(a.id), `Đã duyệt ${a.applicantFullName}.`);
  };

  return (
    <div className="st-card st-scroll">
      <Notice note={note} />
      {loadError && <div className="notice err" role="status">{loadError}</div>}
      <div className="row">
        <h3 className="grow">Đơn đăng ký Content Creator</h3>
        <div className="seg" role="radiogroup" aria-label="Lọc đơn theo trạng thái" style={{ maxWidth: 420 }}>
          {FILTERS.map((f) => (
            <button key={f.id} type="button" role="radio" aria-checked={filter === f.id} className={filter === f.id ? "on" : ""}
              onClick={() => { setFilter(f.id); setPage(1); }}>{f.label}</button>
          ))}
        </div>
      </div>

      {rejecting && <Dialog title={`Từ chối đơn của ${rejecting.applicantFullName}`} onClose={() => setRejecting(null)}>
        <p>Creator nhận email kèm lý do, sửa phần giới thiệu và nộp lại được.</p>
        <label className="field"><span className="lbl">Lý do từ chối (bắt buộc, tối đa 500 ký tự)</span>
          <textarea className="inp" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <div className="row"><button className="btn btn-no" disabled={busy || !reason.trim()} onClick={() => {
          const target = rejecting;
          void run(() => creatorAdminService.reject(target.id, reason.trim()), "Đã từ chối đơn.").then((ok) => { if (ok) setRejecting(null); });
        }}><X className="ic" />Từ chối</button></div>
      </Dialog>}

      <table className="st-table stack-table">
        <thead><tr><th>Người đăng ký</th><th>Giới thiệu</th><th>Nộp lúc</th><th>Trạng thái</th><th /></tr></thead>
        <tbody>
          {items.map((a) => {
            const [tone, label] = STATUS[a.status] ?? ["draft", a.status];
            const unverified = a.applicantStatus === "Registered";
            return (
              <tr key={a.id}>
                <td data-label="Người đăng ký">
                  <b>{a.applicantFullName}</b><br /><small className="sub">{a.applicantUsername} · {a.applicantEmail}</small>
                </td>
                <td data-label="Giới thiệu">
                  <span style={{ whiteSpace: "pre-wrap" }}>{a.introduction}</span>
                  {a.portfolioUrl && <><br /><a className="link" href={a.portfolioUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="ic" />Portfolio</a></>}
                  {a.rejectionReason && <><br /><small className="sub">Lý do từ chối: {a.rejectionReason}</small></>}
                </td>
                <td data-label="Nộp lúc">{fmt(a.createdAt)}{a.reviewedAt && <><br /><small className="sub">Xử lý {fmt(a.reviewedAt)}{a.reviewedByName ? ` · ${a.reviewedByName}` : ""}</small></>}</td>
                <td data-label="Trạng thái">
                  <span className={`pill ${tone}`}>{label}</span>
                  {a.status === "Pending" && unverified && <><br /><small className="sub">Chưa xác thực email</small></>}
                </td>
                <td data-label="" style={{ whiteSpace: "nowrap" }}>
                  {a.status === "Pending" && <>
                    <button className="btn btn-ok" disabled={busy || unverified} title={unverified ? "Creator cần xác thực email trước khi được duyệt" : undefined}
                      onClick={() => void approve(a)}><Check className="ic" />Duyệt</button>
                    <button className="btn btn-g" disabled={busy} onClick={() => { setReason(""); setRejecting(a); }}><X className="ic" />Từ chối</button>
                  </>}
                </td>
              </tr>
            );
          })}
          {items.length === 0 && !loadError && <tr><td colSpan={5} className="sub">Không có đơn nào.</td></tr>}
        </tbody>
      </table>
      <Pager page={page} totalPages={paging.totalPages} hasPrev={paging.hasPrev} hasNext={paging.hasNext} onPage={setPage} />
    </div>
  );
}
