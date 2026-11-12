import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { MonthPeriod } from '@/app/lib/monthPeriods';
import MonthBars from '@/app/components/stats/MonthBars';

vi.mock('@/app/lib/motion', () => ({
  useGrowBars: () => ({ current: null }),
  usePop: () => ({ current: null }),
}));

describe('MonthBars component', () => {
  it('render tĩnh đúng các giá trị trạng thái đang tải, lỗi, số liệu và class bar fill', () => {
    const months: MonthPeriod[] = [
      { key: '2026-09', label: 'T9/2026', start: '2026-09-01', end: '2026-09-30' },
      { key: '2026-10', label: 'T10/2026', start: '2026-10-01', end: '2026-10-31' },
      { key: '2026-11', label: 'T11/2026', start: '2026-11-01', end: '2026-11-30' },
    ];
    const values = [undefined, null, 1500];
    const format = (n: number) => 'v' + n;

    const html = renderToStaticMarkup(
      <MonthBars
        title="Thống kê"
        months={months}
        values={values}
        format={format}
      />
    );

    expect(html).toContain('…');
    expect(html).toContain('—');
    expect(html).toContain('v1500');

    // Chỉ có ĐÚNG 1 lần class 'ce-bar-fill' (tương ứng với cột có số 1500)
    const matches = html.match(/ce-bar-fill/g);
    expect(matches).not.toBeNull();
    expect(matches?.length).toBe(1);
  });
});
