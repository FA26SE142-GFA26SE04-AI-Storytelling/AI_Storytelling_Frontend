'use client';
import { Check } from 'lucide-react';
import { benefitLines, quotaLines, tierLabel } from '@/app/lib/billing';
import type { MyQuotaDto } from '@/app/types/backendContracts';

const day = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');

/** Khối "Gói đang dùng": mức hiện tại, hạn, lượt tạo truyện AI còn lại và quyền lợi. */
export default function MyPlanSummary({ quota }: { quota: MyQuotaDto | null }) {
  if (!quota) return <p className="sub">Đang tải…</p>;
  const b = quota.benefits;
  const lines = quotaLines(quota);
  return <article className="plan-card" aria-label="Gói đang dùng">
    <div className="plan-head">
      <span className="plan-tag">Gói đang dùng</span>
      <b className="display plan-title">{tierLabel(quota)}</b>
      {quota.plan && <small className="plan-note">Hiệu lực đến {day(quota.plan.endAt)}</small>}
      {quota.nextPlan && <small className="plan-note">Đã gia hạn: {quota.nextPlan.planName} từ {day(quota.nextPlan.startAt)}</small>}
      <p><b>{quota.totalRemaining}</b> lượt tạo truyện AI còn lại</p>
      {lines.length > 0 && <small className="plan-note">{lines.map(l => `${l.label}: ${l.value}`).join(' · ')}</small>}
    </div>
    {b && <ul className="plan-list">
      {benefitLines(b).map(t => <li key={t}><Check className="ic" />{t}</li>)}
      {b.weeklyNewLibraryStories !== null && <li><Check className="ic" />Đã mở {quota.newLibraryStoriesThisWeek}/{b.weeklyNewLibraryStories} truyện thư viện mới tuần này</li>}
      <li><Check className="ic" />Đã dùng trợ lý viết {quota.writingAssistsToday}/{b.writingAssistPerDay} lần hôm nay</li>
    </ul>}
  </article>;
}
