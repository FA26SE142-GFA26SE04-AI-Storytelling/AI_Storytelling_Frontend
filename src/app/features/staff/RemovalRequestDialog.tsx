"use client";

import { useState } from "react";
import { Undo2 } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import { confirmDialog } from "@/app/lib/confirm";
import { showToast } from "@/app/lib/toast";
import { creatorPublicationService } from "@/app/services/creatorPublicationService";

/**
 * Popup Creator yêu cầu gỡ một truyện đã công khai để chỉnh sửa (ví dụ đổi ảnh bìa). Moderator sẽ xem xét việc gỡ.
 * Nút gửi chỉ hiện khi đã nhập lý do.
 */
export default function RemovalRequestDialog({ storyId, title, onClose, onDone }: {
  storyId: number;
  title: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const ok = reason.trim().length > 0;

  const submit = async () => {
    if (!ok || busy) return;
    if (!(await confirmDialog("Gửi yêu cầu gỡ truyện? Moderator sẽ xem xét việc gỡ truyện khỏi thư viện công khai."))) return;
    setBusy(true);
    const r = await creatorPublicationService.remove(storyId, reason.trim());
    setBusy(false);
    if (!r.success) { showToast(r.message || "Không yêu cầu gỡ được truyện.", "err"); return; }
    showToast("Đã gửi yêu cầu gỡ truyện.");
    onDone(); onClose();
  };

  return (
    <Dialog title="Yêu cầu gỡ truyện" onClose={onClose}>
      <form className="edit-story" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
        <p className="sub">Truyện “{title || "chưa đặt tên"}” đang công khai nên không chỉnh sửa trực tiếp được. Sau khi được gỡ, bạn có thể sửa rồi gửi duyệt lại.</p>
        <label className="lbl" htmlFor="rm-reason">Lý do yêu cầu gỡ</label>
        <textarea id="rm-reason" className="inp" rows={4} maxLength={2000} autoFocus value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="row edit-story-actions">
          <button type="button" className="btn btn-s" onClick={onClose}>Hủy</button>
          {ok && <button type="submit" className="btn btn-p" disabled={busy}><Undo2 className="ic" />{busy ? "Đang gửi…" : "Gửi yêu cầu"}</button>}
        </div>
      </form>
    </Dialog>
  );
}
