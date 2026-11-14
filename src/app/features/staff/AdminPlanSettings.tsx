"use client";

import { useEffect, useState } from "react";
import { confirmDialog } from "@/app/lib/confirm";
import { validatePlanSettings } from "@/app/lib/billing";
import { adminBillingService } from "@/app/services/adminBillingService";
import type { PlanSettingsDto, UpdatePlanSettingsRequest } from "@/app/types/backendContracts";
import PlanSettingsFields from "./PlanSettingsFields";
import { Notice, Page, fmt, type Note } from "./ui";

/** Bỏ updatedAt: chỉ 15 trường cấu hình được gửi lên và so sánh thay đổi. */
const toRequest = (d: PlanSettingsDto): UpdatePlanSettingsRequest => {
  const { updatedAt, ...rest } = d;
  void updatedAt;
  return rest;
};

/** Trang "Cấu hình gói" của Administrator: các con số chung về quỹ Creator, hạn mức, lượt đọc hợp lệ và mức Miễn phí. */
export function AdminPlanSettings() {
  const [saved, setSaved] = useState<PlanSettingsDto | null>(null);
  const [d, setD] = useState<UpdatePlanSettingsRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    void adminBillingService.settings(ctrl.signal).then((r) => {
      if (ctrl.signal.aborted) return;
      setLoading(false);
      if (r.success && r.data) { setSaved(r.data); setD(toRequest(r.data)); setError(null); } else setError(r.message || "Không tải được cấu hình gói.");
    });
    return () => ctrl.abort();
  }, []);

  const dirty = saved !== null && d !== null && JSON.stringify(d) !== JSON.stringify(toRequest(saved));
  const problem = d ? validatePlanSettings(d) : null;

  const save = async () => {
    if (!d || !(await confirmDialog("Thay đổi áp dụng ngay cho toàn hệ thống. Lưu?"))) return;
    setBusy(true);
    setNote(null);
    const r = await adminBillingService.saveSettings(d);
    setBusy(false);
    if (r.success && r.data) { setSaved(r.data); setD(toRequest(r.data)); setNote({ ok: true, text: "Đã lưu cấu hình." }); } else setNote({ ok: false, text: r.message || "Không lưu được cấu hình gói." });
  };

  return (
    <Page title="Cấu hình gói">
      <Notice note={note} />
      {error && <div className="notice err" role="status" data-inline-notice>{error}</div>}
      {loading && <p className="sub">Đang tải…</p>}
      {d && (
        <div className="sec">
          <PlanSettingsFields s={d} set={(patch) => setD((x) => (x ? { ...x, ...patch } : x))} />
          {saved?.updatedAt && <p className="sub">Cập nhật lần cuối: {fmt(saved.updatedAt)}</p>}
          {dirty && problem && <p className="sub" role="alert">{problem}</p>}
          {dirty && !problem && <button type="button" className="btn btn-p" disabled={busy} onClick={() => void save()}>Lưu</button>}
        </div>
      )}
    </Page>
  );
}
