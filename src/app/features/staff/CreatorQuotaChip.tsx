"use client";

import { useEffect, useState } from 'react';
import { WandSparkles, Send, CreditCard } from 'lucide-react';
import { paymentService, CREATOR_QUOTA_CHANGED } from '@/app/services/paymentService';
import { usePop } from '@/app/lib/motion';
import './CreatorQuotaChip.css';

export default function CreatorQuotaChip({
  kind,
  onBuy,
}: {
  kind: 'ai' | 'submit';
  onBuy?: () => void;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const countRef = usePop<HTMLElement>(remaining);

  useEffect(() => {
    let alive = true;
    let ctrl: AbortController | null = null;

    const fetchQuota = () => {
      ctrl?.abort();
      ctrl = new AbortController();
      paymentService
        .creatorQuota(ctrl.signal)
        .then((r) => {
          if (!alive) return;
          if (!r?.success || !r?.data) {
            setRemaining(null);
            return;
          }
          const val =
            kind === 'ai'
              ? r.data.aiCredits?.totalRemaining
              : r.data.submitCredits?.totalRemaining;
          setRemaining(typeof val === 'number' ? val : null);
        })
        .catch(() => {
          if (alive) setRemaining(null);
        });
    };

    fetchQuota();
    window.addEventListener(CREATOR_QUOTA_CHANGED, fetchQuota);

    return () => {
      alive = false;
      ctrl?.abort();
      window.removeEventListener(CREATOR_QUOTA_CHANGED, fetchQuota);
    };
  }, [kind]);

  if (remaining === null) {
    return null;
  }

  const isAi = kind === 'ai';
  const Icon = isAi ? WandSparkles : Send;
  const isZero = remaining === 0;
  const label = isAi ? 'lượt AI' : 'lượt gửi duyệt';

  return (
    <div className={`cq-chip${isZero ? ' cq-warn' : ''}`}>
      <Icon className="ic" aria-hidden="true" />
      <span>
        Còn <b ref={countRef}>{remaining}</b> {label}
      </span>
      {isZero && onBuy ? (
        <button type="button" className="btn btn-s" onClick={onBuy}>
          <CreditCard className="ic" aria-hidden="true" />
          <span>Mua thêm</span>
        </button>
      ) : null}
    </div>
  );
}
