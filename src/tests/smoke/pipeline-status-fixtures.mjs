import assert from 'node:assert/strict';
export async function pipelineStatusFixture({path,method,body,state,ok,card,now,caseName,route}){
 if(!caseName?.startsWith('Pipeline'))return false;
 const s=state.pipeline??={phase:caseName==='PipelineRetry'?'failed':'running',networkDown:caseName==='PipelineNetwork',reads:0};
 const outlineCase=caseName==='PipelineRetry'||caseName==='PipelineOutlineRunning';
 const finished=s.phase==='complete',failed=s.phase==='failed';
 const status=finished?(outlineCase?'OutlineReview':'ContentReview'):(outlineCase?'Draft':'OutlineReview');
 const version={id:12,versionNo:1,title:card.title,opening:'Bạn tìm thấy chiếc hộp.',development:'Cùng nhau sửa hộp.',ending:'Cả hai cùng vui.',isCurrent:true,outlineApprovedAt:outlineCase?null:now,createdAt:now};
 const outline=()=>({storyId:7,storyStatus:status,currentVersion:outlineCase&&!finished?null:version,activeOperation:outlineCase&&!failed&&!finished?'generate_outline':null,activeJobStatus:outlineCase&&!failed&&!finished?'processing':null,lastErrorCode:'OUTLINE_GENERATION_FAILED'});
 const generation=()=>({storyId:7,storyStatus:status,outputMode:'reading_media_only',currentStep:finished?'complete':outlineCase?'not_started':failed?'failed_content':'generating_content',content:finished?'stable':failed?'failed':'processing',vocabulary:'skipped',quiz:'skipped',discussion:'skipped',isComplete:finished&&!outlineCase,stableStoryVersionId:finished?12:null,waitingForModeration:false,lastErrorCode:!outlineCase&&failed?'CONTENT_SCHEMA_INVALID':null,qualityFailure:null});
 if(path==='/Story/7')return ok({...card,status,childProfileId:10});
 if(path==='/stories/7/outline/retry'){
  assert.equal(method,'POST');assert(body.operationKey);s.phase='running';s.holdRead=true;return ok(outline(),202);
 }
 if(path==='/stories/7/generation/retry'){
  assert.equal(method,'POST');assert(body.retryKey);s.phase='running';s.holdRead=true;return ok(generation(),202);
 }
 if(path==='/stories/7/outline'||path==='/stories/7/generation/progress'){
  s.reads++;
  if(s.networkDown)return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({success:false,message:'Fixture temporary read outage',data:null})});
  if(s.holdRead){s.holdRead=false;await new Promise(resolve=>setTimeout(resolve,800));}
  return ok(path.endsWith('/outline')?outline():generation());
 }
 const review={storyId:7,outputMode:'reading_media_only',title:'Truyện đã xử lý xong',content:'Kết quả đã được backend xác nhận.',lesson:'Hợp tác',readabilityAlgorithm:'fixture',readabilityFkgl:null,readabilityFre:null};
 if(path==='/stories/7/review')return ok({...review,storyVersionId:12,storyStatus:'ContentReview',canEdit:true,canApprove:false,canConfirmContent:false,canArchive:false,vocabulary:{},quiz:{},discussion:{}});
 if(path==='/stories/7/review/story')return ok({...review,versionId:12});
 return false;
}
export async function exercisePipeline({page,state,requests,label,base}){
 await page.goto(`${base}/?storyId=7#studio`,{waitUntil:'domcontentloaded'});
 if(label==='PipelineRetry'){
  await page.getByText('Bước này bị lỗi (mã OUTLINE_GENERATION_FAILED).',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Thử lại',exact:true}).click();
  await page.getByText('AI đang viết dàn ý',{exact:true}).waitFor();
  assert.equal(await page.getByText('Bước này bị lỗi',{exact:false}).count(),0);
  assert.equal(requests.filter(r=>r.path==='/stories/7/outline/retry').length,1);
 }else if(label==='PipelineNetwork'){
  await page.getByText('Chưa lấy được cập nhật từ máy chủ.',{exact:false}).waitFor();
  assert.equal(await page.getByText('Bước này bị lỗi',{exact:false}).count(),0);
  state.pipeline.networkDown=false;
  await page.getByText('AI đang viết truyện',{exact:true}).waitFor();
 }else{
  await page.getByText(label==='PipelineOutlineRunning'?'AI đang viết dàn ý':'AI đang viết truyện',{exact:true}).waitFor();
  assert.equal(await page.getByText('Bước này bị lỗi',{exact:false}).count(),0);
 }
 if(label==='PipelineOutlineRunning'||label==='PipelineRetry')assert.equal(await page.getByRole('button',{name:'Duyệt dàn ý và viết truyện',exact:true}).count(),0);
 if(label==='PipelineContentRetry'){
  state.pipeline.phase='failed';
  await page.getByText('Bước này bị lỗi (mã CONTENT_SCHEMA_INVALID).',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Thử lại',exact:true}).click();
  await page.getByText('AI đang viết truyện',{exact:true}).waitFor();
  assert.equal(await page.getByText('Bước này bị lỗi',{exact:false}).count(),0);
  assert.equal(requests.filter(r=>r.path==='/stories/7/generation/retry').length,1);
 }
 state.pipeline.phase='complete';
 if(label==='PipelineOutlineRunning'||label==='PipelineRetry')await page.getByRole('button',{name:'Duyệt dàn ý và viết truyện',exact:true}).waitFor();
 else await page.getByText('Kết quả đã được backend xác nhận.',{exact:true}).waitFor();
 assert.equal(await page.getByText('Bước này bị lỗi',{exact:false}).count(),0);
 assert(!requests.some(r=>r.method==='POST'&&r.path.includes('/ai-story-input/requests')));
}
