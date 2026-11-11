'use client';

import { useEffect, useState } from 'react';
import { UsersRound, UserPlus, Activity, UserX, Smile } from 'lucide-react';
import StatCard from '@/app/components/stats/StatCard';
import MonthBars from '@/app/components/stats/MonthBars';
import { useMonthlyStats } from '@/app/components/stats/useMonthlyStats';
import { count } from '@/app/components/stats/statFormat';
import type { MonthPeriod, Period } from '@/app/lib/monthPeriods';
import { showToast } from '@/app/lib/toast';
import { staffService } from '@/app/services/staffService';
import type { UserAccountStatisticsDto } from '@/app/types/backendContracts';

export function AdminAccountsTab({ period, months }: { period: Period; months: MonthPeriod[] }) {
  const [stats, setStats] = useState<UserAccountStatisticsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();
    setLoading(true);

    staffService
      .accountStats(period.start, period.end, ctrl.signal)
      .then((r) => {
        if (!alive || ctrl.signal.aborted) return;
        if (r.success && r.data) {
          setStats(r.data);
        } else {
          showToast(r.message, 'err');
        }
      })
      .catch(() => {
        if (!alive || ctrl.signal.aborted) return;
        showToast('Không tải được số liệu tài khoản.', 'err');
      })
      .finally(() => {
        if (alive && !ctrl.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [period.start, period.end]);

  const monthly = useMonthlyStats(
    months,
    (s, e, sig) => staffService.accountStats(s, e, sig),
    (d) => d.newAccounts,
    [],
  );

  const sub = loading ? 'Đang tải…' : undefined;

  return (
    <div className="admin-accounts-tab">
      <div className="ce-stats">
        <StatCard
          icon={UsersRound}
          label="Tổng phụ huynh"
          value={stats ? count(stats.totalParentAccounts) : '—'}
          sub={sub}
        />
        <StatCard
          icon={UserPlus}
          label="Đăng ký mới"
          value={stats ? count(stats.newAccounts) : '—'}
          sub={sub}
        />
        <StatCard
          icon={Activity}
          label="Đang hoạt động"
          value={stats ? count(stats.activeAccounts) : '—'}
          sub={sub}
        />
        <StatCard
          icon={UserX}
          label="Bị khoá"
          value={stats ? count(stats.lockedOrDisabledAccounts) : '—'}
          info="Số hiện tại, không tính theo kỳ"
          tone={stats && stats.lockedOrDisabledAccounts > 0 ? 'gold' : 'default'}
          sub={sub}
        />
        <StatCard
          icon={Smile}
          label="Hồ sơ bé"
          value={stats ? count(stats.childProfiles) : '—'}
          sub={sub}
        />
      </div>

      <MonthBars
        title="Đăng ký mới 6 tháng gần nhất"
        months={months}
        values={monthly}
        format={count}
      />
    </div>
  );
}
