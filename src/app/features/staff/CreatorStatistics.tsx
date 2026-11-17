"use client";

import { useState } from "react";
import type { CreatorPageProps } from "./CreatorStories";
import { Page } from "./ui";
import { defaultPeriod, lastMonths, type Period } from "@/app/lib/monthPeriods";
import PeriodPicker from "@/app/components/stats/PeriodPicker";
import StatTabs from "@/app/components/stats/StatTabs";
import { CreatorReadingTab } from "./CreatorReadingTab";
import { CreatorIncomeTab } from "./CreatorIncomeTab";
import CreatorContentTab from "./CreatorContentTab";
import { CreatorPayoutsTab } from "./CreatorPayoutsTab";

export function CreatorStatistics(_props: CreatorPageProps) {
  const [period, setPeriod] = useState<Period>(() => defaultPeriod());
  const [months] = useState(() => lastMonths(6));
  const [tab, setTab] = useState<"reading" | "income" | "content" | "payouts">("reading");

  return (
    <Page title="Thống kê">
      {/* Nhận tiền không theo kỳ: số dư và lịch sử là toàn bộ. */}
      {tab !== "payouts" && <PeriodPicker value={period} onChange={setPeriod} />}
      <StatTabs
        label="Thống kê"
        items={[
          { id: "reading", label: "Lượt đọc" },
          { id: "income", label: "Thu nhập" },
          { id: "content", label: "Nội dung" },
          { id: "payouts", label: "Nhận tiền" },
        ]}
        value={tab}
        onChange={(val) => setTab(val as typeof tab)}
      />
      {tab === "reading" ? (
        <CreatorReadingTab period={period} months={months} />
      ) : tab === "income" ? (
        <CreatorIncomeTab period={period} months={months} />
      ) : tab === "content" ? (
        <CreatorContentTab period={period} />
      ) : (
        <CreatorPayoutsTab />
      )}
    </Page>
  );
}
