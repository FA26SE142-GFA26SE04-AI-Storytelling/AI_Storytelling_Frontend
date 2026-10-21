"use client";

import { useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import { accountService } from "@/app/services/accountService";
import type { SubscriptionPlan } from "@/app/types/auth";
import type { PaymentTransaction } from "@/app/types/staff";

const vnd = (n: number) => n.toLocaleString("vi-VN") + " đ";

/** Mua thêm lượt tạo truyện (Bước 5.6.1): chọn gói → nhận mã QR VietQR → chuyển khoản; ngân hàng báo về thì tự cộng lượt. */
export default function PlansSection() {
  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null);
  const [tx, setTx] = useState<PaymentTransaction | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { void accountService.plans().then((r) => { setPlans(r.data ?? []); if (!r.success) setError(r.message); }); }, []);

  const buy = async (plan: SubscriptionPlan) => {
    setBusy(true);
    setError(null);
    const r = await accountService.buyPlan(plan.id);
    setBusy(false);
    if (r.success && r.data) setTx(r.data); else setError(r.message);
  };

  return (
    <div className="sec">
      <h3 className="display" style={{ margin: 0 }}>Gói tạo truyện</h3>
      {plans === null && <p className="sub">Đang tải…</p>}
      {plans?.length === 0 && !error && <p className="sub">Hiện chưa có gói nào để mua.</p>}
      {error && <div className="notice err">{error}</div>}
      {tx ? (
        <div className="sec" style={{ gap: 8, alignItems: "flex-start" }}>
          <b>{tx.planName} · {vnd(tx.amount)}</b>
          {tx.qrCodeUrl ? <img src={tx.qrCodeUrl} alt="Mã QR chuyển khoản" style={{ width: 220, borderRadius: 12, background: "#fff" }} /> : <span className="sub">Chưa có mã QR, hãy chuyển khoản theo nội dung bên dưới.</span>}
          <span>Nội dung chuyển khoản: <b>{tx.transactionCode}</b></span>
          <small className="sub">Mã hết hạn lúc {new Date(tx.expiresAt).toLocaleString("vi-VN")}. Chuyển khoản đúng số tiền và nội dung; hệ thống tự cộng lượt khi ngân hàng báo về.</small>
          <button className="btn btn-g" onClick={() => setTx(null)}>Xong</button>
        </div>
      ) : (
        <div className="sec" style={{ gap: 6 }}>
          {plans?.map((p) => (
            <div key={p.id} className="row" style={{ gap: 8 }}>
              <span className="grow"><b>{p.name}</b> <small className="sub">· {p.quotaAmount} lượt · {vnd(p.priceVnd)}</small></span>
              <button className="btn btn-s" disabled={busy} onClick={() => void buy(p)}><QrCode className="ic" />Mua</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
