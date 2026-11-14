"use client";

import { useEffect, useState } from "react";
import Dialog from "@/app/components/Dialog";
import { adminBillingService } from "@/app/services/adminBillingService";
import type { AdminBusinessReportDto, PagedResult } from "@/app/types/backendContracts";
import { TransactionPager } from "./billingTable";
import RevenuePanel from "./RevenuePanel";
import { fmt, fmtDay } from "./ui";

const STATUS: Record<string, string> = { draft: "Bản nháp", published: "Đã công bố" };

/** Bảng "Các báo cáo kỳ"; `refreshKey` đổi thì tải lại. Nút "Xem" mở số liệu đã chụp của báo cáo. */
export default function AdminReportList({ refreshKey }: { refreshKey: number }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PagedResult<AdminBusinessReportDto> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);
  const [report, setReport] = useState<AdminBusinessReportDto | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    void adminBillingService.reports(page, 10, ctrl.signal).then((r) => {
      if (ctrl.signal.aborted) return;
      setLoading(false);
      if (r.success && r.data) { setData(r.data); setError(null); } else setError(r.message || "Không tải được danh sách báo cáo.");
    });
    return () => ctrl.abort();
  }, [page, refreshKey]);

  useEffect(() => {
    if (openId === null) return;
    const ctrl = new AbortController();
    void adminBillingService.report(openId, ctrl.signal).then((r) => {
      if (ctrl.signal.aborted) return;
      if (r.success && r.data) { setReport(r.data); setReportError(null); } else setReportError(r.message || "Không tải được báo cáo.");
    });
    return () => ctrl.abort();
  }, [openId]);

  const close = () => { setOpenId(null); setReport(null); setReportError(null); };
  const items = data?.items ?? [];
  return (
    <div className="st-card st-scroll">
      <h3>Các báo cáo kỳ</h3>
      {error && <div className="notice err" role="status" data-inline-notice>{error}</div>}
      <table className="st-table stack-table">
        <thead><tr><th>Kỳ</th><th>Trạng thái</th><th>Ngày công bố</th><th /></tr></thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id}>
              <td data-label="Kỳ">{fmtDay(r.periodStart)} – {fmtDay(r.periodEnd)}</td>
              <td data-label="Trạng thái">{STATUS[r.status.toLowerCase()] ?? r.status}</td>
              <td data-label="Ngày công bố">{fmt(r.publishedAt)}</td>
              <td data-label=""><button className="btn btn-s" onClick={() => setOpenId(r.id)}>Xem</button></td>
            </tr>
          ))}
          {items.length === 0 && <tr><td colSpan={4} className="sub">{loading ? "Đang tải…" : "Chưa có báo cáo kỳ nào."}</td></tr>}
        </tbody>
      </table>
      {data && <TransactionPager data={data} onPage={setPage} />}
      {openId !== null && (
        <Dialog title="Báo cáo kỳ" onClose={close} wide>
          {reportError && <div className="notice err" role="status" data-inline-notice>{reportError}</div>}
          {!report && !reportError && <p className="sub">Đang tải…</p>}
          {report && <RevenuePanel revenue={report.revenue} accounts={report.accounts} />}
        </Dialog>
      )}
    </div>
  );
}
