"use client";
import { confirmDialog } from "@/app/lib/confirm";

import { useCallback, useEffect, useState } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import { staffService, type QuotaInput } from "@/app/services/staffService";
import type { BusinessReport, PaymentTransaction, TokenQuotaConfig } from "@/app/types/staff";
import { Notice, Page, fmt, fmtDay, useAction } from "./ui";

const SCOPE: Record<string, string> = { System: "Mặc định toàn hệ thống", Personal: "Riêng một tài khoản" };
type QuotaScope = QuotaInput["scope"];
const monthStart = () => new Date().toISOString().slice(0, 8) + "01";
const monthEnd = () => { const d = new Date(); return new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 0)).toISOString().slice(0, 10); };

/** Luồng 5 Bước 5.1c — Token Quota (API thật /TokenQuota/config). */
export function AdminQuota() {
  const [list, setList] = useState<TokenQuotaConfig[]>([]);
  const [f, setF] = useState({ scope: "System" as QuotaScope, targetId: "", quotaLimit: 30, periodStart: monthStart(), periodEnd: monthEnd() });
  const [quotaOpen, setQuotaOpen] = useState(false);
  const needsTarget = f.scope !== "System";
  const load = useCallback(async () => { setList((await staffService.quotaConfigs()).data ?? []); }, []);
  useEffect(() => { void load(); }, [load]);
  const { note, busy, run } = useAction(load);
  return (
    <Page title="Token Quota" sub="Số lượt tạo truyện mỗi kỳ.">
      <Notice note={note} />
      <div className="st-card st-scroll">
        <table className="st-table stack-table">
          <thead><tr><th>Phạm vi</th><th>Áp cho</th><th>Hạn mức</th><th>Đã dùng</th><th>Kỳ</th></tr></thead>
          <tbody>
            {list.map((q) => (
              <tr key={q.id}><td data-label="Phạm vi">{SCOPE[q.scope] ?? q.scope}</td><td data-label="Áp cho">{q.userId ? `Tài khoản #${q.userId}` : "—"}</td>
                <td data-label="Hạn mức">{q.quotaLimit}</td><td data-label="Đã dùng">{q.quotaUsed}{q.quotaUsed > q.quotaLimit && <span className="pill flag" style={{ marginLeft: 6 }}>Vượt</span>}</td><td data-label="Kỳ">{fmtDay(q.periodStart)} – {fmtDay(q.periodEnd)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="row"><button className="btn btn-p" onClick={() => setQuotaOpen(true)}><SlidersHorizontal className="ic" />Đặt hạn mức</button></div>
      {quotaOpen && <Dialog title="Đặt hạn mức" onClose={() => setQuotaOpen(false)}>
        <div className="st-form">
          <label className="field"><span className="lbl">Phạm vi</span><select className="inp" value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value as QuotaScope })}>
            <option value="System">Mặc định toàn hệ thống</option><option value="Personal">Riêng một tài khoản (ghi đè)</option></select></label>
          {needsTarget && <label className="field"><span className="lbl">Mã tài khoản</span><input className="inp" type="number" value={f.targetId} onChange={(e) => setF({ ...f, targetId: e.target.value })} /></label>}
          <label className="field"><span className="lbl">Số lượt</span><input className="inp" type="number" min={0} value={f.quotaLimit} onChange={(e) => setF({ ...f, quotaLimit: +e.target.value })} /></label>
          <label className="field"><span className="lbl">Từ ngày</span><input className="inp" type="date" value={f.periodStart} onChange={(e) => setF({ ...f, periodStart: e.target.value })} /></label>
          <label className="field"><span className="lbl">Đến ngày</span><input className="inp" type="date" value={f.periodEnd} onChange={(e) => setF({ ...f, periodEnd: e.target.value })} /></label>
          <button className="btn btn-p" disabled={busy || (needsTarget && !f.targetId)} onClick={() => void run(() => staffService.setQuota({
            scope: f.scope, userId: f.scope === "Personal" ? +f.targetId : null,
            quotaLimit: f.quotaLimit, periodStart: f.periodStart, periodEnd: f.periodEnd,
          })).then((ok) => { if (ok) setQuotaOpen(false); })}><Plus className="ic" />Lưu</button>
        </div>
      </Dialog>}
    </Page>
  );
}

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
  const { note, busy, run } = useAction(load);
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
    </Page>
  );
}

/** Luồng 5 Bước 5.6 (Optional) — giao dịch SePay lệch số tiền, xử lý tay có ghi nhật ký. */
export function AdminPayments() {
  const [list, setList] = useState<PaymentTransaction[]>([]);
  const load = useCallback(async () => { setList((await staffService.mismatchedPayments()).data ?? []); }, []);
  useEffect(() => { void load(); }, [load]);
  const { note, busy, run } = useAction(load);
  return (
    <Page title="Đối soát thanh toán" sub="Giao dịch SePay có số tiền không khớp gói. Không bao giờ cộng lượt khi giao dịch chưa được xác nhận đã thanh toán.">
      <Notice note={note} />
      <div className="st-card st-scroll">
        <table className="st-table stack-table">
          <thead><tr><th>Mã giao dịch</th><th>Gói</th><th>Số tiền nhận</th><th>Mã SePay</th><th>Hết hạn</th><th /></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}><td data-label="Mã giao dịch"><code>{p.transactionCode}</code></td><td data-label="Gói">{p.planName}</td><td data-label="Số tiền nhận">{p.amount.toLocaleString("vi-VN")}đ</td><td data-label="Mã SePay">{p.sepayTransactionId ?? "—"}</td><td data-label="Hết hạn">{fmt(p.expiresAt)}</td>
                <td data-label=""><button className="btn btn-s" disabled={busy} onClick={async () => { if (await confirmDialog("Xác nhận đã nhận đủ tiền và cộng lượt cho phụ huynh?")) void run(() => staffService.markPaid(p.id)); }}>Xác nhận đã thanh toán</button></td></tr>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="sub">Không có giao dịch cần đối soát.</td></tr>}
          </tbody>
        </table>
      </div>
    </Page>
  );
}
