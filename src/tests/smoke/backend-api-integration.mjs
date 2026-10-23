/** Browser wiring checks against isolated fixtures. Does not contact a backend/database. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { currentControllerFixture } from './current-controller-fixtures.mjs';
import { resumeStoryFixture } from './resume-story-fixtures.mjs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.FRONTEND_SMOKE_URL || 'http://localhost:3107';
const output = new URL('../../out/api-integration-smoke/',import.meta.url);
await mkdir(output,{recursive:true});
const browser = await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL || 'msedge'});
const results=[];
const now='2026-10-21T00:00:00Z';
const paged=(items)=>({items,pageIndex:1,pageSize:20,totalCount:items.length,totalPages:1,hasNextPage:false,hasPreviousPage:false});
const child={id:10,ownerUserId:1,nickname:'Bé Sen',ageBand:'Age_6_8',language:'vi',avatarId:'frog',status:'Active',createdAt:now};
const card={id:7,title:'Ếch con khám phá',content:'Ếch con đọc truyện.',ageBand:'6-8',status:'Ready',isPublished:false,source:'Ai',genre:'Khám phá',createdAt:now,authorUserId:1,language:'vi',description:'Một câu chuyện mẫu',moralLesson:'Biết quan tâm',coverImageUrl:null};
const draft={storyId:7,authorUserId:1,title:card.title,description:'',language:'vi',ageBand:'6-8',genre:'Khám phá',experienceMode:'reading',audienceRevision:1,revisionToken:'r1',selectedVersionId:12,lastVersionNo:1,createdAt:now,updatedAt:null,source:'Ai',status:'ContentReview'};
async function fixture(role,run,manual=false,caseName=null) {
 const label=caseName ?? (manual ? `${role}Manual` : role);
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const page=await context.newPage(); const requests=[]; const errors=[]; const state={claimed:false,cleared:false,creatorStatus:manual?'Draft':'ContentReview',submitted:false};
 const user={id:1,username:'fixture',email:'fixture@example.invalid',fullName:'Người dùng kiểm thử',role,status:'Active'};
 const jwt=`e30.${Buffer.from(JSON.stringify({exp:Math.floor(Date.now()/1000)+3600,sub:'1',role})).toString('base64url')}.fixture`;
 const notification={id:81,childProfileId:10,type:'RoadmapStoryAdded',group:'stories',payload:null,status:'Unread',readAt:null,createdAt:now};
 if(caseName==='ParentAccount')await page.routeWebSocket(/\/hubs\/notifications(?:\?|$)/,socket=>{
  socket.onMessage(message=>{if(message.toString().includes('"protocol"')){state.notificationPushed=true;socket.send('{}\x1e');socket.send(JSON.stringify({type:1,target:'ReceiveNotification',arguments:[notification]})+'\x1e');}});
 });
 page.setDefaultTimeout(15000);
 await page.addInitScript(({user,jwt})=>{localStorage.setItem('taletale_user_profile',JSON.stringify(user));localStorage.setItem('taletale_access_token',jwt);localStorage.setItem('taletale_refresh_token','fixture-refresh');}, {user,jwt});
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&/Encountered two children with the same key/.test(m.text()))errors.push(m.text());});
 page.on('requestfailed',r=>console.log('Failed request',new URL(r.url()).origin+new URL(r.url()).pathname,r.failure()?.errorText));
 await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin===new URL(base).origin)return r.continue();console.log('Blocked external request',u.origin+u.pathname);return r.abort();});
 await page.route(u=>u.pathname.startsWith('/api/v1/')||u.pathname.includes('/swagger/')||/^\/(health|healthz|hubs\/notifications\/negotiate)$/.test(u.pathname),async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname.replace('/api/v1',''),method=req.method();
  const body=req.postDataJSON?.() ?? null;
  requests.push({path,method,body,authorization:req.headers().authorization});
  const ok=async (data,status=200)=>route.fulfill({status,contentType:'application/json',headers:{'access-control-allow-origin':'*','access-control-allow-headers':'*'},body:JSON.stringify({success:true,message:'Đã ghi nhận fixture',data})});
  if(method==='OPTIONS')return ok(null);
  if(await resumeStoryFixture({path,caseName,state,ok,paged,card}) !== false)return;
  if(await currentControllerFixture({path,method,body,url,state,ok,draft,card,paged,now}) !== false)return;
  if(path==='/health'||path==='/healthz')return route.fulfill({status:200,contentType:'text/plain',body:'Healthy'});
  if(path==='/hubs/notifications/negotiate'&&caseName==='ParentAccount')return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({negotiateVersion:1,connectionId:'fixture-connection',connectionToken:'fixture-connection',availableTransports:[{transport:'WebSockets',transferFormats:['Text']}]})});
  if(path.includes('/swagger/'))return ok({});
  if(path==='/Auth/me')return ok(user);
  if(path==='/Auth/sessions')return ok([]);
  if(path==='/Auth/me/audit-log')return ok(paged([{id:1,actorUserId:1,action:'ProfileUpdated',entityType:'UserAccount',entityId:1,occurredAt:now}]));
  if(path==='/Payment/plans')return ok([{id:4,name:'Gói thử nghiệm',priceVnd:50000,quotaAmount:100}]);
  if(path==='/Payment/transactions')return ok({id:17,planId:4,planName:'Gói thử nghiệm',amount:50000,transactionCode:'FIXTURE17',qrCodeUrl:null,status:'Pending',expiresAt:'2099-01-01T00:00:00Z',paidAt:null,sepayTransactionId:null},201);
  if(path==='/Notification/unread-count')return ok(state.notificationPushed?1:0);
  if(path==='/Notification')return ok(state.notificationPushed?[notification]:[]);
  if(path==='/ChildProfile/mine')return ok([child]);
  if(path==='/ChildProfile/10')return ok(child);
  if(path.startsWith('/Supervision/')&&path.includes('supervisors'))return ok([{id:3,childProfileId:10,supervisorUserId:1,supervisorRole:'Owner'}]);
  if(path.startsWith('/LearningProfile/'))return ok({childProfileId:10,readingLevel:2,readingMode:'ReadFirst',topics:[]});
  if(path.startsWith('/SafetyPolicy/'))return ok({childProfileId:10,maxStoryLength:2000,categories:[]});
  if(path==='/ContentCategory')return ok([{id:1,code:'nature',displayName:'Thiên nhiên',isActive:true}]);
  if(path==='/Story'&&method==='POST'){state.personal={...card,...body,id:70,authorUserId:1,status:'Draft',source:'Manual',isPublished:false};return ok(state.personal,201);}
  if(path==='/Story/70'&&method==='PUT'){state.personal={...state.personal,...body};return ok(state.personal);}
  if(path==='/Story/70'&&method==='DELETE'){state.personal=null;return ok(true);}
  if(path==='/Story/70/publish')return route.fulfill({status:409,contentType:'application/json',body:JSON.stringify({success:false,message:'CANNOT_BYPASS_APPROVAL_MEDIA',data:null})});
  if(path==='/Story/70')return ok(state.personal);
  if(path==='/Story/71/publish'){state.readyPublished=true;return ok(true);}
  if(path==='/Story/71'&&method==='DELETE')return ok(true);
  if(path==='/Story/71')return ok({...card,id:71,source:'Manual',status:'Ready',isPublished:!!state.readyPublished});
  if(path==='/Story')return ok(paged([card]));
  if(path==='/Story/7')return ok(card);
  if(path==='/ChildRoadmap/10')return ok({childProfileId:10,open:{id:55,storyId:7,title:'Ếch con trong lộ trình',position:0,status:'Open',source:'Manual',skipReason:null,note:'Đọc cùng mẹ',expectedDays:7,expectedCompletionAt:null,openedAt:now,completedAt:null,addedByUserId:1,isStoryAvailable:true},waiting:[],history:[],completedCount:5,totalCount:7});
  if(path==='/RoadmapLibrary')return ok(paged([{id:2,name:'Bộ khám phá',description:'Bộ truyện mẫu',ageBand:'6-8',mainCategory:{id:1,code:'nature',displayName:'Thiên nhiên'},readingLevelMin:1,readingLevelMax:3,defaultDaysPerStory:3,storyCount:1,needsUpdate:false,publishedAt:now}]));
  if(path==='/RoadmapLibrary/2')return ok({id:2,name:'Bộ khám phá',description:'Bộ truyện mẫu',ageBand:'6-8',mainCategory:{id:1,code:'nature',displayName:'Thiên nhiên'},readingLevelMin:1,readingLevelMax:3,defaultDaysPerStory:3,storyCount:1,needsUpdate:false,publishedAt:now,stories:[{storyId:7,position:1,days:3,title:card.title,ageBand:'6-8',readingLevel:2,isAvailable:true}]});
  if(path==='/RoadmapLibrary/2/preview'||path==='/RoadmapLibrary/2/copy')return ok({roadmapId:2,roadmapName:'Bộ khám phá',children:[{childProfileId:10,outcome:path.endsWith('preview')?'Copy':'Copied',skipCode:null,message:null,steps:[{storyId:7,title:card.title,position:1,days:3,action:'Copy',skipCode:null,message:null}],warnings:['Độ khó cần được bố mẹ xem lại']} ]});
  if(path==='/CommunitySubmission/mine')return ok([]);
  if(path==='/CommunitySubmission/check')return ok({storyId:7,canSubmit:true,storyVersionId:12,requiredDeclaration:'none',blockers:[],piiFindings:[]});
  if(path==='/CommunitySubmission')return ok({itemId:21,storyId:7,storyVersionId:12,status:'Pending'});
  if(path==='/ContentReport')return ok({reportId:8,storyId:7,reason:body.reason,status:'Pending',createdAt:now});
  if(path==='/ModerationQueue')return ok(paged((url.searchParams.get('status')===(state.claimed?'Claimed':'Pending')&&!state.cleared)?[{id:9,itemType:'GrayZoneStory',status:state.claimed?'Claimed':'Pending',priority:'High',storyId:7,storyVersionId:12,contentReportId:null,readingRoadmapId:null,isResubmission:false,slaDueAt:now,isOverdue:false,claimedByUserId:state.claimed?1:null,claimedAt:now,claimExpiresAt:'2099-01-01T00:00:00Z',createdAt:now}]:[]));
  if(path==='/ModerationQueue/9/claim'){state.claimed=true;return ok({id:9,rowVersion:4});}
  if(path==='/moderation/gray-zone-stories/9')return ok({itemId:9,storyVersionId:12,versionNo:1,title:'Truyện vùng xám đã che',content:'Nội dung để kiểm tra.',ageBand:'6-8',readingLevel:2,flags:null,rowVersion:4});
  if(path==='/moderation/gray-zone-stories/9/decision'){state.cleared=true;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,message:'Đã ghi nhận quyết định'})});}
  if(path==='/creator/stories')return ok(paged([{...draft,source:manual?'Manual':'Ai',status:state.creatorStatus}]));
  if(path==='/creator/stories/7')return ok({...draft,source:manual?'Manual':'Ai',status:state.creatorStatus});
  if(path==='/creator/stories/7/content/versions/12')return ok({versionId:12,storyId:7,versionNo:1,title:card.title,content:card.content,sourceDeclaration:'Original work',rightsDeclaration:'Rights confirmed',origin:'Write',createdAt:now});
  if(path==='/creator/stories/7/content/versions')return ok([]);
  if(path==='/creator/stories/7/manual/confirm-content'){state.creatorStatus='MediaProcessing';return ok({storyId:7,versionId:12,jobId:22,status:'MediaProcessing',jobStatus:'Pending',progressUrl:'/api/v1/stories/7/media/progress',packageUrl:'/api/v1/stories/7/media/package'},202);}
  if(path==='/stories/7/media/package')return ok({storyId:7,storyVersionId:12,packageRevision:state.mediaRevision??1,isGenerated:true,isAwaitingConfirmation:state.creatorStatus!=='Ready',isConfirmed:state.creatorStatus==='Ready',isReady:state.creatorStatus==='Ready',confirmedAt:null,confirmedByUserId:null,scenes:[{sceneId:1,sceneIndex:0,text:'Scene from the saved manual version.',illustrations:[{beatId:5,beatOrder:0,startOffset:0,endOffset:10,visualFocus:'Tranh kiểm thử',assetId:1,status:'Ready',url:null}],audio:[{segmentId:8,segmentOrder:0,text:'Đoạn nghe kiểm thử',assetId:2,status:'Ready',url:null,wordTimings:null}]}]});
  if(path==='/creator/ai-story-input/context')return ok({ageBand:'6-8',readingLevel:2,defaultLanguage:'vi',availableLanguages:['vi'],availableVocabularyLevels:['basic'],maximumLength:1000,requiredApprovalMode:'always_manual',safetyScoreThreshold:0.8,blockedCategoryCodes:[],availableOutputModes:['reading_media_only']});
  if(path==='/creator/stories/7/publication')return ok({storyId:7,versionId:12,isPublished:false,reviewStatus:state.submitted?'Pending':'None',openItemId:state.submitted?9:null,openItemType:state.submitted?'PublicStoryReview':null,openItemStatus:state.submitted?'Pending':null});
  if(path==='/stories/7/outline')return ok({storyId:7,storyStatus:state.creatorStatus,currentVersion:{id:12,versionNo:1,editType:'Initial',title:card.title,opening:'Mở đầu',development:'Diễn biến',ending:'Kết thúc',isCurrent:true,editorUserId:1,outlineApprovedAt:now,outlineApprovedByUserId:1,createdAt:now},activeOperation:null,activeJobStatus:null,lastErrorCode:null});
  if(path==='/stories/7/generation/progress')return ok({storyId:7,outputMode:'reading_media_only',storyStatus:state.creatorStatus,currentStep:'completed',content:'stable',vocabulary:'skipped',quiz:'skipped',discussion:'skipped',isComplete:true,lastErrorCode:null,qualityFailure:null,stableStoryVersionId:12,waitingForModeration:false});
  if(path==='/stories/7/review')return ok({storyId:7,outputMode:'reading_media_only',storyVersionId:12,storyStatus:state.creatorStatus,title:card.title,content:card.content,lesson:'Biết quan tâm',readabilityAlgorithm:'fixture',readabilityFkgl:null,readabilityFre:null,vocabulary:{},quiz:{},discussion:{},canEdit:true,canApprove:false,canConfirmContent:true,canArchive:false});
  if(path==='/stories/7/review/story')return ok({storyId:7,outputMode:'reading_media_only',versionId:12,title:card.title,content:card.content,lesson:'Biết quan tâm',readabilityAlgorithm:'fixture',readabilityFkgl:null,readabilityFre:null});
  if(path==='/stories/7/review/story/complete')return ok(true);
  if(path==='/stories/7/review/validation')return ok({canApprove:false,canConfirmContent:true,checks:[],issues:[]});
  if(path==='/creator/stories/7/generation/confirm-content'){state.creatorStatus='MediaProcessing';return ok({storyId:7,versionId:12,status:'MediaProcessing',confirmedAt:now});}
  if(path==='/stories/7/media/confirm'){assert.deepEqual(body,{storyVersionId:12,packageRevision:state.mediaRevision??1});state.creatorStatus='Ready';return ok({storyId:7,approvedStoryVersionId:12,storyStatus:'Ready',isReady:true,isConfirmed:true,packageRevision:state.mediaRevision??1,isAwaitingConfirmation:false});}
  if(path==='/stories/7/media/illustration-beats/5/regenerate'||path==='/stories/7/media/segments/8/regenerate'){assert.deepEqual(body,{storyVersionId:12,packageRevision:state.mediaRevision??1,expectedConfirmed:state.creatorStatus==='Ready'});state.mediaRevision=(state.mediaRevision??1)+1;state.creatorStatus='MediaReview';return route.fulfill({status:202,body:''});}
  if(path==='/stories/7/media/progress'){if(state.creatorStatus!=='Ready')state.creatorStatus='MediaReview';return ok({storyId:7,approvedStoryVersionId:12,storyStatus:state.creatorStatus,jobStatus:'Completed',sceneCount:1,readyIllustrations:1,readyAudio:1,isReady:state.creatorStatus==='Ready',isGenerated:true,isAwaitingConfirmation:state.creatorStatus==='MediaReview',isConfirmed:state.creatorStatus==='Ready',packageRevision:state.mediaRevision??1,confirmedAt:null,confirmedByUserId:null,errorCode:null,requiredIllustrations:1,missingIllustrationBeatIds:[],missingAudioSegmentIds:[],manualReviewAssetIds:[],scenesWithoutValidBeats:[]});}
  if(path==='/PublicStorySubmission/submit'){state.submitted=true;return ok({itemId:9,storyId:7,storyVersionId:12,status:'Pending',submittedAt:now});}
  if(path==='/ChildAccessCredential/easylogin/login')return ok({childProfileId:10,accessToken:'child-fixture',expiresInSeconds:3600});
  if(path==='/ChildAccessCredential/me')return ok({childProfileId:10,nickname:'Bé Sen',ageBand:'Age_6_8',avatarId:'frog',language:'vi'});
  if(path==='/MyRoadmap')return ok({open:null,upcoming:[],done:[],completedCount:5,totalCount:7,isFinished:false});
  if(path==='/child/manual-stories')return ok([{confirmationId:42,storyId:7,storyVersionId:12,childProfileId:10,preparationId:2,confirmedAt:now}]);
  if(path==='/child/manual-stories/42/package')return ok({preparationId:2,storyId:7,storyVersionId:12,childProfileId:10,audienceRevision:1,contextFingerprint:'fixture',title:'Truyện gia đình đã cấp quyền',language:'vi',experienceMode:'reading',segments:[{order:0,startOffset:0,endOffset:10,text:'Em đọc đúng bản đã được bố mẹ giao.'}],isReady:true,missingRequirements:[]});
  if(path==='/CommunityLibrary')return ok(paged([{submissionId:33,title:'Truyện cộng đồng',description:'Giới thiệu truyện',ageBand:'6-8',readingLevel:2,labels:[],author:'Cộng đồng',approvedAt:now}]));
  return route.fulfill({status:404,contentType:'application/json',body:JSON.stringify({success:false,message:'Fixture: chức năng không nằm trong smoke test.',data:null})});
 });
 try {console.log('Smoke',label);await page.goto(base,{waitUntil:'domcontentloaded'});await run({page,requests,state});assert.deepEqual(errors,[],`Runtime errors: ${errors.join('; ')}`);results.push({role:label,status:'passed',requests:requests.length});}
 finally {await writeFile(new URL(`${label}-requests.json`,output),JSON.stringify({requests,errors},null,2));await page.screenshot({path:new URL(`${label}.png`,output).pathname.replace(/^\/(\w:)/,'$1'),fullPage:true}).catch(()=>{});await context.close();}
}
async function confirmMediaInBrowser(page, regenerate=false) {
 await page.getByText('Ảnh và âm thanh thực tế',{exact:true}).click();
 await page.getByRole('button',{name:'Tải gói media mới nhất',exact:true}).click();
 if(regenerate){
  page.on('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Tạo lại giọng đọc đoạn này',exact:true}).click();
  await page.getByRole('button',{name:'Tải gói media mới nhất',exact:true}).click();
  await page.getByRole('button',{name:'Tạo lại tranh này',exact:true}).click();
  await page.getByRole('button',{name:'Tải gói media mới nhất',exact:true}).click();
 }
 assert(await page.getByRole('button',{name:'Xác nhận tranh và giọng đọc',exact:true}).isDisabled());
 await page.getByRole('checkbox',{name:'Tôi đã xem tranh và nghe các đoạn âm thanh của gói này',exact:true}).check();
 await page.getByRole('button',{name:'Xác nhận tranh và giọng đọc',exact:true}).click();
}
try {
 await fixture('Parent',async({page,requests,state})=>{
  page.on('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Tài khoản',exact:true}).click();
  await page.getByText('ProfileUpdated',{exact:false}).waitFor();
  await page.getByRole('button',{name:'Chọn gói',exact:true}).click();
  await page.getByText('FIXTURE17',{exact:true}).waitFor();
  await page.getByText('Các dịch vụ đã sẵn sàng.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Thông báo, 1 chưa đọc',exact:true}).click();
  await page.getByText('Có truyện mới trong lộ trình của con',{exact:true}).waitFor();
  assert.equal(state.notificationPushed,true);
  assert.deepEqual(requests.find(r=>r.path==='/Payment/transactions').body,{planId:4});
  assert(requests.some(r=>r.path==='/Auth/me/audit-log'));
  assert(!requests.some(r=>r.path.includes('/webhook/')));
 },false,'ParentAccount');
 await fixture('Parent',async({page,requests})=>{
  page.on('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Thư viện truyện',exact:true}).click();
  await page.getByRole('button',{name:'Truyện riêng',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Quản lý truyện riêng',exact:true});
  await dialog.getByLabel('Tên truyện',{exact:true}).fill('Truyện riêng fixture');
  await dialog.getByLabel('Nội dung',{exact:true}).fill('Bản truyện thuộc tài khoản kiểm thử.');
  await dialog.getByRole('button',{name:'Lưu truyện riêng',exact:true}).click();
  await dialog.getByText('Truyện #70',{exact:false}).waitFor();
  await dialog.getByLabel('Tên truyện',{exact:true}).fill('Truyện riêng đã sửa');
  await dialog.getByRole('button',{name:'Lưu truyện riêng',exact:true}).click();
  assert(await dialog.getByRole('button',{name:'Yêu cầu phát hành',exact:true}).isDisabled());
  await dialog.getByRole('spinbutton',{name:'Mã truyện riêng',exact:true}).fill('71');
  await dialog.getByRole('button',{name:'Mở theo mã',exact:true}).click();
  await dialog.getByRole('button',{name:'Yêu cầu phát hành',exact:true}).click();
  await dialog.getByRole('button',{name:'Xóa truyện riêng',exact:true}).click();
  await dialog.getByRole('button',{name:'Yêu cầu phát hành',exact:true}).waitFor({state:'detached'});
  assert.equal(requests.find(r=>r.path==='/Story'&&r.method==='POST').body.isAiGenerated,false);
  assert(requests.some(r=>r.path==='/Story/70'&&r.method==='PUT'));
  assert(!requests.some(r=>r.path==='/Story/70/publish'));
  assert(requests.some(r=>r.path==='/Story/71/publish'&&r.method==='PATCH'));
  assert(requests.some(r=>r.path==='/Story/71'&&r.method==='DELETE'));
 },false,'ParentPersonalStory');
 await fixture('Parent',async({page,requests})=>{
  await page.getByRole('button',{name:'Lộ trình của con',exact:true}).click();
  await page.getByText('Ếch con trong lộ trình',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Kho bộ truyện mẫu',exact:true}).click();
  await page.locator('.rm-template').filter({hasText:'Bộ khám phá'}).getByRole('button').click();
  await page.getByRole('button',{name:'Xem trước kế hoạch'}).click();
  await page.getByText('Kế hoạch sao chép',{exact:true}).waitFor();
  assert(!requests.some(r=>r.path.endsWith('/copy')));
  await page.getByRole('button',{name:'Thêm vào lộ trình',exact:true}).click();
  await page.getByRole('button',{name:'Xong',exact:true}).waitFor();
  assert.deepEqual(requests.find(r=>r.path.endsWith('/copy')).body,{childProfileIds:[10],position:'NextUp',daysPerStory:3});
  await page.getByRole('button',{name:'Xong',exact:true}).click();
  await page.getByRole('button',{name:'Thư viện truyện',exact:true}).click();
  await page.getByRole('button',{name:'Báo cáo nội dung',exact:true}).click();
  await page.getByRole('button',{name:'Gửi báo cáo',exact:true}).click();
  await page.getByText('Đã ghi nhận fixture',{exact:true}).first().waitFor();
  assert.equal(requests.find(r=>r.path==='/ContentReport').body.reason,'SafetyConcern');
 });
 await fixture('Moderator',async({page,requests})=>{
  await page.getByRole('button',{name:'Hàng đợi kiểm duyệt',exact:true}).click();
  await page.getByRole('button',{name:/Vùng xám #9/}).click();
  await page.getByRole('button',{name:'Nhận xử lý',exact:true}).click();
  await page.getByLabel('Trạng thái',{exact:true}).selectOption('Claimed');
  await page.getByRole('button',{name:/Vùng xám #9/}).click();
  await page.getByText('Truyện vùng xám đã che',{exact:true}).waitFor();
  await page.getByLabel('Lý do / ghi chú quyết định',{exact:true}).fill('Đã xem xét trong ngữ cảnh.');
  await page.getByRole('button',{name:'Cho phép tiếp tục',exact:true}).click();
  await page.getByText('Không có mục nào ở trang này.',{exact:true}).waitFor();
  assert.deepEqual(requests.find(r=>r.path.endsWith('/decision')).body,{decision:'Clear',reason:'Đã xem xét trong ngữ cảnh.',rowVersion:4});
  assert(!requests.some(r=>r.path==='/Story/7'));
 });
 await fixture('ContentCreator',async({page,requests})=>{
  await page.getByRole('button',{name:'Mở',exact:true}).click();
  await page.getByRole('button',{name:'Xác nhận nội dung và tạo media',exact:true}).waitFor();
  await page.getByRole('button',{name:'Xác nhận nội dung và tạo media',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Gửi bản hiện tại cho Moderator',exact:true}).count(),0);
  await confirmMediaInBrowser(page);
  await page.getByRole('button',{name:'Gửi bản hiện tại cho Moderator',exact:true}).click();
  await page.getByRole('button',{name:'Rút yêu cầu duyệt',exact:true}).waitFor();
  assert.deepEqual(requests.find(r=>r.path.endsWith('/generation/confirm-content')).body,{versionId:12});
  assert.deepEqual(requests.find(r=>r.path==='/PublicStorySubmission/submit').body,{storyId:7,storyVersionId:12});
  assert(!requests.some(r=>r.path==='/stories/7/review/approve'));
 });
 await fixture('ContentCreator',async({page,requests})=>{
  await page.getByRole('button',{name:'Mở',exact:true}).click();
  await page.getByRole('button',{name:'Chốt bản đã lưu và tạo media',exact:true}).click();
  await page.getByRole('button',{name:'Xem ảnh và nghe thử',exact:true}).click();
  await page.getByText('Scene from the saved manual version.',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Gửi bản hiện tại cho Moderator',exact:true}).count(),0);
  await confirmMediaInBrowser(page,true);
  await page.getByRole('button',{name:'Gửi bản hiện tại cho Moderator',exact:true}).click();
  await page.getByRole('button',{name:'Rút yêu cầu duyệt',exact:true}).waitFor();
  assert.deepEqual(requests.find(r=>r.path.endsWith('/manual/confirm-content')).body,{versionId:12,revisionToken:'r1'});
  assert.deepEqual(requests.find(r=>r.path.endsWith('/media/confirm')).body,{storyVersionId:12,packageRevision:3});
  assert(!requests.some(r=>r.path.includes('/outline')||r.path.includes('/parent/')));
 },true);
 await fixture('Moderator',async({page,requests})=>{
  page.on('dialog',d=>d.accept());
  await page.getByRole('button',{name:'Hướng dẫn sáng tác',exact:true}).click();
  await page.getByRole('button',{name:'Tạo bản nháp từ bản đang dùng',exact:true}).click();
  await page.getByLabel('Mã hướng dẫn',{exact:true}).fill('ending');
  await page.getByLabel('Tiêu đề',{exact:true}).fill('Kết thúc mới');
  await page.getByLabel('Lời hướng dẫn',{exact:true}).fill('Nêu một điều em đã hiểu.');
  await page.getByRole('button',{name:'Lưu hướng dẫn vào bản nháp',exact:true}).click();
  await page.getByRole('button',{name:'Xem trước danh sách',exact:true}).click();
  await page.getByRole('button',{name:'Phát hành bộ đã xem trước',exact:true}).click();
  await page.getByText('Bản đang phát hành: parent-vi-2',{exact:true}).waitFor();
  const root='/moderation/authoring-guides';
  assert(requests.some(r=>r.method==='PUT'&&r.path===`${root}/draft/items/ending`));
  assert.deepEqual(requests.find(r=>r.path===`${root}/draft/publish`).body,{revisionToken:'g3'});
  await page.getByRole('button',{name:'parent-vi-2 · Published',exact:true}).click();
  await page.getByRole('button',{name:'Tạo bản nháp từ phiên bản này',exact:true}).click();
  await page.getByRole('button',{name:'Hủy bản nháp',exact:true}).click();
  await page.getByRole('button',{name:'Tạo bản nháp từ bản đang dùng',exact:true}).waitFor();
  assert(requests.some(r=>r.method==='DELETE'&&r.path===`${root}/draft`));
 },false,'ModeratorGuides');
 await fixture('Parent',async({page,requests})=>{
  await page.getByRole('button',{name:'Studio tạo truyện',exact:true}).click();
  await page.getByRole('button',{name:'Tự soạn truyện',exact:true}).click();
  await page.getByRole('button',{name:'Ếch con khám phá #7',exact:true}).click();
  await page.getByRole('button',{name:'Kiểm tra bản đã lưu',exact:true}).click();
  for(const name of ['Đúng ý định của tôi','Phù hợp với bé','Đã kiểm tra thông tin riêng tư','Đã đọc phần kết'])await page.getByRole('checkbox',{name,exact:true}).check();
  await page.getByRole('button',{name:'Xác nhận nội dung',exact:true}).click();
  await page.getByRole('button',{name:'Tạo tranh và giọng đọc cho bản đã xác nhận',exact:true}).click();
  await confirmMediaInBrowser(page);
  await page.getByRole('button',{name:'Chuẩn bị gói đọc cho bản đã xác nhận',exact:true}).click();
  await page.getByRole('button',{name:'Tải bản xem trước',exact:true}).click();
  await page.getByRole('button',{name:'Giao đúng bản này cho bé đọc',exact:true}).click();
  await page.getByRole('button',{name:'Thu hồi quyền đọc bản đã giao',exact:true}).waitFor();
  assert.equal(requests.find(r=>r.path.endsWith('/manual/media/generate')).body.contentConfirmationId,44);
  assert(requests.some(r=>r.path==='/stories/7/media/confirm'));
  assert(requests.some(r=>r.path==='/parent/stories/7/family-confirmations'));
 },false,'ParentManualMedia');
 await fixture('Moderator',async({page})=>{
  await page.getByRole('button',{name:'Hướng dẫn sáng tác',exact:true}).click();
  await page.getByRole('button',{name:'Tạo bản nháp từ bản đang dùng',exact:true}).click();
  await page.getByLabel('Mã hướng dẫn',{exact:true}).fill('ending');
  await page.getByLabel('Tiêu đề',{exact:true}).fill('Bản đang soạn được giữ');
  await page.getByLabel('Lời hướng dẫn',{exact:true}).fill('Giữ khi server trả conflict.');
  await page.route('**/moderation/authoring-guides/draft/items/ending',r=>r.fulfill({status:409,contentType:'application/json',body:JSON.stringify({success:false,message:'GUIDE_CATALOG_CHANGED',data:null})}));
  await page.getByRole('button',{name:'Lưu hướng dẫn vào bản nháp',exact:true}).click();
  await page.getByText('Dữ liệu đã đổi hoặc chưa rõ kết quả thao tác. Đồng bộ trước khi sửa tiếp; nội dung đang soạn vẫn được giữ.',{exact:true}).waitFor();
  assert.equal(await page.getByLabel('Tiêu đề',{exact:true}).inputValue(),'Bản đang soạn được giữ');
  assert(await page.getByRole('button',{name:'Lưu hướng dẫn vào bản nháp',exact:true}).isDisabled());
  assert(await page.getByRole('button',{name:'Phát hành bộ đã xem trước',exact:true}).isDisabled());
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));
 },false,'GuideConflict');
 await fixture('ContentCreator',async({page,requests,state})=>{
  state.creatorStatus='MediaReview';
  await page.getByRole('button',{name:'Mở',exact:true}).click();
  await page.route('**/api/v1/stories/7/media/confirm',async r=>{
   const req=r.request();requests.push({path:'/stories/7/media/confirm',method:req.method(),body:req.postDataJSON()});state.mediaRevision=2;
   await r.fulfill({status:409,contentType:'application/json',body:JSON.stringify({success:false,message:'STALE_MEDIA_PACKAGE',data:null})});
  },{times:1});
  await confirmMediaInBrowser(page);
  await page.getByText('STALE_MEDIA_PACKAGE',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Gửi bản hiện tại cho Moderator',exact:true}).count(),0);
  assert.equal(await page.getByRole('button',{name:'Xác nhận tranh và giọng đọc',exact:true}).count(),0);
  await page.getByRole('button',{name:'Tải gói media mới nhất',exact:true}).click();
  await page.getByRole('checkbox',{name:'Tôi đã xem tranh và nghe các đoạn âm thanh của gói này',exact:true}).check();
  await page.getByRole('button',{name:'Xác nhận tranh và giọng đọc',exact:true}).click();
  await page.getByRole('button',{name:'Gửi bản hiện tại cho Moderator',exact:true}).waitFor();
  assert.deepEqual(requests.filter(r=>r.path.endsWith('/media/confirm')).map(r=>r.body.packageRevision),[1,2]);
 },true,'MediaConflict');
 await fixture('Administrator',async({page,requests})=>{
  await page.getByRole('button',{name:'Hướng dẫn sáng tác',exact:true}).click();
  await page.getByText('Bản đang phát hành: parent-vi-1',{exact:true}).waitFor();
  await page.getByRole('button',{name:'parent-vi-1 · Published',exact:true}).click();
  await page.getByRole('button',{name:'Tạo bản nháp từ phiên bản này',exact:true}).waitFor();
  assert(requests.some(r=>r.path==='/moderation/authoring-guides/versions/1'));
 },false,'AdministratorGuides');
 await fixture('Parent',async({page,requests,state})=>{
  await page.evaluate(()=>sessionStorage.setItem('ai-story-studio:v1:1:10',JSON.stringify({storyId:7,requestId:3})));
  await page.getByRole('button',{name:'Thư viện truyện',exact:true}).click();
  await page.locator('.card').filter({hasText:'Đêm Trung Thu đang tạo'}).click();
  const start=requests.length;
  await page.getByRole('button',{name:'Tiếp tục trong Studio',exact:true}).click();
  await page.getByText('Hai bạn cùng ngắm trăng.',{exact:true}).waitFor();
  assert.equal(new URL(page.url()).searchParams.get('storyId'),'88');
  assert.equal(new URL(page.url()).hash,'#studio');
  assert(!requests.slice(start).some(r=>r.path.startsWith('/ai-story-input')||r.path.startsWith('/stories/7/')));
  await page.getByRole('button',{name:'Về thư viện',exact:true}).click();
  await page.getByRole('button',{name:'Studio tạo truyện',exact:true}).click();
  await page.getByText('Hai bạn cùng ngắm trăng.',{exact:true}).waitFor();
  await page.evaluate(()=>sessionStorage.clear());
  await page.reload({waitUntil:'domcontentloaded'});
  await page.getByText('Hai bạn cùng ngắm trăng.',{exact:true}).waitFor();
  assert(!requests.slice(start).some(r=>r.method==='POST'&&r.path.includes('ai-story-input')));
  state.resumeStatus='MediaReview';
  await page.getByText('Hãy tải gói media, xem tranh, nghe giọng đọc rồi xác nhận.',{exact:true}).waitFor();
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));
 },false,'ParentResume');
 await fixture('Parent',async({page,requests})=>{
  await page.goto(`${base}/?storyId=88#studio`,{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Duyệt dàn ý và viết truyện',exact:true}).waitFor();
  assert(await page.locator('textarea').evaluateAll(nodes=>nodes.some(n=>n.value==='Một buổi tối trăng sáng.')));
  assert(!requests.some(r=>r.method==='POST'&&r.path.includes('ai-story-input')));
 },false,'ParentResumeOutline');
 await fixture('Parent',async({page,requests})=>{
  await page.route('**/api/v1/Story/88',r=>r.fulfill({status:403,contentType:'application/json',body:JSON.stringify({success:false,message:'Không có quyền mở truyện này.',data:null})}));
  const start=requests.length;
  await page.goto(`${base}/?storyId=88#studio`,{waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:'Chưa mở được truyện đang tạo',exact:true}).waitFor();
  await page.getByRole('alert').filter({hasText:'Không có quyền mở truyện này.'}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Tự soạn truyện',exact:true}).count(),0);
  assert(!requests.slice(start).some(r=>r.path.startsWith('/ai-story-input')));
 },false,'ParentResumeForbidden');
 await fixture('ChildSession',async({page,requests})=>{
  await page.goto(`${base}/?kid=fixture`,{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Mở truyện gia đình #7',exact:true}).click();
  await page.getByRole('heading',{name:'Truyện gia đình đã cấp quyền',exact:true}).waitFor();
  await page.getByText('Em đọc đúng bản đã được bố mẹ giao.',{exact:true}).waitFor();
  assert.equal(requests.find(r=>r.path==='/MyRoadmap').authorization,'Bearer child-fixture');
  assert.equal(requests.find(r=>r.path==='/child/manual-stories/42/package').authorization,'Bearer child-fixture');
  assert(!requests.some(r=>r.path.startsWith('/reading/sessions')));
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>document.documentElement.setAttribute('data-theme','dark'));
 });
 await writeFile(new URL('results.json',output),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
} finally {await browser.close();}
