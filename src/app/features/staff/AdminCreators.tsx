"use client";

import { useEffect, useState } from "react";
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
      <div className="seg" role="tablist" aria-label="Content Creator" style={{ maxWidth: 360 }}>
        <button type="button" role="tab" aria-selected={tab === "apps"} className={tab === "apps" ? "on" : ""} onClick={() => setTab("apps")}>
          Đơn đăng ký{!!pending && <> <span className="pill gold-pill" aria-label={`${pending} đơn chờ duyệt`}>{pending}</span></>}
        </button>
        <button type="button" role="tab" aria-selected={tab === "accounts"} className={tab === "accounts" ? "on" : ""} onClick={() => setTab("accounts")}>Tài khoản</button>
        <button type="button" role="tab" aria-selected={tab === "payouts"} className={tab === "payouts" ? "on" : ""} onClick={() => setTab("payouts")}>Chi trả</button>
      </div>
      {tab === "apps" ? <CreatorApplicationsTab onChanged={() => setRecount((n) => n + 1)} />
        : tab === "accounts" ? <CreatorAccountsTab /> : <AdminCreatorPayouts />}
    </Page>
  );
}
