"use client";

import { useCallback, useEffect, useState } from "react";
import { Undo2 } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import { confirmDialog } from "@/app/lib/confirm";
import { creatorAdminService, formatVnd } from "@/app/services/creatorAdminService";
import type { CreatorPayout, CreatorPayoutOverview } from "@/app/types/creatorAdmin";
import { CreatorPayoutTables } from "./CreatorPayoutTables";
import { Notice, type Note } from "./ui";

/**
 * Số dư và lịch sử chi của một Creator (5h). Admin huỷ được một lần chi (chuyển nhầm, ngân hàng trả lại) kèm lý do:
 * số dư được cộng lại và Creator nhận thông báo.
 */
export function CreatorPayoutHistoryDialog({ creatorUserId, name, onClose, onChanged }: {
  creatorUserId: number; name: string; onClose: () => void; onChanged: () => void;
}) {
  const [data, setData] = useState<CreatorPayoutOverview | null>(null);
  const [note, setNote] = useState<Note>(null);
  const [cancelling, setCancelling] = useState<CreatorPayout | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await creatorAdminService.payoutOverview(creatorUserId);
    if (r.success) setData(r.data);
    else setNote({ ok: false, text: r.message });
  }, [creatorUserId]);
  useEffect(() => { void load(); }, [load]);

  const cancel = async () => {
    const target = cancelling;
    if (!target) return;
    if (!(await confirmDialog(`Huỷ lần chi ${formatVnd(target.amountVnd)}? Số dư của ${name} được cộng lại và nhà sáng tạo nhận thông báo.`))) return;
    setBusy(true);
    const r = await creatorAdminService.cancelPayout(target.payoutId, reason.trim());
    setBusy(false);
    setNote({ ok: r.success, text: r.success ? `Đã huỷ lần chi ${formatVnd(target.amountVnd)}; số dư được cộng lại.` : r.message });
    if (r.success) { setCancelling(null); setReason(""); await load(); onChanged(); }
  };

  return (
    <Dialog title={`Chi trả · ${name}`} onClose={onClose}>
      <Notice note={note} />
      {!data && !note && <p className="sub">Đang tải…</p>}
      {data && <CreatorPayoutTables data={data} renderPayoutAction={(p) => p.status === "Paid" && (
        <button className="btn btn-g" disabled={busy} onClick={() => { setReason(""); setCancelling(p); }}><Undo2 className="ic" />Huỷ lần chi</button>
      )} />}
      {cancelling && <>
        <h4 className="sec-h">Huỷ lần chi {formatVnd(cancelling.amountVnd)} (mã {cancelling.bankTransactionCode})</h4>
        <label className="field"><span className="lbl">Lý do (bắt buộc, tối đa 500 ký tự)</span>
          <textarea className="inp" rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <div className="row">
          <button className="btn btn-no" disabled={busy || !reason.trim()} onClick={() => void cancel()}>Huỷ lần chi</button>
          <button className="btn btn-g" onClick={() => setCancelling(null)}>Thôi</button>
        </div>
      </>}
    </Dialog>
  );
}
