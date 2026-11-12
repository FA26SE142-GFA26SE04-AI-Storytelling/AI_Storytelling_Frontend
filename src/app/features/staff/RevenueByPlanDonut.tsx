"use client";

import type { PlanTypeRevenueDto } from "@/app/types/backendContracts";
import { useDrawDonut } from "@/app/lib/motion";
import { count, money } from "@/app/components/stats/statFormat";
import "./AdminRevenueTab.css";

const PLAN_TYPE_LABELS: Record<string, string> = {
  Reading: "Gói Đọc",
  Creative: "Gói Sáng tạo",
  AddOn: "Add-on",
  CreatorPack: "Gói Creator",
  Legacy: "Gói cũ",
};

const PALETTE = [
  "var(--primary)",
  "var(--gold)",
  "var(--mint)",
  "var(--sky)",
  "var(--rose)",
  "var(--gold-deep)",
];

export default function RevenueByPlanDonut({
  items,
}: {
  items: PlanTypeRevenueDto[];
}) {
  const safeItems = items ?? [];
  const total = safeItems.reduce(
    (sum, it) => sum + (it.revenueVnd > 0 ? it.revenueVnd : 0),
    0,
  );

  const donutRef = useDrawDonut<SVGSVGElement>([total, safeItems.length]);

  if (total === 0) {
    return <p className="empty-line">Chưa có giao dịch nào trong kỳ này.</p>;
  }

  let acc = 0;

  return (
    <div className="rev-donut-card">
      <div className="rev-donut-wrap">
        <svg
          ref={donutRef}
          width="150"
          height="150"
          viewBox="0 0 42 42"
          className="rev-donut-svg"
          role="img"
          aria-label="Biểu đồ tròn doanh thu theo loại gói"
        >
          <circle
            cx="21"
            cy="21"
            r="15.9"
            fill="none"
            style={{ stroke: "var(--line)" }}
            strokeWidth="5"
          />
          {safeItems.map((item, idx) => {
            const len = (item.revenueVnd / total) * 100;
            if (len <= 0) return null;
            const color = PALETTE[idx % PALETTE.length];
            const offset = acc;
            acc += len;
            return (
              <circle
                key={item.planType}
                cx="21"
                cy="21"
                r="15.9"
                fill="none"
                style={{ stroke: color }}
                strokeWidth="5"
                data-d={`${Math.max(len - 1, 0.1)} ${101 - len}`}
                strokeDasharray={`${Math.max(len - 1, 0.1)} ${101 - len}`}
                strokeDashoffset={-offset}
              />
            );
          })}
        </svg>
        <div className="rev-donut-center">
          <span className="rev-donut-sub">Tổng</span>
          <b className="rev-donut-total">{money(total)}</b>
        </div>
      </div>
      <div className="dl grow">
        {safeItems.map((item, idx) => {
          const color = PALETTE[idx % PALETTE.length];
          const label = PLAN_TYPE_LABELS[item.planType] ?? item.planType;
          return (
            <div key={item.planType}>
              <i style={{ background: color }} />
              <span>{label}</span>
              <span className="sub">({count(item.transactionCount)} giao dịch)</span>
              <b>{money(item.revenueVnd)}</b>
            </div>
          );
        })}
      </div>
    </div>
  );
}
