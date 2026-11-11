'use client';

import { useEffect, useState } from 'react';
import type { ApiResponse } from '@/app/types/auth';
import type { MonthPeriod } from '@/app/lib/monthPeriods';
import { showToast } from '@/app/lib/toast';

/**
 * Tải số liệu thống kê theo danh sách tháng song song.
 *
 * @param months Danh sách các khoảng tháng cần lấy số liệu.
 * @param load Hàm gọi API lấy số liệu theo khoảng ngày (start, end) kèm AbortSignal.
 * @param pick Hàm trích xuất giá trị số cần hiển thị từ dữ liệu API trả về.
 * @param deps Danh sách phụ thuộc bổ sung để kích hoạt tải lại số liệu.
 * @returns Mảng cùng độ dài với `months`:
 *          - `undefined`: đang tải
 *          - `null`: lỗi khi tải tháng đó
 *          - `number`: giá trị số liệu tương ứng
 */
export function useMonthlyStats<T>(
  months: MonthPeriod[],
  load: (start: string, end: string, signal: AbortSignal) => Promise<ApiResponse<T>>,
  pick: (data: T) => number,
  deps: unknown[],
): (number | null | undefined)[] {
  const [values, setValues] = useState<(number | null | undefined)[]>(() =>
    months.map(() => undefined),
  );

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();

    Promise.all(
      months.map((m) =>
        load(m.start, m.end, ctrl.signal)
          .then((r) =>
            r.success && r.data
              ? { value: pick(r.data), error: null }
              : { value: null, error: r.message },
          )
          .catch(() => ({ value: null, error: 'Không tải được số liệu.' })),
      ),
    ).then((results) => {
      if (!alive || ctrl.signal.aborted) {
        return;
      }

      setValues(results.map((r) => r.value));

      const failed = results.find((r) => r.error !== null);
      if (failed) {
        showToast(failed.error || 'Không tải được số liệu.', 'err');
      }
    });

    return () => {
      alive = false;
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months.map((m) => m.key).join(','), ...deps]);

  return values;
}
