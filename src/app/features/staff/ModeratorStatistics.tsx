'use client';

import './ModeratorStatistics.css';
import { useEffect, useState } from 'react';
import {
  Inbox,
  Hand,
  AlarmClock,
  CircleCheck,
  PencilLine,
  CircleX,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import type { CreatorPageProps } from './CreatorStories';
import { Page } from './ui';
import { defaultPeriod, type Period } from '@/app/lib/monthPeriods';
import PeriodPicker from '@/app/components/stats/PeriodPicker';
import StatCard from '@/app/components/stats/StatCard';
import InfoTip from '@/app/components/InfoTip';
import { count } from '@/app/components/stats/statFormat';
import { showToast } from '@/app/lib/toast';
import { moderationStatisticsService } from '@/app/services/moderationStatisticsService';
import type * as B from '@/app/types/backendContracts';
import { MODERATION_TYPE_LABELS } from './moderationConfig';

export default function ModeratorStatistics(_props: CreatorPageProps) {
  const [period, setPeriod] = useState<Period>(() => defaultPeriod());
  const [data, setData] = useState<B.ModerationStatisticsDto | null>(null);

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();
    setData(null);

    moderationStatisticsService
      .get(period.start, period.end, ctrl.signal)
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
        showToast(
          err instanceof Error ? err.message : 'Không tải được thống kê kiểm duyệt.',
          'err',
        );
      });

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [period.start, period.end]);

  const rows = (() => {
    if (!data) return [];
    const queueMap = new Map<string, B.ModerationQueueCountDto>();
    for (const q of data.queueByType ?? []) {
      queueMap.set(q.itemType, q);
    }
    const decisionMap = new Map<string, B.ModerationDecisionCountDto>();
    for (const d of data.myDecisionsByType ?? []) {
      decisionMap.set(d.itemType, d);
    }

    const allTypes = Array.from(new Set([...queueMap.keys(), ...decisionMap.keys()]));

    return allTypes
      .map((itemType) => {
        const q = queueMap.get(itemType);
        const d = decisionMap.get(itemType);
        const pending = q?.pending ?? 0;
        const claimed = q?.claimed ?? 0;
        const overdue = q?.overdue ?? 0;
        const approved = d?.approved ?? 0;
        const changesRequested = d?.changesRequested ?? 0;
        const rejected = d?.rejected ?? 0;
        return {
          itemType,
          pending,
          claimed,
          overdue,
          approved,
          changesRequested,
          rejected,
          score: pending + claimed,
        };
      })
      .sort((a, b) => b.score - a.score);
  })();

  return (
    <Page title="Thống kê">
      <PeriodPicker value={period} onChange={setPeriod} />

      {!data ? (
        <p className="sub">Đang tải…</p>
      ) : (
        <div className="mst-tab">
          <h3 className="sec-h">
            Hàng đợi lúc này <InfoTip text="Toàn bộ hàng đợi tại thời điểm xem, không tính theo kỳ" />
          </h3>
          <div className="ce-stats mst-three">
            <StatCard icon={Inbox} label="Chờ nhận" value={count(data.pending)} />
            <StatCard icon={Hand} label="Đang xử lý" value={count(data.claimed)} />
            <StatCard
              icon={AlarmClock}
              label="Quá hạn SLA"
              value={count(data.overdue)}
              tone={data.overdue > 0 ? 'gold' : 'default'}
            />
          </div>

          <h3 className="sec-h">Quyết định của tôi trong kỳ</h3>
          <div className="ce-stats mst-three">
            <StatCard icon={CircleCheck} label="Đã duyệt" value={count(data.myApproved)} />
            <StatCard icon={PencilLine} label="Yêu cầu sửa" value={count(data.myChangesRequested)} />
            <StatCard icon={CircleX} label="Từ chối" value={count(data.myRejected)} />
          </div>

          <h3 className="sec-h">Khác trong kỳ</h3>
          <div className="ce-stats mst-two">
            <StatCard icon={RotateCcw} label="Lượt gửi lại" value={count(data.resubmissionCount)} />
            <StatCard icon={ShieldAlert} label="Vùng xám" value={count(data.grayZoneCount)} />
          </div>

          <h3 className="sec-h">Theo loại mục</h3>
          {rows.length === 0 ? (
            <p className="empty-line">
              Hàng đợi trống và bạn chưa quyết định mục nào trong kỳ này.
            </p>
          ) : (
            <div className="st-card st-scroll">
              <table className="st-table stack-table">
                <thead>
                  <tr>
                    <th>Loại</th>
                    <th>Chờ nhận</th>
                    <th>Đang xử lý</th>
                    <th>Quá hạn</th>
                    <th>Đã duyệt</th>
                    <th>Yêu cầu sửa</th>
                    <th>Từ chối</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const typeName =
                      (MODERATION_TYPE_LABELS as Record<string, string>)[r.itemType] ?? r.itemType;
                    return (
                      <tr key={r.itemType}>
                        <td data-label="Loại">{typeName}</td>
                        <td data-label="Chờ nhận">{count(r.pending)}</td>
                        <td data-label="Đang xử lý">{count(r.claimed)}</td>
                        <td
                          data-label="Quá hạn"
                          className={r.overdue > 0 ? 'mst-warn' : undefined}
                        >
                          {count(r.overdue)}
                        </td>
                        <td data-label="Đã duyệt">{count(r.approved)}</td>
                        <td data-label="Yêu cầu sửa">{count(r.changesRequested)}</td>
                        <td data-label="Từ chối">{count(r.rejected)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Page>
  );
}
