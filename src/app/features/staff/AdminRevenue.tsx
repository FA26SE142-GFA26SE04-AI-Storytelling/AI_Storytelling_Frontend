"use client";

import { useEffect, useState } from "react";
import { currentMonthPeriod } from "@/app/lib/billing";
import { adminBillingService, type Period } from "@/app/services/adminBillingService";
import type { AccountStatisticsDto, RevenueStatisticsDto } from "@/app/types/backendContracts";
import PeriodPicker from "@/app/components/PeriodPicker";
import { AccountSection, RevenueSection } from "./RevenuePanel";
import { Page } from "./ui";

/** Doanh thu và tài khoản của một kỳ bất kỳ, tính trực tiếp. */
export function AdminRevenue() {
  const [period, setPeriod] = useState<Period>(() => currentMonthPeriod(new Date()));
  const [revenue, setRevenue] = useState<RevenueStatisticsDto | null>(null);
  const [accounts, setAccounts] = useState<AccountStatisticsDto | null>(null);
  const [revenueError, setRevenueError] = useState<string | null>(null);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    void Promise.all([adminBillingService.revenue(period, ctrl.signal), adminBillingService.accounts(period, ctrl.signal)]).then(([rev, acc]) => {
      if (ctrl.signal.aborted) return;
      setLoading(false);
      setRevenue(rev.success ? rev.data : null);
      setRevenueError(rev.success ? null : rev.message || "Không tải được thống kê doanh thu.");
      setAccounts(acc.success ? acc.data : null);
      setAccountsError(acc.success ? null : acc.message || "Không tải được thống kê tài khoản.");
    });
    return () => ctrl.abort();
  }, [period]);

  return (
    <Page title="Doanh thu">
      <PeriodPicker value={period} onChange={setPeriod} />
      <p className="sub">Số liệu tính trực tiếp, kỳ tính trọn ngày theo giờ UTC.</p>
      {revenueError && <div className="notice err" role="status" data-inline-notice>{revenueError}</div>}
      {accountsError && <div className="notice err" role="status" data-inline-notice>{accountsError}</div>}
      {loading ? <p className="sub">Đang tải…</p> : (
        <>
          {!revenueError && <RevenueSection revenue={revenue} />}
          {!accountsError && <AccountSection accounts={accounts} />}
        </>
      )}
    </Page>
  );
}
