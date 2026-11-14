"use client";
import { useCallback, useEffect, useState } from "react";
import { staffService } from "@/app/services/staffService";
import type { BusinessReport } from "@/app/types/staff";
import AdminReportList from "./AdminReportList";
import { Notice, Page, fmt, fmtDay, useAction } from "./ui";

const monthStart = () => new Date().toISOString().slice(0, 8) + "01";
const monthEnd = () => { const d = new Date(); return new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 0)).toISOString().slice(0, 10); };

function Report({ r }: { r: BusinessReport }) {
  return (
    <div className="st-grid">
      <div className="st-kpi"><small>Truyện được tạo</small><b>{r.storiesGenerated}</b></div>
      <div className="st-kpi"><small>Truyện được duyệt</small><b>{r.storiesApproved}</b></div>
      <div className="st-kpi"><small>Bị từ chối / chặn</small><b>{r.storiesRejected}</b></div>
      <div className="st-kpi"><small>Lượt đọc hoàn thành</small><b>{r.readingSessionsCompleted}</b></div>
    </div>
  );
}

/** Luồng 5 Bước 5.5 — báo cáo nghiệp vụ (API thật): tổng hợp toàn nền tảng, không định danh trẻ. */
export function AdminBusinessReport() {
  const [latest, setLatest] = useState<BusinessReport | null>(null);
  const [draft, setDraft] = useState<BusinessReport | null>(null);
  const [period, setPeriod] = useState({ start: monthStart(), end: monthEnd() });
  const load = useCallback(async () => { const r = await staffService.latestReport(); setLatest(r.success ? r.data : null); }, []);
  useEffect(() => { void load(); }, [load]);
  const [listKey, setListKey] = useState(0);
  const { note, busy, run } = useAction(async () => { await load(); setListKey((n) => n + 1); });
  return (
    <Page title="Báo cáo nghiệp vụ">
      <Notice note={note} />
      <div className="st-card">
        <h3>Tổng hợp báo cáo mới</h3>
        <div className="row st-wrap">
          <input className="inp" type="date" value={period.start} onChange={(e) => setPeriod({ ...period, start: e.target.value })} aria-label="Từ ngày" />
          <input className="inp" type="date" value={period.end} onChange={(e) => setPeriod({ ...period, end: e.target.value })} aria-label="Đến ngày" />
          <button className="btn btn-p" disabled={busy} onClick={() => void run(async () => { const r = await staffService.generateReport(period.start, period.end); if (r.data) setDraft(r.data); return r; })}>Tổng hợp</button>
        </div>
        {draft && (
          <>
            <p className="sub">Kỳ {fmtDay(draft.periodStart)} – {fmtDay(draft.periodEnd)} · {draft.status}</p>
            <Report r={draft} />
            <button className="btn btn-ok" style={{ width: "fit-content" }} disabled={busy} onClick={() => void run(() => staffService.publishReport(draft)).then((ok) => ok && setDraft(null))}>Công bố</button>
          </>
        )}
      </div>
      <div className="st-card">
        <h3>Báo cáo đã công bố gần nhất</h3>
        {latest ? <><p className="sub">Kỳ {fmtDay(latest.periodStart)} – {fmtDay(latest.periodEnd)} · công bố {fmt(latest.publishedAt)}</p><Report r={latest} /></> : <p className="sub">Chưa có báo cáo nào được công bố.</p>}
      </div>
      <AdminReportList refreshKey={listKey} />
    </Page>
  );
}
