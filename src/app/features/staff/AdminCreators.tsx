"use client";

import { useEffect, useState } from "react";
import { adminCreatorService as svc } from "@/app/services/adminCreatorService";
import { CreatorAccountsTab } from "./CreatorAccountsTab";
import { CreatorApplicationsTab } from "./CreatorApplicationsTab";
import { AdminCreatorPayouts } from "./AdminCreatorPayouts";
import { useAccessLookup } from "./staffAccess";
import { Page } from "./ui";

type Tab = "apps" | "accounts" | "payouts";
const TABS: { id: Tab; label: string; permission: string }[] = [
  { id: "apps", label: "Đơn đăng ký", permission: "creator.application.review" },
  { id: "accounts", label: "Tài khoản", permission: "creator.account.manage" },
  { id: "payouts", label: "Chi trả", permission: "creator.payout.manage" },
];

/** Luồng 5 — Content Creator: duyệt đơn đăng ký và quản lý tài khoản (M5), cấp đối tác (5g), chi trả (5h). Mỗi tab theo quyền của nó. */
export function AdminCreators() {
  const lookup = useAccessLookup();
  const tabs = TABS.filter((t) => lookup(t.permission).state !== "Hidden");
  const [picked, setTab] = useState<Tab>("apps");
  const tab = tabs.some((t) => t.id === picked) ? picked : tabs[0]?.id;
  const canReview = tabs.some((t) => t.id === "apps");
  const [pending, setPending] = useState<number | null>(null);
  const [recount, setRecount] = useState(0);

  useEffect(() => {
    if (!canReview) return;
    let alive = true;
    void svc.applications({ status: "Pending", pageSize: 1 }).then((r) => { if (alive && r.success && r.data) setPending(r.data.totalCount); });
    return () => { alive = false; };
  }, [recount, canReview]);

  return (
    <Page title="Nhà sáng tạo nội dung">
      <div className="seg" role="tablist" aria-label="Nhà sáng tạo nội dung" style={{ maxWidth: 360 }}>
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)}>
            {t.label}{t.id === "apps" && !!pending && <> <span className="pill gold-pill" aria-label={`${pending} đơn chờ duyệt`}>{pending}</span></>}
          </button>
        ))}
      </div>
      {tab === "apps" && <CreatorApplicationsTab onChanged={() => setRecount((n) => n + 1)} />}
      {tab === "accounts" && <CreatorAccountsTab />}
      {tab === "payouts" && <AdminCreatorPayouts />}
    </Page>
  );
}
