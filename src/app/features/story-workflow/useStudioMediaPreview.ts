'use client';
import { useCallback, useEffect, useState } from 'react';
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

/** Progress counts are independent of the authorized, signed media package. */
export function useStudioMediaPreview(storyId:number, versionId:number|null, progress:MediaProgressDto|null) {
  const [result,setResult]=useState<{storyId:number;versionId:number|null;pack:StoryMediaPackage|null;error:string|null;loading:boolean}>({storyId,versionId,pack:null,error:null,loading:true});
  const [revision,setRevision]=useState(0);
  const refresh=useCallback(()=>setRevision(v=>v+1),[]);
  const audioState=mediaBranchChanged(progress?.audio),imageState=mediaBranchChanged(progress?.images);
  useEffect(()=>{
    const controller=new AbortController();
    setResult(previous=>({storyId,versionId,pack:previous.pack&&mediaPreviewMatches(previous.pack,storyId,versionId,progress?.packageRevision)?previous.pack:null,error:null,loading:true}));
    void loadStudioMediaPreview(storyId,versionId,progress?.packageRevision,controller.signal).then(result=>{
      if(!result||controller.signal.aborted)return;
      setResult({storyId,versionId,...result,loading:false});
    });
    return()=>controller.abort();
  },[storyId,versionId,revision,progress?.packageRevision,progress?.readyIllustrations,progress?.readyAudio,progress?.isGenerated,progress?.isAwaitingConfirmation,progress?.isConfirmed,progress?.isReady,progress?.jobStatus,progress?.errorCode,audioState,imageState]);
  const matches=result.storyId===storyId&&result.versionId===versionId&&(!result.pack||progress?.packageRevision==null||result.pack.packageRevision===progress.packageRevision);
  return {...(matches?result:{pack:null,error:null,loading:true}),refresh};
}
