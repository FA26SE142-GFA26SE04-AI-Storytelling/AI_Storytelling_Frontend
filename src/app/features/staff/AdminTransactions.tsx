"use client";

import { useEffect, useState } from "react";
import { confirmDialog } from "@/app/lib/confirm";
import { transactionStatusLabel, vnd } from "@/app/lib/billing";
import { adminBillingService } from "@/app/services/adminBillingService";
import { staffService } from "@/app/services/staffService";
import type { AdminPaymentTransactionDto, PagedResult } from "@/app/types/backendContracts";
import AdminReconciliation from "./AdminReconciliation";
import { PayerCell, TransactionPager } from "./billingTable";
import { Notice, Page, fmt, useAction } from "./ui";

const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "Pending", label: "Chờ thanh toán" },
  { value: "Paid", label: "Đã thanh toán" },
  { value: "Expired", label: "Hết hạn" },
  { value: "MismatchAmount", label: "Lệch số tiền" },
];

const TONE: Record<string, string> = { Paid: "ok", Pending: "wait", Expired: "draft", MismatchAmount: "flag" };

function TransactionList() {
  const [status, setStatus] = useState("");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tick, setTick] = useState(0);
  const [data, setData] = useState<PagedResult<AdminPaymentTransactionDto> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { note, busy, run } = useAction(() => setTick((n) => n + 1));

  useEffect(() => {
    const id = setTimeout(() => { setSearch(input.trim()); setPage(1); }, 400);
    return () => clearTimeout(id);
  }, [input]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    void adminBillingService.transactions({ status: status || undefined, search: search || undefined, pageIndex: page, pageSize: 20 }, ctrl.signal).then((r) => {
      if (ctrl.signal.aborted) return;
      setLoading(false);
      if (r.success && r.data) { setData(r.data); setError(null); } else setError(r.message || "Không tải được danh sách giao dịch.");
    });
    return () => ctrl.abort();
  }, [status, search, page, tick]);

  const items = data?.items ?? [];
  const confirmPaid = async (t: AdminPaymentTransactionDto) => {
    const stillOpen = t.status === "Pending" && new Date(t.expiresAt).getTime() > Date.now();
    const text = `Xác nhận đã nhận đủ ${vnd(t.amount)} từ ${t.payerEmail} và áp gói ${t.planName}?${stillOpen ? " Giao dịch chưa hết hạn, phụ huynh vẫn có thể đang chuyển khoản." : ""}`;
    if (await confirmDialog(text)) void run(() => staffService.markPaid(t.id));
  };

  return (
    <>
      <Notice note={note} />
      <div className="row st-wrap">
        <div className="seg" role="group" aria-label="Lọc trạng thái">
          {FILTERS.map((f) => (
            <button key={f.value} type="button" className={status === f.value ? "on" : ""} aria-pressed={status === f.value} onClick={() => { setStatus(f.value); setPage(1); }}>{f.label}</button>
          ))}
        </div>
        <input className="inp" type="search" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tìm theo mã giao dịch hoặc email" aria-label="Tìm giao dịch" />
      </div>
      <p className="sub">Trạng thái là giá trị đã lưu: giao dịch chờ thanh toán quá hạn vẫn hiện &quot;Chờ thanh toán&quot; cho đến khi hệ thống đánh dấu hết hạn.</p>
      {error && <div className="notice err" role="status" data-inline-notice>{error}</div>}
      <div className="st-card st-scroll">
        <table className="st-table stack-table">
          <thead><tr><th>Mã giao dịch</th><th>Người mua</th><th>Gói</th><th>Số tiền</th><th>Trạng thái</th><th>Tạo lúc</th><th>Thanh toán lúc</th><th /></tr></thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id}>
                <td data-label="Mã giao dịch"><code>{t.transactionCode}</code></td>
                <td data-label="Người mua"><PayerCell t={t} /></td>
                <td data-label="Gói">{t.planName}</td>
                <td data-label="Số tiền">{vnd(t.amount)}</td>
                <td data-label="Trạng thái"><span className={`pill ${TONE[t.status] ?? "draft"}`}>{transactionStatusLabel(t.status, "admin")}</span></td>
                <td data-label="Tạo lúc">{fmt(t.createdAt)}</td>
                <td data-label="Thanh toán lúc">{fmt(t.paidAt)}</td>
                <td data-label="">{t.status !== "Paid" && <button className="btn btn-s" disabled={busy} onClick={() => void confirmPaid(t)}>Xác nhận đã nhận tiền</button>}</td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={8} className="sub">{loading ? "Đang tải…" : "Không có giao dịch phù hợp."}</td></tr>}
          </tbody>
        </table>
      </div>
      {data && <TransactionPager data={data} onPage={setPage} />}
    </>
  );
}

/** Trang "Giao dịch" của Administrator: hai thẻ, danh sách giao dịch và các ca cần xử lý. */
export function AdminTransactions() {
  const [tab, setTab] = useState<"list" | "exceptions">("list");
  return (
    <Page title="Giao dịch">
      <div className="seg" role="group" aria-label="Chọn thẻ">
        <button type="button" className={tab === "list" ? "on" : ""} aria-pressed={tab === "list"} onClick={() => setTab("list")}>Giao dịch</button>
        <button type="button" className={tab === "exceptions" ? "on" : ""} aria-pressed={tab === "exceptions"} onClick={() => setTab("exceptions")}>Cần xử lý</button>
      </div>
      {tab === "list" ? <TransactionList /> : <AdminReconciliation />}
    </Page>
  );
}
