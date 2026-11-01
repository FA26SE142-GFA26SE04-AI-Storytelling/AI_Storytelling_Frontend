'use client';
import { confirmDialog } from "@/app/lib/confirm";
import { useEffect, useState } from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import { paymentService } from '@/app/services/paymentService';
import type { PaymentTransactionDto, SubscriptionPlanDto } from '@/app/types/backendContracts';

/** Trang "Nâng cấp gói": mỗi gói là một thẻ giá; chọn gói thì tạo giao dịch và hiện thông tin chuyển khoản trong popup. */
export default function PaymentSection() {
  const [plans,setPlans]=useState<SubscriptionPlanDto[] | null>(null);
  const [transaction,setTransaction]=useState<PaymentTransactionDto | null>(null);
  const [busy,setBusy]=useState(false); const [uncertain,setUncertain]=useState(false); const [note,setNote]=useState('');
  useEffect(()=>{ const c=new AbortController(); let alive=true; void paymentService.plans(c.signal).then(r=>{if(alive){setPlans(r.data??[]);if(!r.success)setNote(r.message);}});return()=>{alive=false;c.abort();}; },[]);
  const create=async(plan:SubscriptionPlanDto)=>{
    if(busy||uncertain||transaction)return;
    if(!await confirmDialog(`Tạo giao dịch mua ${plan.name}, ${plan.priceVnd.toLocaleString('vi-VN')} đồng?`))return;
    setBusy(true);const r=await paymentService.create(plan.id);setBusy(false);
    if(r.success&&r.data)setTransaction(r.data);else{setNote(r.message);if(r.status===0|| (r.status??0)>=500)setUncertain(true);}
  };
  const featured=plans?.length ? plans[plans.length-1].id : null;
  return <section className="sec plan-page" style={{ gap: 20 }}>
    <h3 className="display" style={{ margin: 0, textAlign: "center" }}>Nâng cấp gói</h3>
    {note&&<p className="notice" role="status">{note}</p>}
    {uncertain&&<p className="notice warn">Chưa rõ máy chủ đã tạo giao dịch. Kiểm tra với bộ phận hỗ trợ trước khi tạo giao dịch khác.</p>}
    {plans===null && <p className="sub">Đang tải…</p>}
    <div className="plan-grid">
      {plans?.map(plan=><article key={plan.id} className={`plan-card${plan.id===featured?" featured":""}`}>
        <div className="plan-head">
          <Sparkles className="plan-icon" aria-hidden />
          <b className="display plan-title">{plan.name}</b>
          <span className="plan-tag">{plan.quotaAmount} lượt tạo truyện bằng AI</span>
          <div className="plan-price"><b>{plan.priceVnd.toLocaleString('vi-VN')}</b><span>₫<small>mua một lần</small></span></div>
          <button className={`btn btn-c ${plan.id===featured?"btn-p":"btn-s"}`} disabled={busy||uncertain||!!transaction} onClick={()=>void create(plan)}>Nâng cấp gói</button>
          <small className="plan-note">Không tự gia hạn · Dùng hết lượt mới cần mua thêm</small>
        </div>
        <ul className="plan-list">
          <li><Check className="ic" />Tạo truyện bằng AI cho bé</li>
          <li><Check className="ic" />Mỗi lần tạo trừ 1 lượt</li>
          <li><Check className="ic" />Dùng cho mọi hồ sơ bé của bạn</li>
          <li><Check className="ic" />Truyện lưu sẵn trong thư viện của bạn</li>
        </ul>
      </article>)}
    </div>
    {transaction&&<div className="dlg-backdrop confirm-backdrop" role="dialog" aria-modal="true" aria-label="Thanh toán" onClick={(e)=>{if(e.target===e.currentTarget)setTransaction(null);}}>
      <div className="dlg" style={{ gap: 12, width: "min(440px, 100%)" }}>
        <div className="row"><b className="display grow" style={{ fontSize: 18 }}>{transaction.planName}</b><button className="btn btn-g" aria-label="Đóng" onClick={()=>setTransaction(null)}><X className="ic" /></button></div>
        <p>Số tiền: <b>{transaction.amount.toLocaleString('vi-VN')} đồng</b></p>
        <p>Nội dung chuyển khoản: <strong>{transaction.transactionCode}</strong></p>
        <p>Trạng thái: {transaction.status} · Hạn: {new Date(transaction.expiresAt).toLocaleString('vi-VN')}</p>
        {transaction.qrCodeUrl&&<a className="btn btn-p btn-c" href={transaction.qrCodeUrl} target="_blank" rel="noreferrer">Mở mã QR thanh toán</a>}
      </div>
    </div>}
  </section>;
}
