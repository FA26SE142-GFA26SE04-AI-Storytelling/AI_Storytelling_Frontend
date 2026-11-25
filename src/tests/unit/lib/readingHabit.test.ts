import { describe, expect, it } from 'vitest';
import { isQuiet, nextReminder, weekProgressText } from '@/app/lib/readingHabit';
import type { ChildHabit } from '@/app/types/readingSchedule';

const habit = (patch: Partial<ChildHabit> = {}): ChildHabit => ({
  enabled: true, streakDays: 2, daysReadThisWeek: 1, weeklyGoalDays: 3, goalMetThisWeek: false,
  reminders: [
    { at: '2026-11-24T12:00:00Z', message: 'Đến giờ đọc truyện rồi, bé vào đọc nhé!' },
    { at: '2026-11-25T12:00:00Z', message: 'Đến giờ đọc truyện rồi, bé vào đọc nhé!' },
  ],
  quietPeriods: [{ from: '2026-11-24T13:30:00Z', to: '2026-11-24T23:00:00Z' }],
  ...patch,
});
const at = (iso: string) => Date.parse(iso);

describe('isQuiet', () => {
  it('is quiet from the start of the period until just before its end', () => {
    const q = habit().quietPeriods;
    expect(isQuiet(q, at('2026-11-24T13:30:00Z'))).toBe(true);
    expect(isQuiet(q, at('2026-11-24T22:59:59Z'))).toBe(true);
    expect(isQuiet(q, at('2026-11-24T23:00:00Z'))).toBe(false);
    expect(isQuiet(q, at('2026-11-24T13:29:59Z'))).toBe(false);
  });
  it('is never quiet without periods', () => {
    expect(isQuiet(undefined, at('2026-11-24T14:00:00Z'))).toBe(false);
  });
});

describe('nextReminder', () => {
  it('picks the first reminder still in the future', () => {
    expect(nextReminder(habit(), at('2026-11-24T11:00:00Z'))?.at).toBe('2026-11-24T12:00:00Z');
    expect(nextReminder(habit(), at('2026-11-24T12:00:00Z'))?.at).toBe('2026-11-25T12:00:00Z');
  });
  it('skips reminders that fall inside a quiet period', () => {
    const h = habit({ quietPeriods: [{ from: '2026-11-24T11:00:00Z', to: '2026-11-24T13:00:00Z' }] });
    expect(nextReminder(h, at('2026-11-24T10:00:00Z'))?.at).toBe('2026-11-25T12:00:00Z');
  });
  it('returns null when habits are off, missing, or nothing is left', () => {
    expect(nextReminder(habit({ enabled: false }), at('2026-11-24T10:00:00Z'))).toBeNull();
    expect(nextReminder(null, at('2026-11-24T10:00:00Z'))).toBeNull();
    expect(nextReminder(habit(), at('2026-11-26T00:00:00Z'))).toBeNull();
  });
  it('does not depend on the order backend sends reminders in', () => {
    const h = habit({ reminders: habit().reminders.slice().reverse() });
    expect(nextReminder(h, at('2026-11-24T11:00:00Z'))?.at).toBe('2026-11-24T12:00:00Z');
  });
});

describe('weekProgressText', () => {
  it('shows progress against the goal', () => expect(weekProgressText(habit())).toBe('1 / 3 ngày'));
  it('shows just the days when there is no goal', () => expect(weekProgressText(habit({ weeklyGoalDays: null, daysReadThisWeek: 2 }))).toBe('2 ngày'));
});
