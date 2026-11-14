'use client';
import { useEffect, useRef, useState } from 'react';
import { Copy } from 'lucide-react';
import Dialog from '@/app/components/Dialog';
import { paymentPollState, vnd, type PollState } from '@/app/lib/billing';
import { paymentService } from '@/app/services/paymentService';
import type { PaymentTransactionDto } from '@/app/types/backendContracts';

const POLL_MS = 5000;
const FINAL_TEXT: Record<Exclude<PollState, 'waiting'>, string> = {
  paid: 'Đã nhận thanh toán. Gói của bạn đã được cập nhật.',
  expired: 'Giao dịch đã hết hạn. Hãy tạo giao dịch mới.',
  mismatch: 'Số tiền chưa khớp. Giao dịch đang chờ quản trị viên xử lý, bạn không cần chuyển lại.',
};

/** Popup chuyển khoản: hỏi lại máy chủ mỗi 5 giây cho tới khi giao dịch được xác nhận, hết hạn hoặc lệch số tiền. */
export default function PaymentDialog({ transaction, onClose, onSettled }: { transaction: PaymentTransactionDto; onClose: () => void; onSettled: (state: PollState) => void }) {
  const [state, setState] = useState<PollState>(() => paymentPollState(transaction, new Date()));
  const [copied, setCopied] = useState(false);
  const settledRef = useRef(onSettled);
  useEffect(() => { settledRef.current = onSettled; });

  useEffect(() => {
    if (state !== 'waiting') return;
    let alive = true; let inFlight = false; let controller: AbortController | null = null;
    const tick = async () => {
      if (inFlight) return;
      inFlight = true; controller = new AbortController();
      const r = await paymentService.myTransactions(1, 20, controller.signal);
      inFlight = false;
      if (!alive) return;
      const found = r.success ? r.data?.items.find(t => t.id === transaction.id) : undefined;
      const next = paymentPollState(found ?? transaction, new Date());
      if (next !== 'waiting') { setState(next); settledRef.current(next); }
    };
    const timer = setInterval(() => { void tick(); }, POLL_MS);
    return () => { alive = false; clearInterval(timer); controller?.abort(); };
  }, [state, transaction]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(transaction.transactionCode); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard unavailable */ }
  };

  return <Dialog title={transaction.planName} onClose={onClose}>
    <p>Số tiền: <b>{vnd(transaction.amount)}</b></p>
    <div className="row" style={{ gap: 8 }}>
      <span className="grow">Nội dung chuyển khoản: <strong>{transaction.transactionCode}</strong></span>
      <button type="button" className="btn btn-s" onClick={() => void copy()}><Copy className="ic" /> {copied ? 'Đã chép' : 'Sao chép'}</button>
    </div>
    <p className="sub">Hạn thanh toán: {new Date(transaction.expiresAt).toLocaleString('vi-VN')}</p>
    {state === 'waiting' && transaction.qrCodeUrl && <a className="btn btn-p btn-c" href={transaction.qrCodeUrl} target="_blank" rel="noreferrer">Mở mã QR thanh toán</a>}
    {state === 'waiting'
      ? <p className="sub" role="status">Đang chờ thanh toán. Trang sẽ tự cập nhật khi nhận được tiền.</p>
      : <p className={state === 'paid' ? 'notice' : 'notice warn'} role="status" data-inline-notice>{FINAL_TEXT[state]}</p>}
  </Dialog>;
}
