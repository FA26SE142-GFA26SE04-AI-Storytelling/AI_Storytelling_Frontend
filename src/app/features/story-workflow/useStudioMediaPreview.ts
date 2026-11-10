'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { aiStoryCreationService as api } from '@/app/services/aiStoryCreationService';
import type { MediaProgressDto, StoryMediaPackage } from '@/app/types/aiStory';
import { mediaBranchChanged } from './studioMediaState';

export function mediaPreviewMatches(pack:StoryMediaPackage, storyId:number, versionId:number|null, packageRevision?:number) {
  return pack.storyId===storyId&&(versionId===null||pack.storyVersionId===versionId)&&(packageRevision===undefined||pack.packageRevision===packageRevision);
}

export async function loadStudioMediaPreview(storyId:number,versionId:number|null,packageRevision:number|undefined,signal:AbortSignal) {
  const response=await api.getMediaPackage(storyId,signal);
  if(signal.aborted)return null;
  const valid=response.success&&response.data&&mediaPreviewMatches(response.data,storyId,versionId,packageRevision);
  return {pack:valid?response.data:null,error:valid?null:!response.success?response.message||'Không tải được gói ảnh và âm thanh.':'Gói media chưa khớp phiên bản hoặc revision đang xem. Hãy tải lại tiến trình và media.'};
}

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
  const audioState=mediaBranchChanged(progress?.audio),imageState=mediaBranchChanged(progress?.images);
  useEffect(()=>{
    const key=[storyId,versionId,progress?.packageRevision,progress?.readyIllustrations,progress?.readyAudio,progress?.isGenerated,progress?.isAwaitingConfirmation,progress?.isConfirmed,progress?.isReady,progress?.jobStatus,progress?.errorCode,audioState,imageState].join(':');
    const bypass=force.current; force.current=false;
    const hit=bypass?undefined:PACK_CACHE.get(key);
    if(hit&&Date.now()-hit.at<PACK_TTL_MS){setResult({storyId,versionId,pack:hit.pack,error:null,loading:false});return;}
    const controller=new AbortController();
    setResult(previous=>({storyId,versionId,pack:previous.pack&&mediaPreviewMatches(previous.pack,storyId,versionId,progress?.packageRevision)?previous.pack:null,error:null,loading:true}));
    void loadStudioMediaPreview(storyId,versionId,progress?.packageRevision,controller.signal).then(result=>{
      if(!result||controller.signal.aborted)return;
      if(result.pack)PACK_CACHE.set(key,{pack:result.pack,at:Date.now()});
      setResult({storyId,versionId,...result,loading:false});
    });
    return()=>controller.abort();
  },[storyId,versionId,revision,progress?.packageRevision,progress?.readyIllustrations,progress?.readyAudio,progress?.isGenerated,progress?.isAwaitingConfirmation,progress?.isConfirmed,progress?.isReady,progress?.jobStatus,progress?.errorCode,audioState,imageState]);
  const matches=result.storyId===storyId&&result.versionId===versionId&&(!result.pack||progress?.packageRevision==null||result.pack.packageRevision===progress.packageRevision);
  return {...(matches?result:{pack:null,error:null,loading:true}),refresh};
}
