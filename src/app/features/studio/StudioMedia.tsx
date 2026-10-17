"use client";

import { useMemo, useState } from "react";
import { Check, CircleAlert, Image as ImageIcon, Images, Volume2 } from "lucide-react";
import AsidePane from "@/app/components/shell/AsidePane";
import { aiStoryCreationService as api } from "@/app/services/aiStoryCreationService";
import { useStoryReview } from "@/app/features/story-workflow/useStoryReview";
import { gradientFor, splitScenes } from "@/app/lib/storyView";
import { isReadingOnly } from "@/app/lib/storyRules";
import type { useMediaProgress } from "./useStoryPipeline";
import { useRiseIn, useSwap } from "@/app/lib/motion";

type Props = { storyId: number; media: ReturnType<typeof useMediaProgress>; onFinish: () => void };

/**
 * Sau khi duyệt (Phase 5): xem lại từng cảnh trong lúc hệ thống vẽ tranh và tạo giọng đọc.
 * Luôn trả về đủ hai khung (vùng xem truyện + cột phải), kể cả lúc đang tải, để khung viền không đổi kích thước giữa các state.
 */
export default function StudioMedia({ storyId, media, onFinish }: Props) {
  const r = useStoryReview(storyId);
  const { bundle, error } = r;
  const [active, setActive] = useState(0);
  const textRef = useSwap<HTMLDivElement>(active);
  const sideRef = useRiseIn<HTMLDivElement>(".kv > div, .ck, .scene-list button", [bundle ? 1 : 0], { delay: 35, distance: 10 });
  const scenes = useMemo(() => (bundle ? splitScenes(bundle.story.content) : []), [bundle]);

  const m = media.data;
  const total = m ? m.requiredIllustrations || m.sceneCount : 0;
  const count = (n: number | undefined) => (bundle && n !== undefined ? n : "…");
  const step = (done: boolean, label: string, detail: string, Icon: typeof Check) => (
    <div className="ck"><span className={`st ${done ? "ok" : "warn"}`}>{done ? <Check /> : <Icon />}</span>{label}<small>{detail}</small></div>
  );

  return (
    <>
      <div className="center">
        <div className="tools">
          <b style={{ padding: "0 6px" }}>{bundle?.story.title ?? ""}</b>
          <span className="pill ok" style={{ marginLeft: "auto" }}>Đã duyệt</span>
        </div>
        {bundle ? (
          <div className="board">
            <div className="artwrap">
              <div className="artlabel"><span>Cảnh {active + 1} / {scenes.length}</span><em>Bé sẽ thấy bản này</em></div>
              <div ref={textRef} className="art" style={{ background: gradientFor(storyId + active) }}>
                <div className="cover" style={{ position: "absolute", inset: 0 }} />
                <div className="tbox" style={{ width: "86%", left: "7%", outline: "none", cursor: "default" }}>
                  <div className="txt" style={{ fontSize: 19, color: "#fff" }}>{scenes[active]}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="board">
            <div className="empty">
              {error
                ? <><CircleAlert style={{ color: "var(--danger)" }} /><b className="display">Không tải được truyện</b><span>{error}</span><button className="btn btn-s" onClick={() => void r.refresh()}>Thử lại</button></>
                : <span>Đang tải truyện…</span>}
            </div>
          </div>
        )}
        <div className="media-bar">
          <b>Minh hoạ và giọng đọc</b>
          <span className="grow">{m ? (m.isReady ? "Đã sẵn sàng. Bé có thể đọc truyện này." : "Đang tạo, bạn có thể rời màn hình này.") : media.error ?? "Đang kiểm tra…"}</span>
          {m?.errorCode && <button className="btn btn-s" onClick={() => void api.retryMedia(storyId).then(media.refresh)}>Thử lại</button>}
          <button className="btn btn-p" onClick={onFinish}>Xong, về thư viện</button>
        </div>
      </div>

      <AsidePane title="Chuẩn bị cho bé" icon={Images} bodyRef={sideRef}>
          <div className="sec">
            {step(true, "Đã duyệt nội dung", "", Check)}
            {step(!!m && total > 0 && m.readyIllustrations >= total, "Tranh minh hoạ", m ? `${m.readyIllustrations}/${total}` : "…", ImageIcon)}
            {step(!!m?.isReady, "Giọng đọc", m ? `${m.readyAudio} đoạn` : "…", Volume2)}
            {m?.errorCode && <div className="notice err" role="alert">Có lỗi khi tạo media ({m.errorCode}). Bạn có thể thử lại.</div>}
          </div>
          <div className="kv">
            {bundle && isReadingOnly(bundle.summary.outputMode) ? (
              <div><small>Kiểu truyện</small><b>Chỉ để đọc</b></div>
            ) : (
              <>
                <div><small>Từ vựng</small><b>{count(bundle?.vocabulary.items.length)}</b></div>
                <div><small>Câu hỏi</small><b>{count(bundle?.quiz.items.length)}</b></div>
                <div><small>Thảo luận</small><b>{count(bundle?.discussion.items.length)}</b></div>
              </>
            )}
            <div><small>Bài học</small><b style={{ fontSize: 12 }}>{bundle ? bundle.story.lesson || "—" : "…"}</b></div>
          </div>
          <div className="sec">
            <div className="sec-h"><span>Cảnh trong truyện</span><span className="pill ai">{bundle ? `${scenes.length} cảnh` : "…"}</span></div>
            <div className="scene-list">
              {scenes.map((s, i) => (
                <button key={i} className={active === i ? "on" : ""} onClick={() => setActive(i)}>
                  <b>Cảnh {i + 1}</b><small>{s.slice(0, 60)}…</small>
                </button>
              ))}
            </div>
          </div>
      </AsidePane>
    </>
  );
}
