"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, MessageCircleHeart, Trash2 } from "lucide-react";
import IconButton from "@/app/components/IconButton";
import SafeImage from "@/app/components/SafeImage";
import Frog from "@/app/components/brand/Frog";
import { confirmDialog } from "@/app/lib/confirm";
import { showToast } from "@/app/lib/toast";
import { parentStorySummaryService } from "@/app/services/childReadingService";
import type { ChildProfile } from "@/app/types/childProfile";
import type { ParentReadingFeedbackItem, ParentSummaryItem } from "@/app/types/childReading";
import { FEELING_FACE, shortDate, useReadingFeedback, useStorySummaries } from "./learningData";

const PAGE = 10;

/** Nút trang trước / trang sau dùng chung cho hai danh sách. */
function Pager({ page, totalPages, hasPrev, hasNext, onPage }: { page: number; totalPages: number; hasPrev: boolean; hasNext: boolean; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="lr-pager">
      <IconButton icon={ChevronLeft} label="Trang trước" disabled={!hasPrev} onClick={() => onPage(page - 1)} />
      <span>{page}/{totalPages}</span>
      <IconButton icon={ChevronRight} label="Trang sau" disabled={!hasNext} onClick={() => onPage(page + 1)} />
    </div>
  );
}

/** Nhãn điểm câu đố: "Không có câu đố", "Chưa làm" hoặc phần trăm tốt nhất. */
export function quizPill(i: ParentReadingFeedbackItem) {
  if (i.quizTotalQuestions === 0) return null;
  if (i.quizBestPercent == null) return <span className="pill draft">Chưa làm câu đố</span>;
  const p = Math.round(i.quizBestPercent);
  return <span className={`pill ${p >= 80 ? "ok" : p >= 50 ? "wait" : "flag"}`}>Câu đố {p}%</span>;
}

export function feelingPill(i: ParentReadingFeedbackItem) {
  return i.feeling ? <span className="pill draft">{FEELING_FACE[i.feeling] ?? ""} {i.feelingLabel ?? i.feeling}</span> : null;
}

/** Một truyện bé đã đọc xong; mở ra để xem câu bé trả lời ở các điểm dừng. */
function ResultCard({ item }: { item: ParentReadingFeedbackItem }) {
  const [open, setOpen] = useState(false);
  const answers = item.conversationAnswers ?? [];
  return (
    <li className="lr-result">
      <div className="lr-result-h">
        <b className="grow">{item.title}</b>
        {feelingPill(item)}
        {quizPill(item)}
        <span className="pill draft">{shortDate(item.completedAt)}</span>
      </div>
      {answers.length > 0 && (
        <>
          <button className="btn btn-g lr-more" aria-expanded={open} onClick={() => setOpen(!open)}>
            <MessageCircleHeart className="ic" />Bé trả lời ({answers.length})
            <ChevronDown className="ic" style={{ transform: open ? "rotate(180deg)" : undefined }} />
          </button>
          {open && (
            <ul className="lr-answers">
              {answers.map((a, i) => (
                <li key={i}>
                  <span className="lr-q">{a.sceneIndex != null && <span className="pill draft">Cảnh {a.sceneIndex + 1}</span>}{a.question}</span>
                  <b className="lr-a">“{a.answerText}”</b>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </li>
  );
}

/** Phần bé kể lại cuối truyện: nghe lại bản ghi âm, xem các cảnh bé còn thắc mắc, xoá khi cần. */
function SummaryCard({ s, nickname, busy, onRemove }: { s: ParentSummaryItem; nickname: string; busy: boolean; onRemove: () => void }) {
  return (
    <li className="lr-result">
      <div className="lr-result-h">
        <b className="grow">{s.title}</b>
        <span className="pill draft">{shortDate(s.createdAt)}</span>
        <IconButton icon={Trash2} label={`Xoá phần kể lại về ${s.title}`} disabled={busy} onClick={onRemove} />
      </div>
      {s.recordingUrl && <audio controls preload="none" src={s.recordingUrl} aria-label={`Nghe ${nickname} kể lại ${s.title}`} />}
      {s.flags.length > 0 && (
        <ul className="lr-flags" aria-label="Chỗ bé còn thắc mắc">
          {s.flags.map((f) => (
            <li key={f.sceneId}>
              <SafeImage src={f.illustrationUrl} alt="" />
              <span><span className="pill wait">Cảnh {f.sceneIndex + 1}</span> {f.sceneText}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/** Tab "Kết quả đọc": truyện bé đã đọc xong và phần bé kể lại. */
export default function ResultsTab({ child }: { child: ChildProfile }) {
  const [page, setPage] = useState(1);
  const [sPage, setSPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const feedback = useReadingFeedback(child.id, page, PAGE);
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

  return (
    <>
      <section className="lr-card">
        <div className="lr-card-h"><h3 className="display">Truyện đã đọc xong</h3>{fb && <span className="pill ok">{fb.totalCount}</span>}</div>
        {!fb ? <p className="sub">{feedback.error ? "" : "Đang tải…"}</p>
          : fb.items.length === 0 ? (
            <div className="lr-empty"><Frog size={72} mood="think" /><b>{child.nickname} chưa đọc xong truyện nào</b></div>
          ) : (
            <ul className="lr-list">{fb.items.map((i) => <ResultCard key={i.sessionId} item={i} />)}</ul>
          )}
        {fb && <Pager page={fb.pageIndex} totalPages={fb.totalPages} hasPrev={fb.hasPreviousPage} hasNext={fb.hasNextPage} onPage={setPage} />}
      </section>

      <section className="lr-card">
        <div className="lr-card-h"><h3 className="display">{child.nickname} kể lại</h3>{sm && <span className="pill ok">{sm.totalCount}</span>}</div>
        {!sm ? <p className="sub">{summaries.error ? "" : "Đang tải…"}</p>
          : sm.items.length === 0 ? (
            <div className="lr-empty"><Frog size={72} mood="think" /><b>Chưa có phần kể lại nào</b></div>
          ) : (
            <ul className="lr-list">{sm.items.map((s) => <SummaryCard key={s.summaryId} s={s} nickname={child.nickname} busy={busy} onRemove={() => void remove(s)} />)}</ul>
          )}
        {sm && <Pager page={sm.pageIndex} totalPages={sm.totalPages} hasPrev={sm.hasPreviousPage} hasNext={sm.hasNextPage} onPage={setSPage} />}
      </section>
    </>
  );
}
