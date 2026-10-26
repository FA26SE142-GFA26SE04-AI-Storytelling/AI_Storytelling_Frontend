import assert from 'node:assert/strict';

export async function exerciseMediaDiagnostics({page, requests, state, base, dark, output}) {
  state.resumeStatus = 'MediaProcessing';
  let cleared = false;
  const issues = [
    {sceneId:1,sceneIndex:0,assetId:41,type:'Illustration',targetId:2,itemNumber:2,status:'Failed',errorCode:'MEDIA_PROVIDER_TIMEOUT',attemptCount:3,nextRetryAt:null},
    {sceneId:2,sceneIndex:1,assetId:42,type:'TtsAudio',targetId:3,itemNumber:1,status:'Pending',errorCode:'GEMINI_TTS_HTTP_429',attemptCount:1,nextRetryAt:'2026-10-26T12:00:00Z'},
  ];
  const reply = (route,data) => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,message:'OK',data})});
  await page.route('**/api/v1/stories/88/media/progress', route=>reply(route, {
    storyId:88,approvedStoryVersionId:112,packageRevision:1,storyStatus:cleared?'MediaReview':'MediaProcessing',
    jobStatus:cleared?'Completed':'Failed',isReady:false,isGenerated:cleared,isAwaitingConfirmation:cleared,isConfirmed:false,
    sceneCount:2,requiredIllustrations:4,readyIllustrations:cleared?4:3,readyAudio:cleared?2:1,
    errorCode:cleared?null:'MEDIA_PROVIDER_TIMEOUT',issues:cleared?[]:issues,
  }));
  await page.route('**/api/v1/stories/88/media/package', route=>reply(route, {
    storyId:88,storyVersionId:112,packageRevision:1,isGenerated:cleared,isReady:false,isAwaitingConfirmation:cleared,isConfirmed:false,
    scenes:[0,1].map(i=>({sceneId:i+1,sceneIndex:i,text:`Nội dung cảnh ${i+1} để kiểm tra media.`,
      illustrations:[{beatId:i*2+1,beatOrder:1,assetId:i+100,status:'Queued',url:null},
        {beatId:i*2+2,beatOrder:2,assetId:41+i,status:i===0?'Failed':'Queued',url:null}],
      audio:[{segmentId:i+2,segmentOrder:0,assetId:42+i,status:i===1?'Failed':'Queued',url:null}],
    })),
  }));
  await page.goto(`${base}/?storyId=88#studio`,{waitUntil:'domcontentloaded'});
  const panel = page.getByRole('region',{name:'Các mục media cần kiểm tra'});
  await panel.getByRole('button',{name:'Cảnh 1 · Tranh 2',exact:true}).waitFor();
  if (dark) {
    await page.getByRole('button',{name:'Chuyển sang giao diện tối',exact:true}).click();
    await page.getByRole('button',{name:'Chuyển sang giao diện sáng',exact:true}).waitFor();
  }
  assert.equal(await page.locator('html').getAttribute('data-theme'),dark?'dark':'light');
  await panel.getByText('Xử lý quá thời gian chờ.',{exact:true}).waitFor();
  await panel.getByText('Đang chờ hệ thống tự thử lại.',{exact:true}).waitFor();
  await panel.getByRole('button',{name:'Cảnh 2 · Giọng đọc đoạn 1',exact:true}).click();
  await page.locator('.artlabel').getByText('Cảnh 2 / 2',{exact:true}).waitFor();
  await panel.getByText('Chi tiết kỹ thuật',{exact:true}).first().click();
  await panel.getByText('Mã: MEDIA_PROVIDER_TIMEOUT',{exact:false}).waitFor();
  await page.screenshot({path:new URL(`MediaDiagnostics-${dark?'dark':'light'}.png`,output).pathname.replace(/^\/(\w:)/,'$1'),fullPage:true});
  cleared = true;
  await page.getByRole('button',{name:'Tải lại ảnh và giọng đọc',exact:true}).click();
  await panel.waitFor({state:'detached'});
  assert(!requests.some(r=>r.method==='POST'&&r.path.includes('/media')));
}
