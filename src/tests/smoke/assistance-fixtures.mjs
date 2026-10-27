import assert from 'node:assert/strict';
export async function assistanceFixture({path,method,body,state,ok,paged,draft,card,caseName,now,route}) {
 if(!caseName?.includes('Assistance'))return false;
 const manual=caseName.includes('Manual'),parent=caseName.startsWith('Parent'),root=`/${parent?'parent':'creator'}/stories`;
 const s=state.assistance ??= {version:12,token:parent&&manual?'p1':'r1',title:card.title,content:card.content,task:null,steps:[]};
 const story=()=>({...draft,selectedVersionId:s.version,revisionToken:s.token,title:s.title,source:manual?'Manual':'Ai',status:manual?'Draft':'ContentReview'});
 const version=()=>({versionId:s.version,storyId:7,versionNo:s.version-11,title:s.title,content:s.content,lesson:'Biết quan tâm',readabilityAlgorithm:'fixture',readabilityFkgl:null,readabilityFre:null,sourceDeclaration:'Tự viết',rightsDeclaration:'Quyền sử dụng hợp lệ',origin:'Write',createdAt:now});
 if(path===root)return ok(paged([story()]));
 if(path===`${root}/7`)return ok(parent&&manual?{story:story(),childProfileId:10,purpose:'free',isReadOnly:false,canUseAiAssistance:true}:story());
 if(path===`${root}/7/content/versions`)return ok([version()]);
 if(path.startsWith(`${root}/7/content/versions/`))return ok(version());
 if(path==='/Story/7')return ok({...card,status:'ContentReview',childProfileId:10,scope:'Parent'});
 if(path==='/stories/7/review')return ok({...version(),storyVersionId:s.version,storyStatus:'ContentReview',outputMode:'reading_media_only',assistanceRevisionToken:s.token,canEdit:true,canApprove:false,canConfirmContent:true,canArchive:false,vocabulary:{},quiz:{},discussion:{}});
 if(path==='/stories/7/review/story'&&method==='GET')return ok({...version(),outputMode:'reading_media_only'});
 if(path===`${root}/7/manual/versions`||path==='/stories/7/review/story'&&method==='PUT'){
  assert.deepEqual(body.assistanceReferences,[{taskId:91,stepId:3,usage:'TrialUsed'}]);
  assert(body.content.includes('Hai bạn cùng làm hòa.'));s.version=13;s.token='saved-r2';s.title=body.title;s.content=body.content;
  return ok(manual?{story:story(),version:version()}:{...version(),outputMode:'reading_media_only'});
 }
 const base=`${root}/7/assistance-tasks`;
 if(!path.startsWith(base))return false;
 const result=(type)=>({resultType:type,question:null,options:type==='Options'?[{id:'a',summary:'Cùng hợp tác',direction:'Hai bạn cùng làm hòa.'},{id:'b',summary:'Kiên nhẫn',direction:'Cùng chờ đợi.'}]:[],findings:[],warnings:[],patch:type==='Trial'?{kind:s.task.target.kind==='selection'?'replace':'insert',start:s.task.target.start,length:s.task.target.length,text:' Hai bạn cùng làm hòa.',quote:s.task.snapshot.content.slice(s.task.target.start,s.task.target.start+s.task.target.length)}:null});
 const step=(id,kind)=>({stepId:id,sequence:id,operationId:body?.operationId??'fixture',kind,status:'Succeeded',resultingTaskRevision:s.task.taskRevision,errorCode:null,result:kind==='Trial'?result('Trial'):null,direction:null,createdAt:now});
 const receipt=(id,kind,running=false)=>({taskId:91,stepId:id,taskRevision:s.task.taskRevision,status:s.task.status,isRunning:running,step:{...step(id,kind),status:running?'Running':'Succeeded'},pollUrl:running?`${base}/91`:null,snapshotHash:'fixture'});
 if(path===base&&method==='POST'){
  assert.equal(body.baseVersionId,12);assert.equal(body.revisionToken,s.token);assert(body.operationId);assert(body.editorSnapshot.content.includes('Bản nháp chưa lưu'));
  s.task={taskId:91,storyId:7,entryPoint:body.entryPoint,status:'Open',taskRevision:1,sourceVersionId:12,sourceRevisionToken:s.token,audienceRevision:1,snapshotHash:'fixture',snapshot:body.editorSnapshot,target:body.target,storyContextStale:false,audienceContextStale:false,currentStoryRevisionToken:s.token,currentAudienceRevision:1,activeOperation:null,activeClarificationStepId:null,acceptedAnswerStepId:null,activeOptionsStepId:null,activeReviewStepId:null,activeDirectionStepId:null,activeTrialStepId:null,activeDirection:null,activeTrial:null,parentTaskId:null,sourceReviewStepId:null,findingId:null,activeResult:null,goal:body.goal};return ok(s.task,201);
 }
 if(path===base)return ok(paged(s.task?[{taskId:91,entryPoint:s.task.entryPoint,status:s.task.status,taskRevision:s.task.taskRevision,createdAt:now}]:[]));
 if(path.endsWith('/steps'))return ok(paged(s.steps));
 if(path===`${base}/91`){
  if(s.pending&&s.polls++>0){const kind=s.pending;s.pending=null;s.task.activeOperation=null;s.task.taskRevision++;
   if(kind==='Suggestions'){s.task.status='OptionsReady';s.task.activeOptionsStepId=1;s.task.activeResult=result('Options');}
   else {s.task.status='TrialReady';s.task.activeTrialStepId=3;s.task.activeTrial={...step(3,'Trial'),result:result('Trial')};}
  }return ok(s.task);
 }
 assert.equal(body.expectedTaskRevision,s.task.taskRevision);assert(body.operationId);
 if(caseName.endsWith('Retry')&&path.endsWith('/suggestions')){
  if(!s.retryBody){s.retryBody=body;return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({success:false,message:'Chưa xác định kết quả yêu cầu.',data:null})});}
  assert.deepEqual(body,s.retryBody);
 }
 if(path.endsWith('/suggestions')||path.endsWith('/trials')){const kind=path.endsWith('/trials')?'Trial':'Suggestions';s.pending=kind;s.polls=0;s.task.taskRevision++;s.task.activeOperation={operationId:body.operationId,stepId:kind==='Trial'?3:1,status:'Running',leaseExpiresAt:'2099-01-01T00:00:00Z'};return ok(receipt(kind==='Trial'?3:1,kind,true),202);}
 if(path.endsWith('/direction')){assert.equal(body.optionsStepId,1);s.task.taskRevision++;s.task.status='DirectionConfirmed';s.task.activeDirectionStepId=2;return ok(receipt(2,'Direction'));}
 return false;
}

export async function exerciseAssistance({page,requests,manual,parent,stale=false,retry=false}) {
 if(parent&&manual){await page.getByRole('button',{name:'Studio tạo truyện',exact:true}).click();await page.getByRole('button',{name:'Tự soạn truyện',exact:true}).click();await page.getByRole('button',{name:'Ếch con khám phá #7',exact:true}).click();}
 else if(parent){await page.goto(new URL('/?storyId=7#studio',page.url()).href,{waitUntil:'domcontentloaded'});}
 else await page.getByRole('button',{name:'Mở',exact:true}).click();
 if(!manual)await page.getByRole('button',{name:'Tự sửa bản thảo',exact:true}).click();
 const content=page.locator('textarea[rows="12"], textarea[rows="14"], textarea[rows="18"]').first();
 await content.fill('Bản nháp chưa lưu. Mi tìm thấy hộp.');
 const panel=page.getByRole('region',{name:'AI gợi ý theo bản nháp',exact:true});
 if(stale){await content.focus();await content.press('Home');for(let i=0;i<8;i++)await content.press('Shift+ArrowRight');await panel.getByRole('combobox').selectOption('SupportSelection');}
 await panel.getByPlaceholder('Ví dụ: Gợi ý cách để hai nhân vật làm hòa, giữ giọng kể nhẹ nhàng.').fill('Giúp hai bạn làm hòa');
 await panel.getByRole('button',{name:'Yêu cầu AI gợi ý theo bản nháp',exact:true}).click();
 if(retry){const repeat=panel.getByRole('button',{name:'Thử lại cùng lệnh chưa rõ kết quả',exact:true});await repeat.waitFor();assert(await panel.getByRole('button',{name:'Yêu cầu AI gợi ý theo bản nháp',exact:true}).isDisabled());await repeat.click();}
 await panel.getByRole('button',{name:'Xác nhận hướng này',exact:true}).first().click();
 await panel.getByRole('button',{name:'Tạo bản viết thử theo hướng đã chọn',exact:true}).click();
 const apply=panel.getByRole('button',{name:'Đưa bản thử vào phần đang sửa',exact:true});await apply.waitFor();
 if(stale){await content.fill('Đã thay đổi bản nháp.');assert(await apply.isDisabled());assert(!requests.some(r=>r.method==='PUT'&&r.path.endsWith('/review/story')||r.method==='POST'&&r.path.endsWith('/manual/versions')));return;}
 await apply.click();assert((await content.inputValue()).includes('Hai bạn cùng làm hòa.'));
 const save=manual?(parent?'Lưu phiên bản':'Lưu phiên bản mới'):'Lưu bản sửa';
 await Promise.all([page.waitForResponse(r=>r.request().method()===(manual?'POST':'PUT')&&r.url().includes(manual?'/manual/versions':'/review/story')),page.getByRole('button',{name:save,exact:true}).click()]);
 const root=`/${parent?'parent':'creator'}/stories/7/assistance-tasks`;
 assert(requests.some(r=>r.path===root&&r.body?.editorSnapshot.content.startsWith('Bản nháp chưa lưu')));
 assert(requests.some(r=>r.path===`${root}/91/trials`));
 assert(!requests.some(r=>r.path.startsWith(`/${parent?'creator':'parent'}/stories/7/assistance-tasks`)));
}
