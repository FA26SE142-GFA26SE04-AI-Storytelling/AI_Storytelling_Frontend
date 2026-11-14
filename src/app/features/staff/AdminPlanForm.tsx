"use client";

import { useState } from "react";
import Dialog from "@/app/components/Dialog";
import { confirmDialog } from "@/app/lib/confirm";
import { planTypeLabel, validatePlanForm } from "@/app/lib/billing";
import { adminBillingService } from "@/app/services/adminBillingService";
import type { AdminPlanDto, CreatePlanRequest, PlanAudience, PlanBenefitsDto, PlanType } from "@/app/types/backendContracts";

export const audienceLabel = (a: string) => (a === "Creator" ? "Creator" : "Phụ huynh");

const TYPES_BY_AUDIENCE: Record<PlanAudience, PlanType[]> = { User: ["Reading", "Creative", "AddOn"], Creator: ["CreatorPack"] };
const DEFAULT_BENEFITS: PlanBenefitsDto = { maxChildProfiles: 1, weeklyNewLibraryStories: null, canCopyRoadmapTemplates: false, readAloudPerMonth: null, writingAssistPerDay: 0 };
const hasBenefits = (t: PlanType) => t === "Reading" || t === "Creative";

const draftOf = (p: AdminPlanDto | null): CreatePlanRequest => p
  ? { name: p.name, audience: p.audience, planType: p.planType, priceVnd: p.priceVnd, aiCredits: p.aiCredits, submitCredits: p.planType === "CreatorPack" ? p.submitCredits : undefined, isActive: p.isActive, benefits: p.benefits ?? (hasBenefits(p.planType) ? DEFAULT_BENEFITS : undefined) }
  : { name: "", audience: "User", planType: "Reading", priceVnd: 0, aiCredits: 0, isActive: false, benefits: DEFAULT_BENEFITS };

/** Chỉ giữ các trường backend nhận theo loại gói. */
const shape = (d: CreatePlanRequest): CreatePlanRequest => ({
  name: d.name.trim(), audience: d.audience, planType: d.planType, priceVnd: d.priceVnd, aiCredits: d.aiCredits, isActive: d.isActive,
  ...(d.planType === "CreatorPack" ? { submitCredits: d.submitCredits ?? 0 } : {}),
  ...(hasBenefits(d.planType) ? { benefits: d.benefits ?? DEFAULT_BENEFITS } : {}),
});

/** Ô số có tuỳ chọn "Không giới hạn" (gửi null). */
function Limit({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="field">
      <span className="lbl">{label}</span>
      <label className="row"><input type="checkbox" checked={value === null} onChange={(e) => onChange(e.target.checked ? null : 0)} /> Không giới hạn</label>
      {value !== null && <input className="inp" type="number" min={0} value={value} aria-label={label} onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))} />}
    </div>
  );
}

export default function AdminPlanForm({ plan, onClose, onSaved }: { plan: AdminPlanDto | null; onClose: () => void; onSaved: (text: string) => void }) {
  const editing = plan !== null;
  const [initial] = useState(() => JSON.stringify(shape(draftOf(plan))));
  const [d, setD] = useState<CreatePlanRequest>(() => draftOf(plan));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<CreatePlanRequest>) => setD((x) => ({ ...x, ...patch }));
  const setB = (patch: Partial<PlanBenefitsDto>) => setD((x) => ({ ...x, benefits: { ...(x.benefits ?? DEFAULT_BENEFITS), ...patch } }));
  const b = d.benefits ?? DEFAULT_BENEFITS;

  const dirty = JSON.stringify(shape(d)) !== initial;
  const valid = validatePlanForm(shape(d)) === null;
  const legacyLocked = d.planType === "Legacy" && !plan?.isActive;

  const pickAudience = (audience: PlanAudience) => set({ audience, planType: TYPES_BY_AUDIENCE[audience][0], submitCredits: audience === "Creator" ? (d.submitCredits ?? 0) : undefined });

  const save = async () => {
    const body = shape(d);
    if (!(await confirmDialog(editing ? `Lưu thay đổi cho ${body.name}? Quyền lợi áp dụng ngay cho người đang dùng gói.` : `Tạo gói ${body.name}?`))) return;
    setBusy(true);
    setError(null);
    let r;
    if (plan) {
      const { audience, planType, ...rest } = body;
      void audience; void planType;
      r = await adminBillingService.updatePlan(plan.id, rest);
    } else r = await adminBillingService.createPlan(body);
    setBusy(false);
    if (r.success) { onSaved(editing ? "Đã lưu gói." : "Đã tạo gói."); onClose(); } else setError(r.message || "Không lưu được gói.");
  };

  return (
    <Dialog title={editing ? `Sửa gói: ${plan.name}` : "Thêm gói"} onClose={onClose} wide>
      <div className="sec">
        {editing ? (
          <p className="sub">{planTypeLabel(d.planType)} · {audienceLabel(d.audience)} (không đổi được sau khi tạo)</p>
        ) : (
          <>
            <div className="field"><span className="lbl">Đối tượng</span>
              <div className="seg" role="group" aria-label="Đối tượng">
                {(["User", "Creator"] as const).map((a) => <button key={a} type="button" className={d.audience === a ? "on" : ""} aria-pressed={d.audience === a} onClick={() => pickAudience(a)}>{audienceLabel(a)}</button>)}
              </div>
            </div>
            <div className="field"><span className="lbl">Loại gói</span>
              <div className="seg" role="group" aria-label="Loại gói">
                {TYPES_BY_AUDIENCE[d.audience].map((t) => <button key={t} type="button" className={d.planType === t ? "on" : ""} aria-pressed={d.planType === t} onClick={() => set({ planType: t })}>{planTypeLabel(t)}</button>)}
              </div>
            </div>
          </>
        )}
        <label className="field"><span className="lbl">Tên gói</span><input className="inp" value={d.name} onChange={(e) => set({ name: e.target.value })} /></label>
        <label className="field"><span className="lbl">Giá (đ)</span><input className="inp" type="number" min={0} value={d.priceVnd} onChange={(e) => set({ priceVnd: Number(e.target.value) || 0 })} /></label>
        <label className="field"><span className="lbl">Lượt AI</span><input className="inp" type="number" min={0} value={d.aiCredits} onChange={(e) => set({ aiCredits: Number(e.target.value) || 0 })} /></label>
        {d.planType === "CreatorPack" && (
          <label className="field"><span className="lbl">Lượt gửi duyệt</span><input className="inp" type="number" min={0} value={d.submitCredits ?? 0} onChange={(e) => set({ submitCredits: Number(e.target.value) || 0 })} /></label>
        )}
        <label className="row">
          <input type="checkbox" checked={d.isActive} disabled={legacyLocked} onChange={(e) => set({ isActive: e.target.checked })} /> Đang bán
        </label>
        {legacyLocked && <p className="sub">Gói cũ không thể bật bán lại.</p>}
        {hasBenefits(d.planType) && (
          <>
            <b>Quyền lợi</b>
            <label className="field"><span className="lbl">Số hồ sơ bé tối đa</span><input className="inp" type="number" min={1} value={b.maxChildProfiles} onChange={(e) => setB({ maxChildProfiles: Number(e.target.value) || 0 })} /></label>
            <Limit label="Truyện thư viện mới mỗi tuần" value={b.weeklyNewLibraryStories} onChange={(v) => setB({ weeklyNewLibraryStories: v })} />
            <Limit label="Lượt đọc to mỗi tháng" value={b.readAloudPerMonth} onChange={(v) => setB({ readAloudPerMonth: v })} />
            <label className="row"><input type="checkbox" checked={b.canCopyRoadmapTemplates} onChange={(e) => setB({ canCopyRoadmapTemplates: e.target.checked })} /> Được sao chép bộ truyện mẫu</label>
            <label className="field"><span className="lbl">Lượt trợ lý viết mỗi ngày</span><input className="inp" type="number" min={0} value={b.writingAssistPerDay} onChange={(e) => setB({ writingAssistPerDay: Math.max(0, Number(e.target.value) || 0) })} /></label>
          </>
        )}
        <p className="sub">Giá và số lượt chỉ áp dụng cho giao dịch tạo sau. Quyền lợi áp dụng ngay cho người đang dùng gói.</p>
        {error && <div className="notice err" role="status" data-inline-notice>{error}</div>}
        {dirty && !valid && <p className="sub" role="alert">{validatePlanForm(shape(d))}</p>}
        {dirty && valid && <button type="button" className="btn btn-p" disabled={busy} onClick={() => void save()}>Lưu</button>}
      </div>
    </Dialog>
  );
}
