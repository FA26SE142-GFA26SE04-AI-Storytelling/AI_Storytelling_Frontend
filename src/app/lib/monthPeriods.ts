export type MonthPeriod = { key: string; label: string; start: string; end: string };
export type PeriodPreset = 'thisMonth' | 'lastMonth' | 'last3Months' | 'custom';
export type Period = { preset: PeriodPreset; start: string; end: string };

export const PRESET_LABEL: Record<PeriodPreset, string> = {
  thisMonth: 'Tháng này',
  lastMonth: 'Tháng trước',
  last3Months: '3 tháng',
  custom: 'Tuỳ chọn',
};

// Chuyển đối tượng Date thành chuỗi yyyy-MM-dd theo giờ địa phương
export const toIsoDay = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Lấy danh sách n tháng gần nhất theo thứ tự cũ nhất trước, kết thúc ở tháng hiện tại
export function lastMonths(n: number, now: Date = new Date()): MonthPeriod[] {
  const periods: MonthPeriod[] = [];
  const curY = now.getFullYear();
  const curM = now.getMonth();

  for (let i = n - 1; i >= 0; i--) {
    const targetM = curM - i;
    const startD = new Date(curY, targetM, 1);
    const endD = new Date(curY, targetM + 1, 0);

    const y = startD.getFullYear();
    const m = startD.getMonth() + 1;
    const key = `${y}-${String(m).padStart(2, '0')}`;
    const label = `T${m}/${y}`;

    periods.push({
      key,
      label,
      start: toIsoDay(startD),
      end: toIsoDay(endD),
    });
  }
  return periods;
}

// Tạo khoảng thời gian theo các mẫu định sẵn (trọn tháng hiện tại, tháng trước, hoặc 3 tháng)
export function presetPeriod(preset: Exclude<PeriodPreset, 'custom'>, now: Date = new Date()): Period {
  const y = now.getFullYear();
  const m = now.getMonth();

  if (preset === 'thisMonth') {
    return {
      preset,
      start: toIsoDay(new Date(y, m, 1)),
      end: toIsoDay(new Date(y, m + 1, 0)),
    };
  }

  if (preset === 'lastMonth') {
    return {
      preset,
      start: toIsoDay(new Date(y, m - 1, 1)),
      end: toIsoDay(new Date(y, m, 0)),
    };
  }

  // last3Months: từ ngày 1 của (tháng now - 2) đến ngày cuối tháng now
  return {
    preset,
    start: toIsoDay(new Date(y, m - 2, 1)),
    end: toIsoDay(new Date(y, m + 1, 0)),
  };
}

// Tạo khoảng thời gian tuỳ chọn từ ngày bắt đầu và kết thúc
export function customPeriod(start: string, end: string): Period {
  return { preset: 'custom', start, end };
}

// Kiểm tra tính hợp lệ của khoảng ngày dạng yyyy-MM-dd và ngày kết thúc không trước ngày bắt đầu
export function isValidRange(start: string, end: string): boolean {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(start) || !datePattern.test(end)) {
    return false;
  }
  return end >= start;
}

// Khoảng thời gian mặc định (trọn tháng hiện tại)
export const defaultPeriod = (now: Date = new Date()): Period => presetPeriod('thisMonth', now);
