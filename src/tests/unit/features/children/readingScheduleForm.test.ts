import { describe, expect, it } from 'vitest';
import {
  changedGroups, groupsText, saveLabel, scheduleFrom, scheduleRequest, sectionOfError, type ScheduleValue,
} from '@/app/features/children/readingScheduleForm';
import type { ReadingSchedule } from '@/app/types/readingSchedule';

const dto: ReadingSchedule = {
  childProfileId: 1, enabled: true, bedtimeWeekday: '20:30', bedtimeWeekend: null,
  breakEnabled: true, breakAfterMinutes: 20, breakDurationMinutes: 5,
  breakRemindEyes: true, breakRemindWater: false, breakRemindMove: true,
  screenLimitEnabled: true, screenLimitWeekdayMinutes: 45, screenLimitWeekendMinutes: 90,
  habitEnabled: true, readingReminderWeekday: '19:00', readingReminderWeekend: null, weeklyGoalDays: 3,
  habit: { streakDays: 2, daysReadThisWeek: 1, goalMetThisWeek: false },
  windows: [
    { dayType: 'Weekend', slot: 2, startTime: '15:00', endTime: '20:00' },
    { dayType: 'Weekday', slot: 1, startTime: '18:00', endTime: '20:00' },
    { dayType: 'Weekend', slot: 1, startTime: '08:00', endTime: '11:00' },
  ],
  isSuggested: false,
};

describe('scheduleFrom', () => {
  it('splits windows by day type and orders them by slot', () => {
    const v = scheduleFrom(dto);
    expect(v.weekday).toEqual([{ start: '18:00', end: '20:00' }]);
    expect(v.weekend).toEqual([{ start: '08:00', end: '11:00' }, { start: '15:00', end: '20:00' }]);
  });

  it('turns missing times into empty strings and keeps a missing goal as null', () => {
    const v = scheduleFrom({ ...dto, bedtimeWeekend: null, readingReminderWeekend: null, weeklyGoalDays: null });
    expect(v.bedtimeWeekend).toBe('');
    expect(v.readingReminderWeekend).toBe('');
    expect(v.weeklyGoalDays).toBeNull();
  });
});

describe('scheduleRequest', () => {
  it('sends every field, including the habit group, so the full-replace PUT never resets anything', () => {
    const body = scheduleRequest(scheduleFrom(dto));
    expect(body).toEqual({
      enabled: true, bedtimeWeekday: '20:30', bedtimeWeekend: null,
      breakEnabled: true, breakAfterMinutes: 20, breakDurationMinutes: 5,
      breakRemindEyes: true, breakRemindWater: false, breakRemindMove: true,
      screenLimitEnabled: true, screenLimitWeekdayMinutes: 45, screenLimitWeekendMinutes: 90,
      habitEnabled: true, readingReminderWeekday: '19:00', readingReminderWeekend: null, weeklyGoalDays: 3,
      windows: [
        { dayType: 'Weekday', startTime: '18:00', endTime: '20:00' },
        { dayType: 'Weekend', startTime: '08:00', endTime: '11:00' },
        { dayType: 'Weekend', startTime: '15:00', endTime: '20:00' },
      ],
    });
  });

  it('round-trips: a value built from a response produces the same request again', () => {
    const v = scheduleFrom(dto);
    expect(scheduleRequest(scheduleFrom({ ...dto, windows: dto.windows.slice().reverse() }))).toEqual(scheduleRequest(v));
  });

  it('drops a window row left completely empty but keeps a half-filled one for the backend to reject', () => {
    const v: ScheduleValue = { ...scheduleFrom(dto), weekday: [{ start: '', end: '' }, { start: '18:00', end: '' }], weekend: [] };
    expect(scheduleRequest(v).windows).toEqual([{ dayType: 'Weekday', startTime: '18:00', endTime: '' }]);
  });

  it('sends cleared optional times as null', () => {
    const v: ScheduleValue = { ...scheduleFrom(dto), bedtimeWeekday: '', readingReminderWeekday: ' ' };
    const body = scheduleRequest(v);
    expect(body.bedtimeWeekday).toBeNull();
    expect(body.readingReminderWeekday).toBeNull();
  });
});

describe('changedGroups', () => {
  const saved = scheduleFrom(dto);

  it('reports nothing when the form equals the saved value', () => {
    expect(changedGroups(scheduleFrom(dto), saved)).toEqual([]);
  });

  it('reports only the limits group for any limit field, including window rows and a nested toggle', () => {
    expect(changedGroups({ ...saved, enabled: false }, saved)).toEqual(['limits']);
    expect(changedGroups({ ...saved, breakRemindEyes: false }, saved)).toEqual(['limits']);
    expect(changedGroups({ ...saved, weekday: [{ start: '18:00', end: '21:00' }] }, saved)).toEqual(['limits']);
  });

  it('reports only the habit group for toggle, reminders and goal', () => {
    expect(changedGroups({ ...saved, habitEnabled: false }, saved)).toEqual(['habit']);
    expect(changedGroups({ ...saved, readingReminderWeekday: '19:30' }, saved)).toEqual(['habit']);
    expect(changedGroups({ ...saved, weeklyGoalDays: null }, saved)).toEqual(['habit']);
  });

  it('reports both groups, limits first, when both changed', () => {
    expect(changedGroups({ ...saved, enabled: false, weeklyGoalDays: 5 }, saved)).toEqual(['limits', 'habit']);
  });
});

describe('save wording', () => {
  it('names the group being saved, and keeps the tab name when both are', () => {
    expect(saveLabel(['limits'])).toBe('Lưu giới hạn thời gian');
    expect(saveLabel(['habit'])).toBe('Lưu thói quen đọc');
    expect(saveLabel(['limits', 'habit'])).toBe('Lưu thời gian & thói quen');
  });

  it('joins group names for hints and toasts', () => {
    expect(groupsText(['habit'])).toBe('thói quen đọc');
    expect(groupsText(['limits', 'habit'])).toBe('giới hạn thời gian và thói quen đọc');
  });
});

describe('sectionOfError', () => {
  it.each([
    ['Giờ nhắc đọc phải từ 06:00.', 'habit'],
    ['Giờ nhắc đọc phải trước giờ đi ngủ.', 'habit'],
    ['Giờ nhắc đọc phải nằm trong khung giờ được dùng.', 'habit'],
    ['Mục tiêu từ 1 đến 7 ngày mỗi tuần.', 'habit'],
    ['Giờ đi ngủ phải từ 18:00 đến 23:30.', 'bedtime'],
    ['Giờ bắt đầu phải trước giờ kết thúc.', 'windows'],
    ['Mỗi loại ngày tối đa 2 khung giờ.', 'windows'],
    ['Hai khung giờ ngày thường đang chồng nhau.', 'windows'],
    ['Hai khung giờ cuối tuần đang chồng nhau.', 'windows'],
    ['Nghỉ sau mỗi 15–60 phút đọc.', 'break'],
    ['Thời gian nghỉ từ 1 đến 15 phút.', 'break'],
    ['Hãy chọn ít nhất một lời nhắc khi nghỉ (mắt, uống nước, vận động).', 'break'],
    ['Giới hạn màn hình từ 10 đến 240 phút mỗi ngày.', 'screen'],
    ['Giờ không hợp lệ, hãy dùng dạng HH:mm.', 'general'],
    ['Bạn không có quyền với hồ sơ trẻ này.', 'general'],
  ])('routes "%s" to the %s section', (message, section) => {
    expect(sectionOfError(message)).toBe(section);
  });
});
