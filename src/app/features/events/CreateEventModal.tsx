"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import EventActivityWizard from "./EventActivityWizard";
import EventDateInput from "./EventDateInput";
import EventRewardPlanField, { findEventRewardPlan, useEventRewardPlans } from "./EventRewardPlanField";
import { childProfileService } from "@/app/services/childProfileService";
import { eventService, type CreateEventPayload } from "@/app/services/eventService";
import { showToast } from "@/app/lib/toast";
import type { ContentCategory } from "@/app/types/childProfile";
import { REWARD_TYPE_LABEL, type EventDetailDto, type EventScoringMode, type EventRewardType, type EventTrackType } from "@/app/types/event";

import { eventDateBoundary, eventDateInput, eventTimeInput, eventTimeValue, participationDateError, votingDateError } from "./eventSchedule";
import { creatorCanVote, parentCanVote } from "@/app/types/event";

export type CreateEventModalProps = {
  open: boolean;
  initialDetail?: EventDetailDto | null;
  onClose: () => void;
  onCreated: (eventId: number) => void;
};

type AwardDraft = {
  trackType: EventTrackType;
  rankOrTier: string;
  slotCount: string;
  rewardType: EventRewardType;
  rewardName: string;
  unitValueVnd: string;
  creditGrantAmount: string;
  submitCreditGrantAmount?: string;
};

const AGE_BAND_OPTIONS = ["3-5", "6-8", "9-10", "11-12"] as const;

const onlyDigits = (raw: string) => raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");

function EventDateTimeField({ id, label, value, onChange, onInvalidChange }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onInvalidChange: (invalid: boolean) => void;
}) {
  return (
    <div className="ev-field">
      <label htmlFor={id} className="sub">{label}</label>
      <EventDateInput id={id} includeTime value={value} onChange={onChange} onInvalidChange={onInvalidChange} />
    </div>
  );
}

const defaultAwards = (): AwardDraft[] => [
  {
    trackType: "Creator",
    rankOrTier: "Giải Nhất",
    slotCount: "1",
    rewardType: "CashTransfer",
    rewardName: "Giải Nhất Sáng tác",
    unitValueVnd: "500000",
    creditGrantAmount: "0",
  },
  {
    trackType: "Parent",
    rankOrTier: "Quà Gia đình",
    slotCount: "10",
    rewardType: "PhysicalGift",
    rewardName: "Bộ sách truyện thiếu nhi",
    unitValueVnd: "150000",
    creditGrantAmount: "0",
  },
];

/** Hộp thoại khởi tạo hoặc chỉnh sửa bản nháp sự kiện (Flow 01): Thông tin chung, 2 Track và Cơ cấu giải thưởng động. */
/** Chủ đề chọn được cho sự kiện; nhóm "Cảnh báo an toàn" không phải chủ đề cho trẻ và bị API từ chối. */
export const eventCategoryOptions = (categories: ContentCategory[]) =>
  categories.filter((c) => c.isActive && c.group !== "SafetyWarning");

export default function CreateEventModal({ open, initialDetail, onClose, onCreated }: CreateEventModalProps) {
  const isEditing = Boolean(initialDetail);
  const creatorTrack = initialDetail?.tracks.find((t) => t.trackType === "Creator");
  const parentTrack = initialDetail?.tracks.find((t) => t.trackType === "Parent");

  const [busy, setBusy] = useState(false);
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [scoringMode, setScoringMode] = useState<EventScoringMode>(initialDetail?.scoringMode ?? "MissionCompletion");
  const reverseSchedule = initialDetail?.creatorVotingSchedule;
  const [reverseTimes, setReverseTimes] = useState(() => ({
    submissionCutoffAt: eventTimeInput(reverseSchedule?.submissionCutoffAt),
    reviewCutoffAt: eventTimeInput(reverseSchedule?.reviewCutoffAt),
    votingStartAt: eventTimeInput(reverseSchedule?.votingStartAt),
    votingEndAt: eventTimeInput(reverseSchedule?.votingEndAt),
  }));
  const [maxParentRegistrations, setMaxParentRegistrations] = useState(String(initialDetail?.maxParentRegistrations ?? ""));
  const [submissionCutoff, setSubmissionCutoff] = useState(eventTimeInput(initialDetail?.submissionCutoffAt));
  const [reviewCutoff, setReviewCutoff] = useState(eventTimeInput(initialDetail?.reviewCutoffAt));
  const [votingStart, setVotingStart] = useState(eventTimeInput(initialDetail?.votingStartAt));
  const [votingEnd, setVotingEnd] = useState(eventTimeInput(initialDetail?.votingEndAt));
  const [invalidEventTimes, setInvalidEventTimes] = useState<Record<string, boolean>>({});
  const markInvalidTime = (id: string, invalid: boolean) => {
    setInvalidEventTimes((previous) => ({ ...previous, [id]: invalid }));
  };
  const [enableCreator, setEnableCreator] = useState(initialDetail ? Boolean(creatorTrack) : true);
  const [enableParent, setEnableParent] = useState(initialDetail ? Boolean(parentTrack) : true);
  const [title, setTitle] = useState(initialDetail?.title ?? "");
  const [description, setDescription] = useState(initialDetail?.description ?? "");
  const [hasBudget, setHasBudget] = useState(initialDetail ? initialDetail.budgetVnd > 0 : true);
  const [budgetInput, setBudgetInput] = useState(String(initialDetail?.budgetVnd ?? 2_000_000));
  const [categoryIdInput, setCategoryIdInput] = useState(String(initialDetail?.mainCategoryId ?? 1));
  const [ageBands, setAgeBands] = useState<string[]>(
    initialDetail?.targetAgeBands ? initialDetail.targetAgeBands.split(",").filter(Boolean) : ["6-8", "9-10"],
  );

  useEffect(() => {
    if (!open) return;
    let active = true;
    void childProfileService.getContentCategories().then((res) => {
      if (!active || !res.success || !res.data) return;
      const list = eventCategoryOptions(res.data);
      setCategories(list);
      if (list[0] && !list.some((c) => c.id === initialDetail?.mainCategoryId)) {
        setCategoryIdInput(String(list[0].id));
      }
    });
    return () => {
      active = false;
    };
  }, [open, initialDetail]);

  const [creatorRegStart, setCreatorRegStart] = useState(() =>
    creatorTrack ? eventTimeInput(creatorTrack.registrationStartAt).slice(0, 10) : eventDateInput(0),
  );
  const [creatorExecEnd, setCreatorExecEnd] = useState(() =>
    creatorTrack ? eventTimeInput(creatorTrack.executionEndAt).slice(0, 10) : eventDateInput(12),
  );
  const [grantAiCredits, setGrantAiCredits] = useState(String(creatorTrack?.grantAiCredits ?? 1));
  const [grantSubmitCredits, setGrantSubmitCredits] = useState(String(creatorTrack?.grantSubmitCredits ?? 1));

  const [parentRegStart, setParentRegStart] = useState(() =>
    parentTrack ? eventTimeInput(parentTrack.registrationStartAt).slice(0, 10) : eventDateInput(13),
  );
  const [parentExecEnd, setParentExecEnd] = useState(() =>
    parentTrack ? eventTimeInput(parentTrack.executionEndAt).slice(0, 10) : eventDateInput(25),
  );
  const [waiveWeeklyLimit, setWaiveWeeklyLimit] = useState(parentTrack?.waiveWeeklyLibraryLimit ?? true);
  const [claimWindowHours, setClaimWindowHours] = useState(String(parentTrack?.claimWindowHours ?? 72));
  const [maxReallocationRounds, setMaxReallocationRounds] = useState(String(parentTrack?.maxReallocationRounds ?? 1));

  const [awards, setAwards] = useState<AwardDraft[]>(() => {
    if (!initialDetail) return defaultAwards();
    const trackMap = new Map(initialDetail.tracks.map((t) => [t.id, t.trackType]));
    const grouped = new Map<string, AwardDraft>();
    for (const aw of initialDetail.awards) {
      const trType = aw.trackId != null ? (trackMap.get(aw.trackId) ?? "Parent") : "Parent";
      const key = `${trType}|${aw.rankOrTier}|${aw.rewardName}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.slotCount = String(Number(existing.slotCount) + 1);
      } else {
        grouped.set(key, {
          trackType: trType,
          rankOrTier: aw.rankOrTier,
          slotCount: "1",
          rewardType: aw.rewardType,
          rewardName: aw.rewardName,
          unitValueVnd: String(aw.unitValueVnd),
          creditGrantAmount: String(aw.creditGrantAmount),
          submitCreditGrantAmount: String(aw.submitCreditGrantAmount ?? 0),
        });
      }
    }
    return Array.from(grouped.values());
  });

  const rewardPlans = useEventRewardPlans(open && initialDetail?.configVersion !== "ActivityBased" &&
    Boolean(initialDetail) && enableCreator && awards.some((award) =>
      award.trackType === "Creator" && award.rewardType === "CreatorPackage"));
  if (!open) return null;

  const toggleAgeBand = (band: string) => {
    setAgeBands((prev) =>
      prev.includes(band) ? (prev.length > 1 ? prev.filter((b) => b !== band) : prev) : [...prev, band],
    );
  };

  const budgetNumber = hasBudget ? Number(budgetInput) || 0 : 0;
  const configuringBoth = enableCreator && enableParent;
  const hasVotingSchedule = configuringBoth && parentCanVote(scoringMode);
  const hasCreatorVoting = configuringBoth && creatorCanVote(scoringMode);
  const creatorDateError = enableCreator ? participationDateError(creatorRegStart, creatorExecEnd, "Creator") : "";
  const parentDateError = enableParent ? participationDateError(parentRegStart, parentExecEnd, "Parent") : "";
  const creatorStartAt = enableCreator && !creatorDateError ? eventDateBoundary(creatorRegStart, false, creatorTrack?.registrationStartAt) : "";
  const creatorEndAt = enableCreator && !creatorDateError ? eventDateBoundary(creatorExecEnd, true, creatorTrack?.executionEndAt) : "";
  const parentStartAt = enableParent && !parentDateError ? eventDateBoundary(parentRegStart, false, parentTrack?.registrationStartAt) : "";
  const parentEndAt = enableParent && !parentDateError ? eventDateBoundary(parentExecEnd, true, parentTrack?.executionEndAt) : "";
  const creatorDatesUnchanged = creatorTrack && creatorStartAt === new Date(creatorTrack.registrationStartAt).toISOString() &&
    creatorEndAt === new Date(creatorTrack.executionEndAt).toISOString();
  const parentDatesUnchanged = parentTrack && parentStartAt === new Date(parentTrack.registrationStartAt).toISOString() &&
    parentEndAt === new Date(parentTrack.executionEndAt).toISOString();
  const creatorExecutionStartAt = creatorDatesUnchanged ? new Date(creatorTrack.executionStartAt).toISOString() : creatorStartAt;
  const submissionAt = hasVotingSchedule && submissionCutoff ? eventTimeValue(submissionCutoff, initialDetail?.submissionCutoffAt) : "";
  const reviewAt = hasVotingSchedule && reviewCutoff ? eventTimeValue(reviewCutoff, initialDetail?.reviewCutoffAt) : "";
  const votingStartAt = hasVotingSchedule && votingStart ? eventTimeValue(votingStart, initialDetail?.votingStartAt) : "";
  const votingEndAt = hasVotingSchedule && votingEnd ? eventTimeValue(votingEnd, initialDetail?.votingEndAt) : parentEndAt;
  const votingError = hasVotingSchedule && !creatorDateError && !parentDateError
    ? votingDateError({
        submission: submissionAt, review: reviewAt, votingStart: votingStartAt, votingEnd: votingEndAt,
        creatorStart: creatorExecutionStartAt, creatorEnd: creatorEndAt, parentStart: parentStartAt, parentEnd: parentEndAt,
      })
    : "";
  const reverseSubmission = hasCreatorVoting && reverseTimes.submissionCutoffAt ? eventTimeValue(reverseTimes.submissionCutoffAt, reverseSchedule?.submissionCutoffAt) : "";
  const reverseReview = hasCreatorVoting && reverseTimes.reviewCutoffAt ? eventTimeValue(reverseTimes.reviewCutoffAt, reverseSchedule?.reviewCutoffAt) : "";
  const reverseStart = hasCreatorVoting && reverseTimes.votingStartAt ? eventTimeValue(reverseTimes.votingStartAt, reverseSchedule?.votingStartAt) : "";
  const reverseEnd = hasCreatorVoting && reverseTimes.votingEndAt ? eventTimeValue(reverseTimes.votingEndAt, reverseSchedule?.votingEndAt) : creatorEndAt;
  const reverseVotingError = hasCreatorVoting && !creatorDateError && !parentDateError
    ? votingDateError({
        submission: reverseSubmission, review: reverseReview, votingStart: reverseStart, votingEnd: reverseEnd,
        creatorStart: parentStartAt, creatorEnd: parentEndAt, parentStart: creatorExecutionStartAt, parentEnd: creatorEndAt,
        authorLabel: "Parent", voterLabel: "Creator",
      })
    : "";
  const activeAwards = awards.filter((award) => award.trackType === "Creator" ? enableCreator : enableParent);
  const invalidPackage = activeAwards.some((award) => award.rewardType === "CreatorPackage" &&
    (award.trackType !== "Creator" || !findEventRewardPlan(rewardPlans, award.rewardName)));
  const estimatedAwardsVnd = activeAwards.reduce(
    (sum, aw) => sum + (Number(aw.slotCount) || 0) * (Number(aw.unitValueVnd) || 0),
    0,
  );
  const overBudget = estimatedAwardsVnd > budgetNumber;
  const parentCapInvalid = enableParent && maxParentRegistrations !== "" &&
    (Number(maxParentRegistrations) < 1 || Number(maxParentRegistrations) > 2_147_483_647);
  const hasInvalidEventTime = Object.entries(invalidEventTimes).some(([id, invalid]) =>
    invalid && (id.startsWith("ev-parent-vote-") ? hasVotingSchedule : hasCreatorVoting));
  const canSubmit = title.trim() && (enableCreator || enableParent) && !hasInvalidEventTime && !invalidPackage &&
    !creatorDateError && !parentDateError && !votingError && !reverseVotingError && !parentCapInvalid;

  const updateAward = (idx: number, patch: Partial<AwardDraft>) => {
    setAwards((prev) => prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const submit = async () => {
    if (busy || !canSubmit) return;
    const tracks: CreateEventPayload["tracks"] = [];
    if (enableCreator) {
      tracks.push({
        trackType: "Creator",
        registrationStartAt: creatorStartAt,
        registrationEndAt: creatorDatesUnchanged ? creatorTrack.registrationEndAt : creatorEndAt,
        executionStartAt: creatorExecutionStartAt,
        executionEndAt: creatorEndAt,
        maxSubmissionsPerUser: 1,
        grantAiCredits: Number(grantAiCredits) || 0,
        grantSubmitCredits: Number(grantSubmitCredits) || 0,
        waiveWeeklyLibraryLimit: false,
        claimWindowHours: Math.max(1, Number(claimWindowHours) || 72),
        maxReallocationRounds: Math.max(0, Number(maxReallocationRounds) || 1),
      });
    }
    if (enableParent) {
      tracks.push({
        trackType: "Parent",
        registrationStartAt: parentStartAt,
        awardAllMissionCompleters: parentTrack?.awardAllMissionCompleters,
        registrationEndAt: parentDatesUnchanged ? parentTrack.registrationEndAt : parentEndAt,
        executionStartAt: hasCreatorVoting ? parentStartAt : hasVotingSchedule ? votingStartAt : parentDatesUnchanged ? parentTrack.executionStartAt : parentStartAt,
        executionEndAt: parentEndAt,
        maxSubmissionsPerUser: 1,
        grantAiCredits: 0,
        grantSubmitCredits: 0,
        waiveWeeklyLibraryLimit: waiveWeeklyLimit,
        claimWindowHours: Math.max(1, Number(claimWindowHours) || 72),
        maxReallocationRounds: Math.max(0, Number(maxReallocationRounds) || 1),
      });
    }
    const payload: CreateEventPayload = {
      title: title.trim(),
      description: description.trim() || "Sự kiện sáng tác và đọc truyện cùng bé.",
      mainCategoryId: Math.max(1, Number(categoryIdInput) || 1),
      targetAgeBands: ageBands.join(","),
      bannerUrl: initialDetail?.bannerUrl,
      format: hasVotingSchedule || hasCreatorVoting ? "SharedCreatorParent" : "Standard",
      scoringMode: !configuringBoth && (parentCanVote(scoringMode) || creatorCanVote(scoringMode)) ? "MissionCompletion" : scoringMode,
      minVotesPerSubmission: initialDetail?.minVotesPerSubmission ?? 5,
      maxParentRegistrations: enableParent && maxParentRegistrations ? Number(maxParentRegistrations) : null,
      submissionCutoffAt: hasVotingSchedule ? submissionAt : null,
      reviewCutoffAt: hasVotingSchedule ? reviewAt : null,
      votingStartAt: hasVotingSchedule ? votingStartAt : null,
      votingEndAt: hasVotingSchedule ? votingEndAt : null,
      creatorVotingSchedule: hasCreatorVoting ? {
        submissionCutoffAt: reverseSubmission, reviewCutoffAt: reverseReview, votingStartAt: reverseStart, votingEndAt: reverseEnd,
      } : null,
      budgetVnd: budgetNumber,
      tracks,
      awardSlots: activeAwards.map((aw) => ({
        trackType: aw.trackType,
        rankOrTier: aw.rankOrTier.trim() || "Giải thưởng",
        slotCount: Math.max(1, Number(aw.slotCount) || 1),
        rewardType: aw.rewardType,
        rewardName: aw.rewardName.trim() || "Phần thưởng sự kiện",
        unitValueVnd: hasBudget ? Number(aw.unitValueVnd) || 0 : 0,
        creditGrantAmount: Number(aw.creditGrantAmount) || 0,
        submitCreditGrantAmount: Number(aw.submitCreditGrantAmount) || 0,
      })),
    };

    setBusy(true);
    const res =
      isEditing && initialDetail
        ? await eventService.update(initialDetail.id, payload)
        : await eventService.create(payload);
    setBusy(false);
    if (!res.success || !res.data) {
      const detailMsg = res.errors?.filter(Boolean).join(" ") || res.message;
      showToast(detailMsg || (isEditing ? "Không cập nhật được sự kiện." : "Không tạo được sự kiện."), "err");
      return;
    }
    showToast(isEditing ? "Đã cập nhật bản nháp sự kiện." : "Đã tạo bản nháp sự kiện mới.", "ok");
    const createdId = res.data.id;
    onClose();
    onCreated(createdId);
  };

  const isActivityWizard = !initialDetail || initialDetail.configVersion === "ActivityBased";

  return (
    <Dialog
      title={isEditing ? "Chỉnh sửa bản nháp sự kiện" : "Tạo sự kiện & Chiến dịch mới"}
      wide
      closeOnBackdrop={false}
      onClose={onClose}
    >
      {isActivityWizard ? (
        <EventActivityWizard
          initialDetail={initialDetail}
          categories={categories}
          onClose={onClose}
          onSaved={(createdId) => {
            onClose();
            onCreated(createdId);
          }}
        />
      ) : (
      <>
      <div className="sec ev-create-scroll" style={{ gap: 14 }}>
        <div className="ev-field">
          <label htmlFor="ev-create-title" className="ev-field-label">
            Tên sự kiện
          </label>
          <input
            id="ev-create-title"
            className="inp"
            placeholder="VD: Lễ hội Sáng tạo Truyện kể"
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="ev-field">
          <label htmlFor="ev-create-desc" className="ev-field-label">
            Mô tả mục tiêu và chủ đề sự kiện
          </label>
          <textarea
            id="ev-create-desc"
            className="inp"
            rows={2}
            placeholder="Nhập mô tả mục tiêu, thể lệ tóm tắt hoặc chủ đề sự kiện"
            maxLength={4000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="ev-grid-2">
          <div className="ev-field">
            <label className="row" style={{ gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={hasBudget}
                onChange={(e) => setHasBudget(e.target.checked)}
              />
              <span className="ev-field-label" style={{ margin: 0 }}>
                Sử dụng ngân sách thưởng (VNĐ)
              </span>
            </label>
            {hasBudget ? (
              <input
                id="ev-create-budget"
                aria-label="Ngân sách thưởng (VNĐ)"
                type="text"
                inputMode="numeric"
                className="inp"
                value={budgetInput}
                onChange={(e) => setBudgetInput(onlyDigits(e.target.value))}
                placeholder="VD: 2000000"
              />
            ) : (
              <p className="sub" style={{ margin: "4px 0 0" }}>
                Sự kiện không dùng tiền mặt (chỉ tặng quà hiện vật 0đ, lượt tạo AI hoặc Gói Creator).
              </p>
            )}
          </div>
          <div className="ev-field">
            <label htmlFor="ev-create-cat" className="ev-field-label">
              Chủ đề chính
            </label>
            <select
              id="ev-create-cat"
              className="inp"
              value={categoryIdInput}
              onChange={(e) => setCategoryIdInput(e.target.value)}
            >
              {categories.length === 0 ? (
                <option value={categoryIdInput}>Chủ đề #{categoryIdInput}</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.displayName}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="ev-field">
          <span className="ev-field-label">Nhóm tuổi mục tiêu</span>
          <div className="ev-age-chips">
            {AGE_BAND_OPTIONS.map((band) => (
              <button
                key={band}
                type="button"
                className={`pill ev-chip-btn${ageBands.includes(band) ? " on" : ""}`}
                onClick={() => toggleAgeBand(band)}
              >
                {band} tuổi
              </button>
            ))}
          </div>
        </div>

        <div className="ev-field">
          <span className="ev-field-label">Đối tượng tham gia</span>
          <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
            <label className="row" style={{ gap: 6, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={enableCreator}
                onChange={(e) => setEnableCreator(e.target.checked)}
              />
              <span>Cho phép Creator tham gia</span>
            </label>
            <label className="row" style={{ gap: 6, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={enableParent}
                onChange={(e) => setEnableParent(e.target.checked)}
              />
              <span>Cho phép Parent tham gia</span>
            </label>
          </div>
          {!enableCreator && !enableParent && <p className="sub ev-warn-text" role="alert">Chọn ít nhất một nhóm tham gia.</p>}
          <p className="sub">Các nhóm có thể tham gia cùng ngày hoặc theo lịch riêng. Ngày kết thúc được tính trọn ngày theo giờ Việt Nam (UTC+7).</p>
        </div>
        <div className="ev-grid-2">
          {enableCreator && (
          <div className="ev-task-row">
            <b className="ev-field-label">Lịch tham gia Creator</b>
            <span className="sub">Dành cho Tác giả viết và nộp truyện dự thi theo chủ đề để tạo nguồn truyện sự kiện.</span>
            <div className="ev-grid-2">
              <div className="ev-field">
                <label htmlFor="ev-cr-reg-start" className="sub">
                  Bắt đầu tham gia
                </label>
                <EventDateInput id="ev-cr-reg-start" value={creatorRegStart} onChange={setCreatorRegStart} />
              </div>
              <div className="ev-field">
                <label htmlFor="ev-cr-reg-end" className="sub">
                  Kết thúc tham gia
                </label>
                <EventDateInput
                  id="ev-cr-reg-end"
                  min={creatorRegStart}
                  value={creatorExecEnd}
                  onChange={setCreatorExecEnd}
                />
              </div>
            </div>
            {creatorDateError && <p className="sub ev-warn-text" role="alert">{creatorDateError}</p>}
            <div className="ev-grid-2">
              <div className="ev-field">
                <label htmlFor="ev-cr-ai" className="sub">
                  Tặng AI Credits
                </label>
                <input id="ev-cr-ai" type="text" inputMode="numeric" className="inp" value={grantAiCredits} onChange={(e) => setGrantAiCredits(onlyDigits(e.target.value))} />
              </div>
              <div className="ev-field">
                <label htmlFor="ev-cr-sub" className="sub">
                  Tặng lượt nộp miễn phí
                </label>
                <input id="ev-cr-sub" type="text" inputMode="numeric" className="inp" value={grantSubmitCredits} onChange={(e) => setGrantSubmitCredits(onlyDigits(e.target.value))} />
              </div>
            </div>
          </div>
          )}

          {enableParent && (
          <div className="ev-task-row">
            <b className="ev-field-label">Lịch tham gia Parent</b>
            <span className="sub">Dành cho phụ huynh cùng bé đọc truyện và làm nhiệm vụ.</span>
            <div className="ev-grid-2">
              <div className="ev-field">
                <label htmlFor="ev-pa-reg-start" className="sub">
                  Bắt đầu tham gia
                </label>
                <EventDateInput
                  id="ev-pa-reg-start"
                  value={parentRegStart}
                  onChange={setParentRegStart}
                />
              </div>
              <div className="ev-field">
                <label htmlFor="ev-pa-reg-end" className="sub">
                  Kết thúc tham gia
                </label>
                <EventDateInput id="ev-pa-reg-end" min={parentRegStart} value={parentExecEnd} onChange={setParentExecEnd} />
              </div>
            </div>
            {parentDateError && <p className="sub ev-warn-text" role="alert">{parentDateError}</p>}
            <label className="ev-field">
              <span className="sub">Giới hạn số Parent đăng ký (tùy chọn)</span>
              <input type="text" inputMode="numeric" className="inp" value={maxParentRegistrations}
                onChange={(e) => setMaxParentRegistrations(onlyDigits(e.target.value))} />
            </label>
            {parentCapInvalid && <p className="sub ev-warn-text" role="alert">Nhập giới hạn đăng ký từ 1 đến 2.147.483.647.</p>}
            <div className="ev-grid-2">
              <div className="ev-field">
                <label htmlFor="ev-claim-hours" className="sub">
                  Hạn nhận thưởng (giờ)
                </label>
                <input id="ev-claim-hours" type="text" inputMode="numeric" className="inp" value={claimWindowHours} onChange={(e) => setClaimWindowHours(onlyDigits(e.target.value))} />
              </div>
              <div className="ev-field">
                <label htmlFor="ev-realloc" className="sub">
                  Số vòng đôn Runner-up
                </label>
                <input id="ev-realloc" type="text" inputMode="numeric" className="inp" value={maxReallocationRounds} onChange={(e) => setMaxReallocationRounds(onlyDigits(e.target.value))} />
              </div>
            </div>
            <label className="row" style={{ gap: 6, fontSize: "var(--fs-xs)" }}>
              <input type="checkbox" checked={waiveWeeklyLimit} onChange={(e) => setWaiveWeeklyLimit(e.target.checked)} />
              Miễn giới hạn đọc thư viện tuần cho gia đình tham gia
            </label>
          </div>
          )}
        </div>

        {configuringBoth && (
          <div className="ev-task-row">
            <label className="ev-field">
              <span className="ev-field-label">Bình chọn truyện dự thi</span>
              <select className="inp" value={scoringMode}
                onChange={(e) => setScoringMode(e.target.value as EventScoringMode)}>
                {initialDetail?.scoringMode === "Rubric" && <option value="Rubric">Giữ cách xét giải của bản nháp cũ</option>}
                <option value="MissionCompletion">Không bình chọn · Xét theo nhiệm vụ</option>
                <option value="ParentVoteAverage">Creator nộp truyện · Parent bình chọn</option>
                <option value="CreatorVoteAverage">Parent nộp truyện · Creator bình chọn</option>
                <option value="CrossRoleVoteAverage">Cả hai chiều</option>
              </select>
            </label>
            {scoringMode === "MissionCompletion" && (
              <p className="sub">Khi số suất có hạn, ưu tiên người hoàn thành nhiệm vụ trước.</p>
            )}
            {hasVotingSchedule && (
              <>
                <b>Creator nộp truyện · Parent bình chọn</b>
                <p className="sub">Parent có thể đăng ký sớm. Vòng bình chọn mở sau khi chốt và duyệt danh sách truyện. Các giờ bên dưới dùng giờ Việt Nam.</p>
                <div className="ev-grid-2">
                  {([
                    ["submission", "Hạn nộp truyện", submissionCutoff, setSubmissionCutoff],
                    ["review", "Hạn duyệt truyện", reviewCutoff, setReviewCutoff],
                    ["start", "Mở bình chọn", votingStart, setVotingStart],
                    ["end", "Đóng bình chọn (mặc định cuối lịch Parent)", votingEnd, setVotingEnd],
                  ] as const).map(([key, label, value, setValue]) => {
                    const id = `ev-parent-vote-${key}`;
                    return <EventDateTimeField key={id} id={id} label={label} value={value} onChange={setValue}
                      onInvalidChange={(invalid) => markInvalidTime(id, invalid)} />;
                  })}
                </div>
                {votingError && <p className="sub ev-warn-text" role="alert">{votingError}</p>}
              </>
            )}
            {hasCreatorVoting && (
              <>
                <b>Parent nộp truyện · Creator bình chọn</b>
                <p className="sub">Moderator duyệt bản văn dự thi. Bản đã duyệt chỉ hiện cho Creator tham gia trong giờ bình chọn.</p>
                <div className="ev-grid-2">
                  {([
                    ["submissionCutoffAt", "Hạn Parent nộp truyện"],
                    ["reviewCutoffAt", "Hạn duyệt bài Parent"],
                    ["votingStartAt", "Mở bình chọn cho Creator"],
                    ["votingEndAt", "Đóng bình chọn cho Creator (mặc định cuối lịch Creator)"],
                  ] as const).map(([key, label]) => {
                    const id = `ev-creator-vote-${key}`;
                    return <EventDateTimeField key={id} id={id} label={label} value={reverseTimes[key]}
                      onChange={(value) => setReverseTimes((prev) => ({ ...prev, [key]: value }))}
                      onInvalidChange={(invalid) => markInvalidTime(id, invalid)} />;
                  })}
                </div>
                {reverseVotingError && <p className="sub ev-warn-text" role="alert">{reverseVotingError}</p>}
              </>
            )}
          </div>
        )}

        <div className="ev-task-row">
          <div className="ev-card-head">
            <b className="ev-field-label">Cơ cấu giải thưởng ({awards.length} hạng)</b>
            <button
              type="button"
              className="btn btn-s"
              onClick={() =>
                setAwards((prev) => [
                  ...prev,
                  {
                    trackType: "Parent",
                    rankOrTier: `Giải Khuyến khích ${prev.length + 1}`,
                    slotCount: "5",
                    rewardType: "PlatformCredits",
                    rewardName: "Tín dụng AI",
                    unitValueVnd: "50000",
                    creditGrantAmount: "5",
                  },
                ])
              }
            >
              <Plus className="ic" aria-hidden="true" />
              Thêm giải
            </button>
          </div>
          {awards.map((aw, idx) => {
            const usesCredits = aw.rewardType === "PlatformCredits";
            const showExtraVnd = hasBudget && usesCredits;
            return (
              <div key={idx} className="ev-award-item">
                <div className="ev-award-row">
                  <label className="ev-field">
                    <span className="sub">Nhóm nhận giải</span>
                    <select
                      aria-label="Track nhận giải"
                      className="inp"
                      value={aw.trackType}
                      onChange={(e) => updateAward(idx, { trackType: e.target.value as EventTrackType })}
                    >
                      <option value="Creator">Creator</option>
                      <option value="Parent">Parent</option>
                    </select>
                  </label>
                  <label className="ev-field">
                    <span className="sub">Hạng giải</span>
                    <input
                      aria-label="Tên hạng giải"
                      className="inp"
                      placeholder="VD: Giải Nhất"
                      value={aw.rankOrTier}
                      onChange={(e) => updateAward(idx, { rankOrTier: e.target.value })}
                    />
                  </label>
                  {aw.rewardType === "CreatorPackage" ? (
                    <EventRewardPlanField catalog={rewardPlans} name={aw.rewardName}
                      onChange={(rewardName) => updateAward(idx, { rewardName })} />
                  ) : <label className="ev-field">
                    <span className="sub">Tên phần thưởng</span>
                    <input
                      aria-label="Tên phần thưởng"
                      className="inp"
                      placeholder="VD: Bộ sách thiếu nhi"
                      value={aw.rewardName}
                      onChange={(e) => updateAward(idx, { rewardName: e.target.value })}
                    />
                  </label>}
                  <label className="ev-field">
                    <span className="sub">Loại thưởng</span>
                    <select
                      aria-label="Loại phần thưởng"
                      className="inp"
                      value={aw.rewardType}
                      onChange={(e) => {
                        const rewardType = e.target.value as EventRewardType;
                        updateAward(idx, rewardType === "CreatorPackage" ? { rewardType, rewardName: "" } : { rewardType });
                      }}
                    >
                      {Object.entries(REWARD_TYPE_LABEL).map(([k, lbl]) => (
                        <option key={k} value={k} disabled={k === "CreatorPackage" && aw.trackType !== "Creator"}>
                          {lbl}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="ev-field">
                    <span className="sub">Số suất</span>
                    <input
                      aria-label="Số suất"
                      type="text"
                      inputMode="numeric"
                      className="inp"
                      placeholder="Số suất"
                      value={aw.slotCount}
                      onChange={(e) => updateAward(idx, { slotCount: onlyDigits(e.target.value) })}
                    />
                  </label>
                  {usesCredits ? (
                    <label className="ev-field">
                      <span className="sub">Lượt AI</span>
                      <input
                        aria-label="Số lượt AI"
                        type="text"
                        inputMode="numeric"
                        className="inp"
                        placeholder="Số lượt AI"
                        value={aw.creditGrantAmount}
                        onChange={(e) => updateAward(idx, { creditGrantAmount: onlyDigits(e.target.value) })}
                      />
                    </label>
                  ) : hasBudget ? (
                    <label className="ev-field">
                      <span className="sub">VNĐ / suất</span>
                      <input
                        aria-label="Giá trị mỗi suất VNĐ"
                        type="text"
                        inputMode="numeric"
                        className="inp"
                        placeholder="VNĐ / suất"
                        value={aw.unitValueVnd}
                        onChange={(e) => updateAward(idx, { unitValueVnd: onlyDigits(e.target.value) })}
                      />
                    </label>
                  ) : (
                    <div aria-hidden="true" />
                  )}
                  <button
                    type="button"
                    className="btn btn-g ev-award-del"
                    aria-label="Xóa hạng giải"
                    onClick={() => setAwards((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="ic" aria-hidden="true" />
                  </button>
                </div>
                {showExtraVnd && (
                  <div className="ev-award-extra">
                    {showExtraVnd && (
                      <label className="ev-field">
                        <span className="sub">VNĐ / suất (quy đổi ngân sách)</span>
                        <input
                          aria-label="Giá trị mỗi suất VNĐ"
                          type="text"
                          inputMode="numeric"
                          className="inp"
                          placeholder="VNĐ / suất"
                          value={aw.unitValueVnd}
                          onChange={(e) => updateAward(idx, { unitValueVnd: onlyDigits(e.target.value) })}
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {invalidPackage && <p className="sub ev-warn-text">Hãy chọn gói đang hoạt động và đặt nhóm nhận giải là Creator.</p>}
          {hasBudget && (
            <p className={`sub${overBudget ? " ev-warn-text" : ""}`} style={{ margin: 0 }}>
              Tổng giá trị giải dự kiến: <b>{estimatedAwardsVnd.toLocaleString("vi-VN")} đ</b> / Ngân sách{" "}
              <b>{budgetNumber.toLocaleString("vi-VN")} đ</b>
              {overBudget ? " (Vượt ngân sách dự kiến!)" : ""}
            </p>
          )}
        </div>
      </div>

      <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
        <button type="button" className="btn btn-g" disabled={busy} onClick={onClose}>
          Hủy
        </button>
        <button type="button" className="btn btn-p" disabled={busy || !canSubmit} onClick={() => void submit()}>
          {busy ? "Đang lưu…" : isEditing ? "Lưu thay đổi" : "Tạo sự kiện"}
        </button>
      </div>
      </>
      )}
    </Dialog>
  );
}
