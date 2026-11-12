"use client";

import { Coins, Handshake, Sparkles } from "lucide-react";
import type { DraftState } from "@/app/features/staff/PlanSettingsDialog";
import PlanNumberField from "./PlanNumberField";

export interface PlanQuotaSectionsProps {
  draft: DraftState;
  onChange: <K extends keyof DraftState>(key: K, value: DraftState[K]) => void;
}

export default function PlanQuotaSections({ draft, onChange }: PlanQuotaSectionsProps) {
  return (
    <>
      {/* 1. Quỹ Creator */}
      <div className="cp-section">
        <div className="cp-section-header">
          <div className="cp-section-title">
            <Coins className="ic" style={{ color: "var(--gold-deep)" }} />
            <span>Quỹ Creator</span>
          </div>
        </div>
        <div className="ps-grid">
          <PlanNumberField
            label="Quỹ trên Gói Đọc (%) * (0–100)"
            min={0}
            max={100}
            suffix="%"
            value={draft.readingFundPercent}
            onChange={(raw) =>
              onChange(
                "readingFundPercent",
                raw === "" ? "" : Math.floor(Number(raw))
              )
            }
            required
          />
          <PlanNumberField
            label="Quỹ trên Gói Sáng tạo (%) * (0–100)"
            min={0}
            max={100}
            suffix="%"
            value={draft.creativeFundPercent}
            onChange={(raw) =>
              onChange(
                "creativeFundPercent",
                raw === "" ? "" : Math.floor(Number(raw))
              )
            }
            required
          />
        </div>
      </div>

      {/* 2. Hạn mức Creator */}
      <div className="cp-section">
        <div className="cp-section-header">
          <div className="cp-section-title">
            <Sparkles className="ic" style={{ color: "var(--gold-deep)" }} />
            <span>Hạn mức Creator</span>
          </div>
        </div>
        <div className="ps-grid">
          <PlanNumberField
            label="Lượt AI mỗi tháng * (≥ 0)"
            min={0}
            value={draft.creatorMonthlyAiCredits}
            onChange={(raw) =>
              onChange(
                "creatorMonthlyAiCredits",
                raw === "" ? "" : Math.floor(Number(raw))
              )
            }
            required
          />
          <PlanNumberField
            label="Lượt gửi duyệt mỗi tháng * (≥ 0)"
            min={0}
            value={draft.creatorMonthlySubmitCredits}
            onChange={(raw) =>
              onChange(
                "creatorMonthlySubmitCredits",
                raw === "" ? "" : Math.floor(Number(raw))
              )
            }
            required
          />
          <PlanNumberField
            label="Trợ lý viết mỗi ngày * (≥ 0)"
            min={0}
            value={draft.creatorWritingAssistPerDay}
            onChange={(raw) =>
              onChange(
                "creatorWritingAssistPerDay",
                raw === "" ? "" : Math.floor(Number(raw))
              )
            }
            required
          />
        </div>
      </div>

      {/* 3. Hạn mức đối tác */}
      <div className="cp-section">
        <div className="cp-section-header">
          <div className="cp-section-title">
            <Handshake className="ic" style={{ color: "var(--gold-deep)" }} />
            <span>Hạn mức đối tác</span>
          </div>
          <span className="cp-gold-badge">Chưa áp dụng</span>
        </div>
        <div className="ps-grid">
          <PlanNumberField
            label="Lượt AI mỗi tháng * (≥ 0)"
            min={0}
            value={draft.partnerMonthlyAiCredits}
            onChange={(raw) =>
              onChange(
                "partnerMonthlyAiCredits",
                raw === "" ? "" : Math.floor(Number(raw))
              )
            }
            required
          />
          <PlanNumberField
            label="Lượt gửi duyệt mỗi tháng * (≥ 0)"
            min={0}
            value={draft.partnerMonthlySubmitCredits}
            onChange={(raw) =>
              onChange(
                "partnerMonthlySubmitCredits",
                raw === "" ? "" : Math.floor(Number(raw))
              )
            }
            required
          />
          <PlanNumberField
            label="Trợ lý viết mỗi ngày * (≥ 0)"
            min={0}
            value={draft.partnerWritingAssistPerDay}
            onChange={(raw) =>
              onChange(
                "partnerWritingAssistPerDay",
                raw === "" ? "" : Math.floor(Number(raw))
              )
            }
            required
          />
        </div>
      </div>
    </>
  );
}
