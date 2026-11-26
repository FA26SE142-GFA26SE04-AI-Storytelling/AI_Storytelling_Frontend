"use client";

import { useEffect, useId, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { showToast } from "@/app/lib/toast";
import type { ContentCategory } from "@/app/types/childProfile";
import {
  EVENT_ACTIVITY_LABEL,
  EVENT_AUDIENCE_LABEL,
  EVENT_RESULT_SOURCE_LABEL,
  EVENT_STORY_SOURCE_LABEL,
  REWARD_TYPE_LABEL,
  type EventActivityType,
  type EventAudience,
  type EventAwardResultSource,
  type EventDetailDto,
  type EventReadingStorySource,
  type EventRewardType,
  type UpsertEventActivityDto,
} from "@/app/types/event";
import type { CreateEventPayload } from "@/app/services/eventService";
import { eventService } from "@/app/services/eventService";
import EventDateInput from "./EventDateInput";
import EventRewardPlanField, { findEventRewardPlan, useEventRewardPlans } from "./EventRewardPlanField";
import { eventScheduleWindow, formatEventDateInput, toVnDateInput, toVnEndIso, toVnStartIso, vnTodayOffsetDate } from "./eventTime";
import { eventWindowDateError, validateActivitySchedule } from "./eventScheduleValidation";

const AGE_BAND_OPTIONS = ["3-5", "6-8", "9-10", "11-12"] as const;
const STEPS = ["Thông tin chung", "Hoạt động", "Giải thưởng", "Xem lại"] as const;
const REVIEW_STEP = STEPS.length - 1;
const onlyDigits = (raw: string) => raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
const registrationDates = (regStart: string, regEnd: string) => ({
  regStart: { label: "Mở đăng ký", value: regStart },
  regEnd: { label: "Đóng đăng ký", value: regEnd },
});

function ScheduleDateField({ label, value, onChange, onInvalidChange, error, min, max, window }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onInvalidChange?: (invalid: boolean) => void;
  error: string;
  min?: string;
  max?: string;
  window?: { opens: string; closes: string };
}) {
  const id = useId();
  const earliest = min && min > (window?.opens ?? "") ? min : window?.opens;
  const latest = max && (!window?.closes || max < window.closes) ? max : window?.closes;
  return (
    <div className="ev-field">
      <label className="sub" htmlFor={id}>{label}</label>
      <EventDateInput id={id} value={value} onChange={onChange} onInvalidChange={onInvalidChange}
        min={earliest} max={latest} error={error} />
    </div>
  );
}

type AwardRowDraft = {
  rankOrTier: string;
  rewardName: string;
  resultSource: EventAwardResultSource;
  targetAudience: EventAudience;
  rewardType: EventRewardType;
  slotCount: string;
  unitValueVnd: string;
  creditGrantAmount: string;
};

export function allowedSourcesFor(subEnabled: boolean, voteEnabled: boolean, readEnabled: boolean): EventAwardResultSource[] {
  return [
    ...(subEnabled ? (["SubmissionScore"] as const) : []),
    ...(voteEnabled ? (["VotingAverage"] as const) : []),
    ...(readEnabled ? (["MissionCompletion"] as const) : []),
  ];
}

export function allowedAudiencesForSource(source: EventAwardResultSource, subAudience: EventAudience): EventAudience[] {
  if (source === "MissionCompletion") return ["Parent"];
  if (subAudience === "Creator") return ["Creator"];
  if (subAudience === "Parent") return ["Parent"];
  return ["Both", "Creator", "Parent"];
}

export function normalizeAwardSources<
  T extends { resultSource: EventAwardResultSource; targetAudience: EventAudience; rewardType: EventRewardType },
>(awards: T[], allowedResultSources: EventAwardResultSource[], subAudience: EventAudience): T[] {
  if (allowedResultSources.length === 0) return awards;
  let changed = false;
  const next = awards.map((aw) => {
    const nextSrc = allowedResultSources.includes(aw.resultSource) ? aw.resultSource : allowedResultSources[0];
    const audiences = allowedAudiencesForSource(nextSrc, subAudience);
    const nextAud = audiences.includes(aw.targetAudience)
      ? aw.targetAudience
      : aw.rewardType === "CreatorPackage" && audiences.includes("Creator")
        ? "Creator"
        : audiences[0];
    if (nextSrc === aw.resultSource && nextAud === aw.targetAudience) return aw;
    changed = true;
    return { ...aw, resultSource: nextSrc, targetAudience: nextAud };
  });
  return changed ? next : awards;
}

export default function EventActivityWizard({
  initialDetail,
  categories,
  onClose,
  onSaved,
}: {
  initialDetail?: EventDetailDto | null;
  categories: ContentCategory[];
  onClose: () => void;
  onSaved: (eventId: number) => void;
}) {
  const isEditing = Boolean(initialDetail);
  const existingSub = initialDetail?.activities?.find((a) => a.activityType === "Submission");
  const existingRead = initialDetail?.activities?.find((a) => a.activityType === "ReadingMissions");
  const existingVote = initialDetail?.activities?.find((a) => a.activityType === "Voting");

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  // Step 1: General info
  const [title, setTitle] = useState(initialDetail?.title ?? "");
  const [description, setDescription] = useState(initialDetail?.description ?? "");
  const [categoryId, setCategoryId] = useState(String(initialDetail?.mainCategoryId ?? categories[0]?.id ?? 1));
  const [ageBands, setAgeBands] = useState<string[]>(
    initialDetail?.targetAgeBands ? initialDetail.targetAgeBands.split(",").filter(Boolean) : ["6-8", "9-10"],
  );
  const [hasBudget, setHasBudget] = useState(initialDetail ? initialDetail.budgetVnd > 0 : true);
  const [budgetInput, setBudgetInput] = useState(String(initialDetail?.budgetVnd ?? 2_000_000));
  const [eventOpens, setEventOpens] = useState(() => {
    const start = eventScheduleWindow(initialDetail, initialDetail).start;
    return start === null ? vnTodayOffsetDate(0) : toVnDateInput(new Date(start).toISOString());
  });
  const [eventCloses, setEventCloses] = useState(() => {
    const end = eventScheduleWindow(initialDetail, initialDetail).end;
    return end === null ? vnTodayOffsetDate(14) : toVnDateInput(new Date(end).toISOString());
  });

  // Step 2: Activities
  const [subEnabled, setSubEnabled] = useState(initialDetail ? Boolean(existingSub) : true);
  const [subAudience, setSubAudience] = useState<EventAudience>(existingSub?.allowedAudience ?? "Both");
  const [subRegStart, setSubRegStart] = useState(() => existingSub ? toVnDateInput(existingSub.registrationStartAt) : vnTodayOffsetDate(0));
  const [subRegEnd, setSubRegEnd] = useState(() => existingSub ? toVnDateInput(existingSub.registrationEndAt) : vnTodayOffsetDate(7));
  const [subStart, setSubStart] = useState(() => existingSub ? toVnDateInput(existingSub.startAt) : vnTodayOffsetDate(0));
  const [subEnd, setSubEnd] = useState(() => existingSub ? toVnDateInput(existingSub.endAt) : vnTodayOffsetDate(7));
  const [subReviewCutoff, setSubReviewCutoff] = useState(() =>
    existingSub?.reviewCutoffAt ? toVnDateInput(existingSub.reviewCutoffAt) : vnTodayOffsetDate(8),
  );
  const [invalidReviewDate, setInvalidReviewDate] = useState(false);
  const [subGrantAi, setSubGrantAi] = useState(String(existingSub?.grantAiCredits ?? 1));
  const [subUnlimited, setSubUnlimited] = useState(existingSub ? existingSub.maxSubmissionsPerUser == null : false);
  const [subMaxStories, setSubMaxStories] = useState(String(existingSub?.maxSubmissionsPerUser ?? 1));

  const [readEnabled, setReadEnabled] = useState(initialDetail ? Boolean(existingRead) : true);
  const [readRegStart, setReadRegStart] = useState(() => existingRead ? toVnDateInput(existingRead.registrationStartAt) : vnTodayOffsetDate(0));
  const [readRegEnd, setReadRegEnd] = useState(() => existingRead ? toVnDateInput(existingRead.registrationEndAt) : vnTodayOffsetDate(14));
  const [readStart, setReadStart] = useState(() => existingRead ? toVnDateInput(existingRead.startAt) : vnTodayOffsetDate(9));
  const [readEnd, setReadEnd] = useState(() => existingRead ? toVnDateInput(existingRead.endAt) : vnTodayOffsetDate(14));
  const [readSource, setReadSource] = useState<EventReadingStorySource>(existingRead?.storySource ?? "Both");
  const [readMaxRegs, setReadMaxRegs] = useState(existingRead?.maxRegistrations ? String(existingRead.maxRegistrations) : "");
  const [readWaiveWeekly, setReadWaiveWeekly] = useState(existingRead?.waiveWeeklyLibraryLimit ?? true);
  const [readAwardAll, setReadAwardAll] = useState(existingRead?.awardAllMissionCompleters ?? false);

  const [voteEnabled, setVoteEnabled] = useState(initialDetail ? Boolean(existingVote) : true);
  const [voteRegStart, setVoteRegStart] = useState(() => existingVote ? toVnDateInput(existingVote.registrationStartAt) : vnTodayOffsetDate(0));
  const [voteRegEnd, setVoteRegEnd] = useState(() => existingVote ? toVnDateInput(existingVote.registrationEndAt) : vnTodayOffsetDate(14));
  const [voteStart, setVoteStart] = useState(() => existingVote ? toVnDateInput(existingVote.startAt) : vnTodayOffsetDate(9));
  const [voteEnd, setVoteEnd] = useState(() => existingVote ? toVnDateInput(existingVote.endAt) : vnTodayOffsetDate(14));
  const [minVotes, setMinVotes] = useState(String(existingVote?.minVotesPerSubmission ?? 5));

  // Step 3: Awards
  const [awards, setAwards] = useState<AwardRowDraft[]>(() => {
    if (initialDetail && initialDetail.awards.length > 0) {
      const grouped = new Map<string, AwardRowDraft>();
      for (const aw of initialDetail.awards) {
        const key = `${aw.resultSource ?? "MissionCompletion"}|${aw.rankOrTier}|${aw.rewardName}`;
        const cur = grouped.get(key);
        if (cur) {
          cur.slotCount = String(Number(cur.slotCount) + 1);
        } else {
          grouped.set(key, {
            rankOrTier: aw.rankOrTier,
            rewardName: aw.rewardName,
            resultSource: aw.resultSource ?? "MissionCompletion",
            targetAudience: aw.targetAudience ?? "Parent",
            rewardType: aw.rewardType,
            slotCount: "1",
            unitValueVnd: String(aw.unitValueVnd),
            creditGrantAmount: String(aw.creditGrantAmount),
          });
        }
      }
      return Array.from(grouped.values());
    }
    return [
      {
        rankOrTier: "Giải Bình chọn Xuất sắc",
        rewardName: "Giải Nhất Bình chọn",
        resultSource: "VotingAverage",
        targetAudience: "Creator",
        rewardType: "CashTransfer",
        slotCount: "1",
        unitValueVnd: "500000",
        creditGrantAmount: "0",
      },
    ];
  });

  const allowedResultSources = allowedSourcesFor(subEnabled, voteEnabled, readEnabled);

  const sourceAudienceOptions = (source: EventAwardResultSource): EventAudience[] =>
    allowedAudiencesForSource(source, subAudience);

  useEffect(() => {
    if (categories.length > 0 && !categories.some((c) => String(c.id) === categoryId)) {
      setCategoryId(String(categories[0].id));
    }
  }, [categories, categoryId]);

  useEffect(() => {
    const sources = allowedSourcesFor(subEnabled, voteEnabled, readEnabled);
    setAwards((prev) => normalizeAwardSources(prev, sources, subAudience));
  }, [subEnabled, voteEnabled, readEnabled, subAudience]);

  const budgetNumber = hasBudget ? Number(budgetInput) || 0 : 0;
  const activeAwards = awards.filter((award) => allowedResultSources.includes(award.resultSource));
  const rewardPlans = useEventRewardPlans(activeAwards.some((award) => award.rewardType === "CreatorPackage"));
  const packageError = activeAwards.some((award) => award.rewardType === "CreatorPackage" &&
      (!sourceAudienceOptions(award.resultSource).includes("Creator") || award.targetAudience !== "Creator"))
    ? "Gói Creator chỉ dành cho hạng giải có đối tượng nhận là Creator."
    : activeAwards.some((award) => award.rewardType === "CreatorPackage" && !findEventRewardPlan(rewardPlans, award.rewardName))
      ? "Hãy chọn một gói Creator đang hoạt động cho mỗi hạng giải dùng gói." : "";
  const estimatedAwardsVnd = activeAwards.reduce(
    (s, a) => s + (Number(a.slotCount) || 0) * (hasBudget ? Number(a.unitValueVnd) || 0 : 0),
    0,
  );
  const overBudget = estimatedAwardsVnd > budgetNumber;
  const eventWindow = { opens: eventOpens, closes: eventCloses };
  const eventOpensError = eventOpens ? "" : "Hãy chọn ngày mở sự kiện.";
  const eventClosesError = !eventCloses ? "Hãy chọn ngày kết thúc sự kiện."
    : eventOpens && eventCloses < eventOpens ? "Ngày kết thúc sự kiện không được trước ngày mở." : "";
  const submissionDates = validateActivitySchedule({
    ...registrationDates(subRegStart, subRegEnd),
    start: { label: "Mở nhận bài", value: subStart },
    end: { label: "Hạn nộp bài", value: subEnd },
  }, eventWindow);
  const reviewError = invalidReviewDate ? "Nhập hạn duyệt bài theo định dạng DD/MM/YYYY."
    : voteEnabled && !subReviewCutoff
    ? "Hãy chọn hạn duyệt bài khi bật bình chọn."
    : subReviewCutoff && subEnd && subReviewCutoff < subEnd
      ? `Hạn duyệt bài không được trước hạn nộp bài (${formatEventDateInput(subEnd)}).`
      : eventWindowDateError("Hạn duyệt bài", subReviewCutoff, eventWindow);
  const readingDates = validateActivitySchedule({
    ...registrationDates(readRegStart, readRegEnd),
    start: { label: "Bắt đầu đọc và làm nhiệm vụ", value: readStart },
    end: { label: "Kết thúc đọc và làm nhiệm vụ", value: readEnd },
  }, eventWindow);
  const onlySubmittedStories = readSource === "ApprovedSubmissionsOnly";
  const readingCutoff = subReviewCutoff || subEnd;
  if (!readingDates.start && onlySubmittedStories && subEnabled && readingCutoff && readStart <= readingCutoff) {
    const cutoffLabel = subReviewCutoff ? "hạn duyệt bài" : "hạn nộp bài";
    readingDates.start = `Bắt đầu đọc phải sau ${cutoffLabel} (${formatEventDateInput(readingCutoff)}) khi chỉ dùng bài dự thi đã duyệt.`;
  }
  const readingSourceError = onlySubmittedStories && (!subEnabled || subAudience === "Parent")
    ? "Hãy bật sáng tác cho Creator hoặc chọn nguồn truyện có sẵn." : "";
  const votingDates = validateActivitySchedule({
    ...registrationDates(voteRegStart, voteRegEnd),
    start: { label: "Mở bình chọn", value: voteStart },
    end: { label: "Đóng bình chọn", value: voteEnd },
  }, eventWindow);
  if (!votingDates.start && subEnabled && subReviewCutoff && voteStart <= subReviewCutoff) {
    votingDates.start = `Mở bình chọn phải sau hạn duyệt bài (${formatEventDateInput(subReviewCutoff)}).`;
  }
  const votingSourceError = voteEnabled && (!subEnabled || subAudience === "Parent")
    ? "Bình chọn cần bật sáng tác cho Creator để có truyện đã duyệt cho bé đọc." : "";
  const scheduleError = [
    !subEnabled && !readEnabled && !voteEnabled ? "Hãy bật ít nhất một hoạt động." : "",
    ...(subEnabled ? [...Object.values(submissionDates), reviewError] : []),
    ...(readEnabled ? [readingSourceError, ...Object.values(readingDates)] : []),
    ...(voteEnabled ? [votingSourceError, ...Object.values(votingDates)] : []),
  ].find(Boolean) ?? "";
  const stepErrors = [
    title.trim() ? eventOpensError || eventClosesError : "Vui lòng nhập tên sự kiện.",
    scheduleError,
    packageError || (overBudget ? "Tổng giá trị giải thưởng vượt ngân sách." : ""),
  ];

  const validateSteps = (beforeStep: number) => {
    const invalidStep = stepErrors.findIndex((error, index) => index < beforeStep && error);
    if (invalidStep === -1) return true;
    setStep(invalidStep);
    showToast(stepErrors[invalidStep], "err");
    return false;
  };

  const navigateToStep = (nextStep: number) => {
    if (busy || nextStep > step + 1) return;
    if (nextStep <= step || validateSteps(nextStep)) setStep(nextStep);
  };

  const buildPayload = (): CreateEventPayload => {
    const activities: UpsertEventActivityDto[] = [];
    if (subEnabled) {
      activities.push({
        activityType: "Submission",
        allowedAudience: subAudience,
        registrationStartAt: toVnStartIso(subRegStart),
        registrationEndAt: toVnEndIso(subRegEnd),
        startAt: toVnStartIso(subStart),
        endAt: toVnEndIso(subEnd),
        reviewCutoffAt: voteEnabled || subReviewCutoff ? toVnEndIso(subReviewCutoff) : null,
        grantAiCredits: Math.max(0, Number(subGrantAi) || 0),
        maxSubmissionsPerUser: subUnlimited ? null : Math.max(1, Number(subMaxStories) || 1),
        maxRegistrations: null,
        waiveWeeklyLibraryLimit: false,
        storySource: "Both",
        minVotesPerSubmission: 5,
        claimWindowHours: 72,
        maxReallocationRounds: 1,
        awardAllMissionCompleters: false,
      });
    }
    if (readEnabled) {
      activities.push({
        activityType: "ReadingMissions",
        allowedAudience: "Parent",
        registrationStartAt: toVnStartIso(readRegStart),
        registrationEndAt: toVnEndIso(readRegEnd),
        startAt: toVnStartIso(readStart),
        endAt: toVnEndIso(readEnd),
        reviewCutoffAt: null,
        grantAiCredits: 0,
        maxSubmissionsPerUser: null,
        maxRegistrations: readMaxRegs.trim() ? Math.max(1, Number(readMaxRegs) || 1) : null,
        waiveWeeklyLibraryLimit: readWaiveWeekly,
        storySource: readSource,
        minVotesPerSubmission: 5,
        claimWindowHours: 72,
        maxReallocationRounds: 1,
        awardAllMissionCompleters: readAwardAll,
      });
    }
    if (voteEnabled) {
      activities.push({
        activityType: "Voting",
        allowedAudience: "Parent",
        registrationStartAt: toVnStartIso(voteRegStart),
        registrationEndAt: toVnEndIso(voteRegEnd),
        startAt: toVnStartIso(voteStart),
        endAt: toVnEndIso(voteEnd),
        reviewCutoffAt: null,
        grantAiCredits: 0,
        maxSubmissionsPerUser: null,
        maxRegistrations: null,
        waiveWeeklyLibraryLimit: true,
        storySource: "ApprovedSubmissionsOnly",
        minVotesPerSubmission: Math.max(1, Number(minVotes) || 1),
        claimWindowHours: 72,
        maxReallocationRounds: 1,
        awardAllMissionCompleters: false,
      });
    }

    const actTypeOf = (src: EventAwardResultSource): EventActivityType =>
      src === "SubmissionScore" ? "Submission" : src === "VotingAverage" ? "Voting" : "ReadingMissions";

    return {
      opensAt: toVnStartIso(eventOpens),
      closesAt: toVnEndIso(eventCloses),
      title: title.trim(),
      description: description.trim() || "Sự kiện sáng tác và đọc truyện cùng bé.",
      mainCategoryId: Math.max(1, Number(categoryId) || 1),
      targetAgeBands: ageBands.join(",") || "6-8,9-10",
      configVersion: "ActivityBased",
      budgetVnd: budgetNumber,
      tracks: [],
      activities,
      awardSlots: activeAwards
        .map((aw) => ({
          activityType: actTypeOf(aw.resultSource),
          resultSource: aw.resultSource,
          targetAudience: sourceAudienceOptions(aw.resultSource).includes(aw.targetAudience)
            ? aw.targetAudience
            : sourceAudienceOptions(aw.resultSource)[0],
          rankOrTier: aw.rankOrTier.trim() || "Giải thưởng",
          rewardName: aw.rewardName.trim() || "Phần thưởng sự kiện",
          rewardType: aw.rewardType,
          slotCount: Math.max(1, Number(aw.slotCount) || 1),
          unitValueVnd: hasBudget ? Math.max(0, Number(aw.unitValueVnd) || 0) : 0,
          creditGrantAmount: aw.rewardType === "PlatformCredits" ? Math.max(0, Number(aw.creditGrantAmount) || 0) : 0,
        })),
    };
  };

  const saveDraft = async () => {
    if (busy || step !== REVIEW_STEP || !validateSteps(REVIEW_STEP)) return;
    setBusy(true);
    const payload = buildPayload();
    const res = isEditing && initialDetail
      ? await eventService.update(initialDetail.id, payload)
      : await eventService.create(payload);
    setBusy(false);
    if (!res.success || !res.data) {
      showToast(res.message || "Không lưu được bản nháp sự kiện.", "err");
      return;
    }
    showToast(isEditing ? "Đã cập nhật bản nháp sự kiện." : "Đã tạo bản nháp sự kiện theo hoạt động.", "ok");
    onSaved(res.data.id);
  };

  return (
    <div className="sec ev-create-scroll" style={{ gap: 14 }}>
      <div className="ev-event-filters" role="tablist" aria-label="Các bước cấu hình sự kiện">
        {STEPS.map((label, idx) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={step === idx}
            className={step === idx ? "on" : ""}
            disabled={busy || idx > step + 1}
            onClick={() => navigateToStep(idx)}
          >
            {idx + 1}. {label}
          </button>
        ))}
      </div>

      {step === 0 && (
        <div className="sec" style={{ gap: 12 }}>
          <div className="ev-field">
            <label htmlFor="ev-act-title" className="ev-field-label">Tên sự kiện</label>
            <input id="ev-act-title" className="inp" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Ngày hội Sáng tác & Bình chọn Mùa Thu" />
          </div>
          <div className="ev-field">
            <label htmlFor="ev-act-desc" className="ev-field-label">Mô tả mục tiêu &amp; thể lệ tóm tắt</label>
            <textarea id="ev-act-desc" className="inp" rows={2} maxLength={4000} value={description}
              onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả sự kiện..." />
          </div>
          <div className="ev-grid-2">
            <div className="ev-field">
              <label htmlFor="ev-act-cat" className="ev-field-label">Chủ đề chính</label>
              <select id="ev-act-cat" className="inp" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {categories.length === 0 ? (
                  <option value={categoryId}>Chủ đề #{categoryId}</option>
                ) : (
                  categories.map((c) => <option key={c.id} value={String(c.id)}>{c.displayName}</option>)
                )}
              </select>
            </div>
            <div className="ev-field">
              <label className="row" style={{ gap: 8, cursor: "pointer" }}>
                <input type="checkbox" checked={hasBudget} onChange={(e) => setHasBudget(e.target.checked)} />
                <span className="ev-field-label" style={{ margin: 0 }}>Sử dụng ngân sách thưởng (VNĐ)</span>
              </label>
              {hasBudget ? (
                <input aria-label="Ngân sách thưởng (VNĐ)" type="text" inputMode="numeric" className="inp"
                  value={budgetInput} onChange={(e) => setBudgetInput(onlyDigits(e.target.value))} placeholder="VD: 2000000" />
              ) : (
                <p className="sub" style={{ margin: "4px 0 0" }}>Chỉ tặng quà 0đ, AI Credits hoặc Gói Creator.</p>
              )}
            </div>
          </div>
          <div className="sec" style={{ gap: 4 }}>
            <span className="ev-field-label">Thời gian diễn ra sự kiện</span>
            <div className="ev-grid-2">
              <ScheduleDateField label="Ngày mở sự kiện (VN)" value={eventOpens} onChange={setEventOpens}
                max={eventCloses} error={eventOpensError} />
              <ScheduleDateField label="Ngày kết thúc sự kiện (VN)" value={eventCloses} onChange={setEventCloses}
                min={eventOpens} error={eventClosesError} />
            </div>
            <p className="sub" style={{ margin: 0 }}>Lịch đăng ký, thực hiện và duyệt bài phải nằm trong khoảng này. Tính trọn ngày kết thúc theo giờ Việt Nam.</p>
          </div>
          <div className="ev-field">
            <span className="ev-field-label">Nhóm tuổi mục tiêu</span>
            <div className="ev-age-chips">
              {AGE_BAND_OPTIONS.map((band) => (
                <button key={band} type="button" className={`pill ev-chip-btn${ageBands.includes(band) ? " on" : ""}`}
                  onClick={() => setAgeBands((prev) => prev.includes(band) ? (prev.length > 1 ? prev.filter((b) => b !== band) : prev) : [...prev, band])}>
                  {band} tuổi
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="sec" style={{ gap: 12 }}>
          <p className="sub" style={{ margin: 0 }}>
            Lịch sự kiện: <b>{formatEventDateInput(eventOpens)} – {formatEventDateInput(eventCloses)}</b> (giờ Việt Nam).
            {" "}Lịch đăng ký quy định khi nào người dùng có thể tham gia. Lịch thực hiện quy định khi nào người đã đăng ký có thể nộp bài, đọc hoặc bình chọn.
          </p>

          <div className="ev-task-row">
            <label className="row" style={{ gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={subEnabled} onChange={(e) => setSubEnabled(e.target.checked)} />
              <b>1. {EVENT_ACTIVITY_LABEL.Submission}</b>
            </label>
            {subEnabled && (
              <div className="sec" style={{ gap: 8, marginTop: 8 }}>
                <div className="ev-grid-2">
                  <label className="ev-field">
                    <span className="sub">Đối tượng được sáng tác</span>
                    <select className="inp" value={subAudience} onChange={(e) => setSubAudience(e.target.value as EventAudience)}>
                      {(Object.entries(EVENT_AUDIENCE_LABEL) as [EventAudience, string][]).map(([k, l]) => (
                        <option key={k} value={k}>{l}</option>
                      ))}
                    </select>
                  </label>
                  <label className="ev-field">
                    <span className="sub">AI Credits tặng khi đăng ký</span>
                    <input className="inp" type="text" inputMode="numeric" value={subGrantAi}
                      onChange={(e) => setSubGrantAi(onlyDigits(e.target.value))} placeholder="VD: 1" />
                  </label>
                </div>
                <div className="ev-grid-2">
                  <ScheduleDateField window={eventWindow} label="Mở đăng ký (VN)" value={subRegStart} onChange={setSubRegStart} error={submissionDates.regStart} />
                  <ScheduleDateField label="Đóng đăng ký (VN)" value={subRegEnd} onChange={setSubRegEnd}
                    window={eventWindow} min={subRegStart} max={subEnd} error={submissionDates.regEnd} />
                  <ScheduleDateField label="Mở nhận bài (VN)" value={subStart} onChange={setSubStart}
                    window={eventWindow} min={subRegStart} error={submissionDates.start} />
                  <ScheduleDateField window={eventWindow} label="Hạn nộp bài (VN)" value={subEnd} onChange={setSubEnd} min={subStart} error={submissionDates.end} />
                </div>
                <p className="sub" style={{ margin: 0 }}>Có thể mở đăng ký và nhận bài cùng ngày. Hạn đăng ký có thể đóng sớm hơn hạn nộp, để người đã đăng ký còn thời gian hoàn thiện truyện.</p>
                <div className="ev-grid-2">
                  <ScheduleDateField label="Hạn duyệt bài (trước khi mở bình chọn)" value={subReviewCutoff}
                    onChange={setSubReviewCutoff} onInvalidChange={setInvalidReviewDate} window={eventWindow} min={subEnd} error={reviewError} />
                  <div className="ev-field">
                    <label className="row" style={{ gap: 6, cursor: "pointer" }}>
                      <input type="checkbox" checked={subUnlimited} onChange={(e) => setSubUnlimited(e.target.checked)} />
                      <span className="sub">Không giới hạn số bài mỗi người</span>
                    </label>
                    {!subUnlimited && (
                      <input aria-label="Số bài tối đa mỗi người" className="inp" type="text" inputMode="numeric"
                        value={subMaxStories} onChange={(e) => setSubMaxStories(onlyDigits(e.target.value))} placeholder="VD: 1" />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="ev-task-row">
            <label className="row" style={{ gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={readEnabled} onChange={(e) => setReadEnabled(e.target.checked)} />
              <b>2. {EVENT_ACTIVITY_LABEL.ReadingMissions} (Parent)</b>
            </label>
            {readEnabled && (
              <div className="sec" style={{ gap: 8, marginTop: 8 }}>
                <div className="ev-grid-2">
                  <label className="ev-field">
                    <span className="sub">Nguồn truyện</span>
                    <select className="inp" value={readSource} onChange={(e) => setReadSource(e.target.value as EventReadingStorySource)}>
                      {(Object.entries(EVENT_STORY_SOURCE_LABEL) as [EventReadingStorySource, string][]).map(([k, l]) => (
                        <option key={k} value={k}>{l}</option>
                      ))}
                    </select>
                    {readingSourceError && <small className="ev-warn-text">{readingSourceError}</small>}
                  </label>
                  <label className="ev-field">
                    <span className="sub">Giới hạn đăng ký (bỏ trống = không giới hạn)</span>
                    <input className="inp" type="text" inputMode="numeric" value={readMaxRegs}
                      onChange={(e) => setReadMaxRegs(onlyDigits(e.target.value))} placeholder="VD: 50" />
                    {readAwardAll && (!readMaxRegs || Number(readMaxRegs) < 1) && (
                      <small className="ev-warn-text">Hãy nhập số gia đình tối đa trước khi gửi duyệt nếu cấp thưởng cho mọi gia đình đạt nhiệm vụ.</small>
                    )}
                  </label>
                </div>
                <div className="ev-grid-2">
                  <ScheduleDateField window={eventWindow} label="Mở đăng ký (VN)" value={readRegStart} onChange={setReadRegStart} error={readingDates.regStart} />
                  <ScheduleDateField label="Đóng đăng ký (VN)" value={readRegEnd} onChange={setReadRegEnd}
                    window={eventWindow} min={readRegStart} max={readEnd} error={readingDates.regEnd} />
                  <ScheduleDateField label="Bắt đầu đọc & nhiệm vụ (VN)" value={readStart} onChange={setReadStart}
                    window={eventWindow} min={readRegStart} error={readingDates.start} />
                  <ScheduleDateField label="Kết thúc đọc & nhiệm vụ (VN)" value={readEnd} onChange={setReadEnd}
                    window={eventWindow} min={readStart} error={readingDates.end} />
                </div>
                <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
                  <label className="row" style={{ gap: 6, cursor: "pointer" }}>
                    <input type="checkbox" checked={readWaiveWeekly} onChange={(e) => setReadWaiveWeekly(e.target.checked)} />
                    <span className="sub">Miễn giới hạn thư viện tuần</span>
                  </label>
                  <label className="row" style={{ gap: 6, cursor: "pointer" }}>
                    <input type="checkbox" checked={readAwardAll} onChange={(e) => setReadAwardAll(e.target.checked)} />
                    <span className="sub">Cấp thưởng mọi gia đình đạt nhiệm vụ</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="ev-task-row">
            <label className="row" style={{ gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={voteEnabled} onChange={(e) => setVoteEnabled(e.target.checked)} />
              <b>3. {EVENT_ACTIVITY_LABEL.Voting} (Parent)</b>
            </label>
            {voteEnabled && (
              <div className="sec" style={{ gap: 8, marginTop: 8 }}>
                {votingSourceError && <small className="ev-warn-text">{votingSourceError}</small>}
                <div className="ev-grid-2">
                  <ScheduleDateField window={eventWindow} label="Mở đăng ký (VN)" value={voteRegStart} onChange={setVoteRegStart} error={votingDates.regStart} />
                  <ScheduleDateField label="Đóng đăng ký (VN)" value={voteRegEnd} onChange={setVoteRegEnd}
                    window={eventWindow} min={voteRegStart} max={voteEnd} error={votingDates.regEnd} />
                </div>
                <div className="ev-grid-2">
                  <ScheduleDateField label="Mở bình chọn (sau hạn duyệt bài)" value={voteStart} onChange={setVoteStart}
                    window={eventWindow} min={voteRegStart} error={votingDates.start} />
                  <ScheduleDateField window={eventWindow} label="Đóng bình chọn (VN)" value={voteEnd} onChange={setVoteEnd} min={voteStart} error={votingDates.end} />
                </div>
                <div className="ev-grid-2">
                  <label className="ev-field">
                    <span className="sub">Ngưỡng phiếu tối thiểu mỗi bài</span>
                    <input className="inp" type="text" inputMode="numeric" value={minVotes}
                      onChange={(e) => setMinVotes(onlyDigits(e.target.value))} placeholder="VD: 5" />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="sec" style={{ gap: 10 }}>
          <div className="ev-card-head">
            <b className="ev-field-label">Cơ cấu giải thưởng ({awards.length} hạng)</b>
            <button type="button" className="btn btn-s" disabled={allowedResultSources.length === 0}
              onClick={() => {
                const defaultSrc = allowedResultSources[0] ?? "MissionCompletion";
                setAwards((prev) => [...prev, {
                  rankOrTier: `Hạng giải ${prev.length + 1}`,
                  rewardName: "Phần thưởng sự kiện",
                  resultSource: defaultSrc,
                  targetAudience: sourceAudienceOptions(defaultSrc)[0],
                  rewardType: hasBudget ? "CashTransfer" : "PlatformCredits",
                  slotCount: "1",
                  unitValueVnd: "0",
                  creditGrantAmount: "2",
                }]);
              }}>
              <Plus className="ic" aria-hidden="true" /> Thêm hạng giải
            </button>
          </div>
          {allowedResultSources.length === 0 && (
            <p className="sub ev-warn-text">Hãy bật ít nhất một hoạt động ở bước 2 trước khi thêm hạng giải.</p>
          )}
          {awards.map((aw, idx) => {
            const audiences = sourceAudienceOptions(aw.resultSource);
            return (
              <div key={idx} className="ev-task-row" style={{ gap: 8 }}>
                <div className="ev-grid-2">
                  <label className="ev-field">
                    <span className="sub">Hạng giải</span>
                    <input className="inp" value={aw.rankOrTier} placeholder="VD: Giải Nhất"
                      onChange={(e) => setAwards((p) => p.map((x, i) => i === idx ? { ...x, rankOrTier: e.target.value } : x))} />
                  </label>
                  {aw.rewardType === "CreatorPackage" ? (
                    <EventRewardPlanField catalog={rewardPlans} name={aw.rewardName}
                      onChange={(rewardName) => setAwards((p) => p.map((x, i) => i === idx ? { ...x, rewardName } : x))} />
                  ) : <label className="ev-field">
                    <span className="sub">Tên phần thưởng</span>
                    <input className="inp" value={aw.rewardName} placeholder="VD: Bộ sách"
                      onChange={(e) => setAwards((p) => p.map((x, i) => i === idx ? { ...x, rewardName: e.target.value } : x))} />
                  </label>}
                  <label className="ev-field">
                    <span className="sub">Nguồn kết quả xét giải</span>
                    <select className="inp" value={aw.resultSource}
                      onChange={(e) => {
                        const nextSrc = e.target.value as EventAwardResultSource;
                        const nextAud = aw.rewardType === "CreatorPackage" && sourceAudienceOptions(nextSrc).includes("Creator")
                          ? "Creator" : sourceAudienceOptions(nextSrc)[0];
                        setAwards((p) => p.map((x, i) => i === idx ? { ...x, resultSource: nextSrc, targetAudience: nextAud } : x));
                      }}>
                      {allowedResultSources.map((src) => (
                        <option key={src} value={src}>{EVENT_RESULT_SOURCE_LABEL[src]}</option>
                      ))}
                    </select>
                  </label>
                  <label className="ev-field">
                    <span className="sub">Đối tượng nhận</span>
                    <select className="inp" value={audiences.includes(aw.targetAudience) ? aw.targetAudience : audiences[0]}
                      onChange={(e) => setAwards((p) => p.map((x, i) => i === idx ? { ...x, targetAudience: e.target.value as EventAudience } : x))}>
                      {audiences.map((aud) => <option key={aud} value={aud}>{EVENT_AUDIENCE_LABEL[aud]}</option>)}
                    </select>
                  </label>
                </div>
                <div className="ev-activity-award-row">
                  <label className="ev-field">
                    <span className="sub">Loại thưởng</span>
                    <select className="inp" value={aw.rewardType}
                      onChange={(e) => {
                        const rewardType = e.target.value as EventRewardType;
                        setAwards((p) => p.map((x, i) => i !== idx ? x : rewardType === "CreatorPackage"
                          ? { ...x, rewardType, targetAudience: "Creator", rewardName: "" }
                          : { ...x, rewardType }));
                      }}>
                      {(Object.entries(REWARD_TYPE_LABEL) as [EventRewardType, string][]).map(([k, l]) => (
                        <option key={k} value={k} disabled={k === "CreatorPackage" && !audiences.includes("Creator")}>{l}</option>
                      ))}
                    </select>
                  </label>
                  <label className="ev-field">
                    <span className="sub">Số suất</span>
                    <input className="inp" type="text" inputMode="numeric" value={aw.slotCount}
                      onChange={(e) => setAwards((p) => p.map((x, i) => i === idx ? { ...x, slotCount: onlyDigits(e.target.value) } : x))} />
                  </label>
                  {hasBudget && (
                    <label className="ev-field">
                      <span className="sub">VNĐ / suất</span>
                      <input className="inp" type="text" inputMode="numeric" value={aw.unitValueVnd}
                        onChange={(e) => setAwards((p) => p.map((x, i) => i === idx ? { ...x, unitValueVnd: onlyDigits(e.target.value) } : x))} />
                    </label>
                  )}
                  {aw.rewardType === "PlatformCredits" && (
                    <label className="ev-field">
                      <span className="sub">Lượt AI</span>
                      <input className="inp" type="text" inputMode="numeric" value={aw.creditGrantAmount}
                        onChange={(e) => setAwards((p) => p.map((x, i) => i === idx ? { ...x, creditGrantAmount: onlyDigits(e.target.value) } : x))} />
                    </label>
                  )}
                  <button type="button" className="btn btn-g" aria-label="Xóa hạng giải"
                    onClick={() => setAwards((p) => p.filter((_, i) => i !== idx))}>
                    <Trash2 className="ic" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
          {hasBudget && (
            <p className={`sub${overBudget ? " ev-warn-text" : ""}`} style={{ margin: 0 }}>
              Tổng giá trị giải: <b>{estimatedAwardsVnd.toLocaleString("vi-VN")} đ</b> / Ngân sách <b>{budgetNumber.toLocaleString("vi-VN")} đ</b>
            </p>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="ev-task-row" style={{ gap: 8 }}>
          <b>Xem lại cấu hình sự kiện</b>
          <p className="sub" style={{ margin: 0 }}>Thời gian sự kiện: <b>{formatEventDateInput(eventOpens)} – {formatEventDateInput(eventCloses)}</b></p>
          <p className="sub" style={{ margin: 0 }}>
            <b>{title.trim() || "(Chưa nhập tên)"}</b> · Nhóm tuổi: {ageBands.join(", ")} · Ngân sách:{" "}
            {hasBudget ? `${budgetNumber.toLocaleString("vi-VN")} đ` : "Không dùng tiền mặt"}
          </p>
          <ul className="sub" style={{ margin: 0, paddingLeft: 18 }}>
            {subEnabled && (
              <li>Sáng tác ({EVENT_AUDIENCE_LABEL[subAudience]}): {formatEventDateInput(subStart)} → {formatEventDateInput(subEnd)} · +{subGrantAi || 0} AI Credits ·{" "}
                {subUnlimited ? "Không giới hạn bài" : `Tối đa ${subMaxStories || 1} bài`}</li>
            )}
            {readEnabled && (
              <li>Đọc &amp; Nhiệm vụ (Parent): {formatEventDateInput(readStart)} → {formatEventDateInput(readEnd)} · {EVENT_STORY_SOURCE_LABEL[readSource]}</li>
            )}
            {voteEnabled && (
              <li>Bình chọn (Parent): {formatEventDateInput(voteStart)} → {formatEventDateInput(voteEnd)} · Ngưỡng {minVotes || 1} phiếu/bài</li>
            )}
          </ul>
          {activeAwards.filter((award) => award.rewardType === "CreatorPackage").map((award, idx) => {
            const plan = findEventRewardPlan(rewardPlans, award.rewardName);
            return plan && (
              <p className="sub" key={idx} style={{ margin: 0 }}>
                {award.rankOrTier || "Giải thưởng"} · {plan.name} · {plan.aiCredits} lượt AI và {plan.submitCredits} lượt gửi duyệt mỗi suất
              </p>
            );
          })}
          {allowedResultSources.length === 0 && awards.length > 0 && (
            <p className="sub ev-warn-text">
              Chưa có hoạt động nào đang bật cho các hạng giải hiện tại. Hãy quay lại bước 2 để bật hoạt động hoặc xóa hạng giải trước khi lưu.
            </p>
          )}
          <p className="sub" style={{ margin: 0 }}>
            Số hạng giải sẽ lưu: <b>{activeAwards.length}</b>. Sau khi lưu nháp, tiếp tục thiết lập Thể lệ &amp; Nhiệm vụ (nếu bật Đọc) trước khi gửi Admin duyệt.
          </p>
        </div>
      )}

      <div className="row" style={{ justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="btn btn-g" disabled={busy} onClick={onClose}>Hủy</button>
        <div className="row" style={{ gap: 8 }}>
          {step > 0 && (
            <button type="button" className="btn btn-s" disabled={busy} onClick={() => setStep((s) => s - 1)}>Quay lại</button>
          )}
          {step < REVIEW_STEP ? (
            <button type="button" className="btn btn-p" disabled={busy} onClick={() => navigateToStep(step + 1)}>Tiếp theo</button>
          ) : (
            <button type="button" className="btn btn-p" disabled={busy || (allowedResultSources.length === 0 && awards.length > 0)} onClick={() => void saveDraft()}>
              {busy ? "Đang lưu…" : isEditing ? "Lưu bản nháp" : "Tạo bản nháp"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
