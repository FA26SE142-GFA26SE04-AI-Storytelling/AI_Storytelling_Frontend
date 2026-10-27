'use client';
import { useState } from 'react';
import type { StoryMediaPackage } from '@/app/types/aiStory';
type Scene=StoryMediaPackage['scenes'][number];

export default function StudioScenePreview({scene,text,loading,onReload}:{scene:Scene|undefined;text:string;loading:boolean;onReload:()=>void}) {
  const [selected,setSelected]=useState(0);
  const [failed,setFailed]=useState<string|null>(null);
  const [audioFailed,setAudioFailed]=useState(false);
  const illustrations=scene?.illustrations.slice().sort((a,b)=>a.beatOrder-b.beatOrder)??[];
  const image=illustrations[selected];
  const url=image?.status==='Ready'?image.url:null;
  return <>
    <div className="art studio-media-art">
      {url&&failed!==url ?
        // Signed storage URLs support arbitrary authorized storage hosts.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="studio-media-image" src={url} alt={`Tranh ${selected+1} của cảnh ${(scene?.sceneIndex??0)+1}`} onError={()=>setFailed(url)}/>
        : <p className="studio-media-placeholder" role="status">{loading?'Đang tải tranh và giọng đọc…':failed===url&&url?'Không mở được ảnh. URL có thể hết hạn hoặc máy chủ lưu trữ đang lỗi.':image?.status==='Ready'?'Ảnh đã được tạo nhưng gói media chưa có URL xem.':'Chưa có ảnh sẵn sàng để hiển thị cho cảnh này.'}</p>}
      <div className="tbox"><div className="txt">{text}</div></div>
    </div>
    <div className="studio-scene-controls">
      {illustrations.length>1&&<div className="row" aria-label="Chọn tranh trong cảnh">{illustrations.map((i,index)=><button className="btn btn-s" key={i.beatId} aria-pressed={index===selected} onClick={()=>{setSelected(index);setFailed(null);}}>Tranh {index+1}</button>)}</div>}
      {scene?.audio?.slice().sort((a,b)=>a.segmentOrder-b.segmentOrder).map(a=><div key={a.segmentId}>
        {a.url&&a.status==='Ready'?<audio controls preload="none" src={a.url} aria-label={`Nghe cảnh ${(scene?.sceneIndex??0)+1}, đoạn ${a.segmentOrder+1}`} onError={()=>setAudioFailed(true)}/>:<p className="sub">{a.status==='Ready'?'Giọng đọc đã tạo nhưng chưa có URL nghe.':'Đoạn giọng đọc này chưa sẵn sàng.'}</p>}
      </div>)}
      {scene&&!scene.audio?.length&&<p className="sub">Gói media chưa có giọng đọc cho cảnh này.</p>}
      {audioFailed&&<p className="notice err" role="alert">Không mở được giọng đọc. Hãy tải lại URL media và thử nghe lại.</p>}
      <button className="btn btn-s" disabled={loading} onClick={onReload}>Tải lại ảnh và giọng đọc</button>
    </div>
  </>;
}
