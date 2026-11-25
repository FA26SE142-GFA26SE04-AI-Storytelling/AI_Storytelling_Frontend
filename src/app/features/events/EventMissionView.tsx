"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Gift, Sparkles } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import ParentEventSubmission from "./ParentEventSubmission";
import { creatorCanVote, parentCanVote } from "@/app/types/event";
import { eventService } from "@/app/services/eventService";
import { showToast } from "@/app/lib/toast";
import {
  AWARD_STATUS_LABEL,
  COMPLETION_MODE_LABEL,
  PARTICIPATION_STATUS_LABEL,
  REWARD_TYPE_LABEL,
  VERIFIER_TYPE_LABEL,
  type EventAwardSlotDto,
  type EventDetailDto,
  type EventLeaderboardDto,
  type EventMissionDashboardDto,
} from "@/app/types/event";
import EventDetailInfoCard from "./EventDetailInfoCard";
import EventClaimFields from "./EventClaimFields";
import { buildClaimRequest, claimFieldsFor, rewardsForEvent, type ClaimRewardPayload } from "./eventRewards";
import { formatVnDateTime } from "./eventTime";

export type EventMissionViewProps = {
  detail: EventDetailDto;
  dashboard: EventMissionDashboardDto | null;
  myRewards: EventAwardSlotDto[];
  onRefresh: () => void;
  onOpenStory?: (storyId: number) => void;
};

/** Không gian tham gia & bảng nhiệm vụ động (1..N nhiệm vụ) cho Phụ huynh, kèm khiếu nại và nhận thưởng. */
export default function EventMissionView({
  detail,
  dashboard,
  myRewards,
  onRefresh,
  onOpenStory,
}: EventMissionViewProps) {
  const [busy, setBusy] = useState(false);
  const [pageTab, setPageTab] = useState<"info" | "participate">(dashboard ? "participate" : "info");
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [claimingAward, setClaimingAward] = useState<EventAwardSlotDto | null>(null);
  const [claimFields, setClaimFields] = useState<ClaimRewardPayload>({});
  const [taskStories, setTaskStories] = useState<Record<number, number>>({});
  const [voteStars, setVoteStars] = useState<Record<number, number>>({});
  const [voteComments, setVoteComments] = useState<Record<number, string>>({});
  const [leaderboard, setLeaderboard] = useState<EventLeaderboardDto | null>(null);
  const parentTrack = detail.tracks.find((track) => track.trackType === "Parent");
  const registrationMessage = () => {
    if (!parentTrack) return "Sự kiện này chưa có nhánh dành cho gia đình.";
    const now = Date.now();
    if (now < Date.parse(parentTrack.registrationStartAt))
      return `Đăng ký gia đình mở lúc ${formatVnDateTime(parentTrack.registrationStartAt)} (giờ Việt Nam).`;
    if (now > Date.parse(parentTrack.registrationEndAt))
      return `Đăng ký gia đình đã đóng lúc ${formatVnDateTime(parentTrack.registrationEndAt)} (giờ Việt Nam).`;
    return null;
  };
  const registrationNotice = registrationMessage();

  const loadLeaderboard = async () => {
    const res = await eventService.leaderboard(detail.id);
    if (res.success && res.data) setLeaderboard(res.data);
    else showToast(res.message || "Không tải được bảng xếp hạng.", "err");
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
      showToast("Đã lưu phiếu bình chọn của gia đình.", "ok");
      onRefresh();
    }
  };

  const registerParent = async () => {
    const blocked = registrationMessage();
    if (blocked || detail.status !== "Published") {
      showToast(blocked ?? "Sự kiện hiện đã đóng đăng ký.", "warn");
      return;
    }
    setBusy(true);
    const res = await eventService.register(detail.id, "Parent");
    setBusy(false);
    if (!res.success) {
      showToast(res.message || "Không đăng ký được sự kiện.", "err");
      return;
    }
    if (res.data?.safetyWarning) showToast(res.data.safetyWarning, "warn");
    else showToast("Đăng ký tham gia nhánh gia đình thành công.", "ok");
    setPageTab("participate");
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

  const submitAppeal = async () => {
    if (!dashboard || !appealReason.trim()) return;
    setBusy(true);
    const res = await eventService.createAppeal(detail.id, dashboard.participation.id, appealReason.trim());
    setBusy(false);
    if (!res.success) showToast(res.message || "Không gửi được khiếu nại.", "err");
    else {
      showToast("Đã gửi đơn khiếu nại tới Moderator.", "ok");
      setAppealOpen(false);
      setAppealReason("");
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
      const res = await eventService.claimReward(claimingAward.id, built.request);
      if (!res.success) showToast(res.message || "Không xác nhận nhận thưởng được.", "err");
      else {
        showToast("Đã xác nhận nhận thưởng thành công.", "ok");
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
      {dashboard && (
        <div className="ev-event-filters" role="tablist" aria-label="Chuyển trang sự kiện Gia đình">
          <button
            type="button"
            role="tab"
            aria-selected={pageTab === "info"}
            className={pageTab === "info" ? "on" : ""}
            onClick={() => setPageTab("info")}
          >
            Thông tin sự kiện
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={pageTab === "participate"}
            className={pageTab === "participate" ? "on" : ""}
            onClick={() => setPageTab("participate")}
          >
            Nhiệm vụ &amp; Phần thưởng
          </button>
        </div>
      )}

      {(!dashboard || pageTab === "info") && (
        <>
          {!dashboard && (
            <div className="ev-card ev-join-banner">
              <h3 className="display" style={{ margin: 0 }}>
                Tham gia cùng gia đình
              </h3>
              <p className="sub" style={{ margin: 0 }}>
                Đăng ký để mở bảng nhiệm vụ động ({detail.activeRule?.tasks.length ?? 0} nhiệm vụ) và tính gộp tiến độ
                đọc của các bé trong gia đình.
              </p>
              {detail.status === "Published" && (
                <button type="button" className="btn btn-gold" disabled={busy || Boolean(registrationNotice)} onClick={() => void registerParent()}>
                  <Sparkles className="ic" aria-hidden="true" />
                  Đăng ký tham gia sự kiện
                </button>
              )}
              {registrationNotice && <p className="sub" style={{ margin: 0 }}>{registrationNotice}</p>}
            </div>
          )}
          <EventDetailInfoCard detail={detail} />
        </>
      )}

      {dashboard && pageTab === "participate" && (
        <>
          {creatorCanVote(detail.scoringMode) && dashboard.participation.status !== "Disqualified" && (
            <ParentEventSubmission key={detail.id} event={detail} onRefresh={onRefresh} />
          )}
          <div className="ev-card">
            <div className="ev-card-head">
              <div>
                <h3 className="display">Tiến độ nhiệm vụ gia đình</h3>
                <span className="sub">{COMPLETION_MODE_LABEL[dashboard.completionMode]}</span>
              </div>
              <div className="row" style={{ gap: 8 }}>
                <span className="pill">{PARTICIPATION_STATUS_LABEL[dashboard.participation.status]}</span>
                {dashboard.participation.appealDeadlineAt && (
                  <span className="sub">Hạn khiếu nại {formatVnDateTime(dashboard.participation.appealDeadlineAt)}</span>
                )}
                {dashboard.participation.status === "VerificationFailed" &&
                  (!dashboard.participation.appealDeadlineAt || Date.parse(dashboard.participation.appealDeadlineAt) > Date.now()) && (
                  <button type="button" className="btn btn-s" onClick={() => setAppealOpen(true)}>
                    <AlertCircle className="ic" aria-hidden="true" />
                    Khiếu nại kết quả
                  </button>
                )}
              </div>
            </div>

            <div className="ev-kpi-grid">
              <div className="ev-kpi">
                <span>Nhiệm vụ hoàn thành</span>
                <strong>
                  {dashboard.completedTasksCount} / {dashboard.tasks.length}
                </strong>
              </div>
              <div className="ev-kpi">
                <span>Điểm tích lũy</span>
                <strong>{dashboard.earnedPoints} điểm</strong>
              </div>
              <div className="ev-kpi">
                <span>Trạng thái điều kiện</span>
                <strong>{dashboard.allRequirementsMet ? "Đạt yêu cầu" : "Đang thực hiện"}</strong>
              </div>
            </div>

            <div className="ev-task-list">
              {dashboard.tasks.map((task) => {
                const pct = Math.min(100, Math.round((task.currentValue / Math.max(1, task.targetValue)) * 100));
                const isSelfCheckin =
                  task.verifierType === "GuidedDiscussionCheckin" || task.verifierType === "RealLifePracticeCheckin";
                return (
                  <div key={task.taskDefinitionId} className={`ev-task-row${task.isCompleted ? " done" : ""}`}>
                    <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <b>
                          [{task.taskCode}] {task.title}
                        </b>
                        <div className="sub">
                          {VERIFIER_TYPE_LABEL[task.verifierType]} · {task.isMandatory ? "Bắt buộc" : "Tự chọn"} ·{" "}
                          {task.points} điểm
                        </div>
                      </div>
                      <div className="row" style={{ gap: 8 }}>
                        <span className="pill">
                          {task.currentValue}/{task.targetValue}
                        </span>
                        {task.isCompleted ? (
                          <CheckCircle2 className="ic" style={{ color: "var(--ok-ink)" }} aria-label="Đã hoàn thành" />
                        ) : (
                          isSelfCheckin && (
                            <>
                            <select className="inp" aria-label={`Truyện cho nhiệm vụ ${task.title}`}
                              value={taskStories[task.taskDefinitionId] ?? 0}
                              onChange={(e) => setTaskStories((previous) => ({ ...previous, [task.taskDefinitionId]: Number(e.target.value) }))}>
                              <option value={0}>Chọn truyện đã thực hiện</option>
                              {dashboard.stories.map((story) => <option key={story.storyId} value={story.storyId}>{story.title}</option>)}
                            </select>
                            <button
                              type="button"
                              className="btn btn-p"
                              disabled={busy || !taskStories[task.taskDefinitionId]}
                              onClick={() => void checkInTask(task.taskDefinitionId)}
                            >
                              Xác nhận hoàn thành
                            </button>
                            </>
                          )
                        )}
                      </div>
                    </div>
                    <div className="ev-progress-track" aria-hidden="true">
                      <div className="ev-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ev-card">
            <div className="ev-card-head">
              <h3 className="display">Kho truyện của sự kiện ({dashboard.stories.length})</h3>
            </div>
            {dashboard.stories.length === 0 ? (
              <p className="sub" style={{ margin: 0 }}>
                Chưa có truyện xuất bản trong sự kiện này.
              </p>
            ) : (
              <div className="ev-grid-2">
                {dashboard.stories.map((st) => (
                  <div key={st.storyId} className="ev-task-row">
                    <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                      <b>{st.title}</b>
                      {onOpenStory && (
                        <button type="button" className="btn btn-p" onClick={() => onOpenStory(st.storyId)}>
                          Đọc truyện
                        </button>
                      )}
                    </div>
                    <span className="sub">
                      {st.genre} · {st.ageBand} tuổi {st.hasFamilyRead ? "· Bé đã đọc xong" : "· Gia đình chưa đọc"}
                    </span>
                    <p className="sub" style={{ margin: 0 }}>
                      {st.description}
                    </p>
                    {parentCanVote(detail.scoringMode) && (
                      <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                        <select
                          className="inp"
                          aria-label={`Chấm sao cho ${st.title}`}
                          disabled={busy || !st.hasFamilyRead}
                          value={voteStars[st.storyId] ?? st.myVoteStars ?? 5}
                          onChange={(e) => setVoteStars((prev) => ({ ...prev, [st.storyId]: Number(e.target.value) }))}
                        >
                          {[5, 4, 3, 2, 1].map((s) => (
                            <option key={s} value={s}>{s} sao</option>
                          ))}
                        </select>
                        <input
                          className="inp grow"
                          placeholder={st.hasFamilyRead ? "Nhận xét cho truyện (tùy chọn)..." : "Bé cần đọc xong bản dự thi để mở bình chọn"}
                          disabled={busy || !st.hasFamilyRead}
                          value={voteComments[st.storyId] ?? st.myVoteComment ?? ""}
                          onChange={(e) => setVoteComments((prev) => ({ ...prev, [st.storyId]: e.target.value }))}
                        />
                        <button
                          type="button"
                          className="btn btn-gold"
                          disabled={busy || !st.hasFamilyRead}
                          onClick={() => void castVote(st.storyId, st.myVoteStars)}
                        >
                          {st.myVoteStars ? "Cập nhật phiếu" : "Gửi bình chọn"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {(parentCanVote(detail.scoringMode) || creatorCanVote(detail.scoringMode)) && (
            <div className="ev-card">
              <div className="ev-card-head">
                <h3 className="display">Bảng xếp hạng sự kiện</h3>
                <button type="button" className="btn btn-s" disabled={busy} onClick={() => void loadLeaderboard()}>
                  Xem kết quả
                </button>
              </div>
              {leaderboard && (
                leaderboard.hidden ? (
                  <p className="sub" style={{ margin: 0 }}>Điểm và thứ hạng được ẩn trong suốt vòng bình chọn.</p>
                ) : leaderboard.entries.length === 0 ? (
                  <p className="sub" style={{ margin: 0 }}>Chưa có bài dự thi đạt ngưỡng phiếu tối thiểu ({leaderboard.minVotesPerSubmission} phiếu).</p>
                ) : (
                  <div className="ev-task-list">
                    {leaderboard.entries.map((entry) => (
                      <div key={entry.submissionId} className="ev-task-row">
                        <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                          <b>{entry.rank > 0 ? `#${entry.rank}` : "Chưa đủ ngưỡng"} · {entry.storyTitle} · {entry.authorTrackType === "Parent" ? "Parent" : "Creator"}</b>
                          <span className="pill">{entry.averageStars} ★ ({entry.validVoteCount} phiếu)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          )}
        </>
      )}

      {eventRewards.length > 0 && (
        <div className="ev-card">
          <div className="ev-card-head">
            <h3 className="display">Phần thưởng của tôi</h3>
          </div>
          {eventRewards.map((aw) => (
            <div key={aw.id} className="row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <span>
                <Gift className="ic" style={{ display: "inline", marginRight: 6 }} aria-hidden="true" />
                <b>{aw.rankOrTier}</b> · {aw.rewardName} ({REWARD_TYPE_LABEL[aw.rewardType]})
              </span>
              <div className="row" style={{ gap: 8 }}>
                <span className="pill">{AWARD_STATUS_LABEL[aw.status]}</span>
                {aw.status === "AwaitingClaim" && (
                  <button type="button" className="btn btn-gold" disabled={busy} onClick={() => openClaim(aw)}>
                    Nhận thưởng
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {appealOpen && (
        <Dialog title="Khiếu nại kết quả xác minh" onClose={() => setAppealOpen(false)}>
          <textarea
            className="inp"
            rows={4}
            value={appealReason}
            onChange={(e) => setAppealReason(e.target.value)}
            placeholder="Mô tả lý do hoặc bằng chứng bổ sung để Moderator rà soát..."
          />
          <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
            <button type="button" className="btn btn-g" onClick={() => setAppealOpen(false)}>
              Hủy
            </button>
            <button type="button" className="btn btn-p" disabled={busy || !appealReason.trim()} onClick={() => void submitAppeal()}>
              Gửi khiếu nại
            </button>
          </div>
        </Dialog>
      )}

      {claimingAward && (
        <Dialog title={`Nhận thưởng: ${claimingAward.rewardName}`} onClose={() => { setClaimingAward(null); setClaimFields({}); }}>
          {claimFieldsFor(claimingAward.rewardType).length > 0 ? (
            <EventClaimFields rewardType={claimingAward.rewardType} fields={claimFields}
              onChange={(field, value) => setClaimFields((current) => ({ ...current, [field]: value }))} />
          ) : (
            <p className="sub">Xác nhận nhận {REWARD_TYPE_LABEL[claimingAward.rewardType]} vào tài khoản của bạn.</p>
          )}
          <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
            <button type="button" className="btn btn-g" onClick={() => { setClaimingAward(null); setClaimFields({}); }}>
              Hủy
            </button>
            <button type="button" className="btn btn-gold" disabled={busy} onClick={() => void submitClaim()}>
              Xác nhận nhận thưởng
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
