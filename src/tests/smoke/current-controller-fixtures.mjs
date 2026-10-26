import assert from 'node:assert/strict';
export async function currentControllerFixture({path,method,body,url,state,ok,draft,card,paged,now}) {
  const root = '/moderation/authoring-guides';
  if (path.startsWith(root)) {
    state.guides ??= {revision:1,draft:false,published:1,items:[{id:'opening',audienceRole:'Parent',purposes:['free'],supportGroup:'opening',itemType:'question',title:'Gợi ý mở đầu',instruction:'Hãy nhớ một buổi sáng.',example:null,templateText:null,placeholderDefinitions:[],order:1}]};
    const g = state.guides;
    const summary = (id,status) => ({versionId:id,versionNo:id,catalogVersion:`parent-vi-${id}`,status,itemCount:g.items.length,createdByUserId:1,createdAt:now,updatedByUserId:1,updatedAt:now,publishedByUserId:status==='Published'?1:null,publishedAt:status==='Published'?now:null});
    const detail = (id,status) => ({version:summary(id,status),schemaVersion:1,items:g.items});
    const token = () => `g${g.revision}`;
    const check = () => assert.equal(body?.revisionToken ?? url.searchParams.get('revisionToken'),token());
    const changed = async () => { g.revision++; return ok({revisionToken:token(),draft:summary(2,'Draft')}); };
    if (path===root) return ok({locale:'vi',audienceRole:'Parent',revisionToken:token(),published:detail(g.published,'Published'),draft:g.draft?detail(2,'Draft'):null});
    if (path===`${root}/versions`) return ok(paged([summary(g.published,'Published')]));
    if (/\/versions\/\d+$/.test(path)) return ok(detail(Number(path.split('/').at(-1)),'Published'));
    if (path===`${root}/draft` && method==='POST') { g.draft=true; return changed(); }
    if (path===`${root}/draft` && method==='DELETE') { check(); g.draft=false; g.revision++; return ok({revisionToken:token(),discardedVersionId:2,discardedCatalogVersion:'parent-vi-2'}); }
    if (path.includes('/draft/items/')) {
      check(); const id=decodeURIComponent(path.split('/').at(-1));
      g.items=g.items.filter(item=>item.id!==id);
      if (method==='PUT') g.items.push({...body,id,audienceRole:'Parent'});
      return changed();
    }
    if (path.endsWith('/draft/preview')) { check(); return ok({revisionToken:token(),page:body.guideId?null:{catalogVersion:'parent-vi-2',locale:'vi',pageIndex:1,pageSize:10,totalCount:g.items.length,items:g.items},render:body.guideId?{catalogVersion:'parent-vi-2',guideId:body.guideId,text:'Bản điền đã xem trước',isPlainText:true}:null}); }
    if (path.endsWith('/draft/publish')) { check(); g.published=2;g.draft=false;g.revision++;return ok({revisionToken:token(),published:summary(2,'Published')}); }
  }
  if (path.startsWith('/parent/stories')) {
    state.parent ??= {ops:[],prepared:false,granted:false}; const p=state.parent;
    const story = {...draft,source:'Manual',status:state.creatorStatus==='ContentReview'?'Draft':state.creatorStatus,revisionToken:'p1'};
    const detail = () => ({story,childProfileId:10,purpose:'free',isReadOnly:p.granted,canUseAiAssistance:!p.granted,aiUnavailableReason:p.granted?'PARENT_STORY_FINALIZED':null});
    const contentConfirmation = {confirmationId:44,storyVersionId:12,checkId:43,checklist:{intendedMeaning:true,suitableForChild:true,privacyChecked:true,endingChecked:true}};
    const preparation = () => ({preparationId:45,storyId:7,storyVersionId:12,childProfileId:10,audienceRevision:1,contextFingerprint:'fixture',title:'Truyện gia đình có media',language:'vi',experienceMode:'reading',segments:[{order:0,startOffset:0,endOffset:card.content.length,text:card.content}],isReady:state.creatorStatus==='Ready',missingRequirements:state.creatorStatus==='Ready'?[]:['MEDIA_PACKAGE_CONFIRMATION_REQUIRED'],mediaPackageRevision:state.mediaRevision??1});
    const op = (id,kind,result) => {p.ops.push({id,kind,storyVersionId:12,sourceIsCurrent:true,revokedAt:null,result});return result;};
    if(path==='/parent/stories')return ok(paged([story]));
    if(path==='/parent/stories/7')return ok(detail());
    if(path.endsWith('/workflow'))return ok(p.ops);
    if(path.endsWith('/content/versions'))return ok([{versionId:12,storyId:7,versionNo:1,title:card.title,content:card.content,sourceDeclaration:'Gia đình tự viết',rightsDeclaration:'Dùng trong gia đình',origin:'Write',createdAt:now}]);
    if(path.endsWith('/content/checks'))return ok(op(43,'Check',{checkId:43,storyVersionId:12,contextFingerprint:'fixture',canPrepare:true,errors:[],warnings:[],coverage:'Đã kiểm tra bản lưu'}));
    if(path.endsWith('/content/confirm'))return ok(op(44,'ContentConfirmation',contentConfirmation));
    if(path.endsWith('/manual/media/generate')){assert.equal(body.baseVersionId,12);assert.equal(body.contentConfirmationId,44);assert(body.operationId);state.creatorStatus='MediaProcessing';return ok(op(46,'MediaGeneration',{storyId:7,storyVersionId:12,jobId:2,packageRevision:1,progressUrl:'/api/v1/stories/7/media/progress',packageUrl:'/api/v1/stories/7/media/package'}),202);}
    if(path.endsWith('/preparations')){p.prepared=true;return ok(op(45,'Preparation',preparation()),201);}
    if(path.endsWith('/preparations/45'))return ok(preparation());
    if(path.endsWith('/family-confirmations')){assert.equal(state.creatorStatus,'Ready');p.granted=true;return ok(op(47,'FamilyConfirmation',{confirmationId:47,storyId:7,storyVersionId:12,childProfileId:10,preparationId:45,confirmedAt:now}),201);}
  }
  return false;
}
