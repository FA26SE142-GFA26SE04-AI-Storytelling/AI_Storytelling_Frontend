"use client";

import { useState } from "react";
import StatTabs from "@/app/components/stats/StatTabs";
import { AdminCreatorApplications } from "./AdminCreatorApplications";
import { AdminCreatorAccounts } from "./AdminCreatorAccounts";
import { AdminCreatorPayouts } from "./AdminCreatorPayouts";
import { Page } from "./ui";

type Tab = "applications" | "accounts" | "payouts";

/**
 * Luồng 5 — Administrator quản lý Content Creator: duyệt đơn đăng ký (M5), vô hiệu hoá / kích hoạt lại và cấp đối tác (5g),
 * chi trả ngoài hệ thống rồi đánh dấu Đã chi (5h).
 */
export function AdminCreators() {
  const [tab, setTab] = useState<Tab>("applications");
  return (
    <Page title="Content Creator">
      <StatTabs
        label="Quản lý Content Creator"
        items={[
          { id: "applications", label: "Đơn đăng ký" },
          { id: "accounts", label: "Creator" },
          { id: "payouts", label: "Chi trả" },
        ]}
        value={tab}
        onChange={(id) => setTab(id as Tab)}
      />
      {tab === "applications" && <AdminCreatorApplications />}
      {tab === "accounts" && <AdminCreatorAccounts />}
      {tab === "payouts" && <AdminCreatorPayouts />}
    </Page>
  );
}
