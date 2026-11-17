"use client";

import { useEffect, useState } from "react";
import { CheckCheck, ChevronDown, CircleHelp, Mic, Trash2, Undo2 } from "lucide-react";
import IconButton from "@/app/components/IconButton";
import Pager from "@/app/components/Pager";
import SafeImage from "@/app/components/SafeImage";
import Frog from "@/app/components/brand/Frog";
import { confirmDialog } from "@/app/lib/confirm";
import { showToast } from "@/app/lib/toast";
import { parentStorySummaryService } from "@/app/services/childReadingService";
import type { ChildProfile } from "@/app/types/childProfile";
import type { ParentSummaryFlag, ParentSummaryItem, ReadingFeedbackFilter } from "@/app/types/childReading";
import { shortDate, useReadingFeedback, useStorySummaries } from "./learningData";
import ReadingFilters from "./ReadingFilters";
import ReadingOverview from "./ReadingOverview";
import ResultCard from "./ResultCard";

const PAGE = 10;

/** Một câu bé hỏi về một tranh: tranh, câu gõ/ghi âm, chữ của tranh rút gọn 2 dòng; câu chưa trả lời có viền vàng. */
function QuestionRow({ f, answeredAt, nickname, busy, onToggle }: { f: ParentSummaryFlag; answeredAt: string | null; nickname: string; busy: boolean; onToggle: () => void }) {
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
function SummaryCard({ s, childId, nickname, busy, onRemove }: { s: ParentSummaryItem; childId: number; nickname: string; busy: boolean; onRemove: () => void }) {
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

/** Tab "Kết quả đọc": truyện bé đã đọc xong và phần bé kể lại. */
export default function ResultsTab({ child }: { child: ChildProfile }) {
  const [filter, setFilter] = useState<ReadingFeedbackFilter>({ status: "Completed", range: "all" });
  const [page, setPage] = useState(1);
  const [sPage, setSPage] = useState(1);
  const [busy, setBusy] = useState(false);

  const changeFilter = (v: ReadingFeedbackFilter) => {
    setFilter(v);
    setPage(1);
  };

  const feedback = useReadingFeedback(child.id, page, PAGE, filter);
  const summaries = useStorySummaries(child.id, sPage, PAGE);

  useEffect(() => { if (feedback.error) showToast(feedback.error, "err"); }, [feedback.error]);
  useEffect(() => { if (summaries.error) showToast(summaries.error, "err"); }, [summaries.error]);

  const remove = async (s: ParentSummaryItem) => {
    if (busy || !(await confirmDialog(`Xoá phần ${child.nickname} kể lại về “${s.title}”? Bản ghi âm sẽ bị xoá và không khôi phục được.`))) return;
    setBusy(true);
    const r = await parentStorySummaryService.remove(child.id, s.summaryId);
    setBusy(false);
    showToast(r.success ? r.message || "Đã xoá phần kể lại." : r.message, r.success ? "ok" : "err");
    if (r.success) summaries.reload();
  };

  const fb = feedback.data;
  const sm = summaries.data;

  const emptyText =
    (filter.status === "Completed"
      ? `${child.nickname} chưa đọc xong truyện nào`
      : "Không có truyện nào đang đọc dở") +
    (filter.range !== "all" ? " trong khoảng này" : "");

  return (
    <>
      <ReadingFilters value={filter} onChange={changeFilter} />
      <ReadingOverview childId={child.id} range={filter.range} />

      <section className="lr-card">
        <div className="lr-card-h">
          <h3 className="display">
            {filter.status === "Completed" ? "Truyện đã đọc xong" : "Truyện chưa đọc xong"}
          </h3>
          {fb && <span className="pill ok">{fb.totalCount}</span>}
        </div>
        {!fb ? (
          <p className="sub">{feedback.error ? "" : "Đang tải…"}</p>
        ) : fb.items.length === 0 ? (
          <div className="lr-empty">
            <Frog size={72} mood="think" />
            <b>{emptyText}</b>
          </div>
        ) : (
          <div className={feedback.loading ? "lr-fade" : undefined}>
            <ul className="lr-list">
              {fb.items.map((i) => (
                <ResultCard key={i.sessionId} item={i} childId={child.id} />
              ))}
            </ul>
          </div>
        )}
        {fb && <Pager page={fb.pageIndex} totalPages={fb.totalPages} hasPrev={fb.hasPreviousPage} hasNext={fb.hasNextPage} onPage={setPage} />}
      </section>

      <section className="lr-card">
        <div className="lr-card-h"><h3 className="display">{child.nickname} kể lại</h3>{sm && <span className="pill ok">{sm.totalCount}</span>}</div>
        {!sm ? <p className="sub">{summaries.error ? "" : "Đang tải…"}</p>
          : sm.items.length === 0 ? (
            <div className="lr-empty"><Frog size={72} mood="think" /><b>Chưa có phần kể lại nào</b></div>
          ) : (
            <ul className="lr-list">{sm.items.map((s) => <SummaryCard key={s.summaryId} s={s} childId={child.id} nickname={child.nickname} busy={busy} onRemove={() => void remove(s)} />)}</ul>
          )}
        {sm && <Pager page={sm.pageIndex} totalPages={sm.totalPages} hasPrev={sm.hasPreviousPage} hasNext={sm.hasNextPage} onPage={setSPage} />}
      </section>
    </>
  );
}
