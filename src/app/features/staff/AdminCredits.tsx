"use client";

import { useEffect, useState } from "react";
import MyPlanSummary from "@/app/features/account/MyPlanSummary";
import { CREDIT_REASON_MAX, signedCredits, validateCreditAdjustment } from "@/app/lib/billing";
import { confirmDialog } from "@/app/lib/confirm";
import { adminBillingService } from "@/app/services/adminBillingService";
import type { CreditAdjustmentDto, MyQuotaDto, PagedResult } from "@/app/types/backendContracts";
import { TransactionPager } from "./billingTable";
import { Notice, Page, fmt, type Note } from "./ui";

function History({ userId, tick }: { userId: number | null; tick: number }) {
  const [onlyViewed, setOnlyViewed] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PagedResult<CreditAdjustmentDto> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const filterId = onlyViewed && userId !== null ? userId : undefined;

  useEffect(() => { setPage(1); }, [filterId]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    void adminBillingService.adjustments({ userId: filterId, pageIndex: page, pageSize: 20 }, ctrl.signal).then((r) => {
      if (ctrl.signal.aborted) return;
      setLoading(false);
      if (r.success && r.data) { setData(r.data); setError(null); } else setError(r.message || "Không tải được lịch sử điều chỉnh lượt.");
    });
    return () => ctrl.abort();
  }, [filterId, page, tick]);

  const items = data?.items ?? [];
  return (
    <>
      <h3 className="sec-h">Lịch sử điều chỉnh</h3>
      <label className="row">
        <input type="checkbox" checked={onlyViewed} disabled={userId === null} onChange={(e) => { setOnlyViewed(e.target.checked); setPage(1); }} />
        <span>Chỉ tài khoản đang xem</span>
      </label>
      {error && <div className="notice err" role="status">{error}</div>}
      {loading && !data && <p className="sub">Đang tải…</p>}
      {data && items.length === 0 && <p className="sub">Chưa có lần điều chỉnh nào.</p>}
      {items.length > 0 && (
        <div className="st-card st-scroll">
          <table className="st-table stack-table">
            <thead><tr><th>Thời gian</th><th>Tài khoản</th><th>Số lượt</th><th>Lý do</th><th>Người thực hiện</th></tr></thead>
            <tbody>
              {items.map((a) => (
                <tr key={a.id}>
                  <td data-label="Thời gian">{fmt(a.createdAt)}</td>
                  <td data-label="Tài khoản">#{a.userId}</td>
                  <td data-label="Số lượt"><b>{signedCredits(a.amount)}</b></td>
                  <td data-label="Lý do">{a.reason}</td>
                  <td data-label="Người thực hiện">{a.adminName} · #{a.adminId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <TransactionPager data={data} onPage={setPage} />}
    </>
  );
}

export function AdminCredits() {
  const [idText, setIdText] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [quota, setQuota] = useState<MyQuotaDto | null>(null);
  const [loadingQuota, setLoadingQuota] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState<Note>(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (userId === null) return;
    const ctrl = new AbortController();
    setLoadingQuota(true);
    void adminBillingService.userQuota(userId, ctrl.signal).then((r) => {
      if (ctrl.signal.aborted) return;
      setLoadingQuota(false);
      if (r.success && r.data) setQuota(r.data);
      else { setQuota(null); setNote({ ok: false, text: r.message || "Không tải được lượt của tài khoản." }); }
    });
    return () => ctrl.abort();
  }, [userId, tick]);

  const view = () => {
    const t = idText.trim();
    if (!/^\d+$/.test(t) || Number(t) < 1) { setNote({ ok: false, text: "Mã tài khoản phải là số nguyên dương." }); return; }
    setNote(null);
    setQuota(null);
    setUserId(Number(t));
    setTick((n) => n + 1);
  };

  const invalid = validateCreditAdjustment(amount, reason);
  const idChanged = Number(idText.trim()) !== userId;

  const submit = async () => {
    if (userId === null || invalid || idChanged) return;
    const target = userId;
    const n = Number(amount.trim());
    const text = n > 0 ? `Cấp ${n} lượt cho tài khoản ${target}?` : `Trừ ${Math.abs(n)} lượt của tài khoản ${target}?`;
    if (!(await confirmDialog(text))) return;
    setBusy(true);
    setNote(null);
    const r = await adminBillingService.adjustCredits({ userId: target, amount: n, reason: reason.trim() });
    setBusy(false);
    if (r.success && r.data) {
      setNote({ ok: true, text: `Tài khoản #${target} còn ${r.data.totalRemainingAfter ?? 0} lượt.` });
      setAmount("");
      setReason("");
      setTick((x) => x + 1);
    } else {
      setNote({ ok: false, text: r.message || "Không điều chỉnh được lượt." });
    }
  };

  const touched = amount !== "" || reason !== "";
  return (
    <Page title="Cấp lượt">
      <Notice note={note} />
      <div className="row st-wrap">
        <label className="field">
          <span className="lbl">Mã tài khoản</span>
          <input className="inp" inputMode="numeric" value={idText} onChange={(e) => setIdText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !busy) view(); }} />
        </label>
        <button className="btn btn-p" onClick={view} disabled={!idText.trim() || busy}>Xem</button>
      </div>

      {userId !== null && (
        <>
          {loadingQuota && !quota && <p className="sub">Đang tải…</p>}
          {quota && (
            <>
              <MyPlanSummary quota={quota} />
              <form className="st-card" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
                <label className="field">
                  <span className="lbl">Số lượt</span>
                  <input className="inp" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Dương là cấp, âm là trừ" />
                </label>
                <label className="field">
                  <span className="lbl">Lý do</span>
                  <textarea className="inp" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
                  <small className="sub">{reason.trim().length}/{CREDIT_REASON_MAX}</small>
                </label>
                {touched && invalid && <p className="sub">{invalid}</p>}
                {!invalid && !idChanged && <button type="submit" className="btn btn-p" disabled={busy}>{Number(amount.trim()) > 0 ? "Cấp lượt" : "Trừ lượt"}</button>}
              </form>
            </>
          )}
        </>
      )}

      <History userId={userId} tick={tick} />
    </Page>
  );
}
