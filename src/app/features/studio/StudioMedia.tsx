"use client";

import { useMemo, useState } from "react";
import { Check, CircleAlert, Image as ImageIcon, Images, Volume2 } from "lucide-react";
import AsidePane from "@/app/components/shell/AsidePane";
import { aiStoryCreationService as api } from "@/app/services/aiStoryCreationService";
import { useStoryReview } from "@/app/features/story-workflow/useStoryReview";
import { splitScenes } from "@/app/lib/storyView";
import { useStudioMediaPreview } from '@/app/features/story-workflow/useStudioMediaPreview';
import { isReadingOnly } from "@/app/lib/storyRules";
import type { useMediaProgress } from "./useStoryPipeline";
import { useRiseIn } from "@/app/lib/motion";
import MediaAssets from './MediaAssets';
import StudioScenePreview from './StudioScenePreview';
import StudioCompletion from './StudioCompletion';
import MediaIssues from './MediaIssues';

type Props = { storyId: number; ageBand:string; media: ReturnType<typeof useMediaProgress>; onFinish: () => void };

/**
 * Sau khi duyệt (Phase 5): xem lại từng cảnh trong lúc hệ thống vẽ tranh và tạo giọng đọc.
 * Luôn trả về đủ hai khung (vùng xem truyện + cột phải), kể cả lúc đang tải, để khung viền không đổi kích thước giữa các state.
 */
export default function StudioMedia({ storyId, ageBand, media, onFinish }: Props) {
  const r = useStoryReview(storyId);
  const { bundle, error } = r;
  const [active, setActive] = useState(0);
  const sideRef = useRiseIn<HTMLDivElement>(".kv > div, .ck, .scene-list button", [bundle ? 1 : 0], { delay: 35, distance: 10 });
  const m = media.data;
  const preview=useStudioMediaPreview(storyId,bundle?.summary.storyVersionId??m?.approvedStoryVersionId??null,m);
  const mediaScenes=useMemo(()=>preview.pack?.scenes.slice().sort((a,b)=>a.sceneIndex-b.sceneIndex)??[],[preview.pack]);
  const scenes=useMemo(()=>mediaScenes.length?mediaScenes.map(s=>s.text??''):(bundle?splitScenes(bundle.story.content):[]),[mediaScenes,bundle]);
  const sceneIndex=Math.min(active,Math.max(0,scenes.length-1));
  const currentScene=mediaScenes[sceneIndex];
  const reload=()=>{preview.refresh();media.refresh();};
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
              <div className="artlabel"><span>Cảnh {sceneIndex + 1} / {scenes.length}</span><em>{preview.pack?'Bản media từ backend':'Đang tải bản media'}</em></div>
              {preview.error&&<p className="notice err" role="alert">{preview.error}</p>}
              <StudioScenePreview key={`${storyId}:${preview.pack?.storyVersionId}:${preview.pack?.packageRevision}:${currentScene?.sceneId}:${sceneIndex}:${currentScene?.illustrations.map(i=>i.url).join('|')}`} scene={currentScene} text={scenes[sceneIndex]??''} loading={preview.loading} onReload={reload}/>
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
          <span className="grow">{m ? (m.isReady ? "Đã xác nhận media. Bạn có thể giao truyện vào lộ trình của bé." : m.isAwaitingConfirmation ? "Xem tranh, nghe giọng đọc rồi xác nhận để hoàn tất truyện." : "Đang tạo, bạn có thể rời màn hình này.") : media.error ?? "Đang kiểm tra…"}</span>
          {m?.errorCode && <button className="btn btn-s" onClick={() => void api.retryMedia(storyId).then(media.refresh)}>Thử lại</button>}
          <button className="btn btn-s" onClick={onFinish}>Về thư viện</button>
          {bundle&&<StudioCompletion pack={preview.pack} progress={m} story={{storyId,title:bundle.story.title,ageBand,length:bundle.story.content.trim()?bundle.story.content.trim().split(/\s+/u).length:0}} onChanged={reload}/>}
        </div>
      </div>

      <AsidePane title="Chuẩn bị cho bé" icon={Images} bodyRef={sideRef}>
          <MediaAssets key={storyId} storyId={storyId} versionId={m?.approvedStoryVersionId} onChanged={reload}/>
          <div className="sec">
            {step(true, "Đã duyệt nội dung", "", Check)}
            {step(!!m && total > 0 && m.readyIllustrations >= total, "Tranh minh hoạ", m ? `${m.readyIllustrations}/${total}` : "…", ImageIcon)}
            {step(!!m?.isGenerated, "Giọng đọc", m ? `${m.readyAudio} đoạn` : "…", Volume2)}
            {step(!!m?.isConfirmed, m?.isConfirmed ? "Đã xác nhận gói media" : "Chờ xác nhận gói media", "", Check)}
            <MediaIssues progress={m} pack={preview.pack} onSelectScene={(id, index) => {
              const position = mediaScenes.findIndex(s => s.sceneId === id);
              if (position >= 0) setActive(position);
              else if (index >= 0 && index < scenes.length) setActive(index);
            }}/>
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
                <button key={mediaScenes[i]?.sceneId??i} className={sceneIndex === i ? "on" : ""} onClick={() => setActive(i)}>
                  <b>Cảnh {i + 1}{m?.issues?.some(issue => issue.sceneIndex === (mediaScenes[i]?.sceneIndex ?? i)) ? ' · Cần kiểm tra' : ''}</b><small>{s.slice(0, 60)}…</small>
                </button>
              ))}
            </div>
          </div>
      </AsidePane>
    </>
  );
}
