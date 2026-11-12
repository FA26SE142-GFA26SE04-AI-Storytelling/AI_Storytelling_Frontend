'use client';

import './CreatorContentTab.css';
import { useEffect, useState } from 'react';
import {
  FilePen,
  PackageCheck,
  Hourglass,
  BookOpenCheck,
  CircleCheck,
  PencilLine,
  CircleX,
  Undo2,
  WandSparkles,
  Send,
  Star,
  Circle,
} from 'lucide-react';
import StatCard from '@/app/components/stats/StatCard';
import InfoTip from '@/app/components/InfoTip';
import { count, pct } from '@/app/components/stats/statFormat';
import type { Period } from '@/app/lib/monthPeriods';
import { showToast } from '@/app/lib/toast';
import { creatorStatisticsService } from '@/app/services/creatorStatisticsService';
import type * as B from '@/app/types/backendContracts';

function criterionLabel(key: string): string {
  switch (key) {
    case 'published_stories':
      return 'Truyện đã xuất bản';
    case 'completion_rate':
      return 'Tỉ lệ đọc xong';
    case 'valid_reads':
      return 'Lượt đọc hợp lệ';
    case 'no_violation_removals':
      return 'Không bị gỡ vì vi phạm';
    default:
      return key;
  }
}

function criterionPct(c: B.PartnerCriterionDto): number {
  if (c.key === 'no_violation_removals') {
    return c.met ? 100 : 0;
  }
  if (!c.target || c.target <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((c.current / c.target) * 100)));
}

function criterionValue(c: B.PartnerCriterionDto): string {
  switch (c.key) {
    case 'published_stories':
      return `${c.current}/${c.target}`;
    case 'completion_rate':
      return `${pct(c.current)} / ${pct(c.target)}`;
    case 'valid_reads':
      return `${count(c.current)}/${count(c.target)}`;
    case 'no_violation_removals':
      return c.current === 0 ? 'Không có' : `${c.current} truyện`;
    default:
      return `${c.current}/${c.target}`;
  }
}

export default function CreatorContentTab({ period }: { period: Period }) {
  const [data, setData] = useState<B.CreatorContentStatisticsDto | null>(null);

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();
    setData(null);

    creatorStatisticsService
      .content(period.start, period.end, ctrl.signal)
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
        showToast(err instanceof Error ? err.message : 'Không tải được thống kê nội dung.', 'err');
      });

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [period.start, period.end]);

  if (!data) {
    return <p className="sub">Đang tải…</p>;
  }

  return (
    <div className="cct-tab">
      <h3 className="sec-h">
        Truyện của tôi <InfoTip text="Số hiện tại, không tính theo kỳ" />
      </h3>
      <div className="ce-stats cct-four">
        <StatCard icon={FilePen} label="Nháp" value={count(data.draft)} />
        <StatCard icon={PackageCheck} label="Sẵn sàng" value={count(data.ready)} />
        <StatCard icon={Hourglass} label="Chờ duyệt" value={count(data.pendingReview)} />
        <StatCard
          icon={BookOpenCheck}
          label="Đã xuất bản"
          value={count(data.published)}
          tone="gold"
        />
      </div>

      <h3 className="sec-h">Gửi duyệt trong kỳ</h3>
      <div className="ce-stats cct-four">
        <StatCard icon={CircleCheck} label="Được duyệt" value={count(data.submissionsApproved)} />
        <StatCard
          icon={PencilLine}
          label="Yêu cầu sửa"
          value={count(data.submissionsChangesRequested)}
        />
        <StatCard icon={CircleX} label="Từ chối" value={count(data.submissionsRejected)} />
        <StatCard icon={Undo2} label="Đã rút" value={count(data.submissionsWithdrawn)} />
      </div>

      <h3 className="sec-h">
        Lượt còn lại <InfoTip text="Số hiện tại, không tính theo kỳ" />
      </h3>
      <div className="ce-stats">
        <StatCard
          icon={WandSparkles}
          label="Lượt tạo truyện AI"
          value={count(data.remainingAiCredits)}
        />
        <StatCard icon={Send} label="Lượt gửi duyệt" value={count(data.remainingSubmitCredits)} />
      </div>

      <div className="st-card cct-partner">
        <div className="cct-partner-head">
          <h3 className="sec-h">
            Tiến độ lên Creator đối tác{' '}
            <InfoTip text="Tính trong 90 ngày gần nhất. Đạt cả 4 tiêu chí để lên hạng đối tác." />
          </h3>
          <span className="pill cct-tier">
            <Star aria-hidden /> {data.tier}
          </span>
          {data.partnerProgress.isEligible && (
            <span className="pill cct-eligible">Đủ điều kiện</span>
          )}
        </div>
        <div className="cct-crit">
          {(data.partnerProgress?.criteria ?? []).map((c: B.PartnerCriterionDto) => {
            const pctValue = criterionPct(c);
            return (
              <div className="cct-row" key={c.key}>
                <span>{criterionLabel(c.key)}</span>
                <div className="cct-bar">
                  <i style={{ width: `${pctValue}%` }} />
                </div>
                <span className="cct-val">{criterionValue(c)}</span>
                {c.met ? (
                  <CircleCheck className="cct-ok" aria-label="Đạt" role="img" />
                ) : (
                  <Circle className="cct-no" aria-label="Chưa đạt" role="img" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
