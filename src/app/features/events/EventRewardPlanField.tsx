"use client";

import { useEffect, useState } from "react";
import { eventService, type EventRewardPlanDto } from "@/app/services/eventService";

export function useEventRewardPlans(enabled: boolean) {
  const [catalog, setCatalog] = useState<{ plans: EventRewardPlanDto[]; error: string } | null>(null);
  useEffect(() => {
    if (!enabled || catalog) return;
    const controller = new AbortController();
    void eventService.rewardPlans(controller.signal).then((result) => {
      if (!controller.signal.aborted) {
        setCatalog(result.success ? { plans: result.data ?? [], error: "" }
          : { plans: [], error: result.message || "Không tải được danh mục gói thưởng." });
      }
    });
    return () => controller.abort();
  }, [enabled, catalog]);
  return catalog;
}

export function findEventRewardPlan(catalog: ReturnType<typeof useEventRewardPlans>, name: string) {
  return catalog?.plans.find((plan) => plan.name.trim().toLowerCase() === name.trim().toLowerCase());
}

export default function EventRewardPlanField({ catalog, name, onChange }: {
  catalog: ReturnType<typeof useEventRewardPlans>;
  name: string;
  onChange: (name: string) => void;
}) {
  const plan = findEventRewardPlan(catalog, name);
  return (
    <label className="ev-field">
      <span className="sub">Gói Creator trong hệ thống</span>
      <select className="inp" value={plan?.name ?? ""} disabled={!catalog || !catalog.plans.length}
        onChange={(e) => onChange(e.target.value)}>
        <option value="">{catalog ? "Chọn gói Creator" : "Đang tải danh mục gói…"}</option>
        {catalog?.plans.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
      </select>
      {catalog?.error && <small className="ev-warn-text">{catalog.error}</small>}
      {catalog && !catalog.error && !catalog.plans.length && (
        <small className="sub">Hiện không có gói Creator đủ điều kiện làm phần thưởng.</small>
      )}
      {catalog?.plans.length && name.trim() && !plan ? (
        <small className="ev-warn-text">Gói “{name}” hiện không có trong danh mục. Hãy chọn gói đang hoạt động.</small>
      ) : null}
      {plan && <small className="sub">{plan.aiCredits} lượt AI · {plan.submitCredits} lượt gửi duyệt mỗi suất</small>}
    </label>
  );
}
