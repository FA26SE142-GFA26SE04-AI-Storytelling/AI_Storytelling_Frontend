'use client';
import {useEffect,useRef,useState} from 'react';
import {aiStoryCreationService as api} from '@/app/services/aiStoryCreationService';
import type {StoryMediaPackage,MediaProgressDto} from '@/app/types/aiStory';

export function useStudioCompletion(pack:StoryMediaPackage|null, progress:MediaProgressDto|null, onChanged:()=>void) {
  const [reviewed,setReviewed]=useState(false),[busy,setBusy]=useState(false),[blocked,setBlocked]=useState(false);
  const [note,setNote]=useState('');
  const scope=useRef(0),lock=useRef(false);
  const empty=pack===null;
  useEffect(()=>{
    const run=++scope.current;lock.current=false;setReviewed(false);setBusy(false);setBlocked(false);setNote('');
    return()=>{scope.current=run+1;};
  },[pack?.storyId,pack?.storyVersionId,pack?.packageRevision,pack?.isConfirmed,empty]);
  const matched=!!pack&&!!progress&&pack.storyId===progress.storyId&&pack.storyVersionId===progress.approvedStoryVersionId&&pack.packageRevision===progress.packageRevision;
  const ready=matched&&pack.isConfirmed&&pack.isReady&&progress.isConfirmed&&progress.isReady;
  const canConfirm=matched&&pack.packageRevision>0&&pack.isGenerated&&pack.isAwaitingConfirmation&&!pack.isConfirmed;
  const confirm=async()=>{
    if(!pack||!canConfirm||!reviewed||lock.current||blocked)return;
    lock.current=true;setBusy(true);setNote('');const run=scope.current;
    const r=await api.confirmMedia(pack.storyId,{storyVersionId:pack.storyVersionId,packageRevision:pack.packageRevision});
    if(run!==scope.current)return;
    lock.current=false;setBusy(false);
    const confirmed=r.success&&r.data?.storyId===pack.storyId&&r.data.approvedStoryVersionId===pack.storyVersionId&&r.data.packageRevision===pack.packageRevision&&r.data.isConfirmed&&r.data.isReady;
    setBlocked(true);setReviewed(false);
    setNote(confirmed?'Đã xác nhận gói media. Đang cập nhật trạng thái để giao truyện.':r.message||'Chưa xác nhận được gói media. Tải lại trạng thái trước khi thử tiếp.');
    if(confirmed)onChanged();
  };
  return {reviewed,setReviewed,busy,blocked,note,ready,canConfirm,confirm};
}
