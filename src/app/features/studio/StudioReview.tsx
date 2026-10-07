"use client";

import { useMemo, useState } from "react";
import { Check, CircleAlert, RefreshCw, Save } from "lucide-react";
import { aiStoryCreationService as api } from "@/app/services/aiStoryCreationService";
import { useStoryReview } from "@/app/features/story-workflow/useStoryReview";
import { hasMissingLearning } from "@/app/features/story-workflow/storyReviewLearning";
import { gradientFor, splitScenes } from "@/app/lib/storyView";
import { useMediaProgress } from "./useStoryPipeline";
import { useRiseIn, useSwap } from "@/app/lib/motion";

type Props = { storyId: number; mediaStage: boolean; onApproved: () => void; onFinish: () => void };

export default function StudioReview({ storyId, mediaStage, onApproved, onFinish }: Props) {
  const r = useStoryReview(storyId);
  const { bundle, busy, error, validation } = r;
  const media = useMediaProgress(mediaStage ? storyId : null);
  const [active, setActive] = useState(0);
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [saved, setSaved] = useState(false);
  const listRef = useRiseIn<HTMLDivElement>("button", [bundle?.summary.storyVersionId, bundle ? 1 : 0], { delay: 40, distance: 10 });
  const textRef = useSwap<HTMLDivElement>(active);
  const sideRef = useRiseIn<HTMLDivElement>(".kv > div, .sec, .voc-i", [bundle ? 1 : 0], { delay: 35, distance: 10 });

  const scenes = useMemo(() => (bundle ? splitScenes(bundle.story.content) : []), [bundle]);
  const text = (i: number) => edits[i] ?? scenes[i] ?? "";
  const dirty = Object.keys(edits).length > 0;

  const save = () => r.run(async (signal) => {
    if (!bundle) return;
    const content = scenes.map((_, i) => text(i)).join("\n\n");
    r.requireData(await api.updateStoryReview(storyId, { versionId: bundle.summary.storyVersionId, title: bundle.story.title, content, lesson: bundle.story.lesson }, signal));
    if (signal.aborted) return;
    setEdits({});
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
    await r.load(signal);
  });

  if (!bundle) {
    return (
      <section className="ws dock" style={{ gridTemplateColumns: "1fr" }}>
        <div className="pane">
          <div className="empty">
            {error
              ? <><CircleAlert style={{ color: "var(--danger)" }} /><b className="display">Không tải được bản thảo</b><span>{error}</span><button className="btn btn-s" onClick={() => void r.refresh()}>Thử lại</button></>
              : <span>Đang tải bản thảo…</span>}
          </div>
        </div>
      </section>
    );
  }

  const { summary, story, vocabulary, quiz, discussion } = bundle;
  const missing = hasMissingLearning(bundle);
  const canEdit = summary.canEdit && !mediaStage;

  return (
    <section className="ws create">
      <div className="pane">
        <div className="ph"><span>Cảnh trong truyện</span><div className="act"><span className="pill ai">{scenes.length} cảnh</span></div></div>
        <div className="pb">
          <div ref={listRef} className="scene-list">
            {scenes.map((_, i) => (
              <button key={i} className={active === i ? "on" : ""} onClick={() => setActive(i)}>
                <b>Cảnh {i + 1}</b><small>{text(i).slice(0, 60)}…</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="center">
        <div className="tools">
          <b style={{ padding: "0 6px" }}>{story.title}</b>
          {canEdit && <button className="btn btn-s" style={{ marginLeft: "auto" }} disabled={!dirty || busy} onClick={() => void save()}><Save className="ic" />{saved ? "Đã lưu ✓" : "Lưu chỉnh sửa"}</button>}
        </div>
        <div className="board">
          <div className="artwrap">
            <div className="artlabel"><span>Cảnh {active + 1} / {scenes.length}</span><em>Bản thảo {summary.storyVersionId}</em></div>
            <div ref={textRef} className="art" style={{ background: gradientFor(storyId + active) }}>
              <div className="cover" style={{ position: "absolute", inset: 0 }} />
              <div className="tbox" style={{ width: "86%", left: "7%" }}>
                <div
                  key={`${bundle.summary.storyVersionId}-${active}`}
                  className="txt"
                  contentEditable={canEdit}
                  suppressContentEditableWarning
                  spellCheck={false}
                  style={{ fontSize: 19, color: "#fff" }}
                  onBlur={(e) => { const v = e.currentTarget.innerText.trim(); if (v !== scenes[active]) setEdits((p) => ({ ...p, [active]: v })); }}
                >{text(active)}</div>
              </div>
            </div>
          </div>
        </div>
        {mediaStage && (
          <div className="media-bar">
            <b>Minh hoạ và giọng đọc</b>
            {media.data ? (
              <>
                <span className="grow">{media.data.isReady ? "Đã sẵn sàng. Bé có thể đọc truyện này." : `Đang tạo… ${media.data.readyIllustrations}/${media.data.requiredIllustrations || media.data.sceneCount} tranh, ${media.data.readyAudio} đoạn giọng đọc`}</span>
                {media.data.errorCode && <span className="pill flag">Lỗi: {media.data.errorCode}</span>}
                {media.data.errorCode && <button className="btn btn-s" onClick={() => void api.retryMedia(storyId).then(media.refresh)}>Thử lại</button>}
              </>
            ) : <span className="grow">{media.error ?? "Đang kiểm tra…"}</span>}
            <button className="btn btn-p" onClick={onFinish}>Xong, về thư viện</button>
          </div>
        )}
      </div>

      <div className="pane">
        <div className="ph"><span>{mediaStage ? "Đã duyệt" : "Duyệt truyện"}</span></div>
        <div ref={sideRef} className="pb">
          <div className="kv">
            <div><small>Từ vựng</small><b>{vocabulary.items.length}</b></div>
            <div><small>Câu hỏi</small><b>{quiz.items.length}</b></div>
            <div><small>Thảo luận</small><b>{discussion.items.length}</b></div>
            <div><small>Độ khó FKGL</small><b>{summary.readabilityFkgl?.toFixed(1) ?? "—"}</b></div>
          </div>
          {validation?.checks.map((c) => (
            <div key={c.name} className="ck"><span className={`st ${c.passed ? "ok" : "warn"}`}>{c.passed ? <Check /> : <CircleAlert />}</span>{c.name}<small>{c.message ?? ""}</small></div>
          ))}
          <div className="sec"><div className="sec-h">Bài học</div><p className="sub" style={{ fontSize: 12.5 }}>{story.lesson || "—"}</p></div>
          {vocabulary.items.length > 0 && <div className="sec"><div className="sec-h">Từ vựng</div>{vocabulary.items.map((v) => <div key={v.term} className="voc-i"><b>{v.term}</b><span>{v.definition}</span></div>)}</div>}
          {discussion.items.length > 0 && <div className="sec"><div className="sec-h">Gợi ý thảo luận</div>{discussion.items.map((d, i) => <p key={d.id ?? i} className="sub" style={{ fontSize: 12.5 }}>{d.question}</p>)}</div>}
          {error && <div className="notice err" role="alert">{error}</div>}
          {!mediaStage && (
            <div className="sec">
              {missing && <button className="btn btn-s btn-c" disabled={busy || !summary.canEdit} onClick={() => void r.generateMissingLearning()}><RefreshCw className="ic" />Tạo học liệu còn thiếu</button>}
              <button className="btn btn-ok btn-c" disabled={busy || dirty || !summary.canApprove || missing} onClick={() => void r.approve(onApproved)}><Check className="ic" />Duyệt và tạo minh hoạ</button>
              {dirty && <p className="sub">Hãy lưu chỉnh sửa trước khi duyệt.</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
