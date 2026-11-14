"use client";

import type { LimitNotice } from "@/app/lib/billing";

/** Thông báo chạm giới hạn của gói; khi nên nâng cấp thì có nút dẫn tới trang gói. */
export default function UpgradeNotice({ notice, onUpgrade, actionLabel = "Xem các gói" }: { notice: LimitNotice; onUpgrade: () => void; actionLabel?: string }) {
  return (
    <div className="notice warn" role="alert" data-inline-notice style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ flex: 1, minWidth: 160 }}>{notice.text}</span>
      {notice.upgrade && <button type="button" className="btn btn-p" onClick={onUpgrade}>{actionLabel}</button>}
    </div>
  );
}
