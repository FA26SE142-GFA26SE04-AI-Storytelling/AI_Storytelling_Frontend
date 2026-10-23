export async function resumeStoryFixture({path,caseName,state,ok,paged,card}) {
  if (!caseName?.startsWith('ParentResume')) return false;
  const status=state.resumeStatus ??= caseName==='ParentResumeOutline'?'OutlineReview':'MediaProcessing';
  const story={...card,id:88,title:'Đêm Trung Thu đang tạo',source:'Ai',status,ageBand:'9-10'};
  if(path==='/Story')return ok(paged([card,story]));
  if(path==='/Story/88')return ok(story);
  if(path==='/stories/88/outline')return ok({storyId:88,storyStatus:status,currentVersion:status==='OutlineReview'?{id:102,versionNo:2,title:story.title,opening:'Một buổi tối trăng sáng.',development:'Hai bạn chuẩn bị đèn lồng.',ending:'Cùng chia sẻ niềm vui.',isCurrent:true,outlineApprovedAt:null,createdAt:'2026-10-22T00:00:00Z'}:null,activeOperation:null,activeJobStatus:null,lastErrorCode:null});
  if(path==='/stories/88/generation/progress')return ok({storyId:88,storyStatus:status,outputMode:'reading_media_only',currentStep:'completed',content:'stable',isComplete:true,lastErrorCode:null,stableStoryVersionId:112,waitingForModeration:false});
  if(path==='/stories/88/media/progress')return ok({storyId:88,approvedStoryVersionId:112,storyStatus:status,jobStatus:status==='MediaProcessing'?'Running':'Completed',isReady:status==='Ready',isGenerated:status!=='MediaProcessing',isAwaitingConfirmation:status==='MediaReview',isConfirmed:status==='Ready',packageRevision:1,sceneCount:1,readyIllustrations:status==='MediaProcessing'?0:1,readyAudio:0,requiredIllustrations:1,errorCode:null});
  if(path==='/stories/88/media/package')return ok({storyId:88,storyVersionId:112,packageRevision:1,isReady:status==='Ready',isGenerated:status!=='MediaProcessing',isAwaitingConfirmation:status==='MediaReview',isConfirmed:status==='Ready',scenes:[]});
  if(path==='/stories/88/review')return ok({storyId:88,storyVersionId:112,storyStatus:status,outputMode:'reading_media_only',title:story.title,content:'Hai bạn cùng ngắm trăng.',canEdit:false,canApprove:false,canArchive:false});
  if(path==='/stories/88/review/story')return ok({storyId:88,versionId:112,outputMode:'reading_media_only',title:story.title,content:'Hai bạn cùng ngắm trăng.',lesson:'Sẻ chia'});
  return false;
}
