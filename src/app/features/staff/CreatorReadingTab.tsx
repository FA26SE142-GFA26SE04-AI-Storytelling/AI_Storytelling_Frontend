'use client';

import { useEffect, useState } from 'react';
import { Eye, CheckCheck, Percent, BadgeCheck, Heart } from 'lucide-react';
import StatCard from '@/app/components/stats/StatCard';
import MonthBars from '@/app/components/stats/MonthBars';
import { useMonthlyStats } from '@/app/components/stats/useMonthlyStats';
import { count, pct } from '@/app/components/stats/statFormat';
import type { MonthPeriod, Period } from '@/app/lib/monthPeriods';
import { showToast } from '@/app/lib/toast';
import { creatorStatisticsService } from '@/app/services/creatorStatisticsService';
import type { CreatorReadingStatisticsDto } from '@/app/types/backendContracts';

export function CreatorReadingTab({
  period,
  months,
}: {
  period: Period;
  months: MonthPeriod[];
}) {
  const [data, setData] = useState<CreatorReadingStatisticsDto | null>(null);

  const monthly = useMonthlyStats(
    months,
    (s, e, sig) => creatorStatisticsService.reading(s, e, sig),
    (d) => d.validReads,
    [],
  );

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();
    setData(null);

    creatorStatisticsService
      .reading(period.start, period.end, ctrl.signal)
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
        showToast(err instanceof Error ? err.message : 'Không tải được thống kê lượt đọc.', 'err');
      });

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [period.start, period.end]);

  if (!data) {
    return <p className="sub">Đang tải…</p>;
  }

  const sortedStories = [...(data.stories ?? [])].sort((a, b) => b.validReads - a.validReads);

  return (
    <div className="creator-reading-tab">
      <div className="ce-stats">
        <StatCard icon={Eye} label="Lượt xem" value={count(data.views)} />
        <StatCard icon={CheckCheck} label="Đọc xong" value={count(data.completedReadings)} />
        <StatCard icon={Percent} label="Tỉ lệ hoàn thành" value={pct(data.completionRate)} />
        <StatCard icon={BadgeCheck} label="Lượt đọc hợp lệ" value={count(data.validReads)} />
        <StatCard
          icon={Heart}
          label="Yêu thích"
          value={count(data.favorites)}
          info="Số hiện tại, không tính theo kỳ"
        />
      </div>

      <MonthBars
        title="Lượt đọc hợp lệ 6 tháng gần nhất"
        months={months}
        values={monthly}
        format={count}
      />

      <h3 className="sec-h">Theo từng truyện</h3>
      {sortedStories.length === 0 ? (
        <p className="empty-line">Chưa có truyện nào được đọc trong kỳ này.</p>
      ) : (
        <div className="st-card st-scroll">
        <table className="st-table stack-table">
          <thead>
            <tr>
              <th>Truyện</th>
              <th>Xem</th>
              <th>Đọc xong</th>
              <th>Tỉ lệ</th>
              <th>Hợp lệ</th>
              <th>Yêu thích</th>
            </tr>
          </thead>
          <tbody>
            {sortedStories.map((story) => {
              const rate = pct(story.completionRate);
              const barWidth = `${Math.max(0, Math.min(100, Math.round(story.completionRate * 100)))}%`;
              return (
                <tr key={story.storyId}>
                  <td data-label="Truyện">{story.title}</td>
                  <td data-label="Xem">{count(story.views)}</td>
                  <td data-label="Đọc xong">{count(story.completedReadings)}</td>
                  <td data-label="Tỉ lệ">
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          width: '60px',
                          height: '6px',
                          background: 'var(--line)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                          verticalAlign: 'middle',
                        }}
                      >
                        <span
                          style={{
                            display: 'block',
                            height: '100%',
                            width: barWidth,
                            background: 'var(--primary)',
                            borderRadius: '3px',
                          }}
                        />
                      </span>
                      <span>{rate}</span>
                    </span>
                  </td>
                  <td data-label="Hợp lệ">{count(story.validReads)}</td>
                  <td data-label="Yêu thích">{count(story.favorites)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
