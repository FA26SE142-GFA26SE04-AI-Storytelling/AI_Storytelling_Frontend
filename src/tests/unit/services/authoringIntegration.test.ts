import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { authService } from '@/app/services/authService';
import { parentAuthoringService } from '@/app/services/parentAuthoringService';
import { parentAssistanceService } from '@/app/services/parentAssistanceService';
import { creatorAssistanceService } from '@/app/services/creatorAssistanceService';
import { childManualService } from '@/app/services/childManualService';
import { authoringGuideService } from '@/app/services/authoringGuideService';
import { creatorPublicationService } from '@/app/services/creatorPublicationService';
import { roadmapTemplateService } from '@/app/services/roadmapTemplateService';
let fetcher: ReturnType<typeof vi.fn>;
beforeEach(() => { fetcher=vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({success:true,message:'',data:null}))));vi.stubGlobal('fetch',fetcher);vi.spyOn(authService,'getStoredAccessToken').mockReturnValue('adult'); });
afterEach(() => {vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('Manual authoring contracts and actor boundaries', () => {
  it('confirms Creator Manual with the saved version and revision, never Parent confirmation', async () => {
    await creatorPublicationService.confirmManual(7,{ versionId:12,revisionToken:'r1' });
    expect(fetcher.mock.calls[0][0]).toMatch(/\/creator\/stories\/7\/manual\/confirm-content$/);
    expect(fetcher.mock.calls[0][1].method).toBe('POST');
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({versionId:12,revisionToken:'r1'});
  });

  it('pins version, revision and confirmation through the Parent family grant flow', async () => {
    const cmd={operationId:'stable-op',revisionToken:'r1',baseVersionId:12};
    await parentAuthoringService.confirmContent(7,{...cmd,checkId:2,checklist:{intendedMeaning:true,suitableForChild:true,privacyChecked:true,endingChecked:true}});
    expect(fetcher.mock.calls[0][0]).toMatch(/\/parent\/stories\/7\/content\/confirm$/);
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({...cmd,checkId:2});
    await parentAuthoringService.confirmFamily(7,{...cmd,preparationId:3}); expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({...cmd,preparationId:3});
    await parentAuthoringService.revokeFamily(7,{...cmd,confirmationId:4}); expect(fetcher.mock.calls[2][0]).toMatch(/\/family-confirmations\/revoke$/);
  });
  it('uses confirmationId for child package, never adult auth or storyId', async () => {
    await childManualService.package('child',42);
    expect(fetcher.mock.calls[0][0]).toMatch(/\/child\/manual-stories\/42\/package$/);
    expect(new Headers(fetcher.mock.calls[0][1].headers).get('Authorization')).toBe('Bearer child');
  });
  it('keeps parent and Creator assistance URLs separate and preserves task revision/idempotency key', async () => {
    const body={operationId:'same-op',expectedTaskRevision:3,answerStepId:2};
    await parentAssistanceService.suggestions(7,9,body); await creatorAssistanceService.suggestions(7,9,body);
    expect(fetcher.mock.calls[0][0]).toMatch(/\/parent\/stories\/7\/assistance-tasks\/9\/suggestions$/);
    expect(fetcher.mock.calls[1][0]).toMatch(/\/creator\/stories\/7\/assistance-tasks\/9\/suggestions$/);
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual(body);
    await creatorAssistanceService.list(7,2); expect(fetcher.mock.calls[2][0]).toMatch(/assistance-tasks\?pageIndex=2&pageSize=20$/);
  });
  it('keeps multipart headers, guide string ids and template archive reasons', async () => {
    const form=new FormData();form.append('RevisionToken','r1');form.append('OperationId','same-op');form.append('File',new Blob(['test']),'story.txt');
    await parentAuthoringService.previewFile(7,form); expect(fetcher.mock.calls[0][1].body).toBe(form);expect(new Headers(fetcher.mock.calls[0][1].headers).has('Content-Type')).toBe(false);
    await authoringGuideService.render('guide/name',{values:{nickname:'ếch'}}); expect(fetcher.mock.calls[1][0]).toMatch(/\/authoring-guides\/guide%2Fname\/render$/);
    await roadmapTemplateService.archive(3,'Cần chỉnh sửa');expect(JSON.parse(fetcher.mock.calls[2][1].body)).toEqual({reason:'Cần chỉnh sửa'});
  });
});
