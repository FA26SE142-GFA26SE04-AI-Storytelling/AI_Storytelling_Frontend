"use client";

import { useCallback, useState } from "react";
import { Trash2 } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import IconButton from "@/app/components/IconButton";
import { confirmDialog } from "@/app/lib/confirm";
import { showToast } from "@/app/lib/toast";
import { parentReadingFeedbackService } from "@/app/services/childReadingService";
import type { ParentReadAloudRecording } from "@/app/types/childReading";
import { usePopupData } from "./learningData";

const tagOf = (r: ParentReadAloudRecording) =>
  r.kind === "Practice" ? "Luyện đọc" : r.sceneIndex != null ? `Trang ${r.sceneIndex + 1}` : "Đoạn truyện";

/** Thân nội dung "Nghe bé đọc": tự tải dữ liệu và quản lý bản ghi. */
export function ReadAloudBody({ childId, sessionId, onRemoved }: {
  childId: number;
  sessionId: number;
  onRemoved: () => void;
}) {
  const noop = useCallback(() => {}, []);
  const load = useCallback((signal: AbortSignal) => parentReadingFeedbackService.readAloud(childId, sessionId, signal), [childId, sessionId]);
  const { data, setData, refresh } = usePopupData(load, noop);
  const [busy, setBusy] = useState(false);

  const remove = async (rec: ParentReadAloudRecording) => {
    if (busy || !(await confirmDialog(`Xoá bản ghi bé đọc “${tagOf(rec)}”? Bản ghi sẽ bị xoá và không khôi phục được.`))) return;
    setBusy(true);
    const r = await parentReadingFeedbackService.removeReadAloud(childId, sessionId, rec.recordingId);
    setBusy(false);
    showToast(r.success ? r.message || "Đã xoá bản ghi bé đọc." : r.message, r.success ? "ok" : "err");
    if (!r.success) return;
    setData((d) => d && { ...d, recordings: d.recordings.filter((x) => x.recordingId !== rec.recordingId) });
    onRemoved();
  };

  return data == null ? (
    <p className="sub">Đang tải…</p>
  ) : data.recordings.length === 0 ? (
    <p className="sub">Chưa có bản ghi nào.</p>
  ) : (
    <ul className="lr-recs">
      {data.recordings.map((rec) => {
        const tag = tagOf(rec);
        const p = Math.round(rec.goodPercent);
        return (
          <li key={rec.recordingId} className={rec.kind === "Practice" ? "is-practice" : undefined}>
            <div className="lr-rec-h">
              <span className={`pill ${rec.kind === "Practice" ? "gold-pill" : "draft"}`}>{tag}</span>
              <span className={`pill ${p >= 80 ? "ok" : p >= 50 ? "wait" : "flag"}`}>{p}% đọc tốt</span>
              {rec.retryCount > 0 && <span className="pill wait">{rec.retryCount} chữ cần đọc lại</span>}
              {rec.skippedCount > 0 && <span className="pill draft">{rec.skippedCount} chữ bỏ qua</span>}
              <span className="grow" />
              <IconButton icon={Trash2} label={`Xoá bản ghi ${tag}`} disabled={busy} onClick={() => void remove(rec)} />
            </div>
            <p className="lr-rec-text">{rec.text}</p>
            <audio controls preload="none" src={rec.audioUrl} onError={refresh} aria-label={`Nghe bé đọc ${tag}`} />
          </li>
        );
      })}
    </ul>
  );
}

/** Popup "Nghe bé đọc": lần đọc gần nhất của từng đoạn, kèm chữ, điểm và nút xoá. */
export default function ReadAloudDialog({ childId, sessionId, title, onClose, onRemoved }: {
  childId: number;
  sessionId: number;
  title: string;
  onClose: () => void;
  onRemoved: () => void;
}) {
  return (
    <Dialog title={"Nghe bé đọc · " + title} onClose={onClose} wide>
      <ReadAloudBody childId={childId} sessionId={sessionId} onRemoved={onRemoved} />
    </Dialog>
  );
}
