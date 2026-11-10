import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { audioBranchDisplay, completionState, mediaPackageDisplay } from '@/app/features/story-workflow/studioMediaState';
import { mediaNeedsPolling } from '@/app/features/story-workflow/mediaPackage';
import { loadStudioMediaPreview, mediaPreviewMatches } from '@/app/features/story-workflow/useStudioMediaPreview';
import { aiStoryCreationService as api } from '@/app/services/aiStoryCreationService';
import type { ApiResponse } from '@/app/types/auth';
import { transientPollingFailure } from '@/app/features/story-workflow/useStoryProgressPolling';
import StudioScenePreview from '@/app/features/studio/StudioScenePreview';
import type { MediaBranchProgress, MediaProgressDto, StoryMediaPackage } from '@/app/types/aiStory';

const branch = (b:Partial<MediaBranchProgress>={}) => ({status:'Preparing',requiredCount:5,readyCount:0,errorCode:null,nextRetryAt:null,queuedCount:0,runningCount:0,failedCount:0,...b});
const progress = (p:Partial<MediaProgressDto>={}) => ({storyId:47,approvedStoryVersionId:94,packageRevision:1,jobStatus:'Processing',isGenerated:false,isReady:false,isConfirmed:false,isAwaitingConfirmation:false,errorCode:null,sceneCount:5,readyAudio:0,audio:branch(),...p} as MediaProgressDto);
const pack = (p:Partial<StoryMediaPackage>={}) => ({storyId:47,storyVersionId:94,packageRevision:1,scenes:[],isGenerated:true,isAwaitingConfirmation:true,isConfirmed:false,isReady:false,...p} as StoryMediaPackage);

describe('Studio media state from real backend contract',()=>{
  afterEach(()=>vi.restoreAllMocks());
  it('does not call an unfinished package awaiting confirmation',()=>{
    expect(mediaPackageDisplay(null).kind).toBe('preparing');
    expect(mediaPackageDisplay(progress()).kind).toBe('processing');
    expect(mediaPackageDisplay(progress({readyIllustrations:10,requiredIllustrations:10})).label).not.toContain('xác nhận');
    expect(completionState(pack(),progress()).canConfirm).toBe(false);
  });
  it('shows unknown, queued, processing and partial narration counts',()=>{
    expect(audioBranchDisplay(null)).toMatchObject({done:false,label:'Đang chuẩn bị giọng đọc'});
    expect(audioBranchDisplay(progress({audio:branch({requiredCount:0})})).detail).toBe('Chưa xác định số đoạn');
    expect(audioBranchDisplay(progress({audio:branch({status:'Pending'})}))).toMatchObject({detail:'0/5 đoạn',label:'Giọng đọc đang chờ xử lý'});
    expect(audioBranchDisplay(progress({audio:branch({status:'Processing',readyCount:2})}))).toMatchObject({done:false,detail:'2/5 đoạn',label:'Đang tạo giọng đọc'});
  });
  it('matches story 47 failed audio without offering confirmation',()=>{
    const p=progress({jobStatus:'Failed',errorCode:'MEDIA_PROVIDER_TIMEOUT',audio:branch({status:'Failed',errorCode:'MEDIA_PROVIDER_TIMEOUT'})});
    expect(mediaPackageDisplay(p).kind).toBe('failed');
    expect(audioBranchDisplay(p)).toMatchObject({done:false,detail:'0/5 đoạn',errorCode:'MEDIA_PROVIDER_TIMEOUT'});
    expect(mediaNeedsPolling(p)).toBe(false);
    expect(completionState(pack(),p).canConfirm).toBe(false);
  });
  it('keeps tracking deferred retries and displays retry time',()=>{
    const nextRetryAt='2026-11-04T12:00:00Z';
    const p=progress({errorCode:'GEMINI_TTS_HTTP_429',audio:branch({status:'Pending',errorCode:'GEMINI_TTS_HTTP_429',nextRetryAt})});
    expect(mediaPackageDisplay(p).kind).toBe('retry');
    expect(audioBranchDisplay(p).nextRetryAt).toBe(nextRetryAt);
    expect(mediaNeedsPolling(p)).toBe(true);
    for(const status of [0,408,429,500,503])expect(transientPollingFailure(status)).toBe(true);
    expect(transientPollingFailure(403)).toBe(false);
  });
  it('marks narration ready while supporting media can still be incomplete',()=>{
    const p=progress({audio:branch({readyCount:5,status:'Processing'})});
    expect(audioBranchDisplay(p).done).toBe(true);
    expect(mediaPackageDisplay(p).kind).toBe('processing');
    expect(completionState(pack(),p).canConfirm).toBe(false);
  });
  it('only enables confirmation for matching and complete progress/package snapshots',()=>{
    const p=progress({isGenerated:true,isAwaitingConfirmation:true,jobStatus:'Completed'});
    expect(completionState(pack(),p)).toEqual({ready:false,canConfirm:true});
    expect(mediaNeedsPolling(p)).toBe(false);
    for(const wrong of [pack({storyId:48}),pack({storyVersionId:95}),pack({packageRevision:2})]) {
      expect(completionState(wrong,p)).toEqual({ready:false,canConfirm:false});
      expect(mediaPreviewMatches(wrong,47,94,1)).toBe(false);
    }
    expect(completionState(pack(),{...p,isAwaitingConfirmation:false}).canConfirm).toBe(false);
    expect(completionState(pack({isConfirmed:true,isReady:true}),p).ready).toBe(false);
    const ready={...p,isConfirmed:true,isReady:true,isAwaitingConfirmation:false};
    expect(completionState(pack({isConfirmed:true,isReady:true}),ready).ready).toBe(true);
    expect(mediaPackageDisplay(ready).kind).toBe('ready');
  });
  it('renders playable audio and distinguishes missing URLs from unfinished audio',()=>{
    const scene={sceneId:36,sceneIndex:0,text:'Truyện',illustrations:[],audio:[{segmentId:34,segmentOrder:0,text:'Lời kể',assetId:173,status:'Ready',url:'https://media.test/narration.wav',wordTimings:null}]};
    const html=renderToStaticMarkup(<StudioScenePreview scene={scene} text="Truyện" loading={false} onReload={()=>{}}/>);
    expect(html).toContain('<audio');expect(html).toContain('narration.wav');
    const missing=renderToStaticMarkup(<StudioScenePreview scene={{...scene,audio:[{...scene.audio[0],url:null}]}} text="Truyện" loading={false} onReload={()=>{}}/>);
    expect(missing).toContain('chưa có URL nghe');expect(missing).not.toContain('<audio');
    const queued=renderToStaticMarkup(<StudioScenePreview scene={{...scene,audio:[{...scene.audio[0],status:'Queued',url:null}]}} text="Truyện" loading={false} onReload={()=>{}}/>);
    expect(queued).toContain('chưa sẵn sàng');
    expect(queued).not.toContain('chưa có URL nghe');
  });
  it('ignores late package responses after changing story or cancelling a request',async()=>{
    let finish!:(response:ApiResponse<StoryMediaPackage>)=>void;
    const get=vi.spyOn(api,'getMediaPackage').mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
    const old=new AbortController();
    const request=loadStudioMediaPreview(47,94,1,old.signal);
    old.abort();
    get.mockResolvedValueOnce({success:true,message:'',data:pack({storyId:48,storyVersionId:95})});
    expect((await loadStudioMediaPreview(48,95,1,new AbortController().signal))?.pack?.storyId).toBe(48);
    finish({success:true,message:'',data:pack()});
    expect(await request).toBeNull();
  });
  it('does not turn a package fetch error into generation failure or accept stale snapshots',async()=>{
    const get=vi.spyOn(api,'getMediaPackage').mockResolvedValueOnce({success:false,status:503,message:'Tạm mất kết nối',data:null});
    expect(await loadStudioMediaPreview(47,94,1,new AbortController().signal)).toEqual({pack:null,error:'Tạm mất kết nối'});
    get.mockResolvedValueOnce({success:true,message:'',data:pack({packageRevision:2})});
    const stale=await loadStudioMediaPreview(47,94,1,new AbortController().signal);
    expect(stale?.pack).toBeNull();expect(stale?.error).toContain('chưa khớp phiên bản');
  });
});
