'use client';
import { useEffect, useState } from 'react';
import { paymentPollState, transactionStatusLabel, vnd } from '@/app/lib/billing';
import { paymentService } from '@/app/services/paymentService';
import type { PagedResult, PaymentTransactionDto } from '@/app/types/backendContracts';

const PAGE_SIZE = 20;
const cell = { padding: '6px 8px', borderBottom: '1px solid var(--line)', textAlign: 'left' as const };
const head = { ...cell, fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 };

/** Bảng lịch sử giao dịch của tài khoản; giao dịch còn chờ có nút mở lại mã QR. */
export default function TransactionHistory({ reloadKey, onOpen }: { reloadKey: number; onOpen: (t: PaymentTransactionDto) => void }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PagedResult<PaymentTransactionDto> | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const c = new AbortController(); let alive = true;
    void paymentService.myTransactions(page, PAGE_SIZE, c.signal).then(r => {
      if (!alive) return;
      if (r.success && r.data) { setData(r.data); setError(''); } else setError(r.message);
    });
    return () => { alive = false; c.abort(); };
  }, [page, reloadKey]);

  const now = new Date();
  return <div className="sec" style={{ gap: 8 }}>
    <h4 className="display" style={{ margin: 0 }}>Lịch sử giao dịch</h4>
    {error && <p className="notice" role="status">{error}</p>}
    {!data && !error && <p className="sub">Đang tải…</p>}
    {data && data.items.length === 0 && <p className="sub">Chưa có giao dịch nào.</p>}
    {data && data.items.length > 0 && <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-sm)' }}>
        <thead><tr><th style={head}>Ngày tạo</th><th style={head}>Gói</th><th style={head}>Số tiền</th><th style={head}>Trạng thái</th><th style={head}></th></tr></thead>
        <tbody>{data.items.map(t => {
          const state = paymentPollState(t, now);
          const waiting = t.status === 'Pending' && state === 'waiting';
          const label = t.status === 'Pending' && state === 'expired' ? transactionStatusLabel('Expired') : transactionStatusLabel(t.status);
          return <tr key={t.id}>
            <td style={cell}>{new Date(t.createdAt).toLocaleString('vi-VN')}</td>
            <td style={cell}>{t.planName}</td>
            <td style={cell}>{vnd(t.amount)}</td>
            <td style={cell}>{label}</td>
            <td style={cell}>{waiting && <button type="button" className="btn btn-s" onClick={() => onOpen(t)}>Mở mã QR</button>}</td>
          </tr>;
        })}</tbody>
      </table>
    </div>}
    {data && (data.hasPreviousPage || data.hasNextPage) && <div className="row" style={{ gap: 8, justifyContent: 'center' }}>
      <button type="button" className="btn btn-s" disabled={!data.hasPreviousPage} onClick={() => setPage(p => Math.max(1, p - 1))}>Trang trước</button>
      <span className="sub">Trang {page}</span>
      <button type="button" className="btn btn-s" disabled={!data.hasNextPage} onClick={() => setPage(p => p + 1)}>Trang sau</button>
    </div>}
  </div>;
}
