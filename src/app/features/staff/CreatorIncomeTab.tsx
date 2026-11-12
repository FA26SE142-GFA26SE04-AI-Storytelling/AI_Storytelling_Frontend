'use client';

import { useEffect, useState } from 'react';
import { Wallet, BadgeCheck, Gift } from 'lucide-react';
import StatCard from '@/app/components/stats/StatCard';
import MonthBars from '@/app/components/stats/MonthBars';
import { useMonthlyStats } from '@/app/components/stats/useMonthlyStats';
import { money, shortMoney, count, pct } from '@/app/components/stats/statFormat';
import type { MonthPeriod, Period } from '@/app/lib/monthPeriods';
import { showToast } from '@/app/lib/toast';
import { creatorStatisticsService } from '@/app/services/creatorStatisticsService';
import type { CreatorRevenueStatisticsDto } from '@/app/types/backendContracts';

export function CreatorIncomeTab({
  period,
  months,
}: {
  period: Period;
  months: MonthPeriod[];
}) {
  const [data, setData] = useState<CreatorRevenueStatisticsDto | null>(null);

  const monthly = useMonthlyStats(
    months,
    (s, e, sig) => creatorStatisticsService.revenue(s, e, sig),
    (d) => d.estimatedEarningsVnd,
    [],
  );

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();
    setData(null);

    creatorStatisticsService
      .revenue(period.start, period.end, ctrl.signal)
      .then((r) => {
        if (!alive || ctrl.signal.aborted) return;
        if (r.success && r.data) {
          setData(r.data);
        } else {
          showToast(r.message, 'err');
        }
      })
      .catch((err) => {
        if (!alive || ctrl.signal.aborted) return;
        showToast(err instanceof Error ? err.message : 'Không tải được thống kê thu nhập.', 'err');
      });

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [period.start, period.end]);

  if (!data) {
    return <p className="sub">Đang tải…</p>;
  }

  const validReadsSub = `Trên tổng ${count(data.totalValidReadsAllCreators)} lượt của tất cả Creator${
    data.totalValidReadsAllCreators > 0
      ? ` (${pct(data.myValidReads / data.totalValidReadsAllCreators)})`
      : ''
  }`;

  const earningsInfo = `Chỉ lượt đọc xong ít nhất ${data.minimumReadSeconds} giây được tính. Quỹ Creator chia theo tỉ lệ: Đọc ${pct(data.readingFundRate)}, Sáng tạo ${pct(data.creativeFundRate)}.`;

  const sortedStories = [...(data.stories ?? [])].sort(
    (a, b) => b.estimatedEarningsVnd - a.estimatedEarningsVnd,
  );

  return (
    <div className="creator-income-tab">
      <div className="ce-stats">
        <StatCard
          icon={Wallet}
          label="Thu nhập ước tính"
          value={money(data.estimatedEarningsVnd)}
          tone="gold"
          info={earningsInfo}
        />
        <StatCard
          icon={BadgeCheck}
          label="Lượt hợp lệ của bạn"
          value={count(data.myValidReads)}
          sub={validReadsSub}
        />
        <StatCard
          icon={Gift}
          label="Quỹ Creator kỳ"
          value={money(data.creatorFundVnd)}
        />
      </div>

      <MonthBars
        title="Thu nhập ước tính 6 tháng gần nhất"
        months={months}
        values={monthly}
        format={shortMoney}
      />

      <h3 className="sec-h">Theo từng truyện</h3>
      {sortedStories.length === 0 ? (
        <p className="empty-line">Chưa có truyện nào phát sinh thu nhập trong kỳ này.</p>
      ) : (
        <div className="st-card st-scroll">
        <table className="st-table stack-table">
          <thead>
            <tr>
              <th>Truyện</th>
              <th>Lượt hợp lệ</th>
              <th>Thu nhập ước tính</th>
            </tr>
          </thead>
          <tbody>
            {sortedStories.map((story) => (
              <tr key={story.storyId}>
                <td data-label="Truyện">{story.title}</td>
                <td data-label="Lượt hợp lệ">{count(story.validReads)}</td>
                <td data-label="Thu nhập ước tính">{money(story.estimatedEarningsVnd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
