'use client';
import { useState } from 'react';
import { AudioLines, ImagePlus, RefreshCw, Undo2 } from 'lucide-react';
import IconButton from '@/app/components/IconButton';
import Frog from '@/app/components/brand/Frog';
import type { StoryMediaPackage } from '@/app/types/aiStory';
import { mediaItemStopped } from '@/app/features/story-workflow/mediaIssues';
type Scene=StoryMediaPackage['scenes'][number];
/** Thao tác tạo lại / giữ bản cũ lấy từ useMediaPackage; không truyền thì không hiện nút. */
export type SceneMediaActions={busy:boolean;locked:boolean;replacements:NonNullable<StoryMediaPackage['replacements']>;regenerate:(kind:'illustration'|'audio',assetId:number)=>void;keepCurrent:(candidateAssetId:number)=>void};

/** `generating`: hệ thống đang vẽ tranh / tạo giọng đọc; chỗ chưa có tranh hoặc giọng thì con ếch ngồi chờ thay vì báo "chưa có". */
export default function StudioScenePreview({scene,text,loading,onReload,actions,generating=false}:{scene:Scene|undefined;text:string;loading:boolean;onReload:()=>void;actions?:SceneMediaActions;generating?:boolean}) {
  const [selected,setSelected]=useState(0);
  const [failed,setFailed]=useState<string|null>(null);
  /** Ảnh đã tải xong; chưa khớp ảnh đang chọn thì hiện vòng tải, ảnh ẩn đi để không lộ ảnh cũ. */
  const [loadedUrl,setLoadedUrl]=useState<string|null>(null);
  const [audioFailed,setAudioFailed]=useState(false);
  const [audioReload,setAudioReload]=useState(0);
  const illustrations=scene?.illustrations.slice().sort((a,b)=>a.beatOrder-b.beatOrder)??[];
  const image=illustrations[selected];
  const url=image?.status==='Ready'?image.url:null;
  /** Tranh đang xem đã dừng (hỏng / chờ kiểm tra): không còn "đang vẽ" dù các mục khác của gói vẫn đang chạy. */
  const imageStopped=!url&&mediaItemStopped(image?.status);
  // Backend chỉ nhận tạo lại khi không còn việc tạo media nào đang chạy cho truyện (MEDIA_JOB_ACTIVE).
  const canChange=!!actions&&!actions.busy&&!actions.locked&&!generating;
  const regenLabel=(what:string)=>generating?`Có thể tạo lại ${what} sau khi hệ thống tạo xong các mục còn lại`:`Tạo lại ${what} bằng AI`;
  // Nút tải lại chỉ cần khi có sự cố (ảnh/tiếng không mở được hoặc chưa có ảnh); mọi thứ đang xem được bình thường thì ẩn đi.
  const needReload=audioFailed||(!url&&!generating)||failed===url;
  const failedReplacements=actions?.replacements.filter(r=>['Failed','ManualReview'].includes(r.status))??[];
  return <div className="studio-scene">
    <div className="art studio-media-art">
      <div className="studio-media-frame">
      {url&&failed!==url ?
        // Signed storage URLs support arbitrary authorized storage hosts.
        // eslint-disable-next-line @next/next/no-img-element
        <img key={url} className={`studio-media-image${loadedUrl===url?'':' loading'}`} src={url} ref={el=>{if(el?.complete&&el.naturalWidth>0)setLoadedUrl(url);}} onLoad={()=>setLoadedUrl(url)} alt={`Tranh ${selected+1} của cảnh ${(scene?.sceneIndex??0)+1}`} onError={()=>setFailed(url)}/>
        : imageStopped ?<div className="studio-media-wait" role="alert"><Frog size={132} mood="think"/><b className="display">Chưa vẽ được tranh này</b><p className="notice err" data-inline-notice>{generating?'Có thể thử lại sau khi hệ thống tạo xong các mục còn lại.':'Bấm "Thử lại" để AI vẽ lại tranh này.'}</p></div>
        : generating&&!url ? <div className="studio-media-wait" role="status" aria-label="Đang vẽ tranh"><Frog size={132} mood="think"/><b className="display">Đang vẽ tranh…</b></div>
        : <p className="studio-media-placeholder" role="status">{loading?'Đang tải tranh và giọng đọc…':failed===url&&url?'Không mở được ảnh. URL có thể hết hạn hoặc máy chủ lưu trữ đang lỗi.':image?.status==='Ready'?'Ảnh đã được tạo nhưng gói media chưa có URL xem.':'Chưa có ảnh sẵn sàng để hiển thị cho cảnh này.'}</p>}
      {/* Backend chỉ tạo lại mục đã Ready (MEDIA_NOT_IN_CURRENT_VERSION); mục hỏng đi qua nút "Thử lại". */}
      {actions&&image?.status==='Ready'&&<IconButton icon={ImagePlus} label={regenLabel('tranh này')} className="btn btn-s studio-media-regen" disabled={!canChange} onClick={()=>actions.regenerate('illustration',image.beatId)}/>}
      {url&&failed!==url&&loadedUrl!==url&&<div className="studio-media-loading" role="status" aria-label="Đang tải tranh"><span className="studio-media-spin" aria-hidden="true"/></div>}
      </div>
    </div>
    {/* Cột phải: chữ của cảnh ở trên, nút chọn tranh và nghe giọng đọc ở dưới. */}
    <div className="studio-scene-side">
    <div className="studio-media-text">{text}</div>
    <div className="studio-scene-controls">
      {illustrations.length>1&&<div className="row" aria-label="Chọn tranh trong cảnh">{illustrations.map((i,index)=><button className="btn btn-s" key={i.beatId} aria-pressed={index===selected} onClick={()=>{setSelected(index);setFailed(null);}}>Tranh {index+1}</button>)}</div>}
      {scene?.audio?.slice().sort((a,b)=>a.segmentOrder-b.segmentOrder).map(a=><div className="row studio-audio-row" key={a.segmentId}>
        {a.url&&a.status==='Ready'?<audio key={`${a.url}:${audioReload}`} controls preload="none" src={a.url} aria-label={`Nghe cảnh ${(scene?.sceneIndex??0)+1}, đoạn ${a.segmentOrder+1}`} onError={()=>setAudioFailed(true)}/>:mediaItemStopped(a.status)?<p className="notice err" data-inline-notice role="alert">Chưa tạo được giọng đọc đoạn này.</p>
          :generating&&a.status!=='Ready'?<div className="studio-audio-wait" role="status" aria-label="Đang tạo giọng đọc"><Frog size={48} mood="think"/><b>Đang tạo giọng đọc…</b></div>:<p className={a.status==='Ready'?'notice err':'sub'} role="status">{a.status==='Ready'?'Giọng đọc đã tạo nhưng chưa có URL nghe.':'Đoạn giọng đọc này chưa sẵn sàng.'}</p>}
        {actions&&a.status==='Ready'&&<IconButton icon={AudioLines} label={regenLabel('giọng đọc đoạn này')} disabled={!canChange} onClick={()=>actions.regenerate('audio',a.segmentId)}/>}
      </div>)}
      {scene&&!scene.audio?.length&&(generating
        ?<div className="studio-audio-wait" role="status" aria-label="Đang tạo giọng đọc"><Frog size={48} mood="think"/><b>Đang tạo giọng đọc…</b></div>
        :<p className="sub">Gói media chưa có giọng đọc cho cảnh này.</p>)}
      {audioFailed&&<p className="notice err" role="alert">Không mở được giọng đọc. Hãy tải lại URL media và thử nghe lại.</p>}
      {failedReplacements.map(r=><div className="notice warn" data-inline-notice key={r.candidateAssetId}><p>Bản tạo lại {r.type==='Illustration'?'tranh':'giọng đọc'} chưa đạt.</p><button className="btn btn-s" disabled={!canChange} onClick={()=>actions?.keepCurrent(r.candidateAssetId)}><Undo2 className="ic" aria-hidden />Giữ bản cũ</button></div>)}
      {needReload&&<div className="studio-reload"><IconButton icon={RefreshCw} label="Tải lại ảnh và giọng đọc (lấy lại đường dẫn, không tạo mới)" disabled={loading} onClick={()=>{setAudioFailed(false);setAudioReload(n=>n+1);onReload();}}/></div>}
    </div>
    </div>
  </div>;
}
