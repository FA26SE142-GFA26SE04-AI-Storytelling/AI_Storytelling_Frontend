"use client";

import "@/app/features/review/review-tools.css";
import { useState } from "react";
import { Flag, X } from "lucide-react";
import { guardianService } from "@/app/services/guardianService";

import type { ReportReason } from "@/app/types/progress";
import type { StoryCard } from "@/app/lib/storyView";
import { FREE_TEXT_MAX } from "@/app/lib/storyRules";

function Shell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="dlg-backdrop" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dlg">
        <div className="row"><b className="display grow" style={{ fontSize: "var(--fs-lg)" }}>{title}</b><button className="btn btn-g" aria-label="Đóng" onClick={onClose}><X className="ic" /></button></div>
        {children}
      </div>
    </div>
  );
}

const REASONS: { id: ReportReason; label: string }[] = [
  { id: "safety_concern", label: "Không an toàn cho trẻ" },
  { id: "inappropriate", label: "Nội dung không phù hợp" },
  { id: "wrong_age_band", label: "Không hợp lứa tuổi" },
  { id: "copyright", label: "Vi phạm bản quyền" },
  { id: "cultural", label: "Không phù hợp văn hoá" },
  { id: "other", label: "Lý do khác" },
];

/** Luồng 4 Bước 4.6 — báo cáo truyện có vấn đề; không tự lưu trữ, chuyển tới hàng đợi kiểm duyệt. */
export function ReportDialog({ story, onClose, onDone }: { story: StoryCard; onClose: () => void; onDone: (msg: string) => void }) {
  const [reason, setReason] = useState<ReportReason>("safety_concern");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true);
    const r = await guardianService.reportStory(story.id, reason, desc);
    setBusy(false);
    if (r.success) onDone(r.message || "Đã gửi báo cáo."); else setErr(r.message);
  };
  return (
    <Shell title={`Báo cáo “${story.title}”`} onClose={onClose}>
      <p className="sub">Kiểm duyệt viên của nền tảng sẽ xem xét. Báo cáo không tự ẩn truyện; nếu là truyện riêng của bé, bạn có thể tự lưu trữ ngay.</p>
      <div className="sec" style={{ gap: 6 }}>
        {REASONS.map((x) => (
          <label key={x.id} className={`opt${reason === x.id ? " on" : ""}`}>
            <input type="radio" name="reason" checked={reason === x.id} onChange={() => setReason(x.id)} /><span><b>{x.label}</b></span>
          </label>
        ))}
      </div>
      <textarea className="inp" rows={3} maxLength={FREE_TEXT_MAX * 2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Mô tả thêm (không bắt buộc)" aria-label="Mô tả" />
      {err && <div className="notice err" role="alert">{err}</div>}
      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button className="btn btn-g" onClick={onClose}><X className="ic" />Hủy</button>
        <button className="btn btn-no" disabled={busy} onClick={() => void submit()}><Flag className="ic" />Gửi báo cáo</button>
      </div>
    </Shell>
  );
}
