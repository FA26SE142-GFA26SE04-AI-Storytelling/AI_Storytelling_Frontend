"use client";

import { useEffect, useState } from "react";
import StatTabs from "@/app/components/stats/StatTabs";
import { adminCreatorService as svc } from "@/app/services/adminCreatorService";
import { CreatorAccountsTab } from "./CreatorAccountsTab";
import { CreatorApplicationsTab } from "./CreatorApplicationsTab";
import { AdminCreatorPayouts } from "./AdminCreatorPayouts";
import { Page } from "./ui";

/** Luồng 5 — Content Creator: duyệt đơn đăng ký và quản lý tài khoản (M5), cấp đối tác (5g), chi trả (5h). */
export function AdminCreators() {
  const [tab, setTab] = useState<"apps" | "accounts" | "payouts">("apps");
  const [pending, setPending] = useState<number | null>(null);
  const [recount, setRecount] = useState(0);

  useEffect(() => {
    let alive = true;
    void svc.applications({ status: "Pending", pageSize: 1 }).then((r) => { if (alive && r.success && r.data) setPending(r.data.totalCount); });
    return () => { alive = false; };
  }, [recount]);

  return (
    <Page title="Content Creator">
      <StatTabs
        label="Content Creator"
        items={[
          { id: "apps", label: <>Đơn đăng ký{!!pending && <> <span className="pill gold-pill" aria-label={`${pending} đơn chờ duyệt`}>{pending}</span></>}</> },
          { id: "accounts", label: "Tài khoản" },
          { id: "payouts", label: "Chi trả" },
        ]}
        value={tab}
        onChange={(id) => setTab(id as typeof tab)}
      />
      {tab === "apps" ? <CreatorApplicationsTab onChanged={() => setRecount((n) => n + 1)} />
        : tab === "accounts" ? <CreatorAccountsTab /> : <AdminCreatorPayouts />}
    </Page>
  );
}
