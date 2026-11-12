"use client";

import { useEffect, useRef, useState } from "react";
import Dialog from "@/app/components/Dialog";
import { confirmDialog } from "@/app/lib/confirm";
import { showToast } from "@/app/lib/toast";
import { adminPaymentService } from "@/app/services/paymentService";
import type { PlanSettings, UpdatePlanSettingsRequest } from "@/app/types/planSettings";
import { fmt } from "@/app/features/staff/ui";
import PlanQuotaSections from "./plan-settings/PlanQuotaSections";
import PlanFreeSections from "./plan-settings/PlanFreeSections";
import "./plan-settings/plan-dialogs.css";

export interface PlanSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export interface DraftState {
  readingFundPercent: number | string;
  creativeFundPercent: number | string;
  creatorMonthlyAiCredits: number | string;
  creatorMonthlySubmitCredits: number | string;
  creatorWritingAssistPerDay: number | string;
  partnerMonthlyAiCredits: number | string;
  partnerMonthlySubmitCredits: number | string;
  partnerWritingAssistPerDay: number | string;
  freeMaxChildProfiles: number | string;
  freeWeeklyNewLibraryStories: number | string | null;
  freeCanCopyRoadmapTemplates: boolean;
  freeReadAloudPerMonth: number | string | null;
  freeWritingAssistPerDay: number | string;
  minimumReadSeconds: number | string;
  trialAiCredits: number | string;
}

const SETTINGS_KEYS: (keyof UpdatePlanSettingsRequest)[] = [
  "readingFundPercent",
  "creativeFundPercent",
  "creatorMonthlyAiCredits",
  "creatorMonthlySubmitCredits",
  "creatorWritingAssistPerDay",
  "partnerMonthlyAiCredits",
  "partnerMonthlySubmitCredits",
  "partnerWritingAssistPerDay",
  "freeMaxChildProfiles",
  "freeWeeklyNewLibraryStories",
  "freeCanCopyRoadmapTemplates",
  "freeReadAloudPerMonth",
  "freeWritingAssistPerDay",
  "minimumReadSeconds",
  "trialAiCredits",
];

function toDraft(settings: PlanSettings): DraftState {
  return {
    readingFundPercent: settings.readingFundPercent,
    creativeFundPercent: settings.creativeFundPercent,
    creatorMonthlyAiCredits: settings.creatorMonthlyAiCredits,
    creatorMonthlySubmitCredits: settings.creatorMonthlySubmitCredits,
    creatorWritingAssistPerDay: settings.creatorWritingAssistPerDay,
    partnerMonthlyAiCredits: settings.partnerMonthlyAiCredits,
    partnerMonthlySubmitCredits: settings.partnerMonthlySubmitCredits,
    partnerWritingAssistPerDay: settings.partnerWritingAssistPerDay,
    freeMaxChildProfiles: settings.freeMaxChildProfiles,
    freeWeeklyNewLibraryStories: settings.freeWeeklyNewLibraryStories,
    freeCanCopyRoadmapTemplates: settings.freeCanCopyRoadmapTemplates,
    freeReadAloudPerMonth: settings.freeReadAloudPerMonth,
    freeWritingAssistPerDay: settings.freeWritingAssistPerDay,
    minimumReadSeconds: settings.minimumReadSeconds,
    trialAiCredits: settings.trialAiCredits,
  };
}

function isValidInteger(val: unknown, min: number, max = Infinity): boolean {
  if (typeof val === "number") {
    return Number.isInteger(val) && val >= min && val <= max;
  }
  if (typeof val === "string" && val.trim() !== "") {
    const n = Number(val);
    return !Number.isNaN(n) && Number.isInteger(n) && n >= min && n <= max;
  }
  return false;
}

export default function PlanSettingsDialog({ open, onClose }: PlanSettingsDialogProps) {
  const [original, setOriginal] = useState<PlanSettings | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      setOriginal(null);
      setDraft(null);
      setUpdatedAt(null);
      setLoading(false);
      setSaving(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    adminPaymentService
      .settings(controller.signal)
      .then((r) => {
        if (controller.signal.aborted) return;
        if (r.success && r.data) {
          setOriginal(r.data);
          setDraft(toDraft(r.data));
          setUpdatedAt(r.data.updatedAt);
        } else {
          showToast(r.message ?? "Không tải được cài đặt gói.", "err");
          onCloseRef.current();
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const msg = err instanceof Error ? err.message : "Không tải được cài đặt gói.";
        showToast(msg, "err");
        onCloseRef.current();
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [open]);

  if (!open) return null;

  const updateField = <K extends keyof DraftState>(key: K, value: DraftState[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  // Kiểm tra tính hợp lệ
  let isValid = false;
  if (draft) {
    const isReadingFundValid = isValidInteger(draft.readingFundPercent, 0, 100);
    const isCreativeFundValid = isValidInteger(draft.creativeFundPercent, 0, 100);
    const isCreatorAiValid = isValidInteger(draft.creatorMonthlyAiCredits, 0);
    const isCreatorSubmitValid = isValidInteger(draft.creatorMonthlySubmitCredits, 0);
    const isCreatorWritingValid = isValidInteger(draft.creatorWritingAssistPerDay, 0);
    const isPartnerAiValid = isValidInteger(draft.partnerMonthlyAiCredits, 0);
    const isPartnerSubmitValid = isValidInteger(draft.partnerMonthlySubmitCredits, 0);
    const isPartnerWritingValid = isValidInteger(draft.partnerWritingAssistPerDay, 0);
    const isFreeProfilesValid = isValidInteger(draft.freeMaxChildProfiles, 1);
    const isFreeWeeklyValid =
      draft.freeWeeklyNewLibraryStories === null || isValidInteger(draft.freeWeeklyNewLibraryStories, 0);
    const isFreeRoadmapValid = typeof draft.freeCanCopyRoadmapTemplates === "boolean";
    const isFreeReadAloudValid =
      draft.freeReadAloudPerMonth === null ||
      draft.freeReadAloudPerMonth === "" ||
      isValidInteger(draft.freeReadAloudPerMonth, 0);
    const isFreeWritingValid = isValidInteger(draft.freeWritingAssistPerDay, 0);
    const isMinReadValid = isValidInteger(draft.minimumReadSeconds, 1, 3600);
    const isTrialAiValid = isValidInteger(draft.trialAiCredits, 0);

    isValid =
      isReadingFundValid &&
      isCreativeFundValid &&
      isCreatorAiValid &&
      isCreatorSubmitValid &&
      isCreatorWritingValid &&
      isPartnerAiValid &&
      isPartnerSubmitValid &&
      isPartnerWritingValid &&
      isFreeProfilesValid &&
      isFreeWeeklyValid &&
      isFreeRoadmapValid &&
      isFreeReadAloudValid &&
      isFreeWritingValid &&
      isMinReadValid &&
      isTrialAiValid;
  }

  // Kiểm tra có thay đổi so với original
  let isDirty = false;
  if (original && draft) {
    isDirty = SETTINGS_KEYS.some((key) => {
      if (key === "freeCanCopyRoadmapTemplates") {
        return draft.freeCanCopyRoadmapTemplates !== original.freeCanCopyRoadmapTemplates;
      }
      if (key === "freeWeeklyNewLibraryStories") {
        const dVal = draft.freeWeeklyNewLibraryStories === null ? null : Number(draft.freeWeeklyNewLibraryStories);
        return dVal !== original.freeWeeklyNewLibraryStories;
      }
      if (key === "freeReadAloudPerMonth") {
        const dVal =
          draft.freeReadAloudPerMonth === null || draft.freeReadAloudPerMonth === ""
            ? null
            : Number(draft.freeReadAloudPerMonth);
        return dVal !== original.freeReadAloudPerMonth;
      }
      const raw = draft[key];
      if (raw === "" || raw === null || raw === undefined) return true;
      return Number(raw) !== original[key];
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty || !isValid || saving || !draft) return;

    const confirmed = await confirmDialog("Thay đổi sẽ áp dụng cho toàn hệ thống. Bạn có chắc muốn lưu?");
    if (!confirmed) return;

    setSaving(true);
    try {
      const body: UpdatePlanSettingsRequest = {
        readingFundPercent: Math.floor(Number(draft.readingFundPercent)),
        creativeFundPercent: Math.floor(Number(draft.creativeFundPercent)),
        creatorMonthlyAiCredits: Math.floor(Number(draft.creatorMonthlyAiCredits)),
        creatorMonthlySubmitCredits: Math.floor(Number(draft.creatorMonthlySubmitCredits)),
        creatorWritingAssistPerDay: Math.floor(Number(draft.creatorWritingAssistPerDay)),
        partnerMonthlyAiCredits: Math.floor(Number(draft.partnerMonthlyAiCredits)),
        partnerMonthlySubmitCredits: Math.floor(Number(draft.partnerMonthlySubmitCredits)),
        partnerWritingAssistPerDay: Math.floor(Number(draft.partnerWritingAssistPerDay)),
        freeMaxChildProfiles: Math.floor(Number(draft.freeMaxChildProfiles)),
        freeWeeklyNewLibraryStories:
          draft.freeWeeklyNewLibraryStories === null ? null : Math.floor(Number(draft.freeWeeklyNewLibraryStories)),
        freeCanCopyRoadmapTemplates: Boolean(draft.freeCanCopyRoadmapTemplates),
        freeReadAloudPerMonth:
          draft.freeReadAloudPerMonth === null || draft.freeReadAloudPerMonth === ""
            ? null
            : Math.floor(Number(draft.freeReadAloudPerMonth)),
        freeWritingAssistPerDay: Math.floor(Number(draft.freeWritingAssistPerDay)),
        minimumReadSeconds: Math.floor(Number(draft.minimumReadSeconds)),
        trialAiCredits: Math.floor(Number(draft.trialAiCredits)),
      };

      const r = await adminPaymentService.updateSettings(body);
      if (r.success && r.data) {
        showToast("Đã lưu cài đặt gói.", "ok");
        setOriginal(r.data);
        setDraft(toDraft(r.data));
        setUpdatedAt(r.data.updatedAt);
      } else {
        showToast(r.message ?? "Không lưu được cài đặt gói.", "err");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không lưu được cài đặt gói.";
      showToast(msg, "err");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog title="Cài đặt gói dịch vụ" onClose={onClose} wide>
      {loading || !draft ? (
        <div className="cp-dialog-body">
          <div className="ps-loading">
            <span>Đang tải cài đặt...</span>
          </div>
          <div className="ps-footer">
            <div className="ps-actions">
              <button type="button" className="btn btn-g" onClick={onClose}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : (
        <form className="cp-dialog-body" onSubmit={handleSubmit}>
          <PlanQuotaSections draft={draft} onChange={updateField} />
          <PlanFreeSections draft={draft} onChange={updateField} />

          {/* Dòng cuối popup và nút hành động */}
          <div className="ps-footer">
            <span className="ps-updated-at">
              Cập nhật lần cuối: {updatedAt ? fmt(updatedAt) : "Chưa cập nhật"}
            </span>
            <div className="ps-actions">
              <button
                type="button"
                className="btn btn-g"
                onClick={onClose}
                disabled={saving}
              >
                Đóng
              </button>
              {isDirty && isValid && (
                <button
                  type="submit"
                  className="btn btn-p"
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              )}
            </div>
          </div>
        </form>
      )}
    </Dialog>
  );
}
