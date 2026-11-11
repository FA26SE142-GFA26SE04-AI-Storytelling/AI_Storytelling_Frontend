"use client";

import { useCallback, useEffect, useState } from "react";
import { BookMarked, BookOpen, CheckCircle2, Eye, FilePlus2, Send, XCircle } from "lucide-react";
import Pager from "@/app/components/Pager";
import StatCard from "@/app/components/stats/StatCard";
import { count, money } from "@/app/components/stats/statFormat";
import { fmt, fmtDay } from "@/app/features/staff/ui";
import { confirmDialog } from "@/app/lib/confirm";
import type { Period } from "@/app/lib/monthPeriods";
import { showToast } from "@/app/lib/toast";
import { staffService } from "@/app/services/staffService";
import type { AdminBusinessReportDto, PagedResult } from "@/app/types/backendContracts";
import type { BusinessReport } from "@/app/types/staff";
import AdminReportDetailDialog from "./AdminReportDetailDialog";

/** Trạng thái báo cáo bằng tiếng Việt kèm màu pill. */
const REPORT_STATUS: Record<string, [string, string]> = { Compiling: ["wait", "Bản nháp"], Published: ["ok", "Đã công bố"] };
function StatusPill({ status }: { status: string }) {
  const [tone, label] = REPORT_STATUS[status] ?? ["draft", status];
  return <span className={`pill ${tone}`}>{label}</span>;
}

function ReportStats({ r }: { r: BusinessReport }) {
  return (
    <div className="ce-stats">
      <StatCard icon={BookOpen} label="Truyện được tạo" value={count(r.storiesGenerated)} />
      <StatCard icon={CheckCircle2} label="Truyện được duyệt" value={count(r.storiesApproved)} />
      <StatCard icon={XCircle} label="Bị từ chối / chặn" value={count(r.storiesRejected)} />
      <StatCard icon={BookMarked} label="Lượt đọc hoàn thành" value={count(r.readingSessionsCompleted)} />
    </div>
  );
}

export function AdminSavedReportsTab({ period }: { period: Period }) {
  const [draft, setDraft] = useState<BusinessReport | null>(null);
  const [latest, setLatest] = useState<BusinessReport | null>(null);
  const [reports, setReports] = useState<PagedResult<AdminBusinessReportDto> | null>(null);
  const [pageIndex, setPageIndex] = useState(1);
  const [busy, setBusy] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  const loadLatest = useCallback(async () => {
    const r = await staffService.latestReport();
    setLatest(r.success ? r.data : null);
  }, []);

  const loadReports = useCallback(async () => {
    const r = await staffService.listReports(pageIndex);
    setReports(r.success ? r.data : null);
  }, [pageIndex]);

  useEffect(() => { void loadLatest(); }, [loadLatest]);
  useEffect(() => { void loadReports(); }, [loadReports]);

  const handleGenerate = async () => {
    setBusy(true);
    const r = await staffService.generateReport(period.start, period.end);
    setBusy(false);
    if (r.success && r.data) {
      showToast("Đã tổng hợp báo cáo kỳ này.");
      setDraft(r.data);
    } else {
      showToast(r.message || "Không tổng hợp được báo cáo.", "err");
    }
  };

  const handlePublish = async () => {
    if (!draft) return;
    if (!(await confirmDialog("Công bố báo cáo kỳ này? Báo cáo đã công bố sẽ hiện cho quản trị viên."))) return;
    setBusy(true);
    const r = await staffService.publishReport(draft);
    setBusy(false);
    if (r.success) {
      showToast("Đã công bố báo cáo.");
      setDraft(null);
      await Promise.all([loadLatest(), loadReports()]);
    } else {
      showToast(r.message || "Không công bố được.", "err");
    }
  };

  return (
    <>
      <div className="st-card">
        <div className="row" style={{ alignItems: "center" }}>
          <h3 className="sec-h grow">Tổng hợp báo cáo mới</h3>
          <button type="button" className="btn btn-p" disabled={busy} onClick={() => void handleGenerate()}>
            <FilePlus2 className="ic" />Tổng hợp
          </button>
        </div>
        {draft && (
          <>
            <p className="sub">Kỳ {fmtDay(draft.periodStart)} – {fmtDay(draft.periodEnd)} · <StatusPill status={draft.status} /></p>
            <ReportStats r={draft} />
            <button type="button" className="btn btn-ok" style={{ width: "fit-content" }} disabled={busy} onClick={() => void handlePublish()}>
              <Send className="ic" />Công bố
            </button>
          </>
        )}
      </div>

      <div className="st-card">
        <h3 className="sec-h">Báo cáo đã công bố gần nhất</h3>
        {latest ? (
          <>
            <p className="sub">Kỳ {fmtDay(latest.periodStart)} – {fmtDay(latest.periodEnd)} · công bố {fmt(latest.publishedAt)}</p>
            <ReportStats r={latest} />
          </>
        ) : <p className="sub">Chưa có báo cáo nào được công bố.</p>}
      </div>

      <div className="st-card st-scroll">
        <h3 className="sec-h">Danh sách báo cáo</h3>
        {!reports || reports.items.length === 0 ? (
          <p className="empty-line">Chưa có báo cáo nào.</p>
        ) : (
          <>
            <table className="st-table stack-table">
              <thead>
                <tr><th>Kỳ</th><th>Trạng thái</th><th>Doanh thu</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {reports.items.map((item) => (
                  <tr key={item.id}>
                    <td data-label="Kỳ">{fmtDay(item.periodStart)} – {fmtDay(item.periodEnd)}</td>
                    <td data-label="Trạng thái"><StatusPill status={item.status} /></td>
                    <td data-label="Doanh thu">{item.revenue ? money(item.revenue.totalRevenueVnd) : "—"}</td>
                    <td data-label="Thao tác">
                      <button type="button" className="btn btn-s" onClick={() => setSelectedReportId(item.id)}>
                        <Eye className="ic" />Xem
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pager page={reports.pageIndex} totalPages={reports.totalPages} hasPrev={reports.hasPreviousPage} hasNext={reports.hasNextPage} onPage={setPageIndex} />
          </>
        )}
      </div>

      {selectedReportId !== null && (
        <AdminReportDetailDialog reportId={selectedReportId} onClose={() => setSelectedReportId(null)} />
      )}
    </>
  );
}
