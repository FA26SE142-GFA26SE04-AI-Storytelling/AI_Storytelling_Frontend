"use client";

import type { ReactNode } from "react";
import { formatVnd } from "@/app/services/creatorAdminService";
import type { CreatorPayout, CreatorPayoutOverview } from "@/app/types/creatorAdmin";
import { fmt, fmtDay } from "./ui";

const month = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" });

/** Số dư, lịch sử nhận tiền và thu nhập các kỳ đã chốt (5h); dùng chung cho Admin và cho Creator xem của chính mình. */
export function CreatorPayoutTables({ data, renderPayoutAction }: {
  data: CreatorPayoutOverview;
  renderPayoutAction?: (payout: CreatorPayout) => ReactNode;
}) {
  return (
    <>
      <div className="kv">
        <div><small>Số dư hiện tại (trước thuế)</small><b>{formatVnd(data.balanceVnd)}</b></div>
      </div>

      <h4 className="sec-h">Lịch sử nhận tiền</h4>
      {data.payouts.length === 0 ? <p className="sub">Chưa có lần chi nào.</p> : (
        <table className="st-table stack-table">
          <thead><tr><th>Ngày chuyển</th><th>Số tiền</th><th>Mã giao dịch</th><th>Tài khoản nhận</th><th>Trạng thái</th>{renderPayoutAction && <th />}</tr></thead>
          <tbody>
            {data.payouts.map((p) => (
              <tr key={p.payoutId}>
                <td data-label="Ngày chuyển">{fmtDay(p.transferredOn)}</td>
                <td data-label="Số tiền"><b>{formatVnd(p.amountVnd)}</b></td>
                <td data-label="Mã giao dịch">{p.bankTransactionCode}</td>
                <td data-label="Tài khoản nhận">{p.bankName} · {p.accountNumber}</td>
                <td data-label="Trạng thái">
                  {p.status === "Paid" ? <span className="pill ok">Đã chi</span> : <span className="pill draft">Đã huỷ</span>}
                  {p.cancelledAt && <><br /><small className="sub">Huỷ {fmt(p.cancelledAt)}{p.cancelReason ? `: ${p.cancelReason}` : ""}</small></>}
                </td>
                {renderPayoutAction && <td data-label="">{renderPayoutAction(p)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h4 className="sec-h">Thu nhập các kỳ đã chốt</h4>
      {data.earnings.length === 0 ? <p className="sub">Chưa có kỳ nào được chốt.</p> : (
        <table className="st-table stack-table">
          <thead><tr><th>Kỳ</th><th>Lượt đọc hợp lệ</th><th>Thu nhập</th><th>Cộng vào số dư</th></tr></thead>
          <tbody>
            {data.earnings.map((e) => (
              <tr key={e.periodMonth}>
                <td data-label="Kỳ">Tháng {month(e.periodMonth)}</td>
                <td data-label="Lượt đọc hợp lệ">{e.validReads.toLocaleString("vi-VN")}</td>
                <td data-label="Thu nhập">{formatVnd(e.amountVnd)}</td>
                <td data-label="Cộng vào số dư">{fmtDay(e.creditedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
