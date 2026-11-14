'use client';
import { Check, Sparkles } from 'lucide-react';
import { benefitLines, planTypeLabel, vnd } from '@/app/lib/billing';
import type { SubscriptionPlanDto } from '@/app/types/backendContracts';

const priceSuffix = (planType: string) => (planType === 'AddOn' ? 'mua thêm' : planType === 'Reading' || planType === 'Creative' ? '/ tháng' : '');

/** Lưới thẻ gói: giá, lượt và quyền lợi do Admin cấu hình; gói chưa mua được hiện lý do thay vì nút mua. */
export default function PlanCards({ plans, disabled, onBuy }: { plans: SubscriptionPlanDto[]; disabled: boolean; onBuy: (plan: SubscriptionPlanDto) => void }) {
  const featured = plans.find(p => p.planType === 'Creative')?.id ?? null;
  return <div className="plan-grid">
    {plans.map(plan => <article key={plan.id} className={`plan-card${plan.id === featured ? ' featured' : ''}`}>
      <div className="plan-head">
        <Sparkles className="plan-icon" aria-hidden />
        <b className="display plan-title">{plan.name}</b>
        <span className="plan-tag">{planTypeLabel(plan.planType)}</span>
        <div className="plan-price"><b>{vnd(plan.priceVnd)}</b>{priceSuffix(plan.planType) && <span><small>{priceSuffix(plan.planType)}</small></span>}</div>
        {plan.aiCredits > 0 && <small className="plan-note">{plan.planType === 'AddOn' ? `+${plan.aiCredits} lượt tạo truyện AI, dùng đến hết chu kỳ hiện tại` : `${plan.aiCredits} lượt tạo truyện AI mỗi chu kỳ`}</small>}
        {plan.isPurchasable
          ? <button className={`btn btn-c ${plan.id === featured ? 'btn-p' : 'btn-s'}`} disabled={disabled} onClick={() => onBuy(plan)}>Mua gói</button>
          : <p className="notice warn">{plan.lockedReason}</p>}
      </div>
      {plan.benefits && <ul className="plan-list">
        {benefitLines(plan.benefits).map(t => <li key={t}><Check className="ic" />{t}</li>)}
      </ul>}
    </article>)}
  </div>;
}
