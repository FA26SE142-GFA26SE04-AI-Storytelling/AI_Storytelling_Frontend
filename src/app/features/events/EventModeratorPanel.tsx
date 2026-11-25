"use client";

import { useState } from "react";
import { Award, CheckCircle2, ChevronDown, ChevronUp, Lock, Pencil, Send, ShieldCheck, Sparkles, Trash2, XCircle } from "lucide-react";
import { eventService } from "@/app/services/eventService";
import { confirmDialog } from "@/app/lib/confirm";
import { showToast } from "@/app/lib/toast";
import {
  APPEAL_STATUS_LABEL,
  EVENT_STATUS_LABEL,
  SUBMISSION_STATUS_LABEL,
  type EventAppealDto,
  type EventDetailDto,
  type EventReportSummaryDto,
  type EventRewardType,
  type EventStatus,
  type EventSubmissionDto,
  type EventVoteDto,
  type TrackCompletionMode,
  type UpsertEventTaskDto,
} from "@/app/types/event";
import { creatorCanVote, parentCanVote } from "@/app/types/event";
import EventTaskBuilder from "./EventTaskBuilder";
import EventModeratorAssignment from "./EventModeratorAssignment";
import EventCuratedStoryPicker from "./EventCuratedStoryPicker";
import EventAwardsTable from "./EventAwardsTable";
import EventConfigurationSummary from "./EventConfigurationSummary";
import EventRewardPlanField, { findEventRewardPlan, useEventRewardPlans } from "./EventRewardPlanField";
import { formatVnDate } from "./eventTime";

const LIFECYCLE_STEPS: EventStatus[] = ["Draft", "PendingApproval", "Approved", "Published", "Closed"];
type RubricCriterion = { key: string; label: string; weight: number };
const DEFAULT_CRITERIA: RubricCriterion[] = [
  { key: "creativity", label: "Sáng tạo và độc đáo", weight: 30 },
  { key: "education", label: "Giá trị giáo dục", weight: 30 },
  { key: "structure", label: "Cấu trúc và mạch lạc", weight: 20 },
  { key: "media", label: "Hình ảnh và giọng đọc", weight: 20 },
];

function criteriaOf(value?: string | null): RubricCriterion[] {
  if (!value) return DEFAULT_CRITERIA;
  try {
    const criteria: RubricCriterion[] | undefined = JSON.parse(value)?.criteria;
    return Array.isArray(criteria) && criteria.length > 0 ? criteria : DEFAULT_CRITERIA;
  } catch { return DEFAULT_CRITERIA; }
}

export type EventModeratorPanelProps = {
  detail: EventDetailDto;
  isAdmin: boolean;
  appeals: EventAppealDto[];
  submissions?: EventSubmissionDto[];
  summary: EventReportSummaryDto | null;
  onRefresh: () => void;
  onDraftDeleted?: (eventId: number) => void;
  onEditDraft?: () => void;
};

/** Bảng điều phối Event cho Moderator & Administrator: nhiệm vụ động, phê duyệt ngân sách, xác minh, khiếu nại và trao giải. */
export default function EventModeratorPanel({
  detail,
  isAdmin,
  appeals,
  submissions = [],
  summary,
  onRefresh,
  onDraftDeleted,
  onEditDraft,
}: EventModeratorPanelProps) {
  const [busy, setBusy] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [evalSubId, setEvalSubId] = useState("");
  const [evalScores, setEvalScores] = useState<Record<string, string>>({});
  const canManageEvent = !isAdmin && detail.canManageEvent !== false;
  const criteria = criteriaOf(detail.activeRule?.creatorRubricJson);
  const isActivityBased = detail.configVersion === "ActivityBased";
  const acts = detail.activities ?? [];
  const subAct = acts.find((a) => a.activityType === "Submission");
  const readAct = acts.find((a) => a.activityType === "ReadingMissions");
  const voteAct = acts.find((a) => a.activityType === "Voting");
  const needsSavedRules = !detail.activeRule?.rulesText.trim() ||
    ((!isActivityBased || Boolean(readAct)) && !detail.activeRule?.tasks.length);
  const executionEnded = isActivityBased
    ? (!detail.closesAt || Date.parse(detail.closesAt) < Date.now()) &&
      acts.length > 0 && acts.every((a) => Date.parse(a.endAt) < Date.now() &&
        (!a.reviewCutoffAt || a.activityType !== "Submission" || Date.parse(a.reviewCutoffAt) < Date.now()))
    : detail.tracks.length > 0 && detail.tracks.every((track) => Date.parse(track.executionEndAt) < Date.now());
  const [cloneWarnings, setCloneWarnings] = useState<string[]>([]);
  const [evalComment, setEvalComment] = useState("");
  const [txCodes, setTxCodes] = useState<Record<number, string>>({});
  const [appealNotes, setAppealNotes] = useState<Record<number, string>>({});
  const [votes, setVotes] = useState<EventVoteDto[]>([]);
  const [voteReasons, setVoteReasons] = useState<Record<number, string>>({});
  const [awardsExpanded, setAwardsExpanded] = useState(false);
  const [minVotesPerSubmission, setMinVotesPerSubmission] = useState(detail.minVotesPerSubmission ?? 5);
  const [rewardEligibilityText, setRewardEligibilityText] = useState(detail.activeRule?.rewardEligibilityText ?? "Hoàn thành nhiệm vụ để xét thưởng.");
  const [tieBreakerPolicyText, setTieBreakerPolicyText] = useState(detail.activeRule?.tieBreakerPolicyText ?? "Ưu tiên nhiều phiếu hợp lệ hơn, rồi nộp sớm hơn.");
  const [insufficientVotesPolicyText, setInsufficientVotesPolicyText] = useState(detail.activeRule?.insufficientVotesPolicyText ?? "Bài chưa đủ ngưỡng phiếu tối thiểu không xếp giải.");
  const [awardAllParentCompleters, setAwardAllParentCompleters] = useState(
    detail.tracks.find((t) => t.trackType === "Parent")?.awardAllMissionCompleters ?? true,
  );
  const creatorTrack = detail.tracks.find((track) => track.trackType === "Creator");
  const creatorAward = detail.awards.find((award) => award.trackId === creatorTrack?.id);
  const [creatorPkgAi, setCreatorPkgAi] = useState(creatorAward?.creditGrantAmount ?? 5);
  const [creatorPlanName, setCreatorPlanName] = useState(creatorAward?.rewardType === "CreatorPackage" ? creatorAward.rewardName : "");
  const [sectionHasBudget, setSectionHasBudget] = useState(detail.budgetVnd > 0);
  const [sectionBudgetVnd, setSectionBudgetVnd] = useState(detail.budgetVnd);
  const [creatorRewardType, setCreatorRewardType] = useState<EventRewardType>(creatorAward?.rewardType ?? "CreatorPackage");
  const [creatorUnitValueVnd, setCreatorUnitValueVnd] = useState(creatorAward?.unitValueVnd ?? 0);
  const parentTrack = detail.tracks.find((track) => track.trackType === "Parent");
  const parentAward = detail.awards.find((award) => award.trackId === parentTrack?.id);
  const [parentRewardType, setParentRewardType] = useState<EventRewardType>(parentAward?.rewardType ?? "PlatformCredits");
  const [parentUnitValueVnd, setParentUnitValueVnd] = useState(parentAward?.unitValueVnd ?? 0);
  const [parentCreditGrant, setParentCreditGrant] = useState(parentAward?.creditGrantAmount ?? 2);
  const hasCreatorTrack = detail.tracks.some((track) => track.trackType === "Creator");
  const hasParentTrack = detail.tracks.some((track) => track.trackType === "Parent");
  const usesCreatorPlan = hasCreatorTrack && creatorRewardType === "CreatorPackage";
  const rewardPlans = useEventRewardPlans(!isAdmin && !isActivityBased && usesCreatorPlan &&
    (detail.status === "Draft" || detail.status === "PendingApproval"));
  const creatorPlan = findEventRewardPlan(rewardPlans, creatorPlanName);
  const [rulesText, setRulesText] = useState(detail.activeRule?.rulesText ?? "Thể lệ chính thức của sự kiện.");
  const [completionMode, setCompletionMode] = useState<TrackCompletionMode>(
    detail.activeRule?.completionMode ?? "AllMandatory",
  );
  const [requiredTaskCount, setRequiredTaskCount] = useState(detail.activeRule?.requiredTaskCount ?? 1);
  const [requiredPoints, setRequiredPoints] = useState(detail.activeRule?.requiredPoints ?? 50);
  const [tasks, setTasks] = useState<UpsertEventTaskDto[]>(
    detail.activeRule?.tasks.map((t) => ({
      taskCode: t.taskCode,
      targetTrackType: t.targetTrackType,
      title: t.title,
      description: t.description,
      sortOrder: t.sortOrder,
      verifierType: t.verifierType,
      targetValue: t.targetValue,
      configJson: t.configJson,
      isMandatory: t.isMandatory,
      points: t.points,
      allowMultiplePerStory: t.allowMultiplePerStory,
    })) ?? [
      {
        taskCode: "T01",
        title: "Đọc truyện trong sự kiện",
        description: "Đọc hoàn thành các câu chuyện được duyệt.",
        sortOrder: 1,
        verifierType: "ReadEventStories",
        targetValue: 1,
        isMandatory: true,
        points: 20,
        allowMultiplePerStory: false,
      },
    ],
  );

  const runAction = async (fn: () => Promise<{ success: boolean; message?: string | null }>, okMsg: string, onSuccess = onRefresh): Promise<boolean> => {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (!res.success) {
      showToast(res.message || "Thao tác thất bại.", "err");
      return false;
    }
    if (okMsg) showToast(okMsg, "ok");
    onSuccess();
    return true;
  };

  const reloadVotes = () => {
    void eventService.listVotes(detail.id).then((r) => {
      if (r.success && r.data) setVotes(r.data);
    });
  };

  const deleteDraft = async () => {
    if (!await confirmDialog(`Xóa bản nháp sự kiện “${detail.title}”?`)) return;
    await runAction(() => eventService.deleteDraft(detail.id), "Đã xóa bản nháp sự kiện.",
      onDraftDeleted ? () => onDraftDeleted(detail.id) : onRefresh);
  };

  const lifecycleStatus = detail.status === "Paused" ? "Published" : detail.status === "Archived" ? "Closed" : detail.status;
  const stepIndex = Math.max(0, LIFECYCLE_STEPS.indexOf(lifecycleStatus));

  const submitEvaluate = async () => {
    const subId = Number(evalSubId.trim());
    const values = criteria.map(({ key }) => ({
      key,
      score: evalScores[key]?.trim() ? Number(evalScores[key]) : NaN,
    }));
    if (!Number.isInteger(subId) || subId <= 0 ||
      values.some(({ score }) => !Number.isFinite(score) || score < 0 || score > 100)) {
      showToast("Nhập mã bài dự thi và điểm từ 0 đến 100 cho mỗi tiêu chí.", "err");
      return;
    }
    const ok = await runAction(
      () =>
        eventService.evaluateSubmission(subId, {
          criteriaScoresJson: JSON.stringify(Object.fromEntries(values.map(({ key, score }) => [key, score]))),
          comment: evalComment.trim() || undefined,
        }),
      `Đã lưu điểm cho bài dự thi #${subId}.`,
    );
    if (!ok) return;
    setEvalSubId("");
    setEvalScores({});
    setEvalComment("");
  };

  if (!isAdmin && detail.canOperateEvent === false) {
    return <p className="sub">Bạn chưa được phân công điều phối sự kiện này.</p>;
  }

  return (
    <div className="sec ev-editorial-sections">
      {isAdmin && detail.status !== "Closed" && detail.status !== "Archived" && (
        <EventModeratorAssignment key={`${detail.id}-${detail.leadModeratorId}-${detail.assistantModeratorIds?.join(",")}`} detail={detail} onRefresh={onRefresh} />
      )}
      <div className="ev-card">
        <div className="ev-card-head">
          <h3 className="display">Điều phối vòng đời Sự kiện</h3>
          {!isAdmin && detail.canOperateEvent && (
            <span className="sub">{canManageEvent ? "Moderator phụ trách chính" : "Moderator hỗ trợ"}</span>
          )}
          <div className="row" style={{ flexWrap: "wrap", gap: 8 }}>
            {isAdmin && detail.status === "Draft" && (
              <button type="button" className="btn btn-no" disabled={busy} onClick={() => void deleteDraft()}>
                <Trash2 className="ic" aria-hidden="true" />
                Xóa bản nháp
              </button>
            )}
            {canManageEvent && detail.status === "Draft" && (
              <>
                {onEditDraft && (
                  <button type="button" className="btn btn-s" disabled={busy} onClick={onEditDraft}>
                    <Pencil className="ic" aria-hidden="true" />
                    Chỉnh sửa thông tin
                  </button>
                )}
                {!isActivityBased && (
                  <button
                    type="button"
                    className="btn btn-s"
                    disabled={busy}
                    onClick={() => {
                      setBusy(true);
                      void eventService.cloneToActivityDraft(detail.id).then((res) => {
                        setBusy(false);
                        if (!res.success || !res.data) {
                          showToast(res.message || "Không sao chép được bản nháp.", "err");
                          return;
                        }
                        setCloneWarnings(res.data.unmappedWarnings);
                        showToast(`Đã tạo bản nháp theo hoạt động #${res.data.draft.id}.`, "ok");
                        onRefresh();
                      });
                    }}
                  >
                    Sao chép sang bản nháp theo hoạt động
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-p"
                  disabled={busy || needsSavedRules}
                  onClick={() => void runAction(() => eventService.submitApproval(detail.id), "Đã gửi Admin duyệt.")}
                >
                  <Send className="ic" aria-hidden="true" />
                  Gửi Admin duyệt
                </button>
                {needsSavedRules && (
                  <a className="sub" href={`#event-rules-${detail.id}`}>
                    Lưu thể lệ{!isActivityBased || readAct ? " và nhiệm vụ" : ""} trước khi gửi duyệt
                  </a>
                )}
              </>
            )}
            {isAdmin && (detail.status === "PendingApproval" || detail.status === "Approved") && (
              <>
                <input
                  aria-label="Ghi chú phê duyệt hoặc lý do trả về"
                  className="inp"
                  style={{ width: 220 }}
                  placeholder="Ghi chú (bắt buộc nếu trả về)"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
                {detail.status === "PendingApproval" && <button
                  type="button"
                  className="btn btn-ok"
                  disabled={busy}
                  onClick={() =>
                    void runAction(
                      () => eventService.approve(detail.id, true, adminNote.trim() || undefined),
                      "Đã phê duyệt sự kiện.",
                    )
                  }
                >
                  <CheckCircle2 className="ic" aria-hidden="true" />
                  Duyệt ngân sách &amp; sự kiện
                </button>}
                <button
                  type="button"
                  className="btn btn-no"
                  disabled={busy || !adminNote.trim()}
                  onClick={() =>
                    void runAction(
                      () => eventService.approve(detail.id, false, adminNote.trim()),
                      "Đã trả về bản nháp.",
                    )
                  }
                >
                  <XCircle className="ic" aria-hidden="true" />
                  Trả về sửa
                </button>
              </>
            )}
            {canManageEvent && detail.status === "Approved" && (
              <button
                type="button"
                className="btn btn-gold"
                disabled={busy}
                onClick={() => void runAction(() => eventService.publish(detail.id), "Đã phát hành sự kiện.")}
              >
                <Sparkles className="ic" aria-hidden="true" />
                Phát hành sự kiện
              </button>
            )}
            {detail.status === "Published" && (
              <>
                {!executionEnded && <span className="sub">Có thể xác minh và xét giải sau khi kết thúc sự kiện, các hoạt động và hạn duyệt bài.</span>}
                <button
                  type="button"
                  className="btn btn-s"
                  disabled={busy || !executionEnded}
                  onClick={() => void runAction(() => eventService.verify(detail.id), "Đã chạy xác minh hồ sơ.")}
                >
                  <ShieldCheck className="ic" aria-hidden="true" />
                  Xác minh kết quả
                </button>
                {canManageEvent && (
                  <button
                    type="button"
                    className="btn btn-s"
                    disabled={busy || !executionEnded}
                    onClick={() =>
                      void runAction(() => eventService.proposeAwards(detail.id), "Đã đề xuất danh sách trao giải.")
                    }
                  >
                    <Award className="ic" aria-hidden="true" />
                    Đề xuất giải
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    className="btn btn-ok"
                    disabled={busy || !executionEnded}
                    onClick={() =>
                      void runAction(async () => {
                        const result = await eventService.approveAwards(detail.id);
                        const failures = result.data?.filter((award) => award.notificationFailed).map((award) => award.id) ?? [];
                        if (result.success && failures.length > 0) {
                          showToast("Chưa gửi được thông báo cho suất #" + failures.join(", #") + ".", "warn");
                        }
                        return result;
                      }, "Đã phê duyệt danh sách nhận giải.")
                    }
                  >
                    <CheckCircle2 className="ic" aria-hidden="true" />
                    Duyệt trao giải
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-s"
                  disabled={busy}
                  onClick={() =>
                    void runAction(() => eventService.processExpired(detail.id), "Đã xử lý các suất quá hạn (Runner-up).")
                  }
                >
                  Đôn suất quá hạn
                </button>
                {canManageEvent && (
                  <button
                    type="button"
                    className="btn btn-no"
                    disabled={busy || !executionEnded}
                    onClick={() => void runAction(() => eventService.close(detail.id), "Đã đóng sự kiện.")}
                  >
                    <Lock className="ic" aria-hidden="true" />
                    Đóng sự kiện
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <ol className="ev-stepper" aria-label="Tiến trình vòng đời sự kiện">
          {LIFECYCLE_STEPS.map((st, idx) => (
            <li key={st} aria-current={idx === stepIndex ? "step" : undefined} className={`ev-step${idx < stepIndex ? " done" : idx === stepIndex ? " active" : ""}`}>
              <span className="ev-step-index" aria-hidden="true">{idx < stepIndex ? "✓" : String(idx + 1).padStart(2, "0")}</span>
              <span>{EVENT_STATUS_LABEL[st]}</span>
            </li>
          ))}
        </ol>
        {cloneWarnings.length > 0 && (
          <div className="ev-task-row" role="status">
            <b>Lưu ý các phần cần điền lại trên bản nháp hoạt động vừa sao chép:</b>
            <ul className="sub" style={{ margin: 0, paddingLeft: 18 }}>
              {cloneWarnings.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        )}
      </div>

      {isActivityBased && <EventConfigurationSummary detail={detail} />}

      {!isActivityBased && detail.tracks.length > 0 && (
        <div className="ev-grid-2 ev-track-columns">
          {detail.tracks.map((tr) => (
            <div key={tr.id} className="ev-card">
              <div className="ev-card-head">
                <h3 className="display">{tr.trackType === "Creator" ? "Creator Track" : "Parent Track"}</h3>
                <span className="pill">Hạn nhận giải: {tr.claimWindowHours}h</span>
              </div>
              <dl className="ev-track-facts">
                <div><dt>Đăng ký</dt><dd>{formatVnDate(tr.registrationStartAt)} → {formatVnDate(tr.registrationEndAt)}</dd></div>
                <div><dt>Thực hiện</dt><dd>{formatVnDate(tr.executionStartAt)} → {formatVnDate(tr.executionEndAt)}</dd></div>
                <div><dt>Quyền lợi</dt><dd>{tr.trackType === "Creator"
                  ? `${tr.grantAiCredits} lượt AI · ${tr.grantSubmitCredits} lượt nộp · Tối đa ${tr.maxSubmissionsPerUser} bài`
                  : `${tr.waiveWeeklyLibraryLimit ? "Miễn giới hạn thư viện tuần" : "Theo hạn mức tuần"} · Đôn Runner-up tối đa ${tr.maxReallocationRounds} vòng`}</dd></div>
              </dl>
            </div>
          ))}
        </div>
      )}

      {!isAdmin && detail.status === "Published" && (creatorCanVote(detail.scoringMode) || (isActivityBased && (subAct?.allowedAudience === "Parent" || subAct?.allowedAudience === "Both"))) && (
        <div className="ev-card">
          <h3 className="display">Duyệt truyện dự thi của Parent</h3>
          {submissions.filter((submission) => submission.submittedText && submission.status === "PendingReview").length === 0 &&
            <p className="sub">Chưa có bài cần duyệt.</p>}
          {submissions.filter((submission) => submission.submittedText && submission.status === "PendingReview").map((submission) => (
            <details className="ev-task-row" key={submission.id}>
              <summary>{submission.submittedTitle}</summary>
              <div style={{ whiteSpace: "pre-wrap" }}>{submission.submittedText}</div>
              <p className="sub">Kiểm tra thể lệ, nội dung an toàn và thông tin cá nhân trước khi duyệt.</p>
              <div className="row">
                {[true, false].map((approved) => (
                  <button key={String(approved)} className={approved ? "btn btn-ok" : "btn btn-no"}
                    type="button" disabled={busy} onClick={() => void runAction(
                      () => eventService.reviewParentSubmission(detail.id, submission.id, submission.currentStoryVersionId,
                        submission.submittedAt ?? null, approved),
                      approved ? "Đã duyệt truyện dự thi." : "Đã trả về để Parent chỉnh sửa.",
                    )}>
                    {approved ? "Duyệt nội dung" : "Yêu cầu chỉnh sửa"}
                  </button>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}

      {detail.status === "Published" && ((!isActivityBased && (detail.scoringMode ?? "Rubric") === "Rubric") ||
        (isActivityBased && !detail.resultsFinalizedAt && subAct != null && detail.awards.some((a) => a.resultSource === "SubmissionScore"))) && (
        <div className="ev-card">
          <div className="ev-card-head">
            <h3 className="display">Chấm điểm bài dự thi Creator ({submissions.length})</h3>
          </div>
          {submissions.length > 0 && (
            <div className="ev-task-list">
              {submissions.map((sub) => (
                <div key={sub.id} className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                  <span>
                    <b>Bài #{sub.id}</b> · Truyện #{sub.storyId} · Trạng thái:{" "}
                    {SUBMISSION_STATUS_LABEL[sub.status] ?? sub.status} · Trùng lặp:{" "}
                    {Math.round((sub.similarityScore ?? 0) * 100)}%
                  </span>
                  <button type="button" className="btn btn-s" onClick={() => setEvalSubId(String(sub.id))}>
                    Chọn chấm
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <input
              aria-label="Submission ID"
              className="inp"
              style={{ width: 140 }}
              placeholder="Submission ID"
              value={evalSubId}
              onChange={(e) => setEvalSubId(e.target.value.replace(/\D/g, ""))}
            />
            {criteria.map(({ key, label, weight }) => (
              <label className="ev-field" key={key}>
                <span className="sub">{label} ({weight}%)</span>
                <input className="inp" type="number" min={0} max={100} step="any"
                  value={evalScores[key] ?? ""}
                  onChange={(event) => setEvalScores({ ...evalScores, [key]: event.target.value })} />
              </label>
            ))}
            <input
              aria-label="Nhận xét bài dự thi"
              className="inp grow"
              placeholder="Nhận xét chấm điểm..."
              value={evalComment}
              onChange={(e) => setEvalComment(e.target.value)}
            />
            <button type="button" className="btn btn-p" disabled={busy} onClick={() => void submitEvaluate()}>
              Lưu điểm
            </button>
          </div>
        </div>
      )}

      {canManageEvent && (detail.status === "Draft" || detail.status === "PendingApproval") && (
        <div id={`event-rules-${detail.id}`} className="sec">
          {detail.format === "SharedCreatorParent" && (
            <div className="card ev-card" style={{ gap: 10 }}>
              <h3 className="ev-sec-title">Cấu hình thể lệ và nhiệm vụ</h3>
              <div className="ev-grid-2">
                <label className="ev-field">
                  <span className="sub">Ngưỡng phiếu tối thiểu</span>
                  <input
                    className="inp"
                    type="number"
                    min={1}
                    value={minVotesPerSubmission}
                    onChange={(e) => setMinVotesPerSubmission(Math.max(1, Number(e.target.value) || 1))}
                  />
                </label>
              </div>
              <div className="ev-grid-2">
                <input
                  className="inp"
                  aria-label="Điều kiện nhận thưởng"
                  placeholder="Điều kiện nhận thưởng"
                  value={rewardEligibilityText}
                  onChange={(e) => setRewardEligibilityText(e.target.value)}
                />
                <input
                  className="inp"
                  aria-label="Quy tắc đồng hạng"
                  placeholder="Quy tắc đồng hạng"
                  value={tieBreakerPolicyText}
                  onChange={(e) => setTieBreakerPolicyText(e.target.value)}
                />
              </div>
              <input
                className="inp"
                aria-label="Xử lý không đủ phiếu"
                placeholder="Xử lý trường hợp không đủ phiếu"
                value={insufficientVotesPolicyText}
                onChange={(e) => setInsufficientVotesPolicyText(e.target.value)}
              />
              <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn-g"
                  disabled={busy}
                  onClick={() =>
                    void runAction(
                      () =>
                        eventService.updateRulesSection(detail.id, {
                          rulesText,
                          rewardEligibilityText,
                          tieBreakerPolicyText,
                          insufficientVotesPolicyText,
                          scoringMode: detail.scoringMode ?? "ParentVoteAverage",
                          minVotesPerSubmission,
                        }),
                      "Đã lưu mục Thể lệ & Tính điểm.",
                    )
                  }
                >
                  Lưu mục Thể lệ
                </button>
                <button
                  type="button"
                  className="btn btn-g"
                  disabled={busy}
                  onClick={() =>
                    void runAction(
                      () =>
                        eventService.updateTasksSection(detail.id, {
                          completionMode,
                          requiredTaskCount,
                          requiredPoints,
                          tasks,
                        }),
                      "Đã lưu mục Nhiệm vụ.",
                    )
                  }
                >
                  Lưu mục Nhiệm vụ
                </button>
              </div>
              <div className="sec" style={{ gap: 8 }}>
                <div className="row" style={{ gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <label className="row" style={{ gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={sectionHasBudget}
                      onChange={(e) => setSectionHasBudget(e.target.checked)}
                    />
                    <span>Dùng ngân sách thưởng (VNĐ)</span>
                  </label>
                  {sectionHasBudget && (
                    <input
                      aria-label="Ngân sách phần thưởng VNĐ"
                      className="inp"
                      type="number"
                      min={0}
                      value={sectionBudgetVnd}
                      onChange={(e) => setSectionBudgetVnd(Math.max(0, Number(e.target.value) || 0))}
                    />
                  )}
                  <label className="row" style={{ gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={awardAllParentCompleters}
                      onChange={(e) => setAwardAllParentCompleters(e.target.checked)}
                    />
                    <span>Cấp thưởng cho mọi Parent hoàn thành nhiệm vụ</span>
                  </label>
                </div>
                <div className="ev-grid-2" style={{ alignItems: "end" }}>
                  <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "end" }}>
                    <label className="ev-field">
                      <span className="sub">Giải Creator</span>
                      <select
                        className="inp"
                        value={creatorRewardType}
                        onChange={(e) => setCreatorRewardType(e.target.value as EventRewardType)}
                      >
                        <option value="CreatorPackage">Gói Creator (AI + Gửi duyệt)</option>
                        <option value="CashTransfer">Tiền thưởng chuyển khoản</option>
                        <option value="PhysicalGift">Quà hiện vật</option>
                        <option value="PlatformCredits">Lượt tạo truyện AI</option>
                      </select>
                    </label>
                    {sectionHasBudget && (creatorRewardType === "CashTransfer" || creatorRewardType === "PhysicalGift") && (
                      <label className="ev-field">
                        <span className="sub">Giá trị (VNĐ)</span>
                        <input
                          className="inp"
                          type="number"
                          min={0}
                          value={creatorUnitValueVnd}
                          onChange={(e) => setCreatorUnitValueVnd(Math.max(0, Number(e.target.value) || 0))}
                        />
                      </label>
                    )}
                    {creatorRewardType === "PlatformCredits" && (
                      <label className="ev-field">
                        <span className="sub">Lượt AI</span>
                        <input
                          className="inp"
                          type="number"
                          min={0}
                          value={creatorPkgAi}
                          onChange={(e) => setCreatorPkgAi(Math.max(0, Number(e.target.value) || 0))}
                        />
                      </label>
                    )}
                    {creatorRewardType === "CreatorPackage" && (
                      <EventRewardPlanField catalog={rewardPlans} name={creatorPlanName} onChange={setCreatorPlanName} />
                    )}
                  </div>
                  <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "end" }}>
                    <label className="ev-field">
                      <span className="sub">Giải Parent</span>
                      <select
                        className="inp"
                        value={parentRewardType}
                        onChange={(e) => setParentRewardType(e.target.value as EventRewardType)}
                      >
                        <option value="PlatformCredits">Lượt tạo truyện AI</option>
                        <option value="PhysicalGift">Quà hiện vật</option>
                        <option value="CashTransfer">Tiền thưởng chuyển khoản</option>
                      </select>
                    </label>
                    {parentRewardType === "PlatformCredits" && (
                      <label className="ev-field">
                        <span className="sub">Lượt AI</span>
                        <input
                          className="inp"
                          type="number"
                          min={1}
                          value={parentCreditGrant}
                          onChange={(e) => setParentCreditGrant(Math.max(1, Number(e.target.value) || 1))}
                        />
                      </label>
                    )}
                    {sectionHasBudget && (parentRewardType === "CashTransfer" || parentRewardType === "PhysicalGift") && (
                      <label className="ev-field">
                        <span className="sub">VNĐ/suất</span>
                        <input
                          className="inp"
                          type="number"
                          min={0}
                          value={parentUnitValueVnd}
                          onChange={(e) => setParentUnitValueVnd(Math.max(0, Number(e.target.value) || 0))}
                        />
                      </label>
                    )}
                    <button
                      type="button"
                      className="btn btn-g"
                      disabled={busy || (usesCreatorPlan && !creatorPlan)}
                      onClick={() =>
                        void runAction(
                          () =>
                            eventService.updateAwardsSection(detail.id, {
                              budgetVnd: sectionHasBudget ? sectionBudgetVnd : 0,
                              awardAllParentMissionCompleters: awardAllParentCompleters,
                              awardSlots: [
                                ...(hasCreatorTrack
                                  ? [
                                      {
                                        trackType: "Creator" as const,
                                        rankOrTier: "Giải Nhất",
                                        slotCount: 1,
                                        rewardType: creatorRewardType,
                                        rewardName:
                                          creatorRewardType === "CashTransfer"
                                            ? "Tiền thưởng Giải Nhất"
                                            : creatorRewardType === "PhysicalGift"
                                              ? "Quà tặng Giải Nhất"
                                              : creatorRewardType === "CreatorPackage"
                                                ? creatorPlan?.name ?? ""
                                                : "Lượt tạo truyện AI",
                                        unitValueVnd: sectionHasBudget ? creatorUnitValueVnd : 0,
                                        creditGrantAmount: creatorRewardType === "CreatorPackage" ? creatorPlan?.aiCredits ?? 0 : creatorPkgAi,
                                        submitCreditGrantAmount: creatorRewardType === "CreatorPackage" ? creatorPlan?.submitCredits ?? 0 : 0,
                                      },
                                    ]
                                  : []),
                                ...(hasParentTrack
                                  ? [
                                      {
                                        trackType: "Parent" as const,
                                        rankOrTier: "Hoàn thành",
                                        slotCount: Math.max(1, detail.maxParentRegistrations ?? 10),
                                        rewardType: parentRewardType,
                                        rewardName:
                                          parentRewardType === "CashTransfer"
                                            ? "Tiền thưởng Gia đình"
                                            : parentRewardType === "PhysicalGift"
                                              ? "Quà tặng Gia đình"
                                              : "Lượt tạo truyện AI",
                                        unitValueVnd: sectionHasBudget ? parentUnitValueVnd : 0,
                                        creditGrantAmount: parentRewardType === "PlatformCredits" ? Math.max(1, parentCreditGrant) : 0,
                                      },
                                    ]
                                  : []),
                              ],
                            }),
                          "Đã lưu mục Phần thưởng.",
                        )
                      }
                    >
                      Lưu mục Phần thưởng
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {isActivityBased && !readAct ? (
            <div className="ev-card">
              <h3 className="display">Thể lệ chung của sự kiện</h3>
              <textarea className="inp" rows={3} value={rulesText} onChange={(e) => setRulesText(e.target.value)}
                placeholder="Nhập thể lệ chung của sự kiện..." />
              <div className="row" style={{ marginTop: 8 }}>
                <button type="button" className="btn btn-p" disabled={busy || !rulesText.trim()}
                  onClick={() => void runAction(
                    () => eventService.upsertRules(detail.id, {
                      rulesText,
                      creatorRubricJson: detail.activeRule?.creatorRubricJson,
                      completionMode: "AllMandatory",
                      tasks: [],
                    }),
                    "Đã lưu thể lệ sự kiện.",
                  )}>
                  Lưu thể lệ
                </button>
              </div>
            </div>
          ) : (
            <EventTaskBuilder
              eventId={detail.id}
              eventStoriesCount={detail.eventStoriesCount}
              readingSource={readAct?.storySource}
              votingEnabled={isActivityBased ? Boolean(voteAct) : (parentCanVote(detail.scoringMode) || creatorCanVote(detail.scoringMode))}
              rulesText={rulesText}
              completionMode={completionMode}
              requiredTaskCount={requiredTaskCount}
              requiredPoints={requiredPoints}
              tasks={tasks}
              onRulesTextChange={setRulesText}
              onCompletionModeChange={setCompletionMode}
              onRequiredTaskCountChange={setRequiredTaskCount}
              onRequiredPointsChange={setRequiredPoints}
              onTasksChange={setTasks}
              busy={busy}
              onSave={() =>
                void runAction(
                  () =>
                    eventService.upsertRules(detail.id, {
                      rulesText,
                      creatorRubricJson: detail.activeRule?.creatorRubricJson,
                      completionMode,
                      requiredTaskCount,
                      requiredPoints,
                      tasks,
                    }),
                  "Đã lưu phiên bản thể lệ và bộ nhiệm vụ động.",
                )
              }
            />
          )}
        </div>
      )}

      {canManageEvent && readAct && readAct.storySource !== "ApprovedSubmissionsOnly" && !detail.resultsFinalizedAt &&
        (!voteAct || Date.parse(voteAct.startAt) > Date.now()) &&
        detail.status !== "Closed" && detail.status !== "Archived" && (
          <EventCuratedStoryPicker eventId={detail.id} onAdded={onRefresh} />
        )}

      {summary && (
        <div className="ev-card">
          <div className="ev-card-head">
            <h3 className="display">Chỉ số hiệu quả &amp; Giữ chân</h3>
          </div>
          <div className="ev-kpi-grid">
            <div className="ev-kpi">
              <span>Creator nộp bài</span>
              <strong>
                {summary.creatorSubmissions} / {summary.creatorRegistrations}
              </strong>
            </div>
            {creatorCanVote(detail.scoringMode) && (
              <div className="ev-kpi">
                <span>Parent nộp bài</span>
                <strong>{summary.parentSubmissions ?? 0} / {summary.parentRegistrations}</strong>
              </div>
            )}
            <div className="ev-kpi">
              <span>Truyện trong Event</span>
              <strong>{summary.publishedEventStories}</strong>
            </div>
            <div className="ev-kpi">
              <span>Gia đình đạt điều kiện</span>
              <strong>
                {summary.parentVerifiedCount} / {summary.parentRegistrations}
              </strong>
            </div>
            <div className="ev-kpi">
              <span>Giải đã trao</span>
              <strong>
                {summary.awardsFulfilled} / {summary.awardsProposedOrApproved}
              </strong>
            </div>
            <div className="ev-kpi">
              <span>Giữ chân D+7 / D+30</span>
              <strong>
                {summary.retention7DayActiveUsers} / {summary.retention30DayActiveUsers}
              </strong>
            </div>
            {detail.format === "SharedCreatorParent" && (
              <>
                <div className="ev-kpi">
                  <span>Gia đình đọc ≥1 truyện</span>
                  <strong>{summary.familiesCompletedFirstRead ?? 0}</strong>
                </div>
                <div className="ev-kpi">
                  <span>Tỷ lệ đọc truyện thứ 2</span>
                  <strong>{Math.round((summary.secondStoryReturnRate ?? 0) * 100)}%</strong>
                </div>
                <div className="ev-kpi">
                  <span>Bài đạt ngưỡng phiếu</span>
                  <strong>{Math.round((summary.submissionsMeetingVoteThresholdRate ?? 0) * 100)}%</strong>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {(parentCanVote(detail.scoringMode) || creatorCanVote(detail.scoringMode) || (isActivityBased && Boolean(voteAct))) && (
        <div className="ev-card">
          <div className="ev-card-head">
            <h3 className="display">Quản lý phiếu bình chọn ({votes.length})</h3>
            <button
              type="button"
              className="btn btn-s"
              disabled={busy}
              onClick={reloadVotes}
            >
              Tải danh sách phiếu
            </button>
          </div>
          {votes.length > 0 && (
            <div className="ev-task-list">
              {votes.map((v) => (
                <div key={v.id} className="ev-task-row">
                  <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                    <b>Phiếu #{v.id} · Truyện #{v.storyId} · {v.voterTrackType ?? "Parent"} #{v.parentUserId}</b>
                    <span className="pill">{v.isDisqualified ? "Đã loại" : `${v.stars} ★`}</span>
                  </div>
                  {v.comment && <p className="sub" style={{ margin: 0 }}>{v.comment}</p>}
                  {v.isDisqualified ? (
                    <span className="sub">Lý do loại: {v.disqualifiedReason}</span>
                  ) : (
                    <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                      <input
                        className="inp grow"
                        placeholder="Lý do loại phiếu vi phạm..."
                        value={voteReasons[v.id] ?? ""}
                        onChange={(e) => setVoteReasons((prev) => ({ ...prev, [v.id]: e.target.value }))}
                      />
                      <button
                        type="button"
                        className="btn btn-no"
                        disabled={busy}
                        onClick={() =>
                          void runAction(
                            () => eventService.disqualifyVote(v.id, voteReasons[v.id]?.trim() || "Vi phạm thể lệ bình chọn."),
                            "Đã loại phiếu bình chọn.",
                            reloadVotes,
                          )
                        }
                      >
                        Loại phiếu
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {detail.awards.length > 0 && (
        <div className="ev-card">
          <div className="ev-card-head">
            <h3 className="display">Cơ cấu &amp; Trạng thái giải thưởng</h3>
            {(isAdmin || detail.canOperateEvent === true) && detail.awards.some((award) => award.status === "AwaitingClaim") && (
              <button type="button" className="btn btn-s" disabled={busy}
                onClick={() => void runAction(async () => {
                  const result = await eventService.resendAwardNotifications(detail.id);
                  if (result.success && result.data) {
                    const { sentCount, failedAwardIds } = result.data;
                    showToast("Đã gửi lại " + sentCount + " thông báo trúng giải." +
                      (failedAwardIds.length ? " Chưa gửi được cho suất #" + failedAwardIds.join(", #") + "." : ""),
                    failedAwardIds.length ? "warn" : "ok");
                  }
                  return result;
                }, "")}>
                Gửi lại thông báo trúng giải
              </button>
            )}
            <button
              type="button"
              className="btn btn-g"
              onClick={() => setAwardsExpanded((prev) => !prev)}
            >
              {awardsExpanded ? <ChevronUp className="ic" aria-hidden="true" /> : <ChevronDown className="ic" aria-hidden="true" />}
              {awardsExpanded ? "Thu gọn" : `Xem chi tiết (${detail.awards.length} suất)`}
            </button>
          </div>
          <EventAwardsTable awards={detail.awards} expanded={awardsExpanded} busy={busy} txCodes={txCodes}
            canViewRecipient={isAdmin || detail.canOperateEvent === true}
            onCodeChange={(id, value) => setTxCodes((prev) => ({ ...prev, [id]: value }))}
            onFulfill={(id) => void runAction(
              () => eventService.fulfillReward(id, { delivered: true, trackingOrBankTxCode: txCodes[id]?.trim() || "MANUAL-OK" }),
              "Đã xác nhận hoàn tất trao thưởng.",
            )} />
        </div>
      )}

      {appeals.length > 0 && (
        <div className="ev-card">
          <div className="ev-card-head">
            <h3 className="display">Đơn khiếu nại xác minh ({appeals.length})</h3>
          </div>
          <div className="ev-task-list">
            {appeals.map((ap) => (
              <div key={ap.id} className="ev-task-row">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <b>Hồ sơ #{ap.participationId}</b>
                  <span className="pill">{APPEAL_STATUS_LABEL[ap.status]}</span>
                </div>
                <p className="sub" style={{ margin: 0 }}>
                  {ap.reasonText}
                </p>
                {ap.status === "Open" && (
                  <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                    <input
                      aria-label={`Ghi chú xử lý khiếu nại #${ap.participationId}`}
                      className="inp grow"
                      placeholder="Ghi chú kết luận kiểm tra..."
                      value={appealNotes[ap.id] ?? ""}
                      onChange={(e) => setAppealNotes((prev) => ({ ...prev, [ap.id]: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="btn btn-ok"
                      disabled={busy}
                      onClick={() =>
                        void runAction(
                          () =>
                            eventService.decideAppeal(
                              ap.id,
                              "Accepted",
                              appealNotes[ap.id]?.trim() || "Đã đối chiếu dữ liệu hợp lệ.",
                            ),
                          "Đã chấp nhận khiếu nại.",
                        )
                      }
                    >
                      Chấp nhận
                    </button>
                    <button
                      type="button"
                      className="btn btn-no"
                      disabled={busy}
                      onClick={() =>
                        void runAction(
                          () =>
                            eventService.decideAppeal(
                              ap.id,
                              "Rejected",
                              appealNotes[ap.id]?.trim() || "Chưa đủ điều kiện theo thể lệ.",
                            ),
                          "Đã từ chối khiếu nại.",
                        )
                      }
                    >
                      Từ chối
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
