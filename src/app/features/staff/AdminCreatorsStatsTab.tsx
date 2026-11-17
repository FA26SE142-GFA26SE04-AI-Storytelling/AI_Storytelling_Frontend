'use client';

import { useEffect, useState } from 'react';
import { Award, BookOpen, Eye, Heart, PiggyBank, UsersRound } from 'lucide-react';
import StatCard from '@/app/components/stats/StatCard';
import { count, money } from '@/app/components/stats/statFormat';
import type { Period } from '@/app/lib/monthPeriods';
import { showToast } from '@/app/lib/toast';
import { creatorAdminService } from '@/app/services/creatorAdminService';
import type { AdminCreatorStatistics } from '@/app/types/creatorAdmin';

const STATUS: Record<string, string> = { Active: 'Đang hoạt động', Suspended: 'Đã vô hiệu hoá', AwaitingApproval: 'Chờ duyệt', Registered: 'Chưa xác thực' };

/** Bảng từng Creator; dùng cho tab thống kê và số liệu đã chụp trong báo cáo đã lưu. */
export function CreatorStatsTable({ stats }: { stats: AdminCreatorStatistics }) {
  if (stats.creators.length === 0) return <p className="sub">Chưa có Creator nào.</p>;
  return (
    <table className="st-table stack-table">
      <thead>
        <tr><th>Creator</th><th>Cấp</th><th>Truyện tạo trong kỳ</th><th>Đang công khai</th><th>Lượt xem</th><th>Yêu thích</th><th>Đọc hợp lệ</th><th>Thu nhập dự kiến</th></tr>
      </thead>
      <tbody>
        {stats.creators.map((c) => (
          <tr key={c.creatorUserId}>
            <td data-label="Creator"><b>{c.fullName || c.username}</b><br /><small className="sub">{c.username} · {STATUS[c.status] ?? c.status}</small></td>
            <td data-label="Cấp">{c.tier === 'Partner' ? <span className="pill ok"><Award className="ic" />Đối tác</span> : 'Creator'}</td>
            <td data-label="Truyện tạo trong kỳ">{count(c.storiesCreated)}</td>
            <td data-label="Đang công khai">{count(c.publishedStories)}</td>
            <td data-label="Lượt xem">{count(c.views)}</td>
            <td data-label="Yêu thích">{count(c.favorites)}</td>
            <td data-label="Đọc hợp lệ">{count(c.validReads)}</td>
            <td data-label="Thu nhập dự kiến"><b>{money(c.estimatedEarningsVnd)}</b></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Thống kê Creator cho Administrator (Luồng 5, 5e): tổng hợp của kỳ và từng Creator. Lượt xem, lượt đọc hợp lệ và thu nhập
 * dự kiến tính như thống kê cá nhân của Creator; lượt yêu thích là số đang yêu thích tại lúc xem.
 */
export function AdminCreatorsStatsTab({ period }: { period: Period }) {
  const [stats, setStats] = useState<AdminCreatorStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    void creatorAdminService.creatorStats(period.start, period.end, ctrl.signal).then((r) => {
      if (ctrl.signal.aborted) return;
      if (r.success && r.data) setStats(r.data);
      else showToast(r.message, 'err');
      setLoading(false);
    });
    return () => ctrl.abort();
  }, [period.start, period.end]);

  const sub = loading ? 'Đang tải…' : undefined;
  return (
    <div className="admin-creators-tab">
      <div className="ce-stats">
        <StatCard icon={UsersRound} label="Creator đang hoạt động" value={stats ? `${count(stats.activeCreators)} / ${count(stats.totalCreators)}` : '—'}
          info="Số hiện tại, không tính theo kỳ" sub={sub} />
        <StatCard icon={Award} label="Creator đối tác" value={stats ? count(stats.partnerCreators) : '—'} sub={sub} />
        <StatCard icon={BookOpen} label="Truyện tạo trong kỳ" value={stats ? count(stats.storiesCreated) : '—'} sub={sub} />
        <StatCard icon={Eye} label="Lượt xem" value={stats ? count(stats.views) : '—'} sub={sub} />
        <StatCard icon={Heart} label="Yêu thích" value={stats ? count(stats.favorites) : '—'} info="Số đang yêu thích, không tính theo kỳ" sub={sub} />
        <StatCard icon={PiggyBank} label="Thu nhập dự kiến" value={stats ? money(stats.estimatedEarningsVnd) : '—'}
          info={stats ? `Quỹ Creator của kỳ ${money(stats.creatorFundVnd)}, chia theo ${count(stats.validReads)} lượt đọc hợp lệ, làm tròn xuống từng Creator` : undefined}
          tone="gold" sub={sub} />
      </div>
      {stats && <CreatorStatsTable stats={stats} />}
    </div>
  );
}
