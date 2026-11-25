import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authService } from '@/app/services/authService';
import { readingScheduleService } from '@/app/services/readingScheduleService';
import type { SetReadingScheduleRequest } from '@/app/types/readingSchedule';

const request: SetReadingScheduleRequest = {
  enabled: true, bedtimeWeekday: '20:30', bedtimeWeekend: null,
  breakEnabled: true, breakAfterMinutes: 20, breakDurationMinutes: 5,
  breakRemindEyes: true, breakRemindWater: true, breakRemindMove: false,
  screenLimitEnabled: true, screenLimitWeekdayMinutes: 45, screenLimitWeekendMinutes: 90,
  habitEnabled: true, readingReminderWeekday: '19:00', readingReminderWeekend: null, weeklyGoalDays: 3,
  windows: [{ dayType: 'Weekday', startTime: '18:00', endTime: '20:00' }],
};

describe('readingScheduleService contracts', () => {
  let fetcher: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetcher = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ success: true, message: 'OK', data: null }))));
    vi.stubGlobal('fetch', fetcher);
    vi.spyOn(authService, 'getStoredAccessToken').mockReturnValue('adult');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('GET /ReadingSchedule/{childProfileId} with the adult token', async () => {
    const ctrl = new AbortController();
    await readingScheduleService.get(7, ctrl.signal);

    const [url, options] = fetcher.mock.calls[0];
    expect(url.endsWith('/ReadingSchedule/7')).toBe(true);
    expect(options.method).toBe('GET');
    expect(options.body).toBeUndefined();
    expect(options.signal).toBe(ctrl.signal);
    expect(new Headers(options.headers).get('Authorization')).toBe('Bearer adult');
  });

  it('PUT /ReadingSchedule/{childProfileId} sends the whole configuration unchanged', async () => {
    await readingScheduleService.set(7, request);

    const [url, options] = fetcher.mock.calls[0];
    expect(url.endsWith('/ReadingSchedule/7')).toBe(true);
    expect(options.method).toBe('PUT');
    expect(JSON.parse(options.body)).toEqual(request);
    expect(new Headers(options.headers).get('Authorization')).toBe('Bearer adult');
  });

  it('keeps the backend message and status of a 400 so the form can show it in place', async () => {
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ success: false, message: 'Giờ nhắc đọc phải từ 06:00.', data: null }), { status: 400 }));
    const r = await readingScheduleService.set(7, request);

    expect(r.success).toBe(false);
    expect(r.status).toBe(400);
    expect(r.message).toBe('Giờ nhắc đọc phải từ 06:00.');
  });

  it('returns the habit progress that the backend attaches to a saved schedule', async () => {
    fetcher.mockResolvedValueOnce(new Response(JSON.stringify({
      success: true, message: 'OK',
      data: { childProfileId: 7, habit: { streakDays: 2, daysReadThisWeek: 1, goalMetThisWeek: false }, windows: [], isSuggested: false },
    })));
    const r = await readingScheduleService.get(7);

    expect(r.data?.habit).toEqual({ streakDays: 2, daysReadThisWeek: 1, goalMetThisWeek: false });
  });
});
