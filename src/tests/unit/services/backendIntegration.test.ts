import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest } from '@/app/services/apiClient';
import { authService } from '@/app/services/authService';
import { guardianService } from '@/app/services/guardianService';
import { roadmapService } from '@/app/services/roadmapService';
import { communityService } from '@/app/services/communityService';
import { creatorPublicationService } from '@/app/services/creatorPublicationService';
import { moderationService } from '@/app/services/moderationService';
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
    expect(r.data?.added).toEqual([{childProfileId:10,itemId:55,moved:false}]); expect(r.data?.skipped[0].childProfileId).toBe(11); expect(r.data?.warnings).toEqual(['10: level']);
    expect((await guardianService.clearRoadmap(10)).success).toBe(false);
  });
  it('uses DELETE for clear, preview before copy and correct child context', async () => {
    fetcher.mockResolvedValue(response(null));
    await roadmapService.clear(10); expect(fetcher.mock.calls[0][0]).toMatch(/\/ChildRoadmap\/10\/items$/); expect(fetcher.mock.calls[0][1].method).toBe('DELETE');
    await roadmapService.preview(2,{ childProfileIds:[10], position:'End', daysPerStory:3 }); expect(fetcher.mock.calls[1][0]).toMatch(/\/RoadmapLibrary\/2\/preview$/);
    await roadmapService.mine('child'); expect(fetcher.mock.calls[2][0]).toMatch(/\/MyRoadmap$/); expect(new Headers(fetcher.mock.calls[2][1].headers).get('Authorization')).toBe('Bearer child');
  });
  it('maps report reasons and community attestation without fabricating a timestamp', async () => {
    fetcher.mockResolvedValueOnce(response({ reportId:8,storyId:7,reason:'SafetyConcern',status:'Pending',createdAt:'2026-10-21T00:00:00Z' })).mockResolvedValueOnce(response({itemId:9,storyId:7,storyVersionId:12,status:'Pending'})).mockResolvedValueOnce(response([]));
    const r = await guardianService.reportStory(7,'safety_concern','Xem lại'); expect(r.data?.id).toBe(8); expect(fetcher.mock.calls[0][0]).toMatch(/\/ContentReport$/); expect(JSON.parse(fetcher.mock.calls[0][1].body).reason).toBe('SafetyConcern');
    await guardianService.submitCommunity(7,true,true); expect(fetcher.mock.calls[1][0]).toMatch(/\/CommunitySubmission$/); expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({storyId:7,confirmNoPersonalInfo:true,copyrightDeclaration:2});
    await communityService.remove(9); expect(fetcher.mock.calls[3][0]).toMatch(/\/CommunitySubmission\/9\/remove$/);
  });
  it('pins version for Creator submission and uses separate confirmation/removal APIs', async () => {
    fetcher.mockResolvedValue(response(null)); await creatorPublicationService.submit(7,12); expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({storyId:7,storyVersionId:12});
    await creatorPublicationService.revision(7,12); expect(fetcher.mock.calls[1][0]).toMatch(/\/creator\/stories\/7\/revisions$/); expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({sourceVersionId:12});
    await moderationService.removalDecision(9,{approve:true,reason:'Gỡ',rowVersion:4}); expect(fetcher.mock.calls[2][0]).toMatch(/\/moderation\/public-story-removals\/9\/decision$/);
  });
  it('loads the specialized package, checks gray-zone rowVersion and rubric revision', async () => {
    fetcher.mockResolvedValue(response({ itemId:9 })); await moderationService.package('CommunitySubmission',9); expect(fetcher.mock.calls[0][0]).toMatch(/\/CommunityReview\/9$/);
    await moderationService.grayDecision(9,{decision:'Clear',reason:'Đã xem',rowVersion:3}); expect(JSON.parse(fetcher.mock.calls[1][1].body).rowVersion).toBe(3);
    await rubricService.activate(2,5); expect(JSON.parse(fetcher.mock.calls[2][1].body)).toEqual({ revision:5 });
    await rubricService.remove(2,5); expect(fetcher.mock.calls[3][0]).toMatch(/\/moderation\/rubrics\/2\?revision=5$/); expect(fetcher.mock.calls[3][1].method).toBe('DELETE');
  });
});
