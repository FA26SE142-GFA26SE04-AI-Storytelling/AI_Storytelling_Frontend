import { describe, expect, it } from 'vitest';
import { blockedStateOf, formatCountdown, isBlocking, minutesOf, restCopy, secondsUntil, warnLine } from '@/app/lib/readingTime';
import type { ReadingTimeState, ReadingTimeStatus } from '@/app/types/readingSchedule';

const status = (state: ReadingTimeState, patch: Partial<ReadingTimeStatus> = {}): ReadingTimeStatus => ({
  state, endReason: null, endsAt: null, graceEndsAt: null, breakUntil: null, breakActivity: null, nextAllowedAt: null,
  bedtimeAt: null, screenMinutesUsed: null, screenMinutesLimit: null, message: null, ...patch,
});
const NOW = Date.parse('2026-11-24T12:00:00Z');

describe('isBlocking', () => {
  it.each([['Outside', true], ['Bedtime', true], ['ScreenLimitReached', true], ['Break', true], ['Allowed', false], ['EndingSoon', false], ['Grace', false]] as const)(
    '%s blocks = %s', (state, expected) => expect(isBlocking(status(state))).toBe(expected));
  it('treats a missing status (old backend, no schedule) as not blocking', () => {
    expect(isBlocking(null)).toBe(false);
    expect(isBlocking(undefined)).toBe(false);
  });
});

describe('blockedStateOf', () => {
  it.each([
    [['READING_TIME_BREAK'], 'Break'],
    [['READING_TIME_BEDTIME'], 'Bedtime'],
    [['READING_TIME_SCREEN_LIMIT'], 'ScreenLimitReached'],
    [['READING_TIME_OUTSIDE'], 'Outside'],
  ] as const)('%j -> %s', (errors, state) => expect(blockedStateOf(errors)).toBe(state));
  it('ignores other error codes', () => {
    expect(blockedStateOf(['CHILD_FEATURE_DISABLED'])).toBeNull();
    expect(blockedStateOf(null)).toBeNull();
    expect(blockedStateOf([])).toBeNull();
  });
});

describe('secondsUntil / formatCountdown', () => {
  it('rounds up and never goes negative', () => {
    expect(secondsUntil('2026-11-24T12:04:05Z', NOW)).toBe(245);
    expect(secondsUntil('2026-11-24T12:00:00.400Z', NOW)).toBe(1);
    expect(secondsUntil('2026-11-24T11:59:00Z', NOW)).toBe(0);
  });
  it('returns null without a usable timestamp', () => {
    expect(secondsUntil(null, NOW)).toBeNull();
    expect(secondsUntil('not a date', NOW)).toBeNull();
  });
  it.each([[245, '4:05'], [9, '0:09'], [0, '0:00'], [3600, '1 giờ'], [3660, '1 giờ 1 phút'], [7260, '2 giờ 1 phút'], [3599, '59:59']])(
    '%i s -> %s', (s, text) => expect(formatCountdown(s)).toBe(text));
  it('counts at least one minute', () => {
    expect(minutesOf(0)).toBe(1);
    expect(minutesOf(61)).toBe(2);
  });
});

describe('restCopy', () => {
  it('break counts down to breakUntil and names the activity', () => {
    const c = restCopy(status('Break', { breakUntil: '2026-11-24T12:05:00Z', breakActivity: 'Water' }));
    expect(c.title).toBe('Nghỉ mắt một chút nhé');
    expect(c.hint).toBe('Em uống một ngụm nước nhé!');
    expect(c.until).toBe('2026-11-24T12:05:00Z');
  });
  it('break without an activity falls back to the eyes prompt', () => {
    expect(restCopy(status('Break', { breakUntil: '2026-11-24T12:05:00Z' })).hint).toBe('Nhìn ra xa một chút cho mắt nghỉ nhé!');
  });
  it.each([
    ['Bedtime', 'Đến giờ đi ngủ rồi'],
    ['ScreenLimitReached', 'Hôm nay em đọc đủ rồi'],
    ['Outside', 'Chưa tới giờ đọc'],
  ] as const)('%s title', (state, title) => {
    const c = restCopy(status(state, { nextAllowedAt: '2026-11-25T01:00:00Z' }));
    expect(c.title).toBe(title);
    expect(c.until).toBe('2026-11-25T01:00:00Z');
  });
  it('has no countdown when the backend gives no next time', () => {
    expect(restCopy(status('Outside')).until).toBeNull();
  });
});

describe('warnLine', () => {
  it('EndingSoon tells how many minutes are left', () => {
    expect(warnLine(status('EndingSoon', { endsAt: '2026-11-24T12:03:10Z' }), NOW)).toBe('Sắp hết giờ đọc rồi, còn khoảng 4 phút nhé!');
  });
  it('Grace tells the child to finish the passage with the grace countdown', () => {
    expect(warnLine(status('Grace', { graceEndsAt: '2026-11-24T12:08:20Z' }), NOW)).toBe('Đến giờ nghỉ rồi, em đọc nốt đoạn này nhé! (còn 8:20)');
  });
  it('shows nothing for the other states', () => {
    expect(warnLine(status('Allowed'), NOW)).toBeNull();
    expect(warnLine(status('Break'), NOW)).toBeNull();
    expect(warnLine(null, NOW)).toBeNull();
  });
});
