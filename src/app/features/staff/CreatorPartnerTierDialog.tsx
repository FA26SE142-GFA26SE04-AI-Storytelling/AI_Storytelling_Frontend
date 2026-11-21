"use client";

import { useCallback, useEffect, useState } from "react";
import { Award, Check, X } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import { confirmDialog } from "@/app/lib/confirm";
import { creatorAdminService } from "@/app/services/creatorAdminService";
import type { CreatorTierOverview, PartnerCriterion } from "@/app/types/creatorAdmin";
import { Notice, fmtDay, type Note } from "./ui";

const CRITERIA: Record<string, string> = {
  published_stories: "Truyện đang công khai",
  completion_rate: "Tỷ lệ đọc hết (90 ngày)",
  valid_reads: "Lượt đọc hợp lệ (90 ngày)",
  no_violation_removals: "Truyện bị gỡ vì vi phạm (90 ngày)",
};

const value = (c: PartnerCriterion, v: number) => (c.key === "completion_rate" ? `${Math.round(v * 100)}%` : v.toLocaleString("vi-VN"));
const month = (iso: string) => new Date(iso).toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" });

/**
 * Cấp Creator đối tác (5g): cấp hiện tại, tiến độ 4 tiêu chí trong 90 ngày, lịch sử xét 12 tháng và thu hồi cấp (lý do bắt buộc).
 * Việc xét lên / xuống cấp chạy tự động mỗi tháng.
 */
export function CreatorPartnerTierDialog({ creator, onClose }: { creator: { id: number; fullName: string }; onClose: () => void }) {
  const [tier, setTier] = useState<CreatorTierOverview | null>(null);
  const [note, setNote] = useState<Note>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const r = await creatorAdminService.partnerTier(creator.id);
    if (r.success) setTier(r.data);
    else setNote({ ok: false, text: r.message });
  }, [creator.id]);
  useEffect(() => { void load(); }, [load]);

  const revoke = async () => {
    if (!(await confirmDialog(`Thu hồi cấp đối tác của ${creator.fullName}? Nhà sáng tạo về cấp thường ngay và nhận thông báo.`))) return;
    setBusy(true);
    const r = await creatorAdminService.revokePartner(creator.id, reason.trim());
    setBusy(false);
    setNote({ ok: r.success, text: r.success ? "Đã thu hồi cấp đối tác; nhà sáng tạo về cấp thường ngay." : r.message });
    if (r.success && r.data) { setTier(r.data); setReason(""); }
  };

  const partner = tier?.tier === "Partner";
  return (
    <Dialog title={`Cấp đối tác · ${creator.fullName}`} onClose={onClose}>
      <Notice note={note} />
      {!tier && !note && <p className="sub">Đang tải…</p>}
      {tier && <>
        <div className="kv">
          <div><small>Cấp hiện tại</small><b><Award className="ic" />{partner ? "Nhà sáng tạo đối tác" : "Nhà sáng tạo thường"}</b></div>
          <div><small>Đối tác từ</small><b>{partner ? fmtDay(tier.partnerSince) : "—"}</b></div>
        </div>

        <h4 className="sec-h">Tiến độ {fmtDay(tier.progress.windowStart)} – {fmtDay(tier.progress.windowEnd)}</h4>
        <table className="st-table">
          <tbody>
            {tier.progress.criteria.map((c) => (
              <tr key={c.key}>
                <td>{CRITERIA[c.key] ?? c.key}</td>
                <td>{value(c, c.current)} / {c.key === "no_violation_removals" ? `tối đa ${value(c, c.target)}` : value(c, c.target)}</td>
                <td>{c.met ? <span className="pill ok"><Check className="ic" />Đạt</span> : <span className="pill wait"><X className="ic" />Chưa đạt</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h4 className="sec-h">Lịch sử xét cấp</h4>
        {tier.evaluations.length === 0 ? <p className="sub">Chưa được xét lần nào.</p> : (
          <table className="st-table">
            <thead><tr><th>Tháng</th><th>Kết quả</th><th>Cấp</th></tr></thead>
            <tbody>
              {tier.evaluations.map((e) => (
                <tr key={e.periodMonth}>
                  <td>{month(e.periodMonth)}</td>
                  <td>{e.eligible ? "Đạt cả 4 tiêu chí" : "Chưa đạt"}</td>
                  <td>{e.tierBefore === e.tierAfter ? (e.tierAfter === "Partner" ? "Giữ đối tác" : "Giữ cấp thường") : e.tierAfter === "Partner" ? "Lên đối tác" : "Về cấp thường"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {partner && <>
          <h4 className="sec-h">Thu hồi cấp đối tác</h4>
          <label className="field"><span className="lbl">Lý do (bắt buộc, tối đa 500 ký tự)</span>
            <textarea className="inp" rows={2} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          <div className="row"><button className="btn btn-no" disabled={busy || !reason.trim()} onClick={() => void revoke()}>Thu hồi</button></div>
        </>}
      </>}
    </Dialog>
  );
}
