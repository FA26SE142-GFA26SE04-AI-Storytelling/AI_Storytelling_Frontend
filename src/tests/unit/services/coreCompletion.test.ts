import { afterEach,beforeEach,describe,expect,it,vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync,existsSync } from 'node:fs';
import { authService } from '@/app/services/authService';
import { profileLifecycleService as profiles } from '@/app/services/profileLifecycleService';
import { permissionService as permissions } from '@/app/services/permissionService';
import { paymentService as payments } from '@/app/services/paymentService';
import { storyManagementService as stories } from '@/app/services/storyManagementService';
import { contentCategoryService as categories } from '@/app/services/contentCategoryService';
import { moderationService } from '@/app/services/moderationService';
import { aiStoryCreationService as generation } from '@/app/services/aiStoryCreationService';
import { existingStoryService } from '@/app/services/existingStoryService';
let fetcher:ReturnType<typeof vi.fn>;
beforeEach(()=>{fetcher=vi.fn().mockImplementation(()=>Promise.resolve(new Response(JSON.stringify({success:true,message:'ok',data:null}))));vi.stubGlobal('fetch',fetcher);vi.spyOn(authService,'getStoredAccessToken').mockReturnValue('adult');});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllGlobals();});
describe('Remaining Core contracts',()=>{
 it.each([
  ['PATCH','/ChildProfile/10/restore',()=>profiles.restore(10)],
  ['DELETE','/LearningProfile/10',()=>profiles.removeLearning(10)],
  ['DELETE','/SafetyPolicy/10',()=>profiles.removeSafety(10)],
  ['GET','/SafetyPolicy/10/age-preset',()=>profiles.agePreset(10)],
  ['GET','/Permission',()=>permissions.catalog()],
  ['GET','/Permission/relationships/3',()=>permissions.list(3)],
  ['POST','/Permission/relationships/3/GenerateStory',()=>permissions.grant(3,'GenerateStory')],
  ['DELETE','/Permission/relationships/3/GenerateStory',()=>permissions.revoke(3,'GenerateStory')],
  ['GET','/ContentCategory/4',()=>categories.get(4)],
  ['DELETE','/ContentCategory/4',()=>categories.remove(4)],
  ['GET','/Payment/plans',()=>payments.plans()],
  ['DELETE','/Story/7',()=>stories.remove(7)],
  ['PATCH','/Story/7/publish',()=>stories.publish(7)],
 ] as const)('%s %s uses the adult session',async(method,route,run)=>{
  const r=await run();expect(r.success).toBe(true);
  expect(fetcher.mock.calls[0][0]).toMatch(new RegExp(route+'$'));
  expect(fetcher.mock.calls[0][1].method).toBe(method);
  expect(new Headers(fetcher.mock.calls[0][1].headers).get('Authorization')).toBe('Bearer adult');
 });
 it('paginates account and child audit separately and forwards cancellation',async()=>{
  const signal=new AbortController().signal;await profiles.accountAudit(2,signal);await profiles.childAudit(10,3,signal);
  expect(fetcher.mock.calls[0][0]).toMatch(/\/Auth\/me\/audit-log\?pageIndex=2&pageSize=20$/);
  expect(fetcher.mock.calls[1][0]).toMatch(/\/ChildProfile\/10\/audit-log\?pageIndex=3&pageSize=20$/);
  expect(fetcher.mock.calls[1][1].signal).toBe(signal);
 });
 it('creates configuration with POST, distinct from existing PUT updates',async()=>{
  const learning={readingLevel:2,readingMode:'ReadFirst' as const,comprehensionGoal:null,topics:[]};
  await profiles.createLearning(10,learning);expect(fetcher.mock.calls[0][1].method).toBe('POST');expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual(learning);
  const safety={maxStoryLength:1500,requiredApprovalMode:'AlwaysManual' as const,parentalGateEnabled:true,consentRecorded:true,categories:[]};
  await profiles.createSafety(10,safety);expect(fetcher.mock.calls[1][0]).toMatch(/\/SafetyPolicy\/10$/);expect(fetcher.mock.calls[1][1].method).toBe('POST');
 });
 it('does not create a payment while listing plans and preserves an uncertain failure',async()=>{
  await payments.plans();expect(fetcher).toHaveBeenCalledTimes(1);expect(fetcher.mock.calls[0][1].method).toBe('GET');
  fetcher.mockResolvedValueOnce(new Response(JSON.stringify({success:false,message:'try later',data:null}),{status:503}));
  const r=await payments.create(4);expect(r.success).toBe(false);expect(r.status).toBe(503);expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({planId:4});
 });
 it('keeps Story metadata and its parent-only CRUD route distinct from version authoring',async()=>{
  const body={title:'Truyen',content:'Noi dung',description:null,coverImageUrl:null,genre:null,moralLesson:null,ageBand:'6-8',language:'vi',isAiGenerated:false};
  await stories.create(body);await stories.update(7,body);
  expect(fetcher.mock.calls[0][0]).toMatch(/\/Story$/);expect(fetcher.mock.calls[0][1].method).toBe('POST');
  expect(fetcher.mock.calls[1][0]).toMatch(/\/Story\/7$/);expect(fetcher.mock.calls[1][1].method).toBe('PUT');
  expect(JSON.parse(fetcher.mock.calls[1][1].body).content).toBe(body.content);
 });
 it('treats auto-publish null as a successful unchanged state and pins cached evaluation',async()=>{
  expect((await generation.autoPublishCheck(7)).success).toBe(true);expect(fetcher.mock.calls[0][1].method).toBe('POST');
  await existingStoryService.evaluation(7,12);expect(fetcher.mock.calls[1][0]).toMatch(/\/stories\/7\/existing\/evaluation\?storyVersionId=12$/);
 });
 it('requests a scoped review view without changing moderation decisions',async()=>{
  const body={sourceTab:'roadmap_templates',storyId:null,storyVersionId:null,readingRoadmapId:8};await moderationService.grantReviewView(body);
  expect(fetcher.mock.calls[0][0]).toMatch(/\/ModerationQueue\/review-views$/);expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual(body);
 });
});
// Backend endpoints with a wrapper in app/services but no screen calling it yet (SERVICE_ONLY).
const SERVICE_ONLY_ENDPOINTS=['GET /api/v1/ChildProfile/{id}','POST /api/v1/stories/import','POST /api/v1/stories/import-file','POST /api/v1/stories/{storyId}/existing/evaluate','GET /api/v1/stories/{storyId}/existing/evaluation','POST /api/v1/stories/{storyId}/existing/adapt','PUT /api/v1/stories/{storyId}/existing/content','POST /api/v1/stories/{storyId}/existing/keep-original','POST /api/v1/stories/{storyId}/existing/archive','DELETE /api/v1/LearningProfile/{childProfileId}','POST /api/v1/parent/stories/{storyId}/imports/preview','POST /api/v1/parent/stories/{storyId}/imports/confirm','GET /api/v1/parent/wishes/{wishId}','DELETE /api/v1/SafetyPolicy/{childProfileId}','GET /api/v1/moderation/wish-cards/{id}'];
// Backend endpoints with no web wrapper at all yet (MISSING).
const MISSING_ENDPOINTS:string[]=[];
type AuditRow={method:string;route:string;disposition:string};
const BY_DISPOSITION=(rows:AuditRow[],disposition:string)=>rows.filter(r=>r.disposition===disposition).map(r=>r.method+' '+r.route);
it('has source evidence for every browser endpoint in the current controllers',()=>{
 if(existsSync('../../AI_Storytelling_Backend/src/Core/StoryPlatform.Api/Controllers')){
  // Without --check: the script exits 1 while any endpoint is unconnected.
  const output=execFileSync(process.execPath,['scripts/audit-core-api.mjs'],{encoding:'utf8',timeout:15000});
  const result=JSON.parse(output);expect(result.total).toBe(329);expect(result.connected).toBe(312);expect(result.excluded).toBe(2);
  // The script also writes every endpoint with its disposition; check each category on its own so a new
  // MISSING endpoint cannot hide behind a SERVICE_ONLY one that got a screen (or vice versa).
  const audit=JSON.parse(readFileSync('out/core-api-audit.json','utf8')) as AuditRow[];
  expect(BY_DISPOSITION(audit,'SERVICE_ONLY')).toEqual(SERVICE_ONLY_ENDPOINTS);
  expect(BY_DISPOSITION(audit,'MISSING')).toEqual(MISSING_ENDPOINTS);
  expect([...result.missing].sort()).toEqual([...SERVICE_ONLY_ENDPOINTS,...MISSING_ENDPOINTS].sort());
 }
 const manifest=JSON.parse(readFileSync('docs/core-api-coverage.json','utf8')) as AuditRow[];
 expect(manifest).toHaveLength(329);expect(new Set(manifest.map(r=>r.method+' '+r.route)).size).toBe(329);
 expect(BY_DISPOSITION(manifest,'SERVICE_ONLY')).toEqual(SERVICE_ONLY_ENDPOINTS);
 expect(BY_DISPOSITION(manifest,'MISSING')).toEqual(MISSING_ENDPOINTS);
 expect(manifest.filter(r=>r.disposition==='SERVER_TO_SERVER').map(r=>r.route)).toEqual(['/api/v1/Payment/webhook/sepay']);
});
