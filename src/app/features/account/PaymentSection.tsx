'use client';
import { useEffect, useState } from 'react';
import MyPlanSummary from '@/app/features/account/MyPlanSummary';
import ReadingSlotsCard from '@/app/features/children/ReadingSlotsCard';
import PlanCards from '@/app/features/account/PlanCards';
import PaymentDialog from '@/app/features/account/PaymentDialog';
import TransactionHistory from '@/app/features/account/TransactionHistory';
import { usePurchase } from '@/app/features/account/usePurchase';
import { paymentService } from '@/app/services/paymentService';
import type { MyQuotaDto, SubscriptionPlanDto } from '@/app/types/backendContracts';

/** Trang "Gói của tôi": gói đang dùng, các thẻ gói và lịch sử giao dịch; chọn gói thì tạo giao dịch và hiện thông tin chuyển khoản trong popup. */
export default function PaymentSection() {
  const [plans,setPlans]=useState<SubscriptionPlanDto[] | null>(null);
  const [quota,setQuota]=useState<MyQuotaDto | null>(null); const [quotaDone,setQuotaDone]=useState(false);
  const [dataKey,setDataKey]=useState(0); const [loadNote,setLoadNote]=useState('');
  const {transaction,setTransaction,uncertain,note:buyNote,reloadKey,onSettled,buy,locked}=usePurchase(()=>setDataKey(k=>k+1));
  const note=buyNote||loadNote;
  useEffect(()=>{ const c=new AbortController(); let alive=true; void paymentService.plans(c.signal).then(r=>{if(alive){setPlans(r.data??[]);if(!r.success)setLoadNote(r.message);}});return()=>{alive=false;c.abort();}; },[dataKey]);
  useEffect(()=>{ const c=new AbortController(); let alive=true; void paymentService.myQuota(c.signal).then(r=>{if(!alive)return;setQuotaDone(true);if(r.success&&r.data)setQuota(r.data);else setLoadNote(r.message);});return()=>{alive=false;c.abort();}; },[dataKey]);
  return <section className="sec plan-page" style={{ gap: 20 }}>
    <h3 className="display" style={{ margin: 0, textAlign: "center" }}>Gói của tôi</h3>
    {note&&<p className="notice" role="status">{note}</p>}
    {uncertain&&<p className="notice warn">Chưa rõ máy chủ đã tạo giao dịch. Kiểm tra với bộ phận hỗ trợ trước khi tạo giao dịch khác.</p>}
    {(quota||!quotaDone)&&<MyPlanSummary quota={quota} />}
    <ReadingSlotsCard key={dataKey} />
    {plans===null && <p className="sub">Đang tải…</p>}
    {plans?.length===0&&<p className="sub">Tài khoản này không có gói để mua.</p>}
    {plans&&plans.length>0&&<PlanCards plans={plans} disabled={locked} onBuy={(p)=>void buy(p)} />}
    <TransactionHistory reloadKey={reloadKey} onOpen={setTransaction} />
    {transaction&&<PaymentDialog key={transaction.id} transaction={transaction} onClose={()=>setTransaction(null)} onSettled={onSettled} />}
  </section>;
}
