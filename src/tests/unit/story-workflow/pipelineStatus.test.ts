import {describe,it,expect} from 'vitest';
import {snapshotStage,pipelineFailure,keepSnapshotPolling,type StatusSnapshot} from '@/app/features/story-workflow/generationSnapshot';
import type {ContentGenerationProgressDto,OutlineProgressDto} from '@/app/types/aiStory';
const snapshot=(step='generating_content'):StatusSnapshot=>({
 outline:{storyId:7,storyStatus:'OutlineReview',activeOperation:null,activeJobStatus:null,lastErrorCode:'OUTLINE_GENERATION_FAILED',currentVersion:{id:12,versionNo:1,isCurrent:true,outlineApprovedAt:'2026-10-26'}} as OutlineProgressDto,
 generation:{storyId:7,storyStatus:'OutlineReview',currentStep:step,isComplete:false,lastErrorCode:null,content:'processing'} as ContentGenerationProgressDto,
});
describe('Backend-driven pending/running/terminal generation status',()=>{
 it.each(['pending_content','generating_content','generating_vocabulary'])('ignores an old outline error during %s',step=>{
  const s=snapshot(step);expect(snapshotStage(s,false)).toBe('generating');
  expect(pipelineFailure(s,'generating')).toBeNull();expect(keepSnapshotPolling(s)).toBe(true);
 });
 it.each(['Pending','Processing','pending','processing'])('holds at outline when regenerate is %s, despite local approval or an earlier failure',activeJobStatus=>{
  const s=snapshot();s.generation=null;s.outline={...s.outline!,activeOperation:'RegenerateOutline',activeJobStatus,currentVersion:{...s.outline!.currentVersion!,outlineApprovedAt:null}};
  expect(snapshotStage(s,true)).toBe('outline_wait');expect(pipelineFailure(s,'outline_wait')).toBeNull();expect(keepSnapshotPolling(s,true)).toBe(true);
 });
 it('uses content progress when outline response has not yet recorded approval',()=>{
  const s=snapshot();s.outline!.currentVersion!.outlineApprovedAt=null;
  expect(snapshotStage(s,false)).toBe('generating');expect(pipelineFailure(s,'generating')).toBeNull();
 });
 it('waits for an active content job even if an earlier version was in review',()=>{
  const s=snapshot();s.outline!.storyStatus='ContentReview';
  expect(snapshotStage(s,false)).toBe('generating');expect(keepSnapshotPolling(s)).toBe(true);
 });
 it('only reports a failed current content job and stops automatic polling',()=>{
  const s=snapshot('failed_content');s.generation!.lastErrorCode='CONTENT_SCHEMA_INVALID';
  expect(pipelineFailure(s,'generating')).toEqual({kind:'generation',code:'CONTENT_SCHEMA_INVALID'});
  expect(keepSnapshotPolling(s)).toBe(false);
 });
 it('does not mistake historical error text or a missing result for a terminal failure',()=>{
  const s=snapshot();s.generation!.lastErrorCode='OLD_ERROR';
  expect(pipelineFailure(s,'generating')).toBeNull();s.generation=null;
  expect(pipelineFailure(s,'generating')).toBeNull();expect(pipelineFailure(null,'outline_wait')).toBeNull();
 });
 it('reports a terminal initial outline failure while preserving the phase',()=>{
  const s=snapshot();s.generation=null;s.outline!.currentVersion=null;s.outline!.storyStatus='Draft';
  expect(snapshotStage(s,false)).toBe('outline_wait');expect(pipelineFailure(s,'outline_wait')).toEqual({kind:'outline',code:'OUTLINE_GENERATION_FAILED'});expect(keepSnapshotPolling(s)).toBe(false);
 });
 it('does not expose old failures after completion or while waiting for moderation',()=>{
  const s=snapshot('failed_content');s.generation!.lastErrorCode='OLD';s.generation!.waitingForModeration=true;
  expect(snapshotStage(s,false)).toBe('moderation');expect(pipelineFailure(s,'moderation')).toBeNull();
  s.generation!.waitingForModeration=false;s.outline!.storyStatus='ContentReview';s.generation!.isComplete=true;
  expect(snapshotStage(s,false)).toBe('review');expect(pipelineFailure(s,'review')).toBeNull();
 });
});
