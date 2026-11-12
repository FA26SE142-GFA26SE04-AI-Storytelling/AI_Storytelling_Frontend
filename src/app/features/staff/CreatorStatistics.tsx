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

export function CreatorStatistics(_props: CreatorPageProps) {
  const [period, setPeriod] = useState<Period>(() => defaultPeriod());
  const [months] = useState(() => lastMonths(6));
  const [tab, setTab] = useState<"reading" | "income" | "content">("reading");

  return (
    <Page title="Thống kê">
      <PeriodPicker value={period} onChange={setPeriod} />
      <StatTabs
        label="Thống kê"
        items={[
          { id: "reading", label: "Lượt đọc" },
          { id: "income", label: "Thu nhập" },
          { id: "content", label: "Nội dung" },
        ]}
        value={tab}
        onChange={(val) => setTab(val as "reading" | "income" | "content")}
      />
      {tab === "reading" ? (
        <CreatorReadingTab period={period} months={months} />
      ) : tab === "income" ? (
        <CreatorIncomeTab period={period} months={months} />
      ) : (
        <CreatorContentTab period={period} />
      )}
    </Page>
  );
}
