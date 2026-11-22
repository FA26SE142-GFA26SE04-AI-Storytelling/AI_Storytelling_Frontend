"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import { showToast } from "@/app/lib/toast";
import { storyRatingService } from "@/app/services/storyRatingService";
import {
  RATING_REPORT_NOTE_MAX,
  type StoryRatingReportReason,
} from "@/app/types/storyRating";

const REASONS: { value: StoryRatingReportReason; label: string }[] = [
  { value: "Offensive", label: "Xúc phạm, thô tục" },
  { value: "Spam", label: "Quảng cáo, spam" },
  { value: "PersonalInfo", label: "Lộ thông tin cá nhân" },
  { value: "Irrelevant", label: "Không liên quan đến truyện" },
  { value: "Other", label: "Lý do khác" },
];

export default function RatingReportDialog({
  ratingId,
  onClose,
}: {
  ratingId: number;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<StoryRatingReportReason | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || submitting) return;
    setSubmitting(true);
    try {
      const r = await storyRatingService.report(ratingId, {
        reason,
        note: note.trim() || null,
      });
      if (r.success) {
        showToast("Đã gửi báo cáo. Kiểm duyệt viên sẽ xem xét.", "ok");
        onClose();
      } else {
        showToast(r.message, "err");
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Đã có lỗi xảy ra.", "err");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog title="Báo cáo bình luận" onClose={onClose}>
      <form onSubmit={handleSubmit} className="stack srd-report-stack">
        <div className="srd-block srd-report-form srd-reasons">
          {REASONS.map((item) => (
            <label
              key={item.value}
              className="srd-reason"
            >
              <input
                type="radio"
                name="ratingReportReason"
                value={item.value}
                checked={reason === item.value}
                onChange={() => setReason(item.value)}
                disabled={submitting}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>

        <div className="srd-field">
          <textarea
            maxLength={RATING_REPORT_NOTE_MAX}
            placeholder="Ghi chú thêm (không bắt buộc)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={submitting}
            rows={3}
            className="srd-textarea"
          />
          <div className="srd-counter">
            {note.length}/{RATING_REPORT_NOTE_MAX}
          </div>
        </div>

        <div className="row srd-actions">
          <button
            type="submit"
            className="btn btn-p"
            disabled={!reason || submitting}
          >
            <Send className="ic" />
            <span>Gửi báo cáo</span>
          </button>
        </div>
      </form>
    </Dialog>
  );
}
