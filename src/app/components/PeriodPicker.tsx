"use client";

import { useState } from "react";
import { currentMonthPeriod, validatePeriod } from "@/app/lib/billing";
import type { Period } from "@/app/services/adminBillingService";

/** Chọn kỳ thống kê (hai ô ngày + "Tháng này"). Chỉ gọi onChange khi kỳ hợp lệ; lỗi hiện ngay tại chỗ. */
export default function PeriodPicker({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const [start, setStart] = useState(value.periodStart);
  const [end, setEnd] = useState(value.periodEnd);
  const [error, setError] = useState<string | null>(null);

  const apply = (s: string, e: string) => {
    setStart(s); setEnd(e);
    const err = validatePeriod(s, e);
    setError(err);
    if (!err) onChange({ periodStart: s, periodEnd: e });
  };
  const thisMonth = () => { const p = currentMonthPeriod(new Date()); apply(p.periodStart, p.periodEnd); };

  return <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <div className="row" style={{ flexWrap: "wrap", alignItems: "center", gap: 10 }}>
      <label className="sub">Từ ngày <input type="date" value={start} onChange={e => apply(e.target.value, end)} aria-invalid={!!error} /></label>
      <label className="sub">Đến ngày <input type="date" value={end} onChange={e => apply(start, e.target.value)} aria-invalid={!!error} /></label>
      <button type="button" className="btn btn-s" onClick={thisMonth}>Tháng này</button>
    </div>
    {error && <p className="notice err" role="alert" data-inline-notice style={{ margin: 0 }}>{error}</p>}
  </div>;
}
