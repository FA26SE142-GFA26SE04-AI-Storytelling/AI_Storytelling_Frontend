"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, History } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import { creatorAdminService, formatVnd } from "@/app/services/creatorAdminService";
import type { CreatorPayoutDue } from "@/app/types/creatorAdmin";
import { CreatorPayoutHistoryDialog } from "./CreatorPayoutHistoryDialog";
import { Notice, useAction } from "./ui";

/** Ngày hôm nay theo giờ Việt Nam, dạng yyyy-MM-dd (backend không cho ngày chuyển sau hôm nay). */
const todayVn = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

/**
 * Chi trả cho Creator (5h): hệ thống không chuyển tiền. Admin chuyển khoản đúng bằng số dư bằng ứng dụng ngân hàng, rồi đánh
 * dấu Đã chi kèm mã giao dịch và ngày chuyển. Danh sách chỉ gồm Creator đang hoạt động, có số dư đạt mức chi tối thiểu (Admin đặt trong Cài đặt gói ở trang Gói dịch vụ) và đã nhập
 * thông tin nhận tiền. Số tiền là số trước thuế.
 */
export function AdminCreatorPayouts() {
  const [rows, setRows] = useState<CreatorPayoutDue[]>([]);
  const [loadError, setLoadError] = useState("");
  const [paying, setPaying] = useState<CreatorPayoutDue | null>(null);
  const [code, setCode] = useState("");
  const [day, setDay] = useState(todayVn());
  const [historyOf, setHistoryOf] = useState<{ id: number; name: string } | null>(null);

  const load = useCallback(async () => {
    const r = await creatorAdminService.payoutsDue();
    setLoadError(r.success ? "" : r.message);
    setRows(r.data ?? []);
  }, []);
  useEffect(() => { void load(); }, [load]);
  const { note, busy, run } = useAction(load);

  const total = rows.reduce((sum, r) => sum + r.balanceVnd, 0);

  return (
    <div className="st-card st-scroll">
      <Notice note={note} />
      {loadError && <div className="notice err" role="status">{loadError}</div>}
      <div className="row">
        <h3 className="grow">Danh sách chi</h3>
        {rows.length > 0 && <span className="sub">{rows.length} nhà sáng tạo · tổng {formatVnd(total)}</span>}
      </div>
      <p className="sub">Thu nhập của tháng trước được cộng vào số dư từ ngày 8 hằng tháng. Chỉ hiện nhà sáng tạo có số dư đạt mức chi tối thiểu đặt trong Cài đặt gói (trang Gói dịch vụ); số dư thấp hơn được cộng dồn sang kỳ sau.</p>

      {paying && <Dialog title={`Đã chi cho ${paying.fullName}`} onClose={() => setPaying(null)}>
        <div className="kv">
          <div><small>Số tiền chuyển (đúng bằng số dư)</small><b>{formatVnd(paying.balanceVnd)}</b></div>
          <div><small>Ngân hàng</small><b>{paying.bankName}</b></div>
          <div><small>Số tài khoản</small><b>{paying.accountNumber}</b></div>
          <div><small>Chủ tài khoản</small><b>{paying.accountHolderName}</b></div>
        </div>
        <label className="field"><span className="lbl">Mã giao dịch ngân hàng</span>
          <input className="inp" maxLength={100} value={code} onChange={(e) => setCode(e.target.value)} />
        </label>
        <label className="field"><span className="lbl">Ngày chuyển</span>
          <input className="inp" type="date" max={todayVn()} value={day} onChange={(e) => setDay(e.target.value)} />
        </label>
        <div className="row"><button className="btn btn-ok" disabled={busy || !code.trim() || !day} onClick={() => {
          const target = paying;
          void run(() => creatorAdminService.markPaid(target.creatorUserId, {
            amountVnd: target.balanceVnd, bankTransactionCode: code.trim(), transferredOn: day,
          }), `Đã ghi nhận lần chi ${formatVnd(target.balanceVnd)} cho ${target.fullName}.`).then((ok) => { if (ok) setPaying(null); });
        }}><Banknote className="ic" />Xác nhận Đã chi</button></div>
      </Dialog>}
      {historyOf && <CreatorPayoutHistoryDialog creatorUserId={historyOf.id} name={historyOf.name}
        onClose={() => setHistoryOf(null)} onChanged={() => void load()} />}

      <table className="st-table stack-table">
        <thead><tr><th>Nhà sáng tạo</th><th>Số dư</th><th>Ngân hàng</th><th>Số tài khoản</th><th>Chủ tài khoản</th><th /></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.creatorUserId}>
              <td data-label="Nhà sáng tạo"><b>{r.fullName}</b><br /><small className="sub">{r.username}</small></td>
              <td data-label="Số dư"><b>{formatVnd(r.balanceVnd)}</b></td>
              <td data-label="Ngân hàng">{r.bankName}</td>
              <td data-label="Số tài khoản">{r.accountNumber}</td>
              <td data-label="Chủ tài khoản">{r.accountHolderName}</td>
              <td data-label="" style={{ whiteSpace: "nowrap" }}>
                <button className="btn btn-p" disabled={busy} onClick={() => { setCode(""); setDay(todayVn()); setPaying(r); }}><Banknote className="ic" />Đã chi</button>
                <button className="btn btn-g" onClick={() => setHistoryOf({ id: r.creatorUserId, name: r.fullName })}><History className="ic" />Lịch sử</button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && !loadError && <tr><td colSpan={6} className="sub">Chưa có nhà sáng tạo nào đến hạn chi.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
