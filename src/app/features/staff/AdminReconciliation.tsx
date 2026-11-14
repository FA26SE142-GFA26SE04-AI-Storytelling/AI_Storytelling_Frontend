"use client";

import { useEffect, useState } from "react";
import { confirmDialog } from "@/app/lib/confirm";
import { vnd } from "@/app/lib/billing";
import { adminBillingService } from "@/app/services/adminBillingService";
import type { PagedResult, ReconciliationExceptionDto } from "@/app/types/backendContracts";
import { PayerCell, TransactionPager } from "./billingTable";
import { Notice, fmt, useAction } from "./ui";

/** Thẻ "Cần xử lý": giao dịch đã trả tiền nhưng chưa được áp gói. */
export default function AdminReconciliation() {
  const [status, setStatus] = useState<"Open" | "Resolved">("Open");
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(0);
  const [data, setData] = useState<PagedResult<ReconciliationExceptionDto> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // useAction reloads after both success and failure, so a 409 (reason changed) refreshes the list too.
  const { note, busy, run } = useAction(() => setTick((n) => n + 1));

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    void adminBillingService.reconciliation({ status, pageIndex: page, pageSize: 20 }, ctrl.signal).then((r) => {
      if (ctrl.signal.aborted) return;
      setLoading(false);
      if (r.success && r.data) { setData(r.data); setError(null); } else setError(r.message || "Không tải được danh sách đối soát.");
    });
    return () => ctrl.abort();
  }, [status, page, tick]);

  const items = data?.items ?? [];
  const reapply = async (e: ReconciliationExceptionDto) => {
    if (await confirmDialog(`Áp lại gói ${e.transaction.planName} (${vnd(e.transaction.amount)}) cho ${e.transaction.payerEmail}?`)) void run(() => adminBillingService.resolveException(e.id));
  };

  return (
    <>
      <Notice note={note} />
      <div className="seg" role="group" aria-label="Lọc trạng thái xử lý">
        <button type="button" className={status === "Open" ? "on" : ""} aria-pressed={status === "Open"} onClick={() => { setStatus("Open"); setPage(1); }}>Chưa xử lý</button>
        <button type="button" className={status === "Resolved" ? "on" : ""} aria-pressed={status === "Resolved"} onClick={() => { setStatus("Resolved"); setPage(1); }}>Đã xử lý</button>
      </div>
      {error && <div className="notice err" role="status" data-inline-notice>{error}</div>}
      <div className="st-card st-scroll">
        <table className="st-table stack-table">
          <thead><tr><th>Giao dịch</th><th>Người mua</th><th>Lý do</th><th>Tạo lúc</th><th>Người xử lý</th><th /></tr></thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id}>
                <td data-label="Giao dịch"><code>{e.transaction.transactionCode}</code> · {e.transaction.planName} · {vnd(e.transaction.amount)}</td>
                <td data-label="Người mua"><PayerCell t={e.transaction} /></td>
                <td data-label="Lý do">{e.reason}</td>
                <td data-label="Tạo lúc">{fmt(e.createdAt)}</td>
                <td data-label="Người xử lý">{e.resolvedByName ? `${e.resolvedByName} · ${fmt(e.resolvedAt)}` : "—"}</td>
                <td data-label="">{e.status === "Open" && <button className="btn btn-s" disabled={busy} onClick={() => void reapply(e)}>Áp lại gói</button>}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={6} className="sub">{loading ? "Đang tải…" : "Không có mục nào."}</td></tr>}
          </tbody>
        </table>
      </div>
      {data && <TransactionPager data={data} onPage={setPage} />}
    </>
  );
}
