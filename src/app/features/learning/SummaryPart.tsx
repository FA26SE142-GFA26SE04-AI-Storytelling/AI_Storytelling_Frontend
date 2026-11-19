"use client";

import { useEffect, useState } from "react";
import { CheckCheck, ChevronDown, CircleHelp, Mic, Trash2, Undo2 } from "lucide-react";
import IconButton from "@/app/components/IconButton";
import SafeImage from "@/app/components/SafeImage";
import { showToast } from "@/app/lib/toast";
import { parentStorySummaryService } from "@/app/services/childReadingService";
import type { ParentSummaryFlag, ParentSummaryItem } from "@/app/types/childReading";
import { shortDate } from "./learningData";

/** Một câu bé hỏi về một tranh: tranh, câu gõ/ghi âm, chữ của tranh rút gọn 2 dòng; câu chưa trả lời có viền vàng. */
export function QuestionRow({ f, answeredAt, nickname, busy, onToggle }: { f: ParentSummaryFlag; answeredAt: string | null; nickname: string; busy: boolean; onToggle: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <li className={answeredAt ? undefined : "is-open"}>
      <SafeImage src={f.illustrationUrl} alt={`Tranh cảnh ${f.sceneIndex + 1}`} />
      <div className="lr-flag-body">
        <span className={`pill ${answeredAt ? "ok" : "wait"}`}>Cảnh {f.sceneIndex + 1}</span>
        {f.questionText && <b className="lr-flag-q">“{f.questionText}”</b>}
        {f.questionAudioUrl && <audio controls preload="none" src={f.questionAudioUrl} aria-label={`Nghe ${nickname} hỏi về cảnh ${f.sceneIndex + 1}`} />}
        <p className={`lr-flag-text${open ? " open" : ""}`}>{f.pictureText || f.sceneText}</p>
        <button type="button" className="btn btn-g lr-flag-more" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? "Thu gọn" : "Xem cả đoạn"}<ChevronDown className="ic" aria-hidden />
        </button>
      </div>
      <IconButton icon={answeredAt ? Undo2 : CheckCheck} className={`btn ${answeredAt ? "btn-s" : "btn-ok"}`} disabled={busy} onClick={onToggle}
        label={answeredAt ? "Bỏ đánh dấu đã trả lời" : "Đánh dấu đã trả lời"} />
    </li>
  );
}

/** Phần bé kể lại cuối truyện: nghe lại bản ghi âm, xem và đánh dấu đã trả lời các câu bé hỏi, xoá khi cần. */
export function SummaryCard({ s, childId, nickname, busy, onRemove }: { s: ParentSummaryItem; childId: number; nickname: string; busy: boolean; onRemove: () => void }) {
  // Cập nhật tại chỗ sau khi đánh dấu, không tải lại cả danh sách.
  const [over, setOver] = useState<Record<number, string | null>>({});
  const [saving, setSaving] = useState(false);
  const at = (f: ParentSummaryFlag) => (f.questionId in over ? over[f.questionId] : f.answeredAt);
  const unanswered = s.flags.filter((f) => !at(f)).length;
  const toggle = async (f: ParentSummaryFlag) => {
    setSaving(true);
    const r = await parentStorySummaryService.answered(childId, s.summaryId, f.questionId, !at(f));
    setSaving(false);
    if (r.success && r.data) setOver((v) => ({ ...v, [f.questionId]: r.data!.answeredAt }));
    showToast(r.message || (r.success ? "Đã cập nhật câu hỏi." : "Không cập nhật được câu hỏi."), r.success ? "ok" : "err");
  };
  return (
    <li className="lr-result">
      <div className="lr-result-h">
        <b className="grow">{s.title}</b>
        <span className="pill draft">{shortDate(s.createdAt)}</span>
        <IconButton icon={Trash2} label={`Xoá phần kể lại về ${s.title}`} disabled={busy} onClick={onRemove} />
      </div>
      <div className="lr-sum-part">
        <b className="lr-sum-h"><Mic className="ic" aria-hidden />Bản ghi âm</b>
        {s.recordingUrl
          ? <audio controls preload="none" src={s.recordingUrl} aria-label={`Nghe ${nickname} kể lại ${s.title}`} />
          : <p className="sub">{nickname} chưa ghi âm phần kể lại.</p>}
      </div>
      {s.flags.length > 0 && (
        <div className="lr-sum-part">
          <b className="lr-sum-h"><CircleHelp className="ic" aria-hidden />{nickname} hỏi bố mẹ{unanswered > 0 && <span className="pill wait">{unanswered} chưa trả lời</span>}</b>
          <ul className="lr-flags">
            {s.flags.map((f) => <QuestionRow key={f.questionId} f={f} answeredAt={at(f)} nickname={nickname} busy={saving} onToggle={() => void toggle(f)} />)}
          </ul>
        </div>
      )}
    </li>
  );
}

// shortcut: chưa có API lấy 1 phần kể lại theo id, phải dò danh sách; có API thì đổi.
export function useStorySummary(childId: number, summaryId: number | null | undefined): { summary: ParentSummaryItem | null; loading: boolean } {
  const [summary, setSummary] = useState<ParentSummaryItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (summaryId == null) {
      setSummary(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const run = async () => {
      let page = 1;
      let found: ParentSummaryItem | null = null;
      try {
        while (!controller.signal.aborted) {
          const r = await parentStorySummaryService.list(childId, page, 50, controller.signal);
          if (controller.signal.aborted) return;
          if (!r.success || !r.data) {
            break;
          }
          const item = r.data.items.find((it) => it.summaryId === summaryId);
          if (item) {
            found = item;
            break;
          }
          if (!r.data.hasNextPage) {
            break;
          }
          page += 1;
        }
        if (!controller.signal.aborted) {
          setSummary(found);
          setLoading(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSummary(null);
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      controller.abort();
    };
  }, [childId, summaryId]);

  return { summary, loading };
}
