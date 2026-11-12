"use client";

import { useEffect, useState } from "react";
import { Coins, Gift, ReceiptText, Sparkles, Users } from "lucide-react";
import type { MonthPeriod, Period } from "@/app/lib/monthPeriods";
import type { RevenueStatisticsDto } from "@/app/types/backendContracts";
import { staffService } from "@/app/services/staffService";
import { showToast } from "@/app/lib/toast";
import StatCard from "@/app/components/stats/StatCard";
import MonthBars from "@/app/components/stats/MonthBars";
import { useMonthlyStats } from "@/app/components/stats/useMonthlyStats";
import { count, money, pct, shortMoney } from "@/app/components/stats/statFormat";
import RevenueByPlanDonut from "./RevenueByPlanDonut";
import "./AdminRevenueTab.css";

/** Nguồn cấp lượt AI (CreditSource của Backend) bằng tiếng Việt; nguồn lạ thì giữ nguyên tên. */
const CREDIT_SOURCE_LABELS: Record<string, string> = {
  Trial: "Dùng thử",
  Cycle: "Chu kỳ gói",
  AddOn: "Add-on",
  Legacy: "Gói cũ",
  AdminAdjust: "Admin cấp",
  CreatorMonthly: "Hạn mức Creator",
  CreatorPack: "Gói Creator",
};

export function AdminRevenueTab({
  period,
  months,
}: {
  period: Period;
  months: MonthPeriod[];
}) {
  const [data, setData] = useState<RevenueStatisticsDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let alive = true;
    const ctrl = new AbortController();
    setLoading(true);

    staffService
      .revenueStats(period.start, period.end, ctrl.signal)
      .then((r) => {
        if (!alive || ctrl.signal.aborted) return;
        if (r.success && r.data) {
          setData(r.data);
        } else {
          showToast(r.message || "Không tải được số liệu doanh thu.", "err");
          setData(null);
        }
      })
      .catch(() => {
        if (!alive || ctrl.signal.aborted) return;
        showToast("Không tải được số liệu doanh thu.", "err");
        setData(null);
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
    (s, e, sig) => staffService.revenueStats(s, e, sig),
    (d) => d.totalRevenueVnd,
    [],
  );

  if (loading && !data) {
    return <p className="sub">Đang tải…</p>;
  }

  if (!data) {
    return <p className="empty-line">Chưa có dữ liệu thống kê doanh thu.</p>;
  }

  const selectedKey = months.find(
    (m) => m.start === period.start && m.end === period.end,
  )?.key;

  return (
    <div className="admin-rev-tab">
      <div className="ce-stats st-grid">
        <StatCard
          icon={Coins}
          label="Tổng doanh thu"
          value={money(data.totalRevenueVnd)}
          tone="gold"
        />
        <StatCard
          icon={ReceiptText}
          label="Giao dịch đã thanh toán"
          value={count(data.paidTransactionCount)}
        />
        <StatCard
          icon={Users}
          label="Phụ huynh mua"
          value={count(data.buyingParents)}
          sub={`${count(data.repeatBuyingParents)} mua lại`}
        />
        <StatCard
          icon={Gift}
          label="Quỹ Creator"
          value={money(data.creatorFundVnd)}
          info={`Tỉ lệ quỹ: Đọc ${pct(data.readingFundRate)}, Sáng tạo ${pct(data.creativeFundRate)}`}
        />
      </div>

      <MonthBars
        title="Doanh thu 6 tháng gần nhất"
        months={months}
        values={monthly}
        format={shortMoney}
        selectedKey={selectedKey}
      />

      <div className="rev-split">
        <div className="pane">
          <h3 className="sec-h">Doanh thu theo gói</h3>
          <RevenueByPlanDonut items={data.revenueByPlanType} />
          {data.revenueByPlan && data.revenueByPlan.length > 0 ? (
            <div className="st-scroll">
              <table className="stack-table st-table">
                <thead>
                  <tr>
                    <th>Gói</th>
                    <th>Giao dịch</th>
                    <th>Doanh thu</th>
                  </tr>
                </thead>
                <tbody>
                  {data.revenueByPlan.map((p) => (
                    <tr key={p.planId}>
                      <td data-label="Gói">{p.planName}</td>
                      <td data-label="Giao dịch">{count(p.transactionCount)}</td>
                      <td data-label="Doanh thu">{money(p.revenueVnd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        <div className="pane">
          <h3 className="sec-h">Giao dịch và lượt AI</h3>
          <div className="rev-status-pills">
            <span className="pill ok">
              Đã thanh toán: {count(data.transactionsByStatus.paid)}
            </span>
            <span className="pill wait">
              Chờ thanh toán: {count(data.transactionsByStatus.pending)}
            </span>
            <span className="pill draft">
              Hết hạn: {count(data.transactionsByStatus.expired)}
            </span>
            <span className="pill flag">
              Sai số tiền: {count(data.transactionsByStatus.mismatchAmount)}
            </span>
          </div>
          <p className="sub rev-note">
            Xác nhận tay: {count(data.manuallyMarkedPaidCount)} giao dịch, {money(data.manuallyMarkedPaidRevenueVnd)}
          </p>
          <hr className="rev-divider" />
          <div className="rev-mini-grid">
            <div className="rev-mini">
              <Sparkles aria-hidden="true" />
              <small>Lượt đã cấp</small>
              <b>{count(data.creditsGranted)}</b>
            </div>
            <div className="rev-mini">
              <Sparkles aria-hidden="true" />
              <small>Đã dùng</small>
              <b>{count(data.creditsUsed)}</b>
            </div>
          </div>
          {data.creditsGrantedBySource && data.creditsGrantedBySource.length > 0 ? (
            <div className="rev-credit-sources">
              <span className="sub">Nguồn cấp:</span>
              <div className="rev-credit-pills">
                {data.creditsGrantedBySource.map((s) => (
                  <span className="pill draft" key={s.source}>
                    {CREDIT_SOURCE_LABELS[s.source] ?? s.source}: {count(s.credits)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
