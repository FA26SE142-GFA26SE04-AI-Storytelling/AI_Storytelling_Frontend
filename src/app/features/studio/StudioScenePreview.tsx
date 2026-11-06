'use client';
import { useState } from 'react';
import { RefreshCw, Undo2 } from 'lucide-react';
import IconButton from '@/app/components/IconButton';
import type { StoryMediaPackage } from '@/app/types/aiStory';
type Scene=StoryMediaPackage['scenes'][number];
/** Thao tác tạo lại / giữ bản cũ lấy từ useMediaPackage; không truyền thì không hiện nút. */
export type SceneMediaActions={busy:boolean;locked:boolean;replacements:NonNullable<StoryMediaPackage['replacements']>;regenerate:(kind:'illustration'|'audio',assetId:number)=>void;keepCurrent:(candidateAssetId:number)=>void};

export default function StudioScenePreview({scene,text,loading,onReload,actions}:{scene:Scene|undefined;text:string;loading:boolean;onReload:()=>void;actions?:SceneMediaActions}) {
  const [selected,setSelected]=useState(0);
  const [failed,setFailed]=useState<string|null>(null);
  /** Ảnh đã tải xong; chưa khớp ảnh đang chọn thì hiện vòng tải, ảnh ẩn đi để không lộ ảnh cũ. */
  const [loadedUrl,setLoadedUrl]=useState<string|null>(null);
  const [audioFailed,setAudioFailed]=useState(false);
  const illustrations=scene?.illustrations.slice().sort((a,b)=>a.beatOrder-b.beatOrder)??[];
  const image=illustrations[selected];
  const url=image?.status==='Ready'?image.url:null;
  const canChange=!!actions&&!actions.busy&&!actions.locked;
  const failedReplacements=actions?.replacements.filter(r=>['Failed','ManualReview'].includes(r.status))??[];
  return <div className="studio-scene">
    <div className="art studio-media-art">
      <div className="studio-media-frame">
      {url&&failed!==url ?
        // Signed storage URLs support arbitrary authorized storage hosts.
        // eslint-disable-next-line @next/next/no-img-element
        <img key={url} className={`studio-media-image${loadedUrl===url?'':' loading'}`} src={url} ref={el=>{if(el?.complete&&el.naturalWidth>0)setLoadedUrl(url);}} onLoad={()=>setLoadedUrl(url)} alt={`Tranh ${selected+1} của cảnh ${(scene?.sceneIndex??0)+1}`} onError={()=>setFailed(url)}/>
        : <p className="studio-media-placeholder" role="status">{loading?'Đang tải tranh và giọng đọc…':failed===url&&url?'Không mở được ảnh. URL có thể hết hạn hoặc máy chủ lưu trữ đang lỗi.':image?.status==='Ready'?'Ảnh đã được tạo nhưng gói media chưa có URL xem.':'Chưa có ảnh sẵn sàng để hiển thị cho cảnh này.'}</p>}
      {url&&failed!==url&&loadedUrl!==url&&<div className="studio-media-loading" role="status" aria-label="Đang tải tranh"><span className="studio-media-spin" aria-hidden="true"/></div>}
      </div>
    </div>
    {/* Cột phải: chữ của cảnh ở trên, nút chọn tranh và nghe giọng đọc ở dưới. */}
    <div className="studio-scene-side">
    <div className="studio-media-text">{text}</div>
    <div className="studio-scene-controls">
      {(illustrations.length>1||(actions&&image))&&<div className="row" aria-label="Chọn tranh trong cảnh">{illustrations.length>1&&illustrations.map((i,index)=><button className="btn btn-s" key={i.beatId} aria-pressed={index===selected} onClick={()=>{setSelected(index);setFailed(null);}}>Tranh {index+1}</button>)}{actions&&image&&<IconButton icon={RefreshCw} label="Tạo lại tranh này" disabled={!canChange} onClick={()=>actions.regenerate('illustration',image.beatId)}/>}</div>}
      {scene?.audio?.slice().sort((a,b)=>a.segmentOrder-b.segmentOrder).map(a=><div className="row" key={a.segmentId}>
        {a.url&&a.status==='Ready'?<audio controls preload="none" src={a.url} aria-label={`Nghe cảnh ${(scene?.sceneIndex??0)+1}, đoạn ${a.segmentOrder+1}`} onError={()=>setAudioFailed(true)}/>:<p className="sub">{a.status==='Ready'?'Giọng đọc đã tạo nhưng chưa có URL nghe.':'Đoạn giọng đọc này chưa sẵn sàng.'}</p>}
        {actions&&<IconButton icon={RefreshCw} label="Tạo lại giọng đọc đoạn này" disabled={!canChange} onClick={()=>actions.regenerate('audio',a.segmentId)}/>}
      </div>)}
      {scene&&!scene.audio?.length&&<p className="sub">Gói media chưa có giọng đọc cho cảnh này.</p>}
      {audioFailed&&<p className="notice err" role="alert">Không mở được giọng đọc. Hãy tải lại URL media và thử nghe lại.</p>}
      {failedReplacements.map(r=><div className="notice warn" data-inline-notice key={r.candidateAssetId}><p>Bản tạo lại {r.type==='Illustration'?'tranh':'giọng đọc'} chưa đạt.</p><button className="btn btn-s" disabled={!canChange} onClick={()=>actions?.keepCurrent(r.candidateAssetId)}><Undo2 className="ic" aria-hidden />Giữ bản cũ</button></div>)}
      <button className="btn btn-s" disabled={loading} onClick={onReload}>Tải lại ảnh và giọng đọc</button>
    </div>
    </div>
  </div>;
}
