"use client";

import { BookOpen, Gift } from "lucide-react";
import type { DraftState } from "@/app/features/staff/PlanSettingsDialog";
import PlanNumberField from "./PlanNumberField";

export interface PlanFreeSectionsProps {
  draft: DraftState;
  onChange: <K extends keyof DraftState>(key: K, value: DraftState[K]) => void;
}

export default function PlanFreeSections({ draft, onChange }: PlanFreeSectionsProps) {
  return (
    <>
      {/* 4. Gói Miễn phí */}
      <div className="cp-section">
        <div className="cp-section-header">
          <div className="cp-section-title">
            <Gift className="ic" style={{ color: "var(--gold-deep)" }} />
            <span>Gói Miễn phí</span>
          </div>
        </div>

        <div className="ps-grid">
          {/* Số hồ sơ bé tối đa */}
          <PlanNumberField
            label="Số hồ sơ bé tối đa * (≥ 1)"
            min={1}
            value={draft.freeMaxChildProfiles}
            onChange={(raw) =>
              onChange(
                "freeMaxChildProfiles",
                raw === "" ? "" : Math.floor(Number(raw))
              )
            }
            required
          />

          {/* Trợ lý viết mỗi ngày */}
          <PlanNumberField
            label="Trợ lý viết mỗi ngày * (≥ 0)"
            min={0}
            value={draft.freeWritingAssistPerDay}
            onChange={(raw) =>
              onChange(
                "freeWritingAssistPerDay",
                raw === "" ? "" : Math.floor(Number(raw))
              )
            }
            required
          />
        </div>

        {/* Truyện mới mỗi tuần */}
        <div className="cp-field">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <span className="lbl">Truyện mới mỗi tuần</span>
            <label className="cp-check-row" style={{ fontSize: "var(--fs-xs)" }}>
              <input
                type="checkbox"
                checked={draft.freeWeeklyNewLibraryStories === null}
                onChange={(e) =>
                  onChange("freeWeeklyNewLibraryStories", e.target.checked ? null : 0)
                }
              />
              <span>Không giới hạn</span>
            </label>
          </div>
          {draft.freeWeeklyNewLibraryStories !== null && (
            <input
              className="inp"
              type="number"
              min={0}
              step={1}
              placeholder="0"
              value={draft.freeWeeklyNewLibraryStories ?? ""}
              onChange={(e) =>
                onChange(
                  "freeWeeklyNewLibraryStories",
                  e.target.value === "" ? "" : Math.floor(Number(e.target.value))
                )
              }
              required
            />
          )}
        </div>

        {/* Cho phép sao chép lộ trình mẫu */}
        <label className="cp-check-row">
          <input
            type="checkbox"
            checked={draft.freeCanCopyRoadmapTemplates}
            onChange={(e) => onChange("freeCanCopyRoadmapTemplates", e.target.checked)}
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
                checked={draft.freeReadAloudPerMonth === null}
                onChange={(e) =>
                  onChange("freeReadAloudPerMonth", e.target.checked ? null : "")
                }
              />
              <span>Không giới hạn</span>
            </label>
          </div>
          {draft.freeReadAloudPerMonth !== null && (
            <input
              className="inp"
              type="number"
              min={0}
              step={1}
              placeholder="Để trống hoặc nhập số lượt"
              value={draft.freeReadAloudPerMonth ?? ""}
              onChange={(e) =>
                onChange(
                  "freeReadAloudPerMonth",
                  e.target.value === "" ? "" : Math.floor(Number(e.target.value))
                )
              }
            />
          )}
        </div>
      </div>

      {/* 5. Đọc và dùng thử */}
      <div className="cp-section">
        <div className="cp-section-header">
          <div className="cp-section-title">
            <BookOpen className="ic" style={{ color: "var(--gold-deep)" }} />
            <span>Đọc và dùng thử</span>
          </div>
        </div>
        <div className="ps-grid">
          <PlanNumberField
            label="Thời gian đọc tối thiểu (giây) * (1–3600)"
            min={1}
            max={3600}
            suffix="giây"
            value={draft.minimumReadSeconds}
            onChange={(raw) =>
              onChange(
                "minimumReadSeconds",
                raw === "" ? "" : Math.floor(Number(raw))
              )
            }
            required
          />
          <PlanNumberField
            label="Lượt AI dùng thử * (≥ 0)"
            min={0}
            value={draft.trialAiCredits}
            onChange={(raw) =>
              onChange(
                "trialAiCredits",
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
