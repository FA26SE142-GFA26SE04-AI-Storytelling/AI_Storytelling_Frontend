"use client";

import { Sparkles } from "lucide-react";
import PlanNumberField from "./PlanNumberField";

export interface CreatePlanBenefitsSectionProps {
  maxChildProfiles: number | string;
  setMaxChildProfiles: (v: number | string) => void;
  weeklyUnlimited: boolean;
  setWeeklyUnlimited: (v: boolean) => void;
  weeklyStories: number | string;
  setWeeklyStories: (v: number | string) => void;
  canCopyRoadmapTemplates: boolean;
  setCanCopyRoadmapTemplates: (v: boolean) => void;
  readAloudUnlimited: boolean;
  setReadAloudUnlimited: (v: boolean) => void;
  readAloudStories: number | string;
  setReadAloudStories: (v: number | string) => void;
  writingAssistPerDay: number | string;
  setWritingAssistPerDay: (v: number | string) => void;
}

export default function CreatePlanBenefitsSection({
  maxChildProfiles,
  setMaxChildProfiles,
  weeklyUnlimited,
  setWeeklyUnlimited,
  weeklyStories,
  setWeeklyStories,
  canCopyRoadmapTemplates,
  setCanCopyRoadmapTemplates,
  readAloudUnlimited,
  setReadAloudUnlimited,
  readAloudStories,
  setReadAloudStories,
  writingAssistPerDay,
  setWritingAssistPerDay,
}: CreatePlanBenefitsSectionProps) {
  return (
    <div className="cp-section">
      <div className="cp-section-header">
        <div className="cp-section-title">
          <Sparkles className="ic" style={{ color: "var(--gold-deep)" }} />
          <span>Quyền lợi gói</span>
        </div>
        <span className="cp-gold-badge">Đặc quyền</span>
      </div>

      {/* Số hồ sơ bé tối đa */}
      <PlanNumberField
        label="Số hồ sơ bé tối đa * (≥ 1)"
        value={maxChildProfiles}
        min={1}
        step={1}
        placeholder="1"
        required
        onChange={(raw) =>
          setMaxChildProfiles(
            raw === "" ? "" : Math.max(1, Math.floor(Number(raw)))
          )
        }
      />

      {/* Truyện mới mỗi tuần */}
      <div className="cp-field">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <span className="lbl">Truyện mới mỗi tuần</span>
          <label className="cp-check-row" style={{ fontSize: "var(--fs-xs)" }}>
            <input
              type="checkbox"
              checked={weeklyUnlimited}
              onChange={(e) => setWeeklyUnlimited(e.target.checked)}
            />
            <span>Không giới hạn</span>
          </label>
        </div>
        {!weeklyUnlimited && (
          <input
            className="inp"
            type="number"
            min={0}
            step={1}
            placeholder="0"
            value={weeklyStories}
            onChange={(e) =>
              setWeeklyStories(
                e.target.value === "" ? "" : Math.max(0, Math.floor(Number(e.target.value)))
              )
            }
            required
          />
        )}
      </div>

      {/* Cho sao chép lộ trình mẫu */}
      <label className="cp-check-row">
        <input
          type="checkbox"
          checked={canCopyRoadmapTemplates}
          onChange={(e) => setCanCopyRoadmapTemplates(e.target.checked)}
        />
        <span>Cho phép sao chép lộ trình mẫu</span>
      </label>

      {/* Đọc to mỗi tháng */}
      <div className="cp-field">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <span className="lbl">Đọc to mỗi tháng</span>
          <label className="cp-check-row" style={{ fontSize: "var(--fs-xs)" }}>
            <input
              type="checkbox"
              checked={readAloudUnlimited}
              onChange={(e) => setReadAloudUnlimited(e.target.checked)}
            />
            <span>Không giới hạn</span>
          </label>
        </div>
        {!readAloudUnlimited && (
          <input
            className="inp"
            type="number"
            min={0}
            step={1}
            placeholder="Để trống hoặc nhập số lượt"
            value={readAloudStories}
            onChange={(e) =>
              setReadAloudStories(
                e.target.value === "" ? "" : Math.max(0, Math.floor(Number(e.target.value)))
              )
            }
          />
        )}
      </div>

      {/* Trợ lý viết mỗi ngày */}
      <PlanNumberField
        label="Trợ lý viết mỗi ngày * (≥ 0)"
        value={writingAssistPerDay}
        min={0}
        step={1}
        placeholder="0"
        required
        onChange={(raw) =>
          setWritingAssistPerDay(
            raw === "" ? "" : Math.max(0, Math.floor(Number(raw)))
          )
        }
      />
    </div>
  );
}
