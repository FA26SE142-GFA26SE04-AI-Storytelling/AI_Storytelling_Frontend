import { afterEach, describe, expect, it, vi } from 'vitest';
import { authService } from '@/app/services/authService';
import { creatorStatisticsService } from '@/app/services/creatorStatisticsService';

const okBody = () => new Response(JSON.stringify({ success: true, message: 'OK', data: null }));
const spyFetch = () => vi.spyOn(authService, 'authenticatedFetch').mockResolvedValue(okBody());
const urlOf = (spy: ReturnType<typeof spyFetch>) => new URL(String(spy.mock.calls[0][0]));
const period = { periodStart: '2026-11-01', periodEnd: '2026-11-30' };

afterEach(() => vi.restoreAllMocks());

describe('Thống kê Creator — hợp đồng API', () => {
  it('reading: GET /CreatorStatistics/reading, có storyId thì gửi kèm', async () => {
    const spy = spyFetch();
    await creatorStatisticsService.reading(period, 5);
    expect(urlOf(spy).pathname).toMatch(/\/CreatorStatistics\/reading$/);
    expect(spy.mock.calls[0][1]?.method ?? 'GET').toBe('GET');
    expect(Object.fromEntries(urlOf(spy).searchParams)).toEqual({ ...period, storyId: '5' });
  });

  it('reading: bỏ trống storyId thì không có trong query', async () => {
    const spy = spyFetch();
    await creatorStatisticsService.reading(period);
    expect(Object.fromEntries(urlOf(spy).searchParams)).toEqual(period);
  });

  it('revenue: GET /CreatorStatistics/revenue, có storyId thì gửi kèm', async () => {
    const spy = spyFetch();
    await creatorStatisticsService.revenue(period, 8);
    expect(urlOf(spy).pathname).toMatch(/\/CreatorStatistics\/revenue$/);
    expect(Object.fromEntries(urlOf(spy).searchParams)).toEqual({ ...period, storyId: '8' });
  });

  it('revenue: bỏ trống storyId thì không có trong query', async () => {
    const spy = spyFetch();
    await creatorStatisticsService.revenue(period);
    expect(Object.fromEntries(urlOf(spy).searchParams)).toEqual(period);
  });

  it('content: GET /CreatorStatistics/content chỉ gửi kỳ', async () => {
    const spy = spyFetch();
    await creatorStatisticsService.content(period);
    expect(urlOf(spy).pathname).toMatch(/\/CreatorStatistics\/content$/);
    expect(Object.fromEntries(urlOf(spy).searchParams)).toEqual(period);
  });
});
