"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Plus, Trash2, X } from "lucide-react";
import { staffService, downloadBlob, type QuotaInput } from "@/app/services/staffService";
import type { BusinessReport, DataRequest, PaymentTransaction, TokenQuotaConfig } from "@/app/types/staff";
import { Notice, Page, fmt, fmtDay, useAction } from "./ui";

const SCOPE: Record<string, string> = { System: "Mặc định toàn hệ thống", Personal: "Riêng một tài khoản", Child: "Riêng một bé" };
type QuotaScope = QuotaInput["scope"];
const monthStart = () => new Date().toISOString().slice(0, 8) + "01";
const monthEnd = () => { const d = new Date(); return new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 0)).toISOString().slice(0, 10); };

/** Luồng 5 Bước 5.1c — Token Quota (API thật /TokenQuota/config). */
export function AdminQuota() {
  const [list, setList] = useState<TokenQuotaConfig[]>([]);
  const [f, setF] = useState({ scope: "System" as QuotaScope, targetId: "", quotaLimit: 30, periodStart: monthStart(), periodEnd: monthEnd() });
  const needsTarget = f.scope !== "System";
  const load = useCallback(async () => { setList((await staffService.quotaConfigs()).data ?? []); }, []);
  useEffect(() => { void load(); }, [load]);
  const { note, busy, run } = useAction(load);
  return (
    <Page title="Token Quota" sub="Số lượt tạo truyện mỗi kỳ. Truyện mới = 1 lượt, truyện nhiều lựa chọn = 2 lượt; mỗi truyện có 3 lần sửa bằng AI miễn phí. Hết lượt chỉ chặn tạm thời, không khoá tài khoản.">
      <Notice note={note} />
      <div className="st-card st-scroll">
        <table className="st-table">
          <thead><tr><th>Phạm vi</th><th>Áp cho</th><th>Hạn mức</th><th>Đã dùng</th><th>Kỳ</th></tr></thead>
          <tbody>
            {list.map((q) => (
              <tr key={q.id}><td>{SCOPE[q.scope] ?? q.scope}</td><td>{q.userId ? `Tài khoản #${q.userId}` : q.childProfileId ? `Bé #${q.childProfileId}` : "—"}</td>
                <td>{q.quotaLimit}</td><td>{q.quotaUsed}{q.quotaUsed > q.quotaLimit && <span className="pill flag" style={{ marginLeft: 6 }}>Vượt</span>}</td><td>{fmtDay(q.periodStart)} – {fmtDay(q.periodEnd)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="st-card">
        <h3>Đặt hạn mức</h3>
        <div className="st-form">
          <label className="field"><span className="lbl">Phạm vi</span><select className="inp" value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value as QuotaScope })}>
            <option value="System">Mặc định toàn hệ thống</option><option value="Personal">Riêng một tài khoản (ghi đè)</option><option value="Child">Riêng một bé (ghi đè)</option></select></label>
          {needsTarget && <label className="field"><span className="lbl">{f.scope === "Child" ? "Mã hồ sơ bé" : "Mã tài khoản"}</span><input className="inp" type="number" value={f.targetId} onChange={(e) => setF({ ...f, targetId: e.target.value })} /></label>}
          <label className="field"><span className="lbl">Số lượt</span><input className="inp" type="number" min={0} value={f.quotaLimit} onChange={(e) => setF({ ...f, quotaLimit: +e.target.value })} /></label>
          <label className="field"><span className="lbl">Từ ngày</span><input className="inp" type="date" value={f.periodStart} onChange={(e) => setF({ ...f, periodStart: e.target.value })} /></label>
          <label className="field"><span className="lbl">Đến ngày</span><input className="inp" type="date" value={f.periodEnd} onChange={(e) => setF({ ...f, periodEnd: e.target.value })} /></label>
          <button className="btn btn-p" disabled={busy || (needsTarget && !f.targetId)} onClick={() => void run(() => staffService.setQuota({
            scope: f.scope, childProfileId: f.scope === "Child" ? +f.targetId : null, userId: f.scope === "Personal" ? +f.targetId : null,
            quotaLimit: f.quotaLimit, periodStart: f.periodStart, periodEnd: f.periodEnd,
          }))}><Plus className="ic" />Lưu</button>
        </div>
      </div>
    </Page>
  );
}

/** Luồng 5 Bước 5.4 — Data Request (API thật): SLA 72 giờ, cảnh báo ở mốc 48 giờ. */
export function AdminDataRequests() {
  const [list, setList] = useState<DataRequest[]>([]);
  const [format, setFormat] = useState<"xlsx" | "csv">("xlsx");
  const load = useCallback(async () => { setList((await staffService.pendingDataRequests()).data ?? []); }, []);
  useEffect(() => { void load(); }, [load]);
  const { note, setNote, busy, run } = useAction(load);

  const exportData = async (id: number) => {
    const r = await staffService.resolveExport(id, format);
    if (r.ok && r.blob) downloadBlob(r.blob, r.fileName ?? `data-request-${id}.${format}`);
    setNote({ ok: r.ok, text: r.ok ? "Đã xuất dữ liệu và đánh dấu đã xử lý. Hãy gửi file cho phụ huynh qua kênh an toàn." : r.message });
    await load();
  };

  return (
    <Page title="Yêu cầu dữ liệu (xuất / xoá)" sub="Owner của hồ sơ bé gửi yêu cầu. Xoá dữ liệu: thu hồi truy cập trước, gỡ khỏi lộ trình và thư viện cộng đồng, đóng các ca đang mở, xoá nội dung và dữ liệu học tập, ẩn danh hoá hồ sơ; giữ nhật ký kiểm toán."
      actions={<select className="inp" style={{ width: "auto" }} value={format} onChange={(e) => setFormat(e.target.value as "xlsx" | "csv")} aria-label="Định dạng xuất"><option value="xlsx">Excel (.xlsx)</option><option value="csv">CSV</option></select>}>
      <Notice note={note} />
      <div className="st-card st-scroll">
        <table className="st-table">
          <thead><tr><th>Yêu cầu</th><th>Hồ sơ bé</th><th>Loại</th><th>Gửi lúc</th><th>SLA</th><th /></tr></thead>
          <tbody>
            {list.map((r) => {
              const hours = (Date.now() - Date.parse(r.createdAt)) / 3_600_000;
              const del = /delete/i.test(r.requestType);
              return (
                <tr key={r.id}>
                  <td>#{r.id}</td><td>#{r.childProfileId}</td><td>{del ? "Xoá dữ liệu" : "Xuất dữ liệu"}</td><td>{fmt(r.createdAt)}</td>
                  <td>{hours >= 72 ? <span className="pill flag">Quá hạn</span> : hours >= 48 ? <span className="pill wait">Còn {Math.ceil(72 - hours)} giờ</span> : <span className="pill ok">Còn {Math.ceil(72 - hours)} giờ</span>}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{del
                    ? <button className="btn btn-no" disabled={busy} onClick={() => { if (confirm(`Xoá toàn bộ dữ liệu của hồ sơ #${r.childProfileId}? Không hoàn tác được.`)) void run(() => staffService.resolveDelete(r.id)); }}><Trash2 className="ic" />Xoá</button>
                    : <button className="btn btn-s" disabled={busy} onClick={() => void exportData(r.id)}><Download className="ic" />Xuất</button>}
                    <button className="btn btn-g" disabled={busy} onClick={() => {
                      const reason = prompt("Lý do từ chối (phụ huynh sẽ thấy):")?.trim();
                      if (reason) void run(() => staffService.rejectDataRequest(r.id, reason), "Đã từ chối yêu cầu.");
                    }}><X className="ic" />Từ chối</button></td>
                </tr>
              );
            })}
            {list.length === 0 && <tr><td colSpan={6} className="sub">Không có yêu cầu nào đang chờ.</td></tr>}
          </tbody>
        </table>
      </div>
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
        <div className="row">
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
        <table className="st-table">
          <thead><tr><th>Mã giao dịch</th><th>Gói</th><th>Số tiền nhận</th><th>Mã SePay</th><th>Hết hạn</th><th /></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}><td><code>{p.transactionCode}</code></td><td>{p.planName}</td><td>{p.amount.toLocaleString("vi-VN")}đ</td><td>{p.sepayTransactionId ?? "—"}</td><td>{fmt(p.expiresAt)}</td>
                <td><button className="btn btn-s" disabled={busy} onClick={() => { if (confirm("Xác nhận đã nhận đủ tiền và cộng lượt cho phụ huynh?")) void run(() => staffService.markPaid(p.id)); }}>Xác nhận đã thanh toán</button></td></tr>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="sub">Không có giao dịch cần đối soát.</td></tr>}
          </tbody>
        </table>
      </div>
    </Page>
  );
}

/** Luồng 5 Bước 5.1b — cấp / thu hồi quyền Administrator cho tài khoản có sẵn (API thật /AdminAccount). */
export function AdminGrant() {
  const [email, setEmail] = useState("");
  const [uid, setUid] = useState("");
  const { note, busy, run } = useAction(async () => undefined);
  return (
    <div className="st-card">
      <h3>Cấp / thu hồi Administrator (API hiện có)</h3>
      <p className="sub">Backend hiện cấp quyền Administrator cho một email đã có tài khoản. Đặc tả yêu cầu tài khoản Administrator riêng, được mời qua email — xem phần “Mời tài khoản mới”.</p>
      <Notice note={note} />
      <div className="row">
        <input className="inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email cấp quyền" />
        <button className="btn btn-s" disabled={busy || !email.trim()} onClick={() => void run(() => staffService.grantAdmin(email.trim()))}>Cấp quyền</button>
        <input className="inp" type="number" value={uid} onChange={(e) => setUid(e.target.value)} placeholder="Mã tài khoản" aria-label="Mã tài khoản thu hồi" style={{ maxWidth: 140 }} />
        <button className="btn btn-no" disabled={busy || !uid} onClick={() => void run(() => staffService.revokeAdmin(+uid))}>Thu hồi</button>
      </div>
    </div>
  );
}
