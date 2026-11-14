'use client';
import { useState } from 'react';
import { confirmDialog } from '@/app/lib/confirm';
import { findPendingTransaction, limitMessage, vnd, type PollState } from '@/app/lib/billing';
import { paymentService } from '@/app/services/paymentService';
import type { PaymentTransactionDto, SubscriptionPlanDto } from '@/app/types/backendContracts';

/** Luồng mua gói dùng chung: xác nhận, tạo giao dịch, 409 thì mở lại giao dịch đang chờ, lỗi mạng/máy chủ thì khoá mua tiếp (chưa rõ đã tạo hay chưa). */
export function usePurchase(onPaid: () => void) {
  const [transaction, setTransaction] = useState<PaymentTransactionDto | null>(null);
  const [busy, setBusy] = useState(false); const [uncertain, setUncertain] = useState(false); const [note, setNote] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const onSettled = (state: PollState) => { setReloadKey(k => k + 1); if (state === 'paid') { setNote(''); onPaid(); } };
  const buy = async (plan: SubscriptionPlanDto) => {
    if (busy || uncertain || transaction) return;
    if (!await confirmDialog(`Tạo giao dịch mua ${plan.name}, ${vnd(plan.priceVnd)}?`)) return;
    setBusy(true); const r = await paymentService.create(plan.id);
    if (r.success && r.data) { setBusy(false); setTransaction(r.data); setReloadKey(k => k + 1); return; }
    if (r.status === 409) {
      const h = await paymentService.myTransactions(1, 20);
      const pending = h.success && h.data ? findPendingTransaction(h.data.items, plan.planType, new Date()) : null;
      if (pending) { setBusy(false); setTransaction(pending); return; }
    }
    setBusy(false);
    const limit = limitMessage(r, 'purchase');
    setNote(limit ? limit.text : r.message);
    if (r.status === 0 || (r.status ?? 0) >= 500) setUncertain(true);
  };
  return { transaction, setTransaction, busy, uncertain, note, reloadKey, onSettled, buy, locked: busy || uncertain || !!transaction };
}
