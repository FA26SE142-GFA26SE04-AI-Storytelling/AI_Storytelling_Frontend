import './CreatorQuotaPanel.css';
import type { CreatorQuotaDto, SubscriptionPlanDto } from '@/app/types/backendContracts';
import { useGrowBars, usePop } from '@/app/lib/motion';
import { WandSparkles, Send, Package, Check, CreditCard, CalendarClock } from 'lucide-react';

const day = (iso: string) => new Date(iso).toLocaleDateString('vi-VN');

export default function CreatorQuotaPanel(props: {
  quota: CreatorQuotaDto | null; // null = đang tải (hiện '…')
  error: boolean; // true = lỗi tải
  pack: SubscriptionPlanDto | undefined; // Gói Creator (planType 'CreatorPack')
  packLoading: boolean;
  benefits: string[]; // danh sách quyền lợi do cha truyền vào
  buyLabel: string; // ví dụ 'Mua gói'
  busy: boolean;
  onBuy: (plan: SubscriptionPlanDto) => void;
}) {
  const { quota, error, pack, packLoading, benefits, buyLabel, busy, onBuy } = props;

  const growRef = useGrowBars<HTMLDivElement>('.cqp-bar > i', [quota]);
  const aiNumRef = usePop<HTMLElement>(quota ? quota.aiCredits.totalRemaining : undefined);
  const submitNumRef = usePop<HTMLElement>(quota ? quota.submitCredits.totalRemaining : undefined);

  const calcPct = (rem: number, allow: number) =>
    allow > 0 ? Math.min(100, Math.max(0, Math.round((rem / allow) * 100))) : 0;

  return (
    <div className="cqp-layout">
      <div ref={growRef} className="cqp-main">
        <h3 className="cqp-title display">Lượt của bạn</h3>
        {error ? (
          <p className="notice warn">Chưa tải được lượt của bạn. Hãy tải lại trang.</p>
        ) : (
          <>
            <div
              className={`cqp-card${
                quota && quota.aiCredits.totalRemaining === 0 ? ' cqp-card-empty' : ''
              }`}
            >
              <div className="cqp-head">
                <span className="cqp-label">
                  <WandSparkles className="ic" aria-hidden />
                  Lượt tạo truyện AI
                </span>
                <span ref={aiNumRef} className="cqp-num">
                  {quota ? quota.aiCredits.totalRemaining : '…'}
                </span>
              </div>
              {quota && quota.aiCredits.monthlyAllowance > 0 && (
                <div className="cqp-bar">
                  <i
                    data-h={`${calcPct(
                      quota.aiCredits.monthlyRemaining,
                      quota.aiCredits.monthlyAllowance
                    )}%`}
                  />
                </div>
              )}
              {quota && (
                <div className="cqp-pills">
                  <span className="pill">
                    Tháng này: {quota.aiCredits.monthlyRemaining}/{quota.aiCredits.monthlyAllowance}
                  </span>
                  {quota.aiCredits.purchasedRemaining > 0 && (
                    <span className="pill">Đã mua: {quota.aiCredits.purchasedRemaining}</span>
                  )}
                  {quota.aiCredits.otherRemaining > 0 && (
                    <span className="pill">Khác: {quota.aiCredits.otherRemaining}</span>
                  )}
                </div>
              )}
            </div>

            <div
              className={`cqp-card${
                quota && quota.submitCredits.totalRemaining === 0 ? ' cqp-card-empty' : ''
              }`}
            >
              <div className="cqp-head">
                <span className="cqp-label">
                  <Send className="ic" aria-hidden />
                  Lượt gửi duyệt
                </span>
                <span ref={submitNumRef} className="cqp-num">
                  {quota ? quota.submitCredits.totalRemaining : '…'}
                </span>
              </div>
              {quota && quota.submitCredits.monthlyAllowance > 0 && (
                <div className="cqp-bar">
                  <i
                    data-h={`${calcPct(
                      quota.submitCredits.monthlyRemaining,
                      quota.submitCredits.monthlyAllowance
                    )}%`}
                  />
                </div>
              )}
              {quota && (
                <div className="cqp-pills">
                  <span className="pill">
                    Tháng này: {quota.submitCredits.monthlyRemaining}/{quota.submitCredits.monthlyAllowance}
                  </span>
                  {quota.submitCredits.purchasedRemaining > 0 && (
                    <span className="pill">Đã mua: {quota.submitCredits.purchasedRemaining}</span>
                  )}
                  {quota.submitCredits.otherRemaining > 0 && (
                    <span className="pill">Khác: {quota.submitCredits.otherRemaining}</span>
                  )}
                </div>
              )}
            </div>

            {quota && (
              <p className="cqp-refresh">
                <CalendarClock className="ic" aria-hidden />
                Hạn mức tháng làm mới ngày {day(quota.monthlyAllowanceResetsAt)}
              </p>
            )}
          </>
        )}
      </div>

      <article className="cqp-pack featured">
        {packLoading && !pack ? (
          <p className="sub">Đang tải gói…</p>
        ) : !pack ? (
          <p className="notice warn">Hiện chưa có Gói Creator.</p>
        ) : (
          <>
            <div className="cqp-pack-head">
              <Package className="ic" aria-hidden />
              <h3 className="cqp-pack-name display">{pack.name}</h3>
            </div>
            <p className="cqp-price-row">
              <b className="cqp-price">{pack.priceVnd.toLocaleString('vi-VN')} ₫</b>{' '}
              <span className="cqp-unit">/ lần mua</span>
            </p>
            <ul className="cqp-benefits">
              {benefits.map((b, i) => (
                <li key={i}>
                  <Check className="ic" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="btn btn-p cqp-buy"
              disabled={busy || !pack.isPurchasable}
              onClick={() => onBuy(pack)}
            >
              <CreditCard className="ic" aria-hidden />
              {buyLabel}
            </button>
            {!pack.isPurchasable && pack.lockedReason && (
              <p className="notice warn">{pack.lockedReason}</p>
            )}
          </>
        )}
      </article>
    </div>
  );
}
