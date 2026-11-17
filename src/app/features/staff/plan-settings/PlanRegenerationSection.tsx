"use client";

import { RefreshCw } from "lucide-react";
import type { DraftState } from "@/app/features/staff/PlanSettingsDialog";
import PlanNumberField from "./PlanNumberField";

/** Trần của giới hạn sinh lại, khớp backend (PlanSettingsService.MaxRegenerationLimit). */
export const MAX_REGENERATION_LIMIT = 20;

type RegenerationKey = "outlineRegenerationLimit" | "contentRegenerationLimit" | "imageRegenerationLimit" | "audioRegenerationLimit";

const FIELDS: { key: RegenerationKey; label: string }[] = [
  { key: "outlineRegenerationLimit", label: "Dàn ý (lần) *" },
  { key: "contentRegenerationLimit", label: "Nội dung (lần) * — chỉ lưu" },
  { key: "imageRegenerationLimit", label: "Ảnh (số ảnh) *" },
  { key: "audioRegenerationLimit", label: "Audio (lần) *" },
];

/**
 * Giới hạn sinh lại miễn phí trong một truyện (Luồng 5, 5a; Luồng 2 và 3 chỉ đọc). Lần lỗi kỹ thuật không tính.
 * Giới hạn nội dung chỉ được lưu: hệ thống chưa có chức năng sinh lại toàn bộ nội dung.
 */
export default function PlanRegenerationSection({ draft, onChange }: {
  draft: DraftState;
  onChange: <K extends keyof DraftState>(key: K, value: DraftState[K]) => void;
}) {
  return (
    <div className="cp-section">
      <div className="cp-section-header">
        <div className="cp-section-title">
          <RefreshCw className="ic" style={{ color: "var(--primary-strong)" }} />
          <span>Giới hạn sinh lại trong một truyện (0–{MAX_REGENERATION_LIMIT})</span>
        </div>
      </div>
      <div className="ps-grid">
        {FIELDS.map((f) => (
          <PlanNumberField
            key={f.key}
            label={f.label}
            min={0}
            max={MAX_REGENERATION_LIMIT}
            value={draft[f.key]}
            onChange={(raw) => onChange(f.key, raw === "" ? "" : Math.floor(Number(raw)))}
            required
          />
        ))}
      </div>
    </div>
  );
}
