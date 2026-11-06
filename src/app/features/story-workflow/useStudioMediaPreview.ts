'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { aiStoryCreationService as api } from '@/app/services/aiStoryCreationService';
import type { MediaProgressDto, StoryMediaPackage } from '@/app/types/aiStory';

/**
 * Bộ nhớ tạm gói media theo truyện + phiên bản + trạng thái tiến trình (sống đến khi tải lại trang): đổi tab rồi quay lại thì dùng ngay.
 * Khóa chứa revision và số tranh/giọng đã xong nên gói đổi là tự lấy mới; đường dẫn là URL có chữ ký nên chỉ giữ 5 phút.
 * Bấm "Tải lại" (refresh) thì bỏ qua bộ nhớ tạm.
 */
const PACK_CACHE = new Map<string, { pack: StoryMediaPackage; at: number }>();
const PACK_TTL_MS = 5 * 60_000;

/** Progress counts are independent of the authorized, signed media package. */
export function useStudioMediaPreview(storyId:number, versionId:number|null, progress:MediaProgressDto|null) {
  const [result,setResult]=useState<{storyId:number;versionId:number|null;pack:StoryMediaPackage|null;error:string|null;loading:boolean}>({storyId,versionId,pack:null,error:null,loading:true});
  const [revision,setRevision]=useState(0);
  const force=useRef(false);
  const refresh=useCallback(()=>{force.current=true;setRevision(v=>v+1);},[]);
  useEffect(()=>{
    const key=[storyId,versionId,progress?.packageRevision,progress?.readyIllustrations,progress?.readyAudio,progress?.isGenerated,progress?.isConfirmed,progress?.isReady,progress?.jobStatus,progress?.errorCode].join(':');
    const bypass=force.current; force.current=false;
    const hit=bypass?undefined:PACK_CACHE.get(key);
    if(hit&&Date.now()-hit.at<PACK_TTL_MS){setResult({storyId,versionId,pack:hit.pack,error:null,loading:false});return;}
    const controller=new AbortController();
    setResult({storyId,versionId,pack:null,error:null,loading:true});
    void api.getMediaPackage(storyId,controller.signal).then(r=>{
      if(controller.signal.aborted)return;
      const valid=r.success&&r.data&&r.data.storyId===storyId&&(versionId==null||r.data.storyVersionId===versionId)&&
        (progress?.packageRevision==null||r.data.packageRevision===progress.packageRevision);
      if(valid&&r.data)PACK_CACHE.set(key,{pack:r.data,at:Date.now()});
      setResult({storyId,versionId,pack:valid?r.data:null,loading:false,error:valid?null:!r.success?r.message||'Không tải được gói ảnh và âm thanh.':'Gói media chưa khớp phiên bản hoặc revision đang xem. Hãy tải lại tiến trình và media.'});
    });
    return()=>controller.abort();
  },[storyId,versionId,revision,progress?.packageRevision,progress?.readyIllustrations,progress?.readyAudio,progress?.isGenerated,progress?.isConfirmed,progress?.isReady,progress?.jobStatus,progress?.errorCode]);
  const matches=result.storyId===storyId&&result.versionId===versionId&&(!result.pack||progress?.packageRevision==null||result.pack.packageRevision===progress.packageRevision);
  return {...(matches?result:{pack:null,error:null,loading:true}),refresh};
}
