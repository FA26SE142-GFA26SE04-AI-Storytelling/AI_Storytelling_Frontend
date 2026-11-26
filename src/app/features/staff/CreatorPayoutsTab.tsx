'use client';

import { useCallback, useEffect, useState } from 'react';
import { Landmark, Pencil } from 'lucide-react';
import Dialog from '@/app/components/Dialog';
import { showToast } from '@/app/lib/toast';
import { creatorSelfService } from '@/app/services/creatorAdminService';
import type { CreatorPayoutOverview, PayoutAccountInput } from '@/app/types/creatorAdmin';
import { CreatorPayoutTables } from './CreatorPayoutTables';
import { fmt } from './ui';

const EMPTY: PayoutAccountInput = { bankName: '', accountNumber: '', accountHolderName: '' };

/**
 * Nhận tiền (Luồng 5, 5h): Creator nhập thông tin nhận tiền, xem số dư (trước thuế) và lịch sử các lần Admin chuyển khoản.
 * Thu nhập của tháng trước được cộng vào số dư từ ngày 8; mọi số dư lớn hơn 0 đều được chi.
 */
export function CreatorPayoutsTab() {
  const [data, setData] = useState<CreatorPayoutOverview | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PayoutAccountInput>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await creatorSelfService.payouts();
    setError(r.success ? '' : r.message);
    if (r.success) setData(r.data);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const open = () => {
    const a = data?.payoutAccount;
    setForm(a ? { bankName: a.bankName, accountNumber: a.accountNumber, accountHolderName: a.accountHolderName } : EMPTY);
    setEditing(true);
  };
  const current = data?.payoutAccount;
  const changed = !current || form.bankName.trim() !== current.bankName || form.accountNumber.replace(/\s/g, '') !== current.accountNumber
    || form.accountHolderName.trim() !== current.accountHolderName;
  const digits = form.accountNumber.replace(/\s/g, '');
  const valid = form.bankName.trim().length >= 2 && /^\d{6,20}$/.test(digits) && form.accountHolderName.trim().length >= 2;

  const save = async () => {
    setSaving(true);
    const r = await creatorSelfService.updatePayoutAccount({
      bankName: form.bankName.trim(), accountNumber: digits, accountHolderName: form.accountHolderName.trim(),
    });
    setSaving(false);
    showToast(r.success ? 'Đã lưu thông tin nhận tiền.' : r.message, r.success ? 'ok' : 'err');
    if (r.success) { setEditing(false); await load(); }
  };

  if (error) return <div className="notice err" role="status">{error}</div>;
  if (!data) return <p className="sub">Đang tải…</p>;
  return (
    <div className="creator-payouts-tab">
      {data.reminder && <div className="notice" data-inline-notice>{data.reminder}</div>}
      <div className="st-card">
        <div className="row">
          <h3 className="grow"><Landmark className="ic" />Thông tin nhận tiền</h3>
          <button className="btn btn-s" onClick={open}><Pencil className="ic" />{current ? 'Sửa' : 'Nhập thông tin'}</button>
        </div>
        {current ? (
          <div className="kv">
            <div><small>Ngân hàng</small><b>{current.bankName}</b></div>
            <div><small>Số tài khoản</small><b>{current.accountNumber}</b></div>
            <div><small>Chủ tài khoản</small><b>{current.accountHolderName}</b></div>
            <div><small>Cập nhật</small><b>{fmt(current.updatedAt)}</b></div>
          </div>
        ) : <p className="sub">Chưa có thông tin nhận tiền.</p>}
        <p className="sub">Hệ thống không chuyển tiền: Quản trị viên chuyển khoản đúng bằng số dư rồi ghi nhận lần chi. Số tiền là số trước thuế; bạn tự kê khai và nộp thuế.</p>
      </div>

      <div className="st-card st-scroll"><CreatorPayoutTables data={data} /></div>

      {editing && <Dialog title="Thông tin nhận tiền" onClose={() => setEditing(false)}>
        <label className="field"><span className="lbl">Ngân hàng</span>
          <input className="inp" maxLength={100} value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="VD: Vietcombank" />
        </label>
        <label className="field"><span className="lbl">Số tài khoản (6–20 chữ số)</span>
          <input className="inp" inputMode="numeric" maxLength={30} value={form.accountNumber} onChange={(e) => setForm({ ...form, accountNumber: e.target.value })} />
        </label>
        <label className="field"><span className="lbl">Tên chủ tài khoản</span>
          <input className="inp" maxLength={100} value={form.accountHolderName} onChange={(e) => setForm({ ...form, accountHolderName: e.target.value })} placeholder="Viết đúng như trên thẻ" />
        </label>
        {!valid && (form.bankName || form.accountNumber || form.accountHolderName) && <p className="sub">Điền đủ ngân hàng, số tài khoản chỉ gồm chữ số và tên chủ tài khoản.</p>}
        <div className="row">
          <button className="btn btn-g" onClick={() => setEditing(false)}>Đóng</button>
          {changed && <button className="btn btn-p" disabled={saving || !valid} onClick={() => void save()}>{saving ? 'Đang lưu…' : 'Lưu'}</button>}
        </div>
      </Dialog>}
    </div>
  );
}
