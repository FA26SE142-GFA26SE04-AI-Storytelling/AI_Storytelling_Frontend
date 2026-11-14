"use client";

import { useCallback, useEffect, useState } from "react";
import { planTypeLabel, vnd } from "@/app/lib/billing";
import { adminBillingService } from "@/app/services/adminBillingService";
import type { AdminPlanDto } from "@/app/types/backendContracts";
import AdminPlanForm, { audienceLabel } from "./AdminPlanForm";
import { Notice, Page, type Note } from "./ui";

/** Trang "Gói dịch vụ" của Administrator: xem mọi gói (kể cả đã tắt bán), sửa và thêm gói. */
export function AdminPlans() {
  const [plans, setPlans] = useState<AdminPlanDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const [note, setNote] = useState<Note>(null);
  const [form, setForm] = useState<{ plan: AdminPlanDto | null } | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    void adminBillingService.plans(ctrl.signal).then((r) => {
      if (ctrl.signal.aborted) return;
      setLoading(false);
      if (r.success && r.data) { setPlans(r.data); setError(null); } else setError(r.message || "Không tải được danh sách gói.");
    });
    return () => ctrl.abort();
  }, [tick]);

  const saved = useCallback((text: string) => { setNote({ ok: true, text }); setTick((n) => n + 1); }, []);

  return (
    <Page title="Gói dịch vụ" actions={<button className="btn btn-p" onClick={() => setForm({ plan: null })}>Thêm gói</button>}>
      <Notice note={note} />
      {error && <div className="notice err" role="status" data-inline-notice>{error}</div>}
      <div className="st-card st-scroll">
        <table className="st-table stack-table">
          <thead><tr><th>Tên gói</th><th>Loại</th><th>Đối tượng</th><th>Giá</th><th>Lượt AI</th><th>Lượt gửi duyệt</th><th>Đang bán</th><th /></tr></thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id}>
                <td data-label="Tên gói">{p.name}</td>
                <td data-label="Loại">{planTypeLabel(p.planType)}</td>
                <td data-label="Đối tượng">{audienceLabel(p.audience)}</td>
                <td data-label="Giá">{vnd(p.priceVnd)}</td>
                <td data-label="Lượt AI">{p.aiCredits}</td>
                <td data-label="Lượt gửi duyệt">{p.planType === "CreatorPack" ? p.submitCredits : "—"}</td>
                <td data-label="Đang bán"><span className={`pill ${p.isActive ? "ok" : "draft"}`}>{p.isActive ? "Đang bán" : "Đã tắt"}</span></td>
                <td data-label=""><button className="btn btn-s" onClick={() => setForm({ plan: p })}>Sửa</button></td>
              </tr>
            ))}
            {plans.length === 0 && <tr><td colSpan={8} className="sub">{loading ? "Đang tải…" : "Chưa có gói nào."}</td></tr>}
          </tbody>
        </table>
      </div>
      {form && <AdminPlanForm key={form.plan?.id ?? "new"} plan={form.plan} onClose={() => setForm(null)} onSaved={saved} />}
    </Page>
  );
}
