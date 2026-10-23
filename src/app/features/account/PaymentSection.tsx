'use client';
import { useEffect, useState } from 'react';
import { paymentService } from '@/app/services/paymentService';
import type { PaymentTransactionDto, SubscriptionPlanDto } from '@/app/types/backendContracts';
export default function PaymentSection() {
  const [plans,setPlans]=useState<SubscriptionPlanDto[]>([]);
  const [transaction,setTransaction]=useState<PaymentTransactionDto | null>(null);
  const [busy,setBusy]=useState(false); const [uncertain,setUncertain]=useState(false); const [note,setNote]=useState('');
  useEffect(()=>{ const c=new AbortController(); let alive=true; void paymentService.plans(c.signal).then(r=>{if(alive){setPlans(r.data??[]);if(!r.success)setNote(r.message);}});return()=>{alive=false;c.abort();}; },[]);
  const create=async(plan:SubscriptionPlanDto)=>{
    if(busy||uncertain||transaction)return;
    if(!window.confirm(`Tạo giao dịch mua ${plan.name}, ${plan.priceVnd.toLocaleString('vi-VN')} đồng?`))return;
    setBusy(true);const r=await paymentService.create(plan.id);setBusy(false);
    if(r.success&&r.data)setTransaction(r.data);else{setNote(r.message);if(r.status===0|| (r.status??0)>=500)setUncertain(true);}
  };
  return <section className="sec"><h3>Mua thêm lượt tạo truyện</h3>
    {note&&<p className="notice" role="status">{note}</p>}
    {uncertain&&<p className="notice warn">Chưa rõ máy chủ đã tạo giao dịch. Kiểm tra với bộ phận hỗ trợ trước khi tạo giao dịch khác.</p>}
    {plans.map(plan=><div className="row" key={plan.id}><span className="grow">{plan.name} · {plan.quotaAmount} lượt · {plan.priceVnd.toLocaleString('vi-VN')} đồng</span><button className="btn btn-p" disabled={busy||uncertain||!!transaction} onClick={()=>void create(plan)}>Chọn gói</button></div>)}
    {transaction&&<article><b>{transaction.planName}</b><p>Số tiền: {transaction.amount.toLocaleString('vi-VN')} đồng · Nội dung chuyển khoản: <strong>{transaction.transactionCode}</strong></p><p>Trạng thái: {transaction.status} · Hạn: {new Date(transaction.expiresAt).toLocaleString('vi-VN')}</p>
      {transaction.qrCodeUrl&&<a href={transaction.qrCodeUrl} target="_blank" rel="noreferrer">Mở mã QR thanh toán</a>}
      <p className="sub">Chỉ chuyển khoản theo giao dịch này. Màn hình chưa có API tra cứu kết quả thanh toán; không tự xác nhận đã nhận tiền.</p>
    </article>}
  </section>;
}
