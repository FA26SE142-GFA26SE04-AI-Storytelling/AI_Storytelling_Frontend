"use client";

import { useState } from "react";
import { MessageSquareQuote, Mic } from "lucide-react";
import { confirmDialog } from "@/app/lib/confirm";
import { showToast } from "@/app/lib/toast";
import { parentStorySummaryService } from "@/app/services/childReadingService";
import type { ParentReadingFeedbackItem } from "@/app/types/childReading";
import { SummaryCard, useStorySummary } from "./SummaryPart";

export function SessionRetell({
  childId,
  item,
  nickname,
}: {
  childId: number;
  item: ParentReadingFeedbackItem;
  nickname: string;
}) {
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);

  const retell = item.retell;
  const { summary, loading } = useStorySummary(childId, retell?.summaryId);

  if (!retell || removed) return null;

  if (loading) {
    return <p className="sub">Đang tải phần kể lại…</p>;
  }

  if (!summary) {
    return (
      <div className="lr-sum-part">
        <b className="lr-sum-h">
          <MessageSquareQuote className="ic" aria-hidden />
          Kể lại
        </b>
        {retell.hasRecording ? (
          <span className="pill ok">Có ghi âm</span>
        ) : (
          <span className="pill draft">Chưa ghi âm</span>
        )}
        {retell.flagCount > 0 && (
          <span className="pill draft">{retell.flagCount} câu hỏi</span>
        )}
        {retell.unansweredCount > 0 && (
          <span className="pill wait">{retell.unansweredCount} chưa trả lời</span>
        )}
      </div>
    );
  }

  const remove = async () => {
    if (
      busy ||
      !(await confirmDialog(
        `Xoá phần ${nickname} kể lại về “${summary.title}”? Bản ghi âm sẽ bị xoá và không khôi phục được.`
      ))
    ) {
      return;
    }
    setBusy(true);
    const r = await parentStorySummaryService.remove(childId, summary.summaryId);
    setBusy(false);
    showToast(r.success ? r.message || "Đã xoá phần kể lại." : r.message, r.success ? "ok" : "err");
    if (r.success) setRemoved(true);
  };

  return (
    <div className="lr-sum-part">
      <b className="lr-sum-h">
        <Mic className="ic" aria-hidden />
        Bé kể lại
      </b>
      <ul className="lr-list">
        <SummaryCard
          s={summary}
          childId={childId}
          nickname={nickname}
          busy={busy}
          onRemove={remove}
        />
      </ul>
    </div>
  );
}

export default SessionRetell;
