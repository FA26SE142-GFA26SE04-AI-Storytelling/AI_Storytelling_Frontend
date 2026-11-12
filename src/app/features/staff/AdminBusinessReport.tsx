"use client";

import { useState } from "react";
import { Page } from "./ui";
import { defaultPeriod, lastMonths, type Period } from "@/app/lib/monthPeriods";
import PeriodPicker from "@/app/components/stats/PeriodPicker";
import StatTabs from "@/app/components/stats/StatTabs";
import { AdminRevenueTab } from "./AdminRevenueTab";
import { AdminAccountsTab } from "./AdminAccountsTab";
import { AdminSavedReportsTab } from "./AdminSavedReportsTab";

export function AdminBusinessReport() {
  const [period, setPeriod] = useState<Period>(() => defaultPeriod());
  const [months] = useState(() => lastMonths(6));
  const [tab, setTab] = useState<"revenue" | "accounts" | "saved">("revenue");

  return (
    <Page title="Báo cáo nghiệp vụ">
      <PeriodPicker value={period} onChange={setPeriod} />
      <StatTabs
        label="Báo cáo nghiệp vụ"
        items={[
          { id: "revenue", label: "Doanh thu" },
          { id: "accounts", label: "Tài khoản" },
          { id: "saved", label: "Báo cáo đã lưu" },
        ]}
        value={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />
      {tab === "revenue" && <AdminRevenueTab period={period} months={months} />}
      {tab === "accounts" && <AdminAccountsTab period={period} months={months} />}
      {tab === "saved" && <AdminSavedReportsTab period={period} />}
    </Page>
  );
}
