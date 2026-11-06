"use client";
import { useTabActions } from "@/app/features/story-workflow/tabActions";

import { useMemo, useRef, useState } from "react";
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
import { audioBranchDisplay, mediaBranchError, mediaPackageDisplay } from '@/app/features/story-workflow/studioMediaState';

type Props = { storyId: number; childId: number; ageBand:string; media: ReturnType<typeof useMediaProgress>; onFinish: () => void };

/**
 * Sau khi duyệt (Phase 5): xem lại từng cảnh trong lúc hệ thống vẽ tranh và tạo giọng đọc.
 * Luôn trả về đủ hai khung (vùng xem truyện + cột phải), kể cả lúc đang tải, để khung viền không đổi kích thước giữa các state.
 */
export default function StudioMedia({ storyId, childId, ageBand, media, onFinish }: Props) {
  const r = useStoryReview(storyId);
  const { bundle, error } = r;
  const [active, setActive] = useState(0);
  const [retryBusy,setRetryBusy]=useState(false);
  const [retryNote,setRetryNote]=useState('');
  const retryLock=useRef(false);
  const sideRef = useRiseIn<HTMLDivElement>(".kv > div, .ck, .scene-list button", [bundle ? 1 : 0], { delay: 35, distance: 10 });
  const m = media.data;
  const display=mediaPackageDisplay(m);
  const audio=audioBranchDisplay(m);
  const preview=useStudioMediaPreview(storyId,bundle?.summary.storyVersionId??m?.approvedStoryVersionId??null,m);
  const mediaScenes=useMemo(()=>preview.pack?.scenes.slice().sort((a,b)=>a.sceneIndex-b.sceneIndex)??[],[preview.pack]);
  const scenes=useMemo(()=>mediaScenes.length?mediaScenes.map(s=>s.text??''):(bundle?splitScenes(bundle.story.content):[]),[mediaScenes,bundle]);
  const sceneIndex=Math.min(active,Math.max(0,scenes.length-1));
  const currentScene=mediaScenes[sceneIndex];
  const reload=()=>{preview.refresh();media.refresh();};
  const retry=async()=>{
    if(retryLock.current)return;
    retryLock.current=true;setRetryBusy(true);setRetryNote('');
    try {
      const response=await api.retryMedia(storyId);
      setRetryNote(response.success?'Đã yêu cầu thử lại các mục chưa hoàn tất.':response.message||'Chưa gửi được yêu cầu. Hãy tải lại trạng thái trước khi thử tiếp.');
      reload();
    } finally {retryLock.current=false;setRetryBusy(false);}
  };
  const total = m ? m.requiredIllustrations || m.sceneCount : 0;
  const count = (n: number | undefined) => (bundle && n !== undefined ? n : "…");
  const step = (done: boolean, label: string, detail: string, Icon: typeof Check) => (
    <div className="ck"><span className={`st ${done ? "ok" : "warn"}`}>{done ? <Check /> : <Icon />}</span>{label}<small>{detail}</small></div>
  );

  const tabActions = useTabActions();
  return (
    <>
      <div className="center">
        {bundle ? (
          <div className="board">
            <div className="artwrap">
              <div className="artlabel"><span>Cảnh {sceneIndex + 1} / {scenes.length}</span><em>{preview.pack?'Bản media từ backend':'Đang tải bản media'}</em></div>
              {preview.error&&<p className="notice err" role="alert">{preview.error}</p>}
              <StudioScenePreview key={`${storyId}:${preview.pack?.storyVersionId}:${preview.pack?.packageRevision}:${currentScene?.sceneId}:${sceneIndex}:${currentScene?.illustrations.map(i=>i.url).join('|')}:${currentScene?.audio?.map(a=>a.url).join('|')}`} scene={currentScene} text={scenes[sceneIndex]??''} loading={preview.loading} onReload={reload}/>
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
          <span className="grow" role="status">{display.label}</span>
          {display.kind==='failed' && m?.jobStatus==='Failed' && <button className="btn btn-s" disabled={retryBusy} onClick={()=>void retry()}>{retryBusy?'Đang gửi…':'Thử lại media chưa hoàn tất'}</button>}
          {(media.timedOut||media.error)&&<p className="notice warn" role="status">{media.timedOut?'Chưa nhận được kết quả cuối cùng. Việc tạo media có thể vẫn đang chạy.':media.error}<button className="btn btn-s" onClick={reload}>Tiếp tục theo dõi</button></p>}
          {retryNote&&<p className="notice" role="status">{retryNote}</p>}
          <button className="btn btn-s" onClick={onFinish}>Về thư viện</button>
          {tabActions && <div className="tab-actions">{tabActions}</div>}
          {bundle&&<StudioCompletion childId={childId} pack={preview.loading?null:preview.pack} progress={m} story={{storyId,title:bundle.story.title,ageBand,length:bundle.story.content.trim()?bundle.story.content.trim().split(/\s+/u).length:0}} onChanged={reload}/>}
        </div>
      </div>

      <AsidePane title="Chuẩn bị cho bé" icon={Images} bodyRef={sideRef}>
          <MediaAssets key={storyId} storyId={storyId} versionId={m?.approvedStoryVersionId} onChanged={reload} showConfirmation={false}/>
          <div className="sec">
            {step(true, "Đã duyệt nội dung", "", Check)}
            {step(!!m && total > 0 && m.readyIllustrations >= total, "Tranh minh hoạ", m ? `${m.readyIllustrations}/${total}` : "…", ImageIcon)}
            {step(audio.done, audio.label, audio.detail, Volume2)}
            {audio.errorCode&&<p className="notice warn" role="status">Giọng đọc: {audio.errorCode}{audio.nextRetryAt&&` · Thử lại lúc ${new Date(audio.nextRetryAt).toLocaleString('vi-VN')}`}</p>}
            {step(display.kind==='ready', display.label, "", Check)}
            {display.kind==='failed'&&mediaBranchError(m)&&<p className="notice err" role="alert">Mã lỗi: {mediaBranchError(m)}</p>}
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
                <div><small>Tương tác lúc nghe</small><b>{count(bundle?.listening?.items.length)}</b></div>
              </>
            )}
            <div><small>Bài học</small><b style={{ fontSize: "var(--fs-xs)" }}>{bundle ? bundle.story.lesson || "—" : "…"}</b></div>
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
