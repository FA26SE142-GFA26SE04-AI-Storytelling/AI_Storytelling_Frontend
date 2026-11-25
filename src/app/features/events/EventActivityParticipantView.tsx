"use client";

import { useEffect, useState } from "react";
import { BookOpenCheck, Gift, Sparkles } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import { useAuth } from "@/app/context/AuthContext";
import { showToast } from "@/app/lib/toast";
import { creatorService } from "@/app/services/creatorService";
import { eventService } from "@/app/services/eventService";
import { parentAuthoringService } from "@/app/services/parentAuthoringService";
import { storyService } from "@/app/services/storyService";
import {
  AWARD_STATUS_LABEL,
  COMPLETION_MODE_LABEL,
  EVENT_ACTIVITY_LABEL,
  EVENT_AUDIENCE_LABEL,
  PARTICIPATION_STATUS_LABEL,
  REWARD_TYPE_LABEL,
  SUBMISSION_STATUS_LABEL,
  VERIFIER_TYPE_LABEL,
  type EventActivityDto,
  type EventActivityUserStateDto,
  type EventAwardSlotDto,
  type EventDetailDto,
  type EventLeaderboardDto,
  type EventMissionDashboardDto,
  type EventSubmissionDto,
} from "@/app/types/event";
import EventDetailInfoCard from "./EventDetailInfoCard";
import EventClaimFields from "./EventClaimFields";
import { buildClaimRequest, claimFieldsFor, rewardsForEvent, type ClaimRewardPayload } from "./eventRewards";
import { formatVnDateTime } from "./eventTime";

const LIFECYCLE_LABEL: Record<"NotOpen" | "Open" | "Ended", string> = {
  NotOpen: "Chưa mở",
  Open: "Đang mở",
  Ended: "Đã kết thúc",
};

export type EventActivityParticipantViewProps = {
  detail: EventDetailDto;
  dashboard: EventMissionDashboardDto | null;
  myRewards: EventAwardSlotDto[];
  onRefresh: () => void;
  onOpenStory?: (storyId: number) => void;
};

/** Giao diện tham gia sự kiện theo hoạt động (V2) cho Parent và Creator. */
/** Truyện còn nộp được: bỏ truyện có bài đang chờ duyệt, đã duyệt hoặc đã chốt bản (API từ chối nộp lại). */
export const submittableStories = <T extends { id: number }>(stories: T[], submissions: EventSubmissionDto[]) =>
  stories.filter((story) => !submissions.some((s) => s.storyId === story.id &&
    (s.status === "PendingReview" || s.status === "Approved" || s.lockedStoryVersionId != null)));

export default function EventActivityParticipantView({
  detail,
  dashboard,
  myRewards,
  onRefresh,
  onOpenStory,
}: EventActivityParticipantViewProps) {
  const { user } = useAuth();
  const userId = Number(user?.id);
  const role = user?.role ?? "User";
  const isCreator = role === "ContentCreator";

  const [busy, setBusy] = useState(false);
  const [readyStories, setReadyStories] = useState<Array<{ id: number; title: string }>>([]);
  const [selectedStoryId, setSelectedStoryId] = useState<number>(0);
  const [consentSharing, setConsentSharing] = useState(false);
  const [mySubmissions, setMySubmissions] = useState<EventSubmissionDto[]>([]);
  const [taskStories, setTaskStories] = useState<Record<number, number>>({});
  const [voteStars, setVoteStars] = useState<Record<number, number>>({});
  const [voteComments, setVoteComments] = useState<Record<number, string>>({});
  const [leaderboard, setLeaderboard] = useState<EventLeaderboardDto | null>(null);
  const [claimingAward, setClaimingAward] = useState<EventAwardSlotDto | null>(null);
  const [claimFields, setClaimFields] = useState<ClaimRewardPayload>({});
  const [appealing, setAppealing] = useState<EventActivityUserStateDto | null>(null);
  const [appealReason, setAppealReason] = useState("");

  const activities = detail.activities ?? [];
  const states = (detail.myActivityStates ?? []).filter((s) => s.isEligible);
  const activityById = new Map<number, EventActivityDto>(activities.map((a) => [a.id, a]));
  const subState = states.find((s) => s.activityType === "Submission");
  const submissionActivityId = subState?.activityId;
  const registeredForSubmission = subState?.isRegistered;
  const subSubmissionsCount = subState?.submissionsCount;
  const readState = states.find((s) => s.activityType === "ReadingMissions");
  const voteState = states.find((s) => s.activityType === "Voting");
  const subActivity = subState ? activityById.get(subState.activityId) : undefined;
  const voteActivity = voteState ? activityById.get(voteState.activityId) : undefined;

  const storyChoices = submittableStories(readyStories, mySubmissions);
  const chosenStoryId = storyChoices.some((s) => s.id === selectedStoryId) ? selectedStoryId : 0;

  const submitAppeal = async () => {
    if (!appealing?.participationId || !appealReason.trim()) return;
    setBusy(true);
    const result = await eventService.createAppeal(detail.id, appealing.participationId, appealReason.trim());
    setBusy(false);
    if (!result.success) {
      showToast(result.message || "Không gửi được đơn khiếu nại.", "err");
      return;
    }
    showToast("Đã gửi đơn khiếu nại.", "ok");
    setAppealing(null);
    onRefresh();
  };

  useEffect(() => {
    let active = true;
    if (!submissionActivityId) return;
    const loadStoriesPromise = isCreator
      ? creatorService.list(1, 100).then((res) =>
          (res.data?.items ?? [])
            .filter((s) => s.status?.toLowerCase() === "ready")
            .map((s) => ({ id: s.storyId, title: s.title || `Truyện #${s.storyId}` })),
        )
      : Promise.all([
          storyService.getStories({ authorUserId: userId || undefined, pageIndex: 1, pageSize: 100, isDescending: true }),
          parentAuthoringService.mine(1, 100),
        ]).then(([sr, mr]) => {
          const all = [
            ...(sr.data?.items ?? []).map((s) => ({ id: s.id, title: s.title || `Truyện #${s.id}`, status: s.status })),
            ...(mr.data?.items ?? []).map((s) => ({ id: s.storyId, title: s.title || `Truyện #${s.storyId}`, status: s.status })),
          ].filter((s) => s.status.toLowerCase() === "ready");
          return [...new Map(all.map((s) => [s.id, { id: s.id, title: s.title }])).values()];
        });

    void Promise.all([loadStoriesPromise, eventService.mySubmissions(detail.id)]).then(([stories, subsRes]) => {
      if (!active) return;
      setReadyStories(stories);
      if (stories.length > 0) setSelectedStoryId((cur) => (stories.some((s) => s.id === cur) ? cur : stories[0].id));
      if (subsRes.success) setMySubmissions(subsRes.data ?? []);
    });
    return () => { active = false; };
  }, [detail.id, submissionActivityId, registeredForSubmission, subSubmissionsCount, isCreator, userId]);

  const registerActivity = async (st: EventActivityUserStateDto) => {
    setBusy(true);
    const res = await eventService.register(detail.id, { activityType: st.activityType, eventActivityId: st.activityId });
    setBusy(false);
    if (!res.success) {
      showToast(res.message || "Không đăng ký được hoạt động.", "err");
      return;
    }
    if (res.data?.safetyWarning) showToast(res.data.safetyWarning, "warn");
    else showToast(`Đã đăng ký hoạt động ${EVENT_ACTIVITY_LABEL[st.activityType]}.`, "ok");
    onRefresh();
  };

  const submitStory = async () => {
    if (!chosenStoryId) return;
    setBusy(true);
    const res = await eventService.submitActivityStory(detail.id, chosenStoryId, isCreator ? true : consentSharing);
    setBusy(false);
    if (!res.success || !res.data) {
      showToast(res.message || "Không nộp được bài dự thi.", "err");
      return;
    }
    const created = res.data;
    setMySubmissions((prev) => [created, ...prev.filter((item) => item.id !== created.id)]);
    showToast("Đã nộp truyện dự thi.", "ok");
    onRefresh();
  };

  const checkInTask = async (taskDefinitionId: number) => {
    const storyId = taskStories[taskDefinitionId];
    if (!storyId) return;
    setBusy(true);
    const res = await eventService.completeTask(detail.id, taskDefinitionId, {
      storyId,
      selfDeclaredPayloadJson: JSON.stringify({ confirmedAt: new Date().toISOString() }),
    });
    setBusy(false);
    if (!res.success) showToast(res.message || "Chưa ghi nhận được nhiệm vụ.", "err");
    else {
      showToast("Đã cập nhật tiến độ nhiệm vụ.", "ok");
      onRefresh();
    }
  };

  const castVote = async (storyId: number, fallbackStars?: number | null) => {
    const stars = voteStars[storyId] ?? fallbackStars ?? 5;
    setBusy(true);
    const res = await eventService.castVote(detail.id, {
      storyId,
      stars,
      comment: voteComments[storyId]?.trim() || undefined,
    });
    setBusy(false);
    if (!res.success) showToast(res.message || "Chưa ghi nhận được phiếu bình chọn.", "err");
    else {
      showToast("Đã lưu phiếu bình chọn.", "ok");
      onRefresh();
    }
  };

  const eventRewards = rewardsForEvent(myRewards, detail);

  const openClaim = (award: EventAwardSlotDto) => {
    setClaimFields({});
    setClaimingAward(award);
  };

  const submitClaim = async () => {
    if (!claimingAward || busy) return;
    const built = buildClaimRequest(claimingAward.rewardType, claimFields);
    if ("error" in built) {
      showToast(built.error, "err");
      return;
    }
    setBusy(true);
    try {
      const r = await eventService.claimReward(claimingAward.id, built.request);
      if (!r.success) showToast(r.message || "Không xác nhận nhận thưởng được.", "err");
      else {
        showToast("Đã xác nhận nhận thưởng.", "ok");
        setClaimingAward(null);
        setClaimFields({});
        onRefresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sec ev-participant-flow">
      <div className="ev-card">
        <div className="ev-card-head">
          <h3 className="display">Hoạt động bạn đủ điều kiện tham gia ({states.length})</h3>
        </div>
        {states.length === 0 ? (
          <p className="sub">Sự kiện chưa có hoạt động phù hợp với vai trò tài khoản của bạn.</p>
        ) : (
          <div className="ev-task-list">
            {states.map((st) => {
              const act = activityById.get(st.activityId);
              return (
                <div key={st.activityId} className="ev-task-row">
                  <div className="row" style={{ justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <b>{EVENT_ACTIVITY_LABEL[st.activityType]} · {EVENT_AUDIENCE_LABEL[st.allowedAudience]}</b>
                    <div className="row" style={{ gap: 6 }}>
                      <span className="pill">{LIFECYCLE_LABEL[st.lifecycleStatus]}</span>
                      {st.isRegistered && st.participationStatus && (
                        <span className="pill">{PARTICIPATION_STATUS_LABEL[st.participationStatus]}</span>
                      )}
                    </div>
                  </div>
                  {act && (
                    <span className="sub">
                      Đăng ký: {formatVnDateTime(act.registrationStartAt)} → {formatVnDateTime(act.registrationEndAt)} · Thực hiện:{" "}
                      {formatVnDateTime(act.startAt)} → {formatVnDateTime(act.endAt)}
                      {act.activityType === "Submission" && act.grantAiCredits > 0 ? ` · Tặng +${act.grantAiCredits} AI Credits` : ""}
                    </span>
                  )}
                  {!st.isRegistered && st.canRegister && (
                    <button type="button" className="btn btn-gold" disabled={busy} onClick={() => void registerActivity(st)}>
                      <Sparkles className="ic" aria-hidden="true" />
                      Chấp nhận thể lệ &amp; Đăng ký
                    </button>
                  )}
                  {detail.status === "Published" && !detail.resultsFinalizedAt && st.participationId &&
                    st.participationStatus === "VerificationFailed" &&
                    (!st.appealDeadlineAt || Date.parse(st.appealDeadlineAt) > Date.now()) && (
                      <button type="button" className="btn btn-s" disabled={busy} onClick={() => {
                        setAppealReason("");
                        setAppealing(st);
                      }}>
                        Khiếu nại kết quả
                      </button>
                    )}
                  {st.appealDeadlineAt && <span className="sub">Hạn khiếu nại {formatVnDateTime(st.appealDeadlineAt)}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {subState?.isRegistered && subActivity && (
        <div className="ev-card">
          <div className="ev-card-head">
            <h3 className="display">Sáng tác &amp; Nộp bài</h3>
            <span className="pill">
              Đã nộp {subState.submissionsCount}
              {subActivity.maxSubmissionsPerUser ? ` / ${subActivity.maxSubmissionsPerUser} bài` : " bài (Không giới hạn)"}
            </span>
          </div>
          {subActivity.grantAiCredits > 0 && (
            <p className="sub" style={{ margin: 0 }}>
              Tài khoản đã được cấp <b>{subActivity.grantAiCredits} AI Credits</b> (dùng cho truyện gắn sự kiện trước hạn{" "}
              {formatVnDateTime(subActivity.endAt)}).
            </p>
          )}
          {subState.canSubmit && (
            <div className="sec" style={{ gap: 8 }}>
              <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                {isCreator && (
                  <a className="btn btn-s" href={`/staff/create-ai?eventId=${detail.id}`}>
                    <Sparkles className="ic" aria-hidden="true" />
                    Tạo truyện AI cho sự kiện
                  </a>
                )}
                <select className="inp" style={{ flex: 1, minWidth: 220 }} value={chosenStoryId}
                  onChange={(e) => setSelectedStoryId(Number(e.target.value))}>
                  <option value={0}>
                    {readyStories.length === 0 ? "-- Chưa có truyện sẵn sàng --"
                      : storyChoices.length === 0 ? "-- Các truyện sẵn sàng đều đã nộp --" : "-- Chọn truyện để nộp --"}
                  </option>
                  {storyChoices.map((st) => <option key={st.id} value={st.id}>#{st.id} · {st.title}</option>)}
                </select>
                <button type="button" className="btn btn-p" disabled={busy || !chosenStoryId || (!isCreator && !consentSharing)}
                  onClick={() => void submitStory()}>
                  <BookOpenCheck className="ic" aria-hidden="true" />
                  Nộp truyện dự thi
                </button>
              </div>
              {!isCreator && (
                <label className="row" style={{ gap: 6 }}>
                  <input type="checkbox" checked={consentSharing} onChange={(e) => setConsentSharing(e.target.checked)} />
                  <span className="sub">Tôi đồng ý chia sẻ bản văn dự thi theo thể lệ sự kiện.</span>
                </label>
              )}
            </div>
          )}
          <div className="ev-task-list">
            <b>Bài của tôi ({mySubmissions.length})</b>
            {mySubmissions.length === 0 ? (
              <p className="sub" style={{ margin: 0 }}>Bạn chưa nộp bài nào.</p>
            ) : (
              mySubmissions.map((s) => (
                <div key={s.id} className="ev-task-row">
                  <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                    <b>Bài #{s.id} · {s.submittedTitle || readyStories.find((st) => st.id === s.storyId)?.title || `Truyện #${s.storyId}`}</b>
                    <span className="pill">{SUBMISSION_STATUS_LABEL[s.status] ?? s.status}</span>
                  </div>
                  <span className="sub">
                    Phiên bản #{s.currentStoryVersionId} · Nộp lúc {formatVnDateTime(s.submittedAt)}
                    {s.averageScore != null ? ` · Điểm chấm: ${s.averageScore}/100` : ""}
                    {s.averageStars != null ? ` · Bình chọn: ${s.averageStars} ★ (${s.validVoteCount} phiếu)` : ""}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {readState?.isRegistered && dashboard && (
        <div className="ev-card">
          <div className="ev-card-head">
            <h3 className="display">Nhiệm vụ đọc truyện ({dashboard.completedTasksCount}/{dashboard.tasks.length})</h3>
            <span className="pill">{dashboard.allRequirementsMet ? "Đã đạt" : COMPLETION_MODE_LABEL[dashboard.completionMode]}</span>
          </div>
          <div className="ev-task-list">
            {dashboard.tasks.map((t) => (
              <div key={t.taskDefinitionId} className="ev-task-row">
                <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                  <b>{t.taskCode} · {t.title} {t.isMandatory ? "(Bắt buộc)" : ""}</b>
                  <span className="pill">{t.currentValue}/{t.targetValue} {t.isCompleted ? "✓" : ""}</span>
                </div>
                <span className="sub">{VERIFIER_TYPE_LABEL[t.verifierType]} · +{t.points} điểm</span>
                {(t.verifierType === "GuidedDiscussionCheckin" || t.verifierType === "RealLifePracticeCheckin") && !t.isCompleted && (
                  <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                    <select className="inp" value={taskStories[t.taskDefinitionId] ?? 0}
                      onChange={(e) => setTaskStories((p) => ({ ...p, [t.taskDefinitionId]: Number(e.target.value) }))}>
                      <option value={0}>-- Chọn truyện đã đọc --</option>
                      {dashboard.stories.map((st) => <option key={st.storyId} value={st.storyId}>{st.title}</option>)}
                    </select>
                    <button type="button" className="btn btn-s" disabled={busy || !taskStories[t.taskDefinitionId]}
                      onClick={() => void checkInTask(t.taskDefinitionId)}>
                      Xác nhận thực hiện
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {(readState?.isRegistered || voteState?.isRegistered) && dashboard && (
        <div className="ev-card">
          <div className="ev-card-head">
            <h3 className="display">Truyện trong sự kiện</h3>
            {voteActivity && (
              <button type="button" className="btn btn-s" disabled={busy}
                onClick={() => void eventService.leaderboard(detail.id).then((r) => {
                  if (r.success && r.data) setLeaderboard(r.data);
                  else showToast(r.message || "Không tải được bảng xếp hạng.", "err");
                })}>
                Xem bảng xếp hạng
              </button>
            )}
          </div>
          {leaderboard && (
            leaderboard.hidden ? (
              <p className="sub">Điểm và bảng xếp hạng được ẩn cho đến khi đóng kỳ bình chọn.</p>
            ) : (
              <div className="ev-task-list">
                <p className="sub" style={{ margin: 0 }}>
                  Có {leaderboard.entries.filter((e) => e.meetsThreshold).length} bài đạt ngưỡng ({leaderboard.minVotesPerSubmission} phiếu).
                </p>
                {[...leaderboard.entries]
                  .sort((a, b) => (a.rank || Number.MAX_SAFE_INTEGER) - (b.rank || Number.MAX_SAFE_INTEGER))
                  .map((entry) => (
                    <div key={entry.submissionId} className="ev-task-row">
                      <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                        <b>{entry.rank > 0 ? `#${entry.rank}` : "Chưa đủ ngưỡng"} · {entry.storyTitle}</b>
                        <span className="pill">{entry.averageStars} sao · {entry.validVoteCount} phiếu</span>
                      </div>
                    </div>
                  ))}
              </div>
            )
          )}
          {[
            ...(readState?.isRegistered ? [{ title: "Kho truyện đọc", stories: dashboard.stories, voting: false }] : []),
            ...(voteState?.isRegistered ? [{
              title: "Truyện dự thi để bình chọn",
              stories: dashboard.votingStories ?? (readState?.isRegistered ? [] : dashboard.stories),
              voting: true,
            }] : []),
          ].map(({ title, stories, voting }) => (
          <div className="ev-task-list" key={title}>
            <h4>{title}</h4>
            {stories.length === 0 && <p className="sub">{voting ? "Chưa có bài dự thi đủ điều kiện bình chọn." : "Chưa có truyện trong kho đọc."}</p>}
            {stories.map((st) => (
              <div key={st.storyId} className="ev-task-row">
                <div className="row" style={{ justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <b>{st.title} ({st.ageBand})</b>
                  <div className="row" style={{ gap: 6 }}>
                    <span className="pill">{st.hasFamilyRead ? "Bé đã đọc xong" : "Chưa đọc"}</span>
                    {onOpenStory && (
                      <button type="button" className="btn btn-s" onClick={() => onOpenStory(st.storyId)}>Mở đọc</button>
                    )}
                  </div>
                </div>
                {voting && voteState?.canVote && st.hasFamilyRead && st.source === "CreatorSubmission" && (
                  <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <select className="inp" style={{ width: 110 }} value={voteStars[st.storyId] ?? st.myVoteStars ?? 5}
                      onChange={(e) => setVoteStars((p) => ({ ...p, [st.storyId]: Number(e.target.value) }))}>
                      {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} sao</option>)}
                    </select>
                    <input className="inp grow" placeholder="Nhận xét về truyện..." value={voteComments[st.storyId] ?? st.myVoteComment ?? ""}
                      onChange={(e) => setVoteComments((p) => ({ ...p, [st.storyId]: e.target.value }))} />
                    <button type="button" className="btn btn-p" disabled={busy} onClick={() => void castVote(st.storyId, st.myVoteStars)}>
                      {st.myVoteStars ? "Cập nhật phiếu" : "Gửi bình chọn"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
          ))}
        </div>
      )}

      {eventRewards.length > 0 && (
        <div className="ev-card">
          <div className="ev-card-head">
            <h3 className="display">Phần thưởng của bạn</h3>
          </div>
          {eventRewards.map((aw) => (
            <div key={aw.id} className="ev-task-row">
              <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                <b>{aw.rankOrTier} · {aw.rewardName} ({REWARD_TYPE_LABEL[aw.rewardType]})</b>
                <span className="pill">{AWARD_STATUS_LABEL[aw.status]}</span>
              </div>
              {aw.status === "AwaitingClaim" && (
                <button type="button" className="btn btn-gold" disabled={busy} onClick={() => openClaim(aw)}>
                  <Gift className="ic" aria-hidden="true" /> Xác nhận nhận thưởng
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <EventDetailInfoCard detail={detail} />

      {appealing && (
        <Dialog title={`Khiếu nại · ${EVENT_ACTIVITY_LABEL[appealing.activityType]}`} onClose={() => setAppealing(null)}>
          <label className="ev-field">
            <span>Lý do khiếu nại</span>
            <textarea className="inp" rows={4} value={appealReason} onChange={(e) => setAppealReason(e.target.value)} />
          </label>
          <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
            <button type="button" className="btn btn-g" onClick={() => setAppealing(null)}>Hủy</button>
            <button type="button" className="btn btn-p" disabled={busy || !appealReason.trim()} onClick={() => void submitAppeal()}>
              Gửi khiếu nại
            </button>
          </div>
        </Dialog>
      )}

      {claimingAward && (
        <Dialog title={`Nhận thưởng: ${claimingAward.rankOrTier}`} onClose={() => { setClaimingAward(null); setClaimFields({}); }}>
          {claimFieldsFor(claimingAward.rewardType).length === 0 ? (
            <div className="sec" style={{ gap: 10 }}>
              <p className="sub">
                Xác nhận nhận{" "}
                {claimingAward.rewardType === "PlatformCredits"
                  ? `${claimingAward.creditGrantAmount} Credits`
                  : REWARD_TYPE_LABEL[claimingAward.rewardType]}{" "}
                vào tài khoản của bạn.
              </p>
              <button type="button" className="btn btn-p" disabled={busy} onClick={() => void submitClaim()}>
                Xác nhận
              </button>
            </div>
          ) : (
            <div className="sec" style={{ gap: 10 }}>
              <EventClaimFields rewardType={claimingAward.rewardType} fields={claimFields}
                onChange={(field, value) => setClaimFields((current) => ({ ...current, [field]: value }))} />
              <button type="button" className="btn btn-p" disabled={busy} onClick={() => void submitClaim()}>
                Xác nhận
              </button>
            </div>
          )}
        </Dialog>
      )}
    </div>
  );
}
