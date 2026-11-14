"use client";

import { useEffect, useState } from "react";
import PaymentDialog from "@/app/features/account/PaymentDialog";
import TransactionHistory from "@/app/features/account/TransactionHistory";
import { usePurchase } from "@/app/features/account/usePurchase";
import { vnd } from "@/app/lib/billing";
import { paymentService } from "@/app/services/paymentService";
import type { CreatorCreditBucketDto, CreatorQuotaDto, SubscriptionPlanDto } from "@/app/types/backendContracts";

const BUCKETS: { key: "aiCredits" | "submitCredits"; title: string }[] = [
  { key: "aiCredits", title: "Lượt tạo truyện AI" },
  { key: "submitCredits", title: "Lượt gửi duyệt" },
];

function CreditCard({ title, bucket }: { title: string; bucket: CreatorCreditBucketDto }) {
  return <article className="plan-card">
    <div className="plan-head">
      <b className="display">{title}</b>
      <b className="display" style={{ fontSize: "var(--fs-2xl)" }}>{bucket.totalRemaining}</b>
      <span className="sub">Hạn mức tháng: còn {bucket.monthlyRemaining}/{bucket.monthlyAllowance}</span>
      <span className="sub">Đã mua: {bucket.purchasedRemaining}</span>
      {bucket.otherRemaining > 0 && <span className="sub">Khác: {bucket.otherRemaining}</span>}
    </div>
  </article>;
}

/** Trang "Lượt của tôi" của Content Creator: lượt còn lại, mua Gói Creator và lịch sử giao dịch. */
export default function CreatorBilling() {
  const [quota, setQuota] = useState<CreatorQuotaDto | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlanDto[]>([]);
  const [loadNote, setLoadNote] = useState("");
  const [dataKey, setDataKey] = useState(0);
  const { transaction, setTransaction, uncertain, note: buyNote, reloadKey, onSettled, buy, locked } = usePurchase(() => setDataKey(k => k + 1));
  useEffect(() => {
    const c = new AbortController(); let alive = true;
    void paymentService.creatorQuota(c.signal).then(r => { if (!alive) return; if (r.success && r.data) setQuota(r.data); else setLoadNote(r.message); });
    return () => { alive = false; c.abort(); };
  }, [dataKey]);
  useEffect(() => {
    const c = new AbortController(); let alive = true;
    void paymentService.plans(c.signal).then(r => { if (!alive) return; setPlans(r.data ?? []); if (!r.success) setLoadNote(r.message); });
    return () => { alive = false; c.abort(); };
  }, [dataKey]);
  const note = buyNote || loadNote;
  const pack = plans.find(p => p.planType === "CreatorPack") ?? null;
  return <section className="sec plan-page" style={{ gap: 20 }}>
    <h3 className="display" style={{ margin: 0, textAlign: "center" }}>Lượt của tôi</h3>
    {note && <p className="notice" role="status">{note}</p>}
    {uncertain && <p className="notice warn">Chưa rõ máy chủ đã tạo giao dịch. Kiểm tra với bộ phận hỗ trợ trước khi tạo giao dịch khác.</p>}
    {!quota && !loadNote && <p className="sub">Đang tải…</p>}
    {quota && <>
      <div className="plan-grid">{BUCKETS.map(b => <CreditCard key={b.key} title={b.title} bucket={quota[b.key]} />)}</div>
      <p className="sub" style={{ margin: 0, textAlign: "center" }}>Hạn mức tháng được cấp lại vào {new Date(quota.monthlyAllowanceResetsAt).toLocaleString("vi-VN")}.</p>
    </>}
    {pack && <article className="plan-card featured">
      <div className="plan-head">
        <b className="display">{pack.name}</b>
        <b className="display">{vnd(pack.priceVnd)}</b>
        <span className="sub">+{pack.aiCredits} lượt AI, +{pack.submitCredits} lượt gửi duyệt, không hết hạn</span>
        <button className="btn btn-p" disabled={locked} onClick={() => void buy(pack)}>Mua Gói Creator</button>
      </div>
    </article>}
    <TransactionHistory reloadKey={reloadKey} onOpen={setTransaction} />
    {transaction && <PaymentDialog key={transaction.id} transaction={transaction} onClose={() => setTransaction(null)} onSettled={onSettled} />}
  </section>;
}
