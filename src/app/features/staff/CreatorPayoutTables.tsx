"use client";

import type { ReactNode } from "react";
import { formatVnd } from "@/app/services/creatorAdminService";
import type { CreatorPayout, CreatorPayoutOverview, CreatorPeriodEarningEntry } from "@/app/types/creatorAdmin";
import { fmt, fmtDay } from "./ui";

/** "mm/yyyy" theo ngày UTC của kỳ (toLocaleDateString vi-VN cho "tháng 09, 2026" nên ghép thành "Tháng tháng ..."). */
const month = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
};

/** Kỳ trọn tháng ghi "Tháng mm/yyyy"; kỳ chốt sớm (Chốt kỳ ngay) ghi khoảng ngày. Ngày kỳ là 00:00 UTC. */
export const periodLabel = (e: Pick<CreatorPeriodEarningEntry, "periodMonth" | "periodStart" | "periodEnd">) => {
  if (!e.periodStart || !e.periodEnd) return `Tháng ${month(e.periodMonth)}`;
  const start = new Date(e.periodStart);
  const end = new Date(e.periodEnd);
  const lastDayOfMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
  const fullMonth = start.getUTCDate() === 1 && end.getUTCFullYear() === start.getUTCFullYear()
    && end.getUTCMonth() === start.getUTCMonth() && end.getUTCDate() === lastDayOfMonth;
  return fullMonth ? `Tháng ${month(e.periodStart)}` : `${fmtDay(e.periodStart)} – ${fmtDay(e.periodEnd)}`;
};

/** Mức chi tối thiểu Admin đặt; 0 (hoặc API cũ không trả) nghĩa là không có mức tối thiểu. */
export const minimumPayoutText = (minimum: number | null | undefined) =>
  minimum && minimum > 0 ? formatVnd(minimum) : "Không có";

/** Số dư, lịch sử nhận tiền và thu nhập các kỳ đã chốt (5h); dùng chung cho Admin và cho Creator xem của chính mình. */
export function CreatorPayoutTables({ data, renderPayoutAction }: {
  data: CreatorPayoutOverview;
  renderPayoutAction?: (payout: CreatorPayout) => ReactNode;
}) {
  return (
    <>
      <div className="kv">
        <div><small>Số dư hiện tại (trước thuế)</small><b>{formatVnd(data.balanceVnd)}</b></div>
        <div><small>Mức chi tối thiểu</small><b>{minimumPayoutText(data.minimumPayoutVnd)}</b></div>
        {data.periodCloseDay > 0 && <div><small>Ngày chốt kỳ</small><b>Ngày {data.periodCloseDay} hằng tháng</b></div>}
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
              <tr key={e.periodStart ?? e.periodMonth}>
                <td data-label="Kỳ">{periodLabel(e)}</td>
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
