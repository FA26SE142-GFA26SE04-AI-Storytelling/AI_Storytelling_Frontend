"use client";

import { planTypeLabel, ratePercent, transactionStatusLabel, vnd } from "@/app/lib/billing";
import type { AccountStatisticsDto, RevenueStatisticsDto } from "@/app/types/backendContracts";

const NO_REVENUE = "Báo cáo này được tạo trước khi có số liệu doanh thu.";
const NO_ACCOUNTS = "Báo cáo này được tạo trước khi có số liệu tài khoản.";

const SOURCE_LABELS: Record<string, string> = { Trial: "Dùng thử", Cycle: "Theo gói", AddOn: "Add-on", AdminAdjust: "Admin cấp", Legacy: "Gói cũ" };
const sourceLabel = (s: string) => SOURCE_LABELS[s] ?? s;

const Kpi = ({ label, value }: { label: string; value: string | number }) => <div className="st-kpi"><small>{label}</small><b>{value}</b></div>;

function Money({ r }: { r: RevenueStatisticsDto }) {
  return (
    <div className="st-grid">
      <Kpi label="Tổng doanh thu" value={vnd(r.totalRevenueVnd)} />
      <Kpi label="Giao dịch đã thanh toán" value={r.paidTransactionCount} />
      <Kpi label="Phụ huynh mua gói" value={r.buyingParents} />
      <Kpi label="Mua lại" value={r.repeatBuyingParents} />
      <Kpi label="Xác nhận tay" value={`${r.manuallyMarkedPaidCount} · ${vnd(r.manuallyMarkedPaidRevenueVnd)}`} />
      <Kpi label={`Quỹ Creator (Đọc ${ratePercent(r.readingFundRate)}%, Sáng tạo ${ratePercent(r.creativeFundRate)}%)`} value={vnd(r.creatorFundVnd)} />
    </div>
  );
}

function Tables({ r }: { r: RevenueStatisticsDto }) {
  const s = r.transactionsByStatus;
  const statuses: [string, number][] = [["Paid", s.paid], ["Pending", s.pending], ["Expired", s.expired], ["MismatchAmount", s.mismatchAmount]];
  return (
    <>
      <div className="st-card st-scroll">
        <h3>Theo loại gói</h3>
        <table className="st-table stack-table">
          <thead><tr><th>Loại gói</th><th>Giao dịch</th><th>Doanh thu</th></tr></thead>
          <tbody>
            {r.revenueByPlanType.map((x) => <tr key={x.planType}><td data-label="Loại gói">{planTypeLabel(x.planType)}</td><td data-label="Giao dịch">{x.transactionCount}</td><td data-label="Doanh thu">{vnd(x.revenueVnd)}</td></tr>)}
            {r.revenueByPlanType.length === 0 && <tr><td colSpan={3} className="sub">Chưa có doanh thu trong kỳ.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="st-card st-scroll">
        <h3>Theo gói</h3>
        <table className="st-table stack-table">
          <thead><tr><th>Gói</th><th>Loại</th><th>Giao dịch</th><th>Doanh thu</th></tr></thead>
          <tbody>
            {r.revenueByPlan.map((x) => <tr key={x.planId}><td data-label="Gói">{x.planName}</td><td data-label="Loại">{planTypeLabel(x.planType)}</td><td data-label="Giao dịch">{x.transactionCount}</td><td data-label="Doanh thu">{vnd(x.revenueVnd)}</td></tr>)}
            {r.revenueByPlan.length === 0 && <tr><td colSpan={4} className="sub">Chưa có doanh thu trong kỳ.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="st-card st-scroll">
        <h3>Giao dịch theo trạng thái</h3>
        <table className="st-table stack-table">
          <thead><tr><th>Trạng thái</th><th>Số giao dịch</th></tr></thead>
          <tbody>{statuses.map(([k, n]) => <tr key={k}><td data-label="Trạng thái">{transactionStatusLabel(k, "admin")}</td><td data-label="Số giao dịch">{n}</td></tr>)}</tbody>
        </table>
      </div>
      <div className="st-card st-scroll">
        <h3>Lượt</h3>
        <table className="st-table stack-table">
          <thead><tr><th>Mục</th><th>Số lượt</th></tr></thead>
          <tbody>
            <tr><td data-label="Mục"><b>Đã cấp (tổng)</b></td><td data-label="Số lượt"><b>{r.creditsGranted}</b></td></tr>
            {r.creditsGrantedBySource.map((x) => <tr key={x.source}><td data-label="Mục">Đã cấp · {sourceLabel(x.source)}</td><td data-label="Số lượt">{x.credits}</td></tr>)}
            <tr><td data-label="Mục"><b>Đã dùng</b></td><td data-label="Số lượt"><b>{r.creditsUsed}</b></td></tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export function RevenueSection({ revenue }: { revenue: RevenueStatisticsDto | null }) {
  return revenue ? <><Money r={revenue} /><Tables r={revenue} /></> : <p className="sub">{NO_REVENUE}</p>;
}

export function AccountSection({ accounts }: { accounts: AccountStatisticsDto | null }) {
  return (
    <div className="st-card">
      <h3>Tài khoản</h3>
      {accounts ? (
        <div className="st-grid">
          <Kpi label="Tổng tài khoản phụ huynh" value={accounts.totalParentAccounts} />
          <Kpi label="Đăng ký mới" value={accounts.newAccounts} />
          <Kpi label="Có hoạt động" value={accounts.activeAccounts} />
          <Kpi label="Đang bị khoá" value={accounts.lockedOrDisabledAccounts} />
          <Kpi label="Hồ sơ bé" value={accounts.childProfiles} />
        </div>
      ) : <p className="sub">{NO_ACCOUNTS}</p>}
    </div>
  );
}

/** Số liệu doanh thu và tài khoản của một kỳ; dùng cho báo cáo đã chụp (null = báo cáo cũ). */
export default function RevenuePanel({ revenue, accounts }: { revenue: RevenueStatisticsDto | null; accounts: AccountStatisticsDto | null }) {
  return <><RevenueSection revenue={revenue} /><AccountSection accounts={accounts} /></>;
}
