"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, CircleAlert, Image as ImageIcon, Images, RefreshCw, Volume2 } from "lucide-react";
import AsidePane from "@/app/components/shell/AsidePane";
import { aiStoryCreationService as api } from "@/app/services/aiStoryCreationService";
import { useStoryReview } from "@/app/features/story-workflow/useStoryReview";
import { splitScenes } from "@/app/lib/storyView";
import { useStudioMediaPreview } from '@/app/features/story-workflow/useStudioMediaPreview';
import { isReadingOnly } from "@/app/lib/storyRules";
import type { useMediaProgress } from "./useStoryPipeline";
import { useRiseIn } from "@/app/lib/motion";
import { useMediaPackage } from '@/app/features/story-workflow/useMediaPackage';
import StudioScenePreview from './StudioScenePreview';
import { mediaCanRetry, mediaIsGenerating } from '@/app/features/story-workflow/mediaPackage';
import StudioCompletion from './StudioCompletion';
import MediaIssues from './MediaIssues';

type Props = { storyId: number; media: ReturnType<typeof useMediaProgress> };

/**
 * Sau khi duyệt (Phase 5): xem lại từng cảnh trong lúc hệ thống vẽ tranh và tạo giọng đọc.
 * Luôn trả về đủ hai khung (vùng xem truyện + cột phải), kể cả lúc đang tải, để khung viền không đổi kích thước giữa các state.
 */
export default function StudioMedia({ storyId, media }: Props) {
  const r = useStoryReview(storyId);
  const { bundle, error } = r;
  const [active, setActive] = useState(0);
  const sideRef = useRiseIn<HTMLDivElement>(".prep-stat, .ck, .prep-scene", [bundle ? 1 : 0], { delay: 35, distance: 10 });
  const m = media.data;
  const preview=useStudioMediaPreview(storyId,bundle?.summary.storyVersionId??m?.approvedStoryVersionId??null,m);
  const mediaScenes=useMemo(()=>preview.pack?.scenes.slice().sort((a,b)=>a.sceneIndex-b.sceneIndex)??[],[preview.pack]);
  const scenes=useMemo(()=>mediaScenes.length?mediaScenes.map(s=>s.text??''):(bundle?splitScenes(bundle.story.content):[]),[mediaScenes,bundle]);
  const sceneIndex=Math.min(active,Math.max(0,scenes.length-1));
  const currentScene=mediaScenes[sceneIndex];
  const reload=()=>{preview.refresh();media.refresh();};
  const mp=useMediaPackage({storyId,versionId:m?.approvedStoryVersionId,onChanged:reload,source:preview.pack});
  // Truyện đã sẵn sàng (gói media đã xác nhận) thì không hiện nút tạo lại nữa: gói đã chốt, muốn đổi phải làm lại từ bước duyệt.
  const sceneActions=preview.pack&&!m?.isConfirmed&&!m?.isReady?{busy:mp.busy,locked:mp.uncertain,replacements:preview.pack.replacements??[],regenerate:(k:'illustration'|'audio',id:number)=>void mp.regenerate(k,id),keepCurrent:(id:number)=>void mp.keepCurrent(id)}:undefined;
  const statusText=m ? (m.isReady ? "" : m.isAwaitingConfirmation ? "Xem tranh, nghe giọng đọc rồi xác nhận để hoàn tất truyện." : mediaCanRetry(m) ? "" : "Đang tạo, bạn có thể rời màn hình này.") : media.error ?? "Đang kiểm tra…";
  // Tải sẵn tranh và giọng đọc của cảnh đang xem và cảnh kế để đổi cảnh không phải chờ.
  const warm=useRef<(HTMLImageElement|HTMLAudioElement)[]>([]);
  useEffect(()=>{
    const items:(HTMLImageElement|HTMLAudioElement)[]=[];
    for(const scene of [mediaScenes[sceneIndex],mediaScenes[sceneIndex+1]]){
      if(!scene)continue;
      for(const x of scene.illustrations){if(x.status==='Ready'&&x.url){const im=new Image();im.src=x.url;items.push(im);}}
      const au=scene.audio?.find(a=>a.status==='Ready'&&a.url);
      if(au?.url){const el=new Audio();el.preload='auto';el.src=au.url;items.push(el);}
    }
    warm.current=items;
  },[mediaScenes,sceneIndex]);
  const total = m ? m.requiredIllustrations || m.sceneCount : 0;
  const count = (n: number | undefined) => (bundle && n !== undefined ? n : "…");
  const step = (done: boolean, label: string, detail: string, Icon: typeof Check) => (
    <div className="ck"><span className={`st ${done ? "ok" : "warn"}`}>{done ? <Check /> : <Icon />}</span>{label}<small>{detail}</small></div>
  );

  return (
    <>
      <div className="center">
        {m && mediaCanRetry(m) && <button className="btn btn-p studio-retry-corner" onClick={() => void api.retryMedia(storyId).then(media.refresh)}><RefreshCw className="ic" />Thử lại</button>}
        {bundle ? (
          <div className="board">
            <div className="artwrap">
              {preview.error&&<p className="notice err" role="alert">{preview.error}</p>}
              <StudioScenePreview key={`${storyId}:${preview.pack?.storyVersionId}:${preview.pack?.packageRevision}:${currentScene?.sceneId}:${sceneIndex}:${currentScene?.illustrations.map(i=>i.url).join('|')}`} scene={currentScene} text={scenes[sceneIndex]??''} loading={preview.loading} onReload={reload} actions={sceneActions} generating={!!m && mediaIsGenerating(m)}/>
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
      </div>

      <AsidePane title="Chuẩn bị cho bé" icon={Images} bodyRef={sideRef}>
          <div className="studio-actions">
            {statusText&&<p role="status">{statusText}</p>}
            {mp.note&&<p className="notice" role="status">{mp.note}</p>}
            {mp.uncertain&&<p className="notice warn" role="status">Chưa rõ kết quả thao tác. Hãy tải lại ảnh và giọng đọc rồi mới thử lại.</p>}
            {bundle&&<StudioCompletion pack={preview.pack} progress={m} onChanged={reload}/>}
          </div>
          <section className="prep-group" aria-label="Tiến độ">
            <div className="sec-h"><span>Tiến độ</span></div>
            <div className="prep-list">
              {step(true, "Đã duyệt nội dung", "", Check)}
              {step(!!m && total > 0 && m.readyIllustrations >= total, "Tranh minh hoạ", m ? `${m.readyIllustrations}/${total}` : "…", ImageIcon)}
              {step(!!m?.isGenerated, "Giọng đọc", m ? `${m.readyAudio} đoạn` : "…", Volume2)}
              {step(!!m?.isConfirmed, m?.isConfirmed ? "Đã xác nhận gói media" : "Chờ xác nhận gói media", "", Check)}
            </div>
            <MediaIssues progress={m} pack={preview.pack} onSelectScene={(id, index) => {
              const position = mediaScenes.findIndex(s => s.sceneId === id);
              if (position >= 0) setActive(position);
              else if (index >= 0 && index < scenes.length) setActive(index);
            }}/>
          </section>
          <section className="prep-group" aria-label="Nội dung">
            <div className="sec-h"><span>Nội dung</span></div>
            <div className="prep-stats">
              {bundle && isReadingOnly(bundle.summary.outputMode) ? (
                <div className="prep-stat wide"><small>Kiểu truyện</small><b>Chỉ để đọc</b></div>
              ) : (
                <>
                  <div className="prep-stat"><small>Từ vựng</small><b>{count(bundle?.vocabulary.items.length)}</b></div>
                  <div className="prep-stat"><small>Câu hỏi</small><b>{count(bundle?.quiz.items.length)}</b></div>
                </>
              )}
              <div className="prep-stat wide"><small>Bài học</small><p>{bundle ? bundle.story.lesson || "—" : "…"}</p></div>
            </div>
          </section>
          <section className="prep-group" aria-label="Cảnh trong truyện">
            <div className="sec-h"><span>Cảnh trong truyện</span><span className="pill ai">{bundle ? `${scenes.length} cảnh` : "…"}</span></div>
            <div className="prep-scenes">
              {scenes.map((s, i) => {
                const flagged = m?.issues?.some(issue => issue.sceneIndex === (mediaScenes[i]?.sceneIndex ?? i));
                return (
                  <button key={mediaScenes[i]?.sceneId??i} className={`prep-scene${sceneIndex === i ? " on" : ""}`} aria-pressed={sceneIndex === i} aria-label={`Cảnh ${i + 1}${flagged ? ", cần kiểm tra" : ""}`} onClick={() => setActive(i)}>
                    <span className="num">{i + 1}</span>
                    <span className="txt">{s}</span>
                    {flagged && <CircleAlert className="flag" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </section>
      </AsidePane>
    </>
  );
}
