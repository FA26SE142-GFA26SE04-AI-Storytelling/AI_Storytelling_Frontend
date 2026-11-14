"use client";

import type { AdminPaymentTransactionDto, PagedResult } from "@/app/types/backendContracts";

/** Người mua: tên · email · #mã tài khoản (Task 12 cần thấy mã). */
export function PayerCell({ t }: { t: AdminPaymentTransactionDto }) {
  return <>{t.payerName} · {t.payerEmail} · #{t.payerUserId}</>;
}

export function TransactionPager({ data, onPage }: { data: PagedResult<unknown>; onPage: (p: number) => void }) {
  if (data.totalPages <= 1) return null;
  return (
    <div className="row st-wrap">
      <button className="btn btn-s" disabled={!data.hasPreviousPage} onClick={() => onPage(data.pageIndex - 1)}>Trước</button>
      <span className="sub">Trang {data.pageIndex}/{data.totalPages} · {data.totalCount} mục</span>
      <button className="btn btn-s" disabled={!data.hasNextPage} onClick={() => onPage(data.pageIndex + 1)}>Sau</button>
    </div>
  );
}
