"use client";

import "./review.css";
import { useState } from "react";
import { Archive, Check, CircleAlert, RefreshCw } from "lucide-react";
import { aiStoryCreationService as api } from "@/app/services/aiStoryCreationService";
import { useStoryReview } from "@/app/features/story-workflow/useStoryReview";
import { hasMissingLearning } from "@/app/features/story-workflow/storyReviewLearning";
import { useWorkspaceData } from "@/app/context/WorkspaceDataContext";
import Frog from "@/app/components/brand/Frog";
import { ageLabel } from "@/app/lib/storyView";
import type { WorkspaceId } from "@/app/components/shell/nav";
import { useRiseIn, usePop, useSwap } from "@/app/lib/motion";

function ReviewDetail({ storyId, onDone }: { storyId: number; onDone: (msg: string) => void }) {
  const r = useStoryReview(storyId);
  const sheetRef = useSwap<HTMLDivElement>(storyId);
  const sideRef = useRiseIn<HTMLDivElement>(".ck, .sec, .kv", [r.bundle?.summary.storyVersionId]);
  const { bundle, busy, error, validation, proposal } = r;

  const archive = () => r.run(async (signal) => {
    const res = r.requireData(await api.archiveStory(storyId, { reason: "Lưu trữ từ Taletale" }, signal));
    if (!signal.aborted && res.success) onDone("Đã lưu trữ truyện");
  });

  if (!bundle) {
    return (
      <>
        <div className="review-doc"><div className="empty">{error ? <><CircleAlert style={{ color: "var(--danger)" }} /><b className="display">Không tải được bản thảo</b><span>{error}</span><button className="btn btn-s" onClick={() => void r.refresh()}>Thử lại</button></> : <span>Đang tải bản thảo…</span>}</div></div>
        <div className="pane" />
      </>
    );
  }

  const { summary, story, vocabulary, quiz, discussion } = bundle;
  const missing = hasMissingLearning(bundle);
  const rows = [
    { label: "Từ vựng", n: vocabulary.items.length },
    { label: "Câu hỏi đọc hiểu", n: quiz.items.length },
    { label: "Gợi ý thảo luận", n: discussion.items.length },
  ];

  return (
    <>
      <div className="review-doc">
        <article ref={sheetRef as React.RefObject<HTMLElement>} className="sheet">
          <span className="pill ai">Do AI tạo</span>
          <h2 className="display">{story.title}</h2>
          <p className="sub">Bài học: {story.lesson || "—"}{summary.readabilityFkgl !== null && ` · Độ khó FKGL ${summary.readabilityFkgl.toFixed(1)}`}</p>
          {story.content.split(/\n+/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
          {vocabulary.items.length > 0 && (
            <>
              <h3 className="display" style={{ marginTop: 24 }}>Từ vựng</h3>
              {vocabulary.items.map((v) => <p key={v.term} style={{ margin: "4px 0", fontSize: 14 }}><b>{v.term}</b>: {v.definition}</p>)}
            </>
          )}
          {quiz.items.length > 0 && (
            <>
              <h3 className="display" style={{ marginTop: 24 }}>Câu hỏi đọc hiểu</h3>
              {quiz.items.map((q, i) => <p key={q.id ?? i} style={{ margin: "4px 0", fontSize: 14 }}>{i + 1}. {q.question}{q.correctAnswer && <span className="sub"> (Đáp án: {q.correctAnswer})</span>}</p>)}
            </>
          )}
        </article>
      </div>

      <div className="pane">
        <div className="ph"><span>Kiểm duyệt</span></div>
        <div ref={sideRef} className="pb">
          <div>
            {rows.map((c) => (
              <div key={c.label} className="ck">
                <span className={`st ${c.n > 0 ? "ok" : "warn"}`}>{c.n > 0 ? <Check /> : <CircleAlert />}</span>{c.label}<small>{c.n > 0 ? `${c.n} mục` : "Chưa có"}</small>
              </div>
            ))}
            {validation?.checks.map((c) => (
              <div key={c.name} className="ck"><span className={`st ${c.passed ? "ok" : "warn"}`}>{c.passed ? <Check /> : <CircleAlert />}</span>{c.name}<small>{c.message ?? ""}</small></div>
            ))}
          </div>
          {error && <div className="notice err" role="alert">{error}</div>}
          {proposal && <div className="notice ok">Có đề xuất chỉnh sửa từ AI đang chờ xử lý.</div>}
          <div className="sec">
            <div className="sec-h">Quyết định</div>
            {missing && <button className="btn btn-s btn-c" disabled={busy || !summary.canEdit} onClick={() => void r.generateMissingLearning()}><RefreshCw className="ic" />Tạo học liệu còn thiếu</button>}
            <button className="btn btn-ok btn-c" disabled={busy || !summary.canApprove || missing} onClick={() => void r.approve(() => onDone("Đã duyệt, hệ thống đang tạo minh hoạ và giọng đọc"))}><Check className="ic" />Duyệt truyện</button>
            <div className="row">
              <button className="btn btn-no grow btn-c" disabled={busy || !summary.canArchive} onClick={() => void archive()}><Archive className="ic" />Lưu trữ</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ReviewWorkspace({ go }: { go: (id: WorkspaceId) => void }) {
  const { reviewQueue, reload, storiesLoading } = useWorkspaceData();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const queueRef = useRiseIn<HTMLDivElement>(".queue-item", [reviewQueue.length]);
  const toastRef = usePop<HTMLDivElement>(toast);
  const active = reviewQueue.find((s) => s.id === activeId) ?? reviewQueue[0];

  const done = (msg: string) => {
    setToast(msg);
    setActiveId(null);
    void reload();
    setTimeout(() => setToast(""), 3200);
  };

  return (
    <section className="ws dock" style={{ gridTemplateColumns: "270px 1fr 290px" }}>
      <div className="pane">
        <div className="ph"><span>Hàng chờ duyệt</span><div className="act"><span className="pill wait">{reviewQueue.length} truyện</span></div></div>
        <div ref={queueRef} className="pb" style={{ gap: 7 }}>
          {reviewQueue.map((s) => (
            <button key={s.id} className={`queue-item${active?.id === s.id ? " on" : ""}`} onClick={() => setActiveId(s.id)}>
              <span className="cover-sm" style={{ background: s.gradient }} />
              <span><b>{s.title}</b><small>{s.by} · {ageLabel(s.ageBand)}</small></span>
            </button>
          ))}
          {!storiesLoading && reviewQueue.length === 0 && <p className="sub">Không có truyện nào đang chờ duyệt.</p>}
        </div>
      </div>

      {active ? <ReviewDetail key={active.id} storyId={active.id} onDone={done} /> : (
        <>
          <div className="review-doc">
            <div className="done-state">
              <Frog size={110} mood="happy" />
              <b className="display">Đã xử lý hết hàng chờ</b>
              <span>Truyện mới sẽ xuất hiện ở đây khi AI viết xong và chờ bạn duyệt.</span>
              <button className="btn btn-s" onClick={() => go("studio")}>Tạo truyện mới</button>
            </div>
          </div>
          <div className="pane" />
        </>
      )}
      {toast && <div ref={toastRef} className="toast" role="status">{toast}</div>}
    </section>
  );
}
