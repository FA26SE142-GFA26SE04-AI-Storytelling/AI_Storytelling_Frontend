import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest } from '@/app/services/apiClient';
import { authService } from '@/app/services/authService';
import { guardianService } from '@/app/services/guardianService';
import { roadmapService } from '@/app/services/roadmapService';
import { creatorPublicationService } from '@/app/services/creatorPublicationService';
import { moderationService } from '@/app/services/moderationService';
import { groupStages, mergeRoadmapResults, moveInLayout } from '@/app/services/roadmapAdapters';
import { parseLibraryPick } from '@/app/features/learning/learningIntent';
import { rubricService } from '@/app/services/rubricService';
const response = (data: unknown, status = 200) => new Response(JSON.stringify({ success: status < 400, message: '', data }), { status });
let fetcher: ReturnType<typeof vi.fn>;
beforeEach(() => { fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher); vi.spyOn(authService, 'getStoredAccessToken').mockReturnValue('adult'); vi.spyOn(authService, 'getStoredRefreshToken').mockReturnValue('adult-refresh'); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe('Transport isolation and response contracts', () => {
  it('keeps adult credentials when refresh temporarily fails', async () => {
    fetcher.mockResolvedValueOnce(new Response('', { status: 401 })).mockResolvedValueOnce(response(null, 503));
    const clear = vi.spyOn(authService, 'clearStoredAuth');
    const r = await apiRequest('/Auth/me', 'Không thể kiểm tra phiên');
    expect(r.success).toBe(false); expect(r.status).toBe(503);
    expect(clear).not.toHaveBeenCalled(); expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('does not refresh or replay child requests with an adult token on 401', async () => {
    fetcher.mockResolvedValue(new Response('', { status: 401 }));
    const refresh = vi.spyOn(authService, 'refreshToken');
    const clear = vi.spyOn(authService, 'clearStoredAuth');
    const r = await apiRequest('/MyRoadmap', 'Hết phiên', { session: 'child', token: 'child' });
    expect(r.status).toBe(401); expect(r.success).toBe(false); expect(refresh).not.toHaveBeenCalled(); expect(clear).not.toHaveBeenCalled();
    expect(new Headers(fetcher.mock.calls[0][1].headers).get('Authorization')).toBe('Bearer child'); expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('does not substitute an adult token when a child token is missing', async () => {
    expect((await apiRequest('/MyRoadmap','', { session: 'child' })).status).toBe(401); expect(fetcher).not.toHaveBeenCalled();
  });
  it('preserves progress on HTTP error and never trusts success=true on HTTP failure', async () => {
    fetcher.mockResolvedValue(new Response(JSON.stringify({ success: true, message: 'Chờ', data: { storyId: 7, canRetry: true } }), { status: 409 }));
    const r = await apiRequest('/anything',''); expect(r.success).toBe(false); expect(r.status).toBe(409); expect(r.data).toEqual({ storyId: 7, canRetry: true });
  });
  it('accepts explicit empty 202, rejects malformed successful JSON, preserves false and zero', async () => {
    fetcher.mockResolvedValueOnce(new Response('',{ status: 202 })).mockResolvedValueOnce(new Response('<html>error</html>')).mockResolvedValueOnce(response(false)).mockResolvedValueOnce(response(0));
    expect((await apiRequest('/media','', { emptyResponse: true })).success).toBe(true);
    expect((await apiRequest('/data','')).success).toBe(false); expect((await apiRequest('/false','')).data).toBe(false); expect((await apiRequest('/zero','')).data).toBe(0);
  });
  it('handles a decision without data and forwards AbortSignal', async () => {
    const signal = new AbortController().signal; fetcher.mockResolvedValue(new Response(JSON.stringify({ success: true, message: 'Đã ghi nhận' })));
    const r = await apiRequest('/decision','',{ signal }); expect(r.success).toBe(true); expect(r.data).toBeNull(); expect(fetcher.mock.calls[0][1].signal).toBe(signal);
  });
});
describe('Backend flow contracts', () => {
  it('maps roadmap request and per-child outcomes without falling back to local', async () => {
    fetcher.mockResolvedValueOnce(response({ results: [ { childProfileId: 10, outcome: 'Added', itemId: 55, warnings: ['level'], skipCode: null, message: null }, { childProfileId: 11, outcome: 'Skipped', itemId: null, warnings: [], skipCode: 'no_permission', message: 'Thiếu quyền' } ] })).mockResolvedValueOnce(new Response('',{ status: 403 }));
    const children = [10,11].map(id => ({ id, nickname: String(id), ageBand: '6-8', status: 'Active', maxStoryLength: 1000 }));
    const r = await guardianService.addToRoadmap(children,{ storyId: 7,title: 'Truyện',ageBand:'6-8',length:100 },'next',7,'Ghi chú');
    expect(fetcher.mock.calls[0][0]).toMatch(/\/ChildRoadmap\/stories$/); expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ storyId:7,childProfileIds:[10,11],position:'NextUp',expectedDays:7,note:'Ghi chú' });
    expect(r.data?.added).toEqual([{childProfileId:10,itemId:55,moved:false}]); expect(r.data?.skipped[0].childProfileId).toBe(11); expect(r.data?.warnings).toEqual([{childProfileId:10,nickname:'10',text:'level'}]);
    expect((await guardianService.clearRoadmap(10)).success).toBe(false);
  });
  it('sends stage choices and grouped order, and groups items into stages', async () => {
    fetcher.mockResolvedValue(response({ results: [{ childProfileId: 10, outcome: 'Moved', itemId: 5, warnings: [], skipCode: null, message: null }] }));
    const kid = [{ id: 10, nickname: '10', ageBand: '6-8', status: 'Active', maxStoryLength: 1000 }];
    const r = await guardianService.addToRoadmap(kid, { storyId: 7, title: 'Truyện', ageBand: '6-8', length: 100 }, 'next', null, null, 2);
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({ storyId: 7, childProfileIds: [10], position: 'Stage', stageNumber: 2, expectedDays: null, note: null });
    expect(r.data?.added).toEqual([{ childProfileId: 10, itemId: 5, moved: true }]);
    await guardianService.reorderRoadmap(10, [[3, 4], [5]]);
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ stages: [[3, 4], [5]] });
    const item = (id: number, position: number, status: 'completed' | 'open' | 'queued') => ({ id, childProfileId: 10, storyId: id, title: `T${id}`, position, status, source: 'parent' as const, sourceTemplateId: null, note: null, dueDays: null, dueAt: null, openedAt: null, completedAt: null, skipReason: undefined, isStoryAvailable: true });
    const stages = groupStages([item(1, 1, 'completed'), item(2, 2, 'completed'), item(3, 2, 'open'), item(4, 3, 'queued'), item(5, 3, 'queued')]);
    expect(stages.map(s => [s.number, s.status, s.items.map(i => i.id)])).toEqual([[1, 'done', [1]], [2, 'current', [2, 3]], [3, 'next', [4, 5]]]);
  });
  it('uses DELETE for clear, preview before copy and correct child context', async () => {
    fetcher.mockResolvedValue(response(null));
    await roadmapService.clear(10); expect(fetcher.mock.calls[0][0]).toMatch(/\/ChildRoadmap\/10\/items$/); expect(fetcher.mock.calls[0][1].method).toBe('DELETE');
    await roadmapService.preview(2,{ childProfileIds:[10], position:'End', daysPerStory:3 }); expect(fetcher.mock.calls[1][0]).toMatch(/\/RoadmapLibrary\/2\/preview$/);
    await roadmapService.mine('child'); expect(fetcher.mock.calls[2][0]).toMatch(/\/MyRoadmap$/); expect(new Headers(fetcher.mock.calls[2][1].headers).get('Authorization')).toBe('Bearer child');
  });
  it('maps report reasons', async () => {
    fetcher.mockResolvedValueOnce(response({ reportId:8,storyId:7,reason:'SafetyConcern',status:'Pending',createdAt:'2026-10-21T00:00:00Z' }));
    const r = await guardianService.reportStory(7,'safety_concern','Xem lại'); expect(r.data?.id).toBe(8); expect(fetcher.mock.calls[0][0]).toMatch(/\/ContentReport$/); expect(JSON.parse(fetcher.mock.calls[0][1].body).reason).toBe('SafetyConcern');
  });
  it('pins version for Creator submission and uses separate confirmation/removal APIs', async () => {
    fetcher.mockResolvedValue(response(null)); await creatorPublicationService.submit(7,12,[1,5]); expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({storyId:7,storyVersionId:12,contentCategoryIds:[1,5]});
    await creatorPublicationService.revision(7,12); expect(fetcher.mock.calls[1][0]).toMatch(/\/creator\/stories\/7\/revisions$/); expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({sourceVersionId:12});
    await moderationService.removalDecision(9,{approve:true,reason:'Gỡ',rowVersion:4}); expect(fetcher.mock.calls[2][0]).toMatch(/\/moderation\/public-story-removals\/9\/decision$/);
  });
  it('loads the specialized package, checks gray-zone rowVersion and rubric revision', async () => {
    fetcher.mockResolvedValue(response({ itemId:9 }));
    await moderationService.grayDecision(9,{decision:'Clear',reason:'Đã xem',rowVersion:3}); expect(JSON.parse(fetcher.mock.calls[0][1].body).rowVersion).toBe(3);
    await rubricService.activate(2,5); expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ revision:5 });
    await rubricService.remove(2,5); expect(fetcher.mock.calls[2][0]).toMatch(/\/moderation\/rubrics\/2\?revision=5$/); expect(fetcher.mock.calls[2][1].method).toBe('DELETE');
  });
});
describe('Roadmap stage helpers', () => {
  it('moves one waiting stage to a new position and renumbers the others around it', () => {
    const layout = [[1], [2, 3], [4]];
    expect(moveInLayout(layout, 0, 2)).toEqual([[2, 3], [4], [1]]);
    expect(moveInLayout(layout, 2, 0)).toEqual([[4], [1], [2, 3]]);
    expect(layout).toEqual([[1], [2, 3], [4]]);
    expect(moveInLayout(layout, 1, 1)).toBe(layout); expect(moveInLayout(layout, 0, 3)).toBe(layout); expect(moveInLayout(layout, -1, 0)).toBe(layout);
  });
  it('reads the stored library pick, including the old plain-number value', () => {
    expect(parseLibraryPick(null)).toBeNull();
    expect(parseLibraryPick('12')).toEqual({ childId: 12, stage: null });
    expect(parseLibraryPick('{"childId":12,"stage":3}')).toEqual({ childId: 12, stage: 3 });
    expect(parseLibraryPick('{"childId":12,"stage":"new"}')).toEqual({ childId: 12, stage: 'new' });
    expect(parseLibraryPick('{"childId":12,"stage":null}')).toEqual({ childId: 12, stage: null });
    expect(parseLibraryPick('{"childId":"x"}')).toBeNull(); expect(parseLibraryPick('0')).toBeNull(); expect(parseLibraryPick('{"childId":0}')).toBeNull(); expect(parseLibraryPick('{"childId":12,"stage":0}')).toBeNull(); expect(parseLibraryPick('{"childId":12,"stage":-2}')).toBeNull(); expect(parseLibraryPick('{broken')).toBeNull();
  });
});
describe('mergeRoadmapResults', () => {
  it('concatenates added, skipped and warnings of per-child adds', () => {
    const merged = mergeRoadmapResults([
      { added: [{ childProfileId: 1, itemId: 5, moved: false }], skipped: [], warnings: [{ childProfileId: 1, nickname: 'An', text: 'a' }] },
      { added: [], skipped: [{ childProfileId: 2, nickname: 'Bình', reason: 'Chặng 3 không còn nhận thêm truyện.' }], warnings: [] },
      { added: [{ childProfileId: 3, itemId: 9, moved: true }], skipped: [] },
    ]);
    expect(merged.added.map(a => a.childProfileId)).toEqual([1, 3]);
    expect(merged.skipped).toEqual([{ childProfileId: 2, nickname: 'Bình', reason: 'Chặng 3 không còn nhận thêm truyện.' }]);
    expect(merged.warnings).toEqual([{ childProfileId: 1, nickname: 'An', text: 'a' }]);
    expect(mergeRoadmapResults([])).toEqual({ added: [], skipped: [], warnings: [] });
  });
});
