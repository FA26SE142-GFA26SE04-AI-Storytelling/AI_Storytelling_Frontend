"use client";

import { useEffect, useState } from "react";
import Dialog from "@/app/components/Dialog";
import Select, { type SelectOption } from "@/app/components/Select";
import { showToast } from "@/app/lib/toast";
import { adminPaymentService } from "@/app/services/paymentService";
import type {
  CreatablePlanType,
  CreateSubscriptionPlanRequest,
  PlanAudience,
  PlanBenefitsInput,
} from "@/app/types/planSettings";
import CreatePlanBenefitsSection from "./plan-settings/CreatePlanBenefitsSection";
import "./plan-settings/plan-dialogs.css";

export interface CreatePlanDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const AUDIENCE_OPTIONS: SelectOption<PlanAudience>[] = [
  { value: "User", label: "Phụ huynh" },
  { value: "Creator", label: "Creator" },
];

const USER_PLAN_TYPES: SelectOption<CreatablePlanType>[] = [
  { value: "Reading", label: "Gói Đọc" },
  { value: "Creative", label: "Gói Sáng tạo" },
  { value: "AddOn", label: "Add-on" },
];

const CREATOR_PLAN_TYPES: SelectOption<CreatablePlanType>[] = [
  { value: "CreatorPack", label: "Gói Creator" },
];

export default function CreatePlanDialog({
  open,
  onClose,
  onCreated,
}: CreatePlanDialogProps) {
  // Trạng thái các trường chính
  const [name, setName] = useState("");
  const [audience, setAudience] = useState<PlanAudience>("User");
  const [planType, setPlanType] = useState<CreatablePlanType>("Reading");
  const [priceVnd, setPriceVnd] = useState<number | string>(0);
  const [aiCredits, setAiCredits] = useState<number | string>(0);
  const [submitCredits, setSubmitCredits] = useState<number | string>(0);
  const [isActive, setIsActive] = useState(true);

  // Quyền lợi gói (cho Reading / Creative)
  const [maxChildProfiles, setMaxChildProfiles] = useState<number | string>(1);
  const [weeklyUnlimited, setWeeklyUnlimited] = useState(false);
  const [weeklyStories, setWeeklyStories] = useState<number | string>(0);
  const [canCopyRoadmapTemplates, setCanCopyRoadmapTemplates] = useState(false);
  const [readAloudUnlimited, setReadAloudUnlimited] = useState(false);
  const [readAloudStories, setReadAloudStories] = useState<number | string>(0);
  const [writingAssistPerDay, setWritingAssistPerDay] = useState<number | string>(0);

  const [saving, setSaving] = useState(false);

  // Reset form khi mở popup
  useEffect(() => {
    if (open) {
      setName("");
      setAudience("User");
      setPlanType("Reading");
      setPriceVnd(0);
      setAiCredits(0);
      setSubmitCredits(0);
      setIsActive(true);
      setMaxChildProfiles(1);
      setWeeklyUnlimited(false);
      setWeeklyStories(0);
      setCanCopyRoadmapTemplates(false);
      setReadAloudUnlimited(false);
      setReadAloudStories(0);
      setWritingAssistPerDay(0);
      setSaving(false);
    }
  }, [open]);

  // Đổi đối tượng: cập nhật danh sách loại gói và reset về giá trị đầu tiên
  const handleAudienceChange = (nextAudience: PlanAudience) => {
    setAudience(nextAudience);
    if (nextAudience === "User") {
      setPlanType("Reading");
    } else {
      setPlanType("CreatorPack");
    }
  };

  const isCreatorPack = planType === "CreatorPack";
  const hasBenefits = planType === "Reading" || planType === "Creative";
  const planTypeOptions = audience === "User" ? USER_PLAN_TYPES : CREATOR_PLAN_TYPES;

  // Kiểm tra tính hợp lệ
  const numPrice = typeof priceVnd === "string" ? Number(priceVnd) : priceVnd;
  const numAi = typeof aiCredits === "string" ? Number(aiCredits) : aiCredits;
  const numSubmit = typeof submitCredits === "string" ? Number(submitCredits) : submitCredits;

  const isNameValid = name.trim().length > 0 && name.trim().length <= 150;
  const isPriceValid = priceVnd !== "" && !isNaN(numPrice) && numPrice >= 0 && Number.isInteger(numPrice);
  const isAiValid = aiCredits !== "" && !isNaN(numAi) && numAi >= 0 && Number.isInteger(numAi);
  const isSubmitValid = !isCreatorPack || (submitCredits !== "" && !isNaN(numSubmit) && numSubmit >= 0 && Number.isInteger(numSubmit));

  let isBenefitsValid = true;
  if (hasBenefits) {
    const numProfiles = typeof maxChildProfiles === "string" ? Number(maxChildProfiles) : maxChildProfiles;
    const numWriting = typeof writingAssistPerDay === "string" ? Number(writingAssistPerDay) : writingAssistPerDay;

    const profilesValid = maxChildProfiles !== "" && !isNaN(numProfiles) && numProfiles >= 1 && Number.isInteger(numProfiles);
    const writingValid = writingAssistPerDay !== "" && !isNaN(numWriting) && numWriting >= 0 && Number.isInteger(numWriting);

    let weeklyValid = true;
    if (!weeklyUnlimited) {
      const numWeekly = typeof weeklyStories === "string" ? Number(weeklyStories) : weeklyStories;
      weeklyValid = weeklyStories !== "" && !isNaN(numWeekly) && numWeekly >= 0 && Number.isInteger(numWeekly);
    }

    let readAloudValid = true;
    if (!readAloudUnlimited && readAloudStories !== "") {
      const numRead = typeof readAloudStories === "string" ? Number(readAloudStories) : readAloudStories;
      readAloudValid = !isNaN(numRead) && numRead >= 0 && Number.isInteger(numRead);
    }

    isBenefitsValid = profilesValid && writingValid && weeklyValid && readAloudValid;
  }

  const isValid = isNameValid && isPriceValid && isAiValid && isSubmitValid && isBenefitsValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || saving) return;

    setSaving(true);
    try {
      let benefitsPayload: PlanBenefitsInput | null = null;
      if (hasBenefits) {
        benefitsPayload = {
          maxChildProfiles: Math.max(1, Math.floor(Number(maxChildProfiles) || 1)),
          weeklyNewLibraryStories: weeklyUnlimited ? null : Math.max(0, Math.floor(Number(weeklyStories) || 0)),
          canCopyRoadmapTemplates,
          readAloudPerMonth: readAloudUnlimited || readAloudStories === "" ? null : Math.max(0, Math.floor(Number(readAloudStories) || 0)),
          writingAssistPerDay: Math.max(0, Math.floor(Number(writingAssistPerDay) || 0)),
        };
      }

      const body: CreateSubscriptionPlanRequest = {
        name: name.trim(),
        audience,
        planType,
        priceVnd: Math.floor(Number(priceVnd) || 0),
        aiCredits: Math.floor(Number(aiCredits) || 0),
        submitCredits: isCreatorPack ? Math.floor(Number(submitCredits) || 0) : 0,
        isActive,
        benefits: benefitsPayload,
      };

      const r = await adminPaymentService.createPlan(body);
      if (r.success) {
        showToast("Đã tạo gói mới.", "ok");
        onCreated();
        onClose();
      } else {
        showToast(r.message ?? "Không tạo được gói.", "err");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không tạo được gói.";
      showToast(msg, "err");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog title="Tạo gói dịch vụ mới" onClose={onClose} wide>
      <form className="cp-dialog-body" onSubmit={handleSubmit}>
        {/* 1. Tên gói */}
        <label className="cp-field">
          <span className="lbl">Tên gói *</span>
          <input
            className="inp"
            type="text"
            placeholder="Ví dụ: Gói Sáng tạo Gia đình"
            maxLength={150}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
        </label>

        {/* 2. Đối tượng */}
        <div className="cp-field">
          <span className="lbl">Đối tượng áp dụng *</span>
          <Select<PlanAudience>
            value={audience}
            options={AUDIENCE_OPTIONS}
            onChange={handleAudienceChange}
            portal
            ariaLabel="Đối tượng áp dụng"
          />
        </div>

        {/* 3. Loại gói */}
        <div className="cp-field">
          <span className="lbl">Loại gói *</span>
          <Select<CreatablePlanType>
            value={planType}
            options={planTypeOptions}
            onChange={(v) => setPlanType(v)}
            portal
            ariaLabel="Loại gói"
          />
        </div>

        {/* 4. Giá (VNĐ) */}
        <label className="cp-field">
          <span className="lbl">Giá (VNĐ) *</span>
          <input
            className="inp"
            type="number"
            min={0}
            step={1000}
            placeholder="0"
            value={priceVnd}
            onChange={(e) => setPriceVnd(e.target.value === "" ? "" : Math.max(0, Math.floor(Number(e.target.value))))}
            required
          />
        </label>

        {/* 5. Lượt AI */}
        <label className="cp-field">
          <span className="lbl">Lượt AI *</span>
          <input
            className="inp"
            type="number"
            min={0}
            step={1}
            placeholder="0"
            value={aiCredits}
            onChange={(e) => setAiCredits(e.target.value === "" ? "" : Math.max(0, Math.floor(Number(e.target.value))))}
            required
          />
        </label>

        {/* 6. Lượt gửi duyệt (chỉ hiện khi là CreatorPack) */}
        {isCreatorPack && (
          <label className="cp-field">
            <span className="lbl">Lượt gửi duyệt *</span>
            <input
              className="inp"
              type="number"
              min={0}
              step={1}
              placeholder="0"
              value={submitCredits}
              onChange={(e) => setSubmitCredits(e.target.value === "" ? "" : Math.max(0, Math.floor(Number(e.target.value))))}
              required
            />
          </label>
        )}

        {/* 7. Đang bán */}
        <label className="cp-check-row">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <span>Đang bán (cho phép đăng ký ngay)</span>
        </label>

        {/* 8. Nhóm Quyền lợi (chỉ hiện khi là Reading hoặc Creative) */}
        {hasBenefits && (
          <CreatePlanBenefitsSection
            maxChildProfiles={maxChildProfiles}
            setMaxChildProfiles={setMaxChildProfiles}
            weeklyUnlimited={weeklyUnlimited}
            setWeeklyUnlimited={setWeeklyUnlimited}
            weeklyStories={weeklyStories}
            setWeeklyStories={setWeeklyStories}
            canCopyRoadmapTemplates={canCopyRoadmapTemplates}
            setCanCopyRoadmapTemplates={setCanCopyRoadmapTemplates}
            readAloudUnlimited={readAloudUnlimited}
            setReadAloudUnlimited={setReadAloudUnlimited}
            readAloudStories={readAloudStories}
            setReadAloudStories={setReadAloudStories}
            writingAssistPerDay={writingAssistPerDay}
            setWritingAssistPerDay={setWritingAssistPerDay}
          />
        )}

        {/* Nút hành động */}
        <div className="cp-actions">
          <button
            type="button"
            className="btn btn-g"
            onClick={onClose}
            disabled={saving}
          >
            Huỷ
          </button>
          {isValid && (
            <button
              type="submit"
              className="btn btn-p"
              disabled={saving}
            >
              {saving ? "Đang tạo..." : "Tạo gói"}
            </button>
          )}
        </div>
      </form>
    </Dialog>
  );
}
