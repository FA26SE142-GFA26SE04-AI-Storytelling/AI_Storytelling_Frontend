'use client';
import { useCallback, useEffect, useState } from 'react';
import { aiStoryCreationService as api } from '@/app/services/aiStoryCreationService';
import type { MediaProgressDto, StoryMediaPackage } from '@/app/types/aiStory';

/** Progress counts are independent of the authorized, signed media package. */
export function useStudioMediaPreview(storyId:number, versionId:number|null, progress:MediaProgressDto|null) {
  const [result,setResult]=useState<{storyId:number;versionId:number|null;pack:StoryMediaPackage|null;error:string|null;loading:boolean}>({storyId,versionId,pack:null,error:null,loading:true});
  const [revision,setRevision]=useState(0);
  const refresh=useCallback(()=>setRevision(v=>v+1),[]);
  useEffect(()=>{
    const controller=new AbortController();
    setResult({storyId,versionId,pack:null,error:null,loading:true});
    void api.getMediaPackage(storyId,controller.signal).then(r=>{
      if(controller.signal.aborted)return;
      const valid=r.success&&r.data&&r.data.storyId===storyId&&(versionId==null||r.data.storyVersionId===versionId)&&
        (progress?.packageRevision==null||r.data.packageRevision===progress.packageRevision);
      setResult({storyId,versionId,pack:valid?r.data:null,loading:false,error:valid?null:!r.success?r.message||'Không tải được gói ảnh và âm thanh.':'Gói media chưa khớp phiên bản hoặc revision đang xem. Hãy tải lại tiến trình và media.'});
    });
    return()=>controller.abort();
  },[storyId,versionId,revision,progress?.packageRevision,progress?.readyIllustrations,progress?.readyAudio,progress?.isGenerated,progress?.isConfirmed,progress?.isReady,progress?.jobStatus,progress?.errorCode]);
  const matches=result.storyId===storyId&&result.versionId===versionId&&(!result.pack||progress?.packageRevision==null||result.pack.packageRevision===progress.packageRevision);
  return {...(matches?result:{pack:null,error:null,loading:true}),refresh};
}
