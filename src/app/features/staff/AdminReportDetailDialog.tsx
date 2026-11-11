"use client";

import { useEffect, useState } from "react";
import Dialog from "@/app/components/Dialog";
import { count, money } from "@/app/components/stats/statFormat";
import { fmtDay } from "@/app/features/staff/ui";
import { showToast } from "@/app/lib/toast";
import { staffService } from "@/app/services/staffService";
import type { AdminBusinessReportDto } from "@/app/types/backendContracts";

export default function AdminReportDetailDialog({ reportId, onClose }: { reportId: number; onClose: () => void }) {
  const [report, setReport] = useState<AdminBusinessReportDto | null>(null);

  useEffect(() => {
    let active = true;
    void staffService.getReport(reportId).then((r) => {
      if (!active) return;
      if (r.success && r.data) {
        setReport(r.data);
      } else {
        showToast(r.message || "Không tải được báo cáo.", "err");
        onClose();
      }
    });
    return () => { active = false; };
  }, [reportId, onClose]);

  const title = report ? `Báo cáo kỳ ${fmtDay(report.periodStart)} – ${fmtDay(report.periodEnd)}` : "Báo cáo kỳ …";

  return (
    <Dialog title={title} onClose={onClose} wide>
      {!report ? (
        <p className="sub">Đang tải…</p>
      ) : (
        <>
          <div className="st-grid">
            <div className="st-kpi"><small>Truyện được tạo</small><b>{count(report.storiesGenerated)}</b></div>
            <div className="st-kpi"><small>Truyện được duyệt</small><b>{count(report.storiesApproved)}</b></div>
            <div className="st-kpi"><small>Bị từ chối / chặn</small><b>{count(report.storiesRejected)}</b></div>
            <div className="st-kpi"><small>Lượt đọc hoàn thành</small><b>{count(report.readingSessionsCompleted)}</b></div>
          </div>

          <h4 className="sec-h" style={{ marginTop: 16 }}>Doanh thu</h4>
          {!report.revenue ? (
            <div className="notice" data-inline-notice>Báo cáo cũ chưa có số liệu doanh thu.</div>
          ) : (
            <div className="st-grid">
              <div className="st-kpi"><small>Tổng doanh thu</small><b>{money(report.revenue.totalRevenueVnd)}</b></div>
              <div className="st-kpi"><small>Giao dịch đã thanh toán</small><b>{count(report.revenue.paidTransactionCount)}</b></div>
              <div className="st-kpi"><small>Quỹ Creator</small><b>{money(report.revenue.creatorFundVnd)}</b></div>
            </div>
          )}

          <h4 className="sec-h" style={{ marginTop: 16 }}>Tài khoản</h4>
          {!report.accounts ? (
            <div className="notice" data-inline-notice>Báo cáo cũ chưa có số liệu tài khoản.</div>
          ) : (
            <>
              <div className="st-grid">
                <div className="st-kpi"><small>Tổng phụ huynh</small><b>{count(report.accounts.totalParentAccounts)}</b></div>
                <div className="st-kpi"><small>Đăng ký mới</small><b>{count(report.accounts.newAccounts)}</b></div>
                <div className="st-kpi"><small>Đang hoạt động</small><b>{count(report.accounts.activeAccounts)}</b></div>
                <div className="st-kpi"><small>Bị khoá</small><b>{count(report.accounts.lockedOrDisabledAccounts)}</b></div>
              </div>
              <p className="sub" style={{ margin: "6px 0 0" }}>Số tại thời điểm công bố.</p>
            </>
          )}
        </>
      )}
    </Dialog>
  );
}
