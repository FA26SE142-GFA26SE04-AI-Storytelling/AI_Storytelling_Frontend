import { describe, expect, it } from 'vitest';
import {
  customPeriod,
  isValidRange,
  lastMonths,
  presetPeriod,
  toIsoDay,
} from '@/app/lib/monthPeriods';

describe('monthPeriods', () => {
  const now = new Date(2026, 10, 11); // Tháng 11/2026 (month index 10)

  it('lastMonths(6, now) trả về 6 phần tử đúng thứ tự và định dạng', () => {
    const months = lastMonths(6, now);
    expect(months).toHaveLength(6);

    // cũ nhất trước: bắt đầu từ tháng 6/2026
    expect(months[0].label).toBe('T6/2026');

    // phần tử cuối là tháng 11/2026
    const last = months[5];
    expect(last).toEqual({
      key: '2026-11',
      label: 'T11/2026',
      start: '2026-11-01',
      end: '2026-11-30',
    });
  });

  it('presetPeriod tạo khoảng ngày chính xác cho các mẫu có sẵn', () => {
    expect(presetPeriod('thisMonth', now)).toEqual({
      preset: 'thisMonth',
      start: '2026-11-01',
      end: '2026-11-30',
    });

    expect(presetPeriod('lastMonth', now)).toEqual({
      preset: 'lastMonth',
      start: '2026-10-01',
      end: '2026-10-31',
    });

    expect(presetPeriod('last3Months', now)).toEqual({
      preset: 'last3Months',
      start: '2026-09-01',
      end: '2026-11-30',
    });
  });

  it('isValidRange kiểm tra tính hợp lệ của khoảng ngày', () => {
    expect(isValidRange('2026-11-02', '2026-11-01')).toBe(false);
    expect(isValidRange('2026-11-01', '2026-11-01')).toBe(true);
  });

  it('customPeriod trả về khoảng với preset là "custom"', () => {
    const period = customPeriod('2026-11-01', '2026-11-05');
    expect(period.preset).toBe('custom');
    expect(period.start).toBe('2026-11-01');
    expect(period.end).toBe('2026-11-05');
  });

  it('toIsoDay chuyển Date thành chuỗi yyyy-MM-dd', () => {
    expect(toIsoDay(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
