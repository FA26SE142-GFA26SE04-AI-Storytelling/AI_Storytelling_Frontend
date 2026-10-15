"use client";

import { useCallback, useEffect, useState } from "react";
import { LockOpen } from "lucide-react";
import { guardianService } from "@/app/services/guardianService";
import type { ChildProfile } from "@/app/types/childProfile";
import type { InterventionCase } from "@/app/types/progress";
import type { MyRole } from "@/app/features/children/useMyRole";
import { fmtDateTime } from "@/app/lib/guardian";
import { FREE_TEXT_MAX } from "@/app/lib/storyRules";

/**
 * Luồng 4 Bước 4.5 — Hold Mode: thư viện của bé tạm khoá khi đọc hiểu liên tục dưới ngưỡng.
 * Mở khoá tự động khi bé đọc lại đạt ngưỡng; người có quyền mở khoá thủ công làm dự phòng.
 */
export default function HoldPanel({ child, role, onChanged, compact }: { child: ChildProfile; role: MyRole | null; onChanged?: () => void; compact?: boolean }) {
  const [hold, setHold] = useState<InterventionCase | null>(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await guardianService.holdCase(child.id);
    setHold(r.data ?? null);
    setNotes(r.data?.skillGapNotes ?? "");
  }, [child.id]);
  useEffect(() => { void load(); }, [load]);

  if (!hold || !role?.can("ViewProgress")) return null;
  const active = hold.status === "hold_mode";
  // Ca đã mở khoá chỉ hiện khi vừa mở trong 7 ngày, để bố mẹ bổ sung ghi chú.
  if (!active && (!hold.resolvedAt || Date.now() - Date.parse(hold.resolvedAt) > 7 * 86_400_000)) return null;
  const canUnlock = role.can("AssignActivity");
  const canNote = role.can("ViewResults");

  const unlock = async () => {
    setBusy(true);
    const r = await guardianService.unlockHold(child.id, hold.id, notes);
    setBusy(false);
    setMsg(r.success ? "Đã mở khoá thư viện." : r.message);
    await load();
    onChanged?.();
  };
  const saveNotes = async () => {
    setBusy(true);
    const r = await guardianService.addHoldNotes(child.id, hold.id, notes);
    setBusy(false);
    setMsg(r.success ? "Đã lưu ghi chú." : r.message);
  };

  return (
    <div className={`hold-panel${active ? " active" : ""}`}>
      {active ? (
        <>
          <b className="display">Thư viện của {child.nickname} đang tạm khoá</b>
          <span>{child.nickname} gặp khó ở câu đố vài truyện gần đây. Bé đọc lại “{hold.triggeringStoryTitle ?? "truyện vừa đọc"}” và trả lời đạt ngưỡng thì thư viện tự mở. Bé vẫn đọc tiếp truyện đang dở.</span>
          {!compact && <small>Bắt đầu {fmtDateTime(hold.heldAt)} · bé đã đọc lại {hold.retakesInLast24h}/3 lượt trong 24 giờ qua</small>}
          {hold.needsAttention && <span className="warn">Bé đã hết lượt đọc lại hoặc đã tạm khoá quá 7 ngày. Bạn có thể đọc cùng con rồi mở khoá.</span>}
        </>
      ) : (
        <>
          <b className="display">Thư viện của {child.nickname} đã mở lại</b>
          <span>{hold.resolutionType === "auto_retake_pass" ? "Bé đã đọc lại và trả lời đạt ngưỡng." : "Đã được mở khoá thủ công."} {fmtDateTime(hold.resolvedAt)}</span>
        </>
      )}
      {!compact && (active ? canUnlock : canNote) && (
        <>
          <textarea className="inp" rows={2} maxLength={FREE_TEXT_MAX * 2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Bố mẹ đã cùng con làm gì? (không bắt buộc) — VD: đã đọc lại cùng con, giải thích từ khó" aria-label="Ghi chú của bố mẹ" />
          <div className="row">
            {active
              ? <button className="btn btn-p" disabled={busy} onClick={() => void unlock()}><LockOpen className="ic" />Mở khoá thư viện</button>
              : <button className="btn btn-s" disabled={busy || notes === (hold.skillGapNotes ?? "")} onClick={() => void saveNotes()}>Lưu ghi chú</button>}
            {msg && <span className="sub">{msg}</span>}
          </div>
        </>
      )}
    </div>
  );
}
