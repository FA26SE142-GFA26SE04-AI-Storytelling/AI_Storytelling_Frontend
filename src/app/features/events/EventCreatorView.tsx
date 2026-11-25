"use client";

import { useEffect, useState } from "react";
import { BookOpenCheck, Gift, Sparkles } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import { eventService } from "@/app/services/eventService";
import CreatorEventBallot from "./CreatorEventBallot";
import { creatorCanVote, parentCanVote } from "@/app/types/event";
import { creatorService } from "@/app/services/creatorService";
import { showToast } from "@/app/lib/toast";
import type { CreatorDraft } from "@/app/types/creator";
import {
  AWARD_STATUS_LABEL,
  PARTICIPATION_STATUS_LABEL,
  REWARD_TYPE_LABEL,
  SUBMISSION_STATUS_LABEL,
  type EventAwardSlotDto,
  type EventDetailDto,
  type EventLeaderboardDto,
  type EventParticipationDto,
  type EventSubmissionDto,
} from "@/app/types/event";
import EventDetailInfoCard from "./EventDetailInfoCard";
import CreatorGoalAndStoryCard from "./CreatorGoalAndStoryCard";
import EventClaimFields from "./EventClaimFields";
import { buildClaimRequest, claimFieldsFor, rewardsForEvent, type ClaimRewardPayload } from "./eventRewards";
import { formatVnDate, formatVnDateTime } from "./eventTime";

export type EventCreatorViewProps = {
  detail: EventDetailDto;
  myRewards: EventAwardSlotDto[];
  onRefresh: () => void;
  initialParticipation?: EventParticipationDto | null;
};

/** Không gian tham gia nhánh sáng tác (Creator Track): đăng ký trước, sau đó mở trang nộp bài & theo dõi thông số. */
export default function EventCreatorView({
  detail,
  myRewards,
  onRefresh,
  initialParticipation = null,
}: EventCreatorViewProps) {
  const [busy, setBusy] = useState(false);
  const [pageTab, setPageTab] = useState<"info" | "participate">(initialParticipation ? "participate" : "info");
  const [myStories, setMyStories] = useState<CreatorDraft[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState<number>(0);
  const [participation, setParticipation] = useState<EventParticipationDto | null>(initialParticipation);
  const [submission, setSubmission] = useState<EventSubmissionDto | null>(null);
  const [claimingAward, setClaimingAward] = useState<EventAwardSlotDto | null>(null);
  const [claimFields, setClaimFields] = useState<ClaimRewardPayload>({});
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [leaderboard, setLeaderboard] = useState<EventLeaderboardDto | null>(null);
  const creatorTrack = detail.tracks.find((t) => t.trackType === "Creator");
  const eligibleStories = myStories;
  const eventRewards = rewardsForEvent(myRewards, detail);

  const closeAppeal = () => {
    setAppealOpen(false);
    setAppealReason("");
  };

  const submitAppeal = async () => {
    if (!participation || !appealReason.trim() || busy) return;
    setBusy(true);
    try {
      const result = await eventService.createAppeal(detail.id, participation.id, appealReason.trim());
      if (!result.success) {
        showToast(result.message || "Không gửi được đơn khiếu nại.", "err");
        return;
      }
      closeAppeal();
      showToast("Đã gửi đơn khiếu nại.", "ok");
      onRefresh();
    } finally {
      setBusy(false);
    }
  };

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
      if (res.success) {
        showToast("Đã xác nhận nhận giải thưởng.", "ok");
        setClaimingAward(null);
        setClaimFields({});
        onRefresh();
      } else {
        showToast(res.message || "Không nhận được giải.", "err");
      }
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    let active = true;
    void Promise.all([
      creatorService.list(1, 100),
      eventService.myParticipation(detail.id, "Creator"),
      eventService.mySubmission(detail.id),
    ]).then(([storiesRes, partRes, subRes]) => {
      if (!active) return;
      if (storiesRes.ok) {
        const items = (storiesRes.data?.items ?? []).filter((story) => story.status?.toLowerCase() === "ready");
        setMyStories(items);
        if (items.length > 0) setSelectedStoryId(items[0].storyId);
      }
      if (partRes.success && !initialParticipation) {
        const nextPart = partRes.data ?? null;
        setParticipation(nextPart);
        if (nextPart) setPageTab("participate");
      }
      if (subRes.success) setSubmission(subRes.data ?? null);
    });
    return () => {
      active = false;
    };
  }, [detail.id, initialParticipation]);

  const registerCreator = async () => {
    setBusy(true);
    const res = await eventService.register(detail.id, "Creator");
    setBusy(false);
    if (!res.success || !res.data) showToast(res.message || "Không đăng ký được nhánh sáng tác.", "err");
    else {
      setParticipation(res.data);
      setPageTab("participate");
      showToast("Đăng ký nhánh Creator thành công! Bạn đã có thể nộp truyện dự thi.", "ok");
      onRefresh();
    }
  };

  const submitStory = async () => {
    if (!selectedStoryId) return;
    setBusy(true);
    const res = await eventService.creatorSubmit(detail.id, selectedStoryId);
    setBusy(false);
    if (!res.success) showToast(res.message || "Không nộp được truyện dự thi.", "err");
    else {
      setSubmission(res.data ?? null);
      showToast("Đã nộp truyện dự thi và chuyển sang kiểm duyệt.", "ok");
      onRefresh();
    }
  };

  return (
    <div className="sec ev-participant-flow">
      {participation && (
        <div className="ev-event-filters" role="tablist" aria-label="Chuyển trang sự kiện Creator">
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
            Nộp bài &amp; Mục tiêu thưởng
          </button>
        </div>
      )}

      {(!participation || pageTab === "info") && (
        <>
          {!participation && (
            <div className="ev-card ev-join-banner">
              <div className="ev-card-head ev-creator-join">
                <h3 className="display">Tham gia nhánh sáng tác (Creator Track)</h3>
              </div>
              <p className="sub" style={{ margin: 0 }}>
                Đăng ký tham gia sự kiện để mở trang nộp truyện dự thi và nhận{" "}
                <b>{creatorTrack?.grantAiCredits ?? 0} AI Credits</b> +{" "}
                <b>{creatorTrack?.grantSubmitCredits ?? 0} lượt nộp miễn phí</b>.
              </p>
              {detail.status === "Published" && (
                <button type="button" className="btn btn-gold" disabled={busy} onClick={() => void registerCreator()}>
                  <Sparkles className="ic" aria-hidden="true" />
                  Đăng ký dự thi
                </button>
              )}
            </div>
          )}
          <EventDetailInfoCard detail={detail} />
        </>
      )}

      {participation?.status === "VerificationFailed" && detail.status === "Published" && !detail.resultsFinalizedAt && pageTab === "participate" && (
        <div className="row">
          {participation.appealDeadlineAt && <span className="sub">Hạn khiếu nại {formatVnDateTime(participation.appealDeadlineAt)}</span>}
          {(!participation.appealDeadlineAt || Date.parse(participation.appealDeadlineAt) > Date.now()) && (
            <button type="button" className="btn btn-s" disabled={busy} onClick={() => setAppealOpen(true)}>Khiếu nại kết quả</button>
          )}
        </div>
      )}

      {participation && participation.status !== "Disqualified" && pageTab === "participate" && creatorCanVote(detail.scoringMode) && (
        <CreatorEventBallot key={detail.id} event={detail} />
      )}
      {participation && pageTab === "participate" && detail.scoringMode !== "CreatorVoteAverage" && (
        <>
          <div className="ev-card">
          <div className="ev-card-head">
            <h3 className="display">Trang nộp bài &amp; Thông số dự thi</h3>
            <span className="pill">{PARTICIPATION_STATUS_LABEL[participation.status]}</span>
          </div>

          <div className="ev-kpi-grid">
            <div className="ev-kpi">
              <span>Hạn chót nộp bài</span>
              <strong>{creatorTrack ? formatVnDate(creatorTrack.executionEndAt) : "Đang mở"}</strong>
            </div>
            <div className="ev-kpi">
              <span>Ưu đãi được cấp</span>
              <strong>
                +{creatorTrack?.grantAiCredits ?? 0} AI · +{creatorTrack?.grantSubmitCredits ?? 0} nộp
              </strong>
            </div>
            <div className="ev-kpi">
              <span>Trạng thái bài thi</span>
              <strong>{submission ? SUBMISSION_STATUS_LABEL[submission.status] ?? submission.status : "Chưa nộp bài"}</strong>
            </div>
            {(detail.scoringMode ?? "Rubric") === "Rubric" && (
            <div className="ev-kpi">
              <span>Điểm chấm</span>
              <strong>
                {submission?.averageScore != null
                  ? `${submission.averageScore}/100 (${submission.evaluationCount ?? 0} lượt)`
                  : "Chưa chấm"}
              </strong>
            </div>
            )}
          </div>

          <p className="sub" style={{ margin: 0 }}>
            Bạn có thể chọn <b>truyện hiện có</b> trong thư viện cá nhân hoặc <b>tạo truyện AI mới</b> cho sự kiện. Mỗi
            Creator được nộp tối đa 1 truyện dự thi.
          </p>

          <div className="row" style={{ flexWrap: "wrap", gap: 10 }}>
            {detail.status === "Published" && participation.status !== "Disqualified" && (
              <a className="btn btn-s" href={`/staff/create-ai?eventId=${detail.id}`}>
                <Sparkles className="ic" aria-hidden="true" />Tạo truyện AI cho sự kiện
              </a>
            )}
            <select
              className="inp"
              style={{ flex: 1, minWidth: 220 }}
              value={selectedStoryId}
              onChange={(e) => setSelectedStoryId(Number(e.target.value))}
            >
              <option value={0}>
                {eligibleStories.length === 0
                  ? "-- Chưa có truyện nào của bạn --"
                  : "-- Chọn truyện của bạn để nộp dự thi --"}
              </option>
              {eligibleStories.map((st) => (
                <option key={st.storyId} value={st.storyId}>
                  #{st.storyId} · {st.title || "Chưa đặt tên"} ({st.status})
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-p"
              disabled={busy || !selectedStoryId}
              onClick={() => void submitStory()}
            >
              <BookOpenCheck className="ic" aria-hidden="true" />
              {submission ? "Cập nhật bài dự thi" : "Nộp truyện dự thi"}
            </button>
          </div>

          {submission && (
            <div className="ev-task-row">
              <b>
                Bài dự thi #{submission.id} · Truyện #{submission.storyId} (Phiên bản #{submission.currentStoryVersionId})
              </b>
              <span className="sub">
                Kiểm duyệt: {SUBMISSION_STATUS_LABEL[submission.status] ?? submission.status} · Độ tương đồng kiểm tra:{" "}
                {Math.round((submission.similarityScore ?? 0) * 100)}% · Thời gian nộp:{" "}
                {submission.submittedAt ? formatVnDateTime(submission.submittedAt) : "Vừa xong"}
                {submission.lockedStoryVersionId ? ` · Đã khóa bản #${submission.lockedStoryVersionId}` : ""}
              </span>
              {parentCanVote(detail.scoringMode) && (
                <div className="row" style={{ gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-s"
                    disabled={busy}
                    onClick={() => void eventService.leaderboard(detail.id).then((r) => {
                      if (r.success && r.data) setLeaderboard(r.data);
                      else showToast(r.message || "Không tải được bảng xếp hạng.", "err");
                    })}
                  >
                    Xem bảng xếp hạng
                  </button>
                  {leaderboard && (
                    leaderboard.hidden ? (
                      <span className="sub">Thứ hạng đang ẩn trong vòng bình chọn.</span>
                    ) : (
                      <div className="ev-task-list" style={{ width: "100%" }}>
                        <span className="sub">
                          Đã có {leaderboard.entries.filter((e) => e.meetsThreshold).length} bài đạt ngưỡng ({leaderboard.minVotesPerSubmission} phiếu).
                        </span>
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
                </div>
              )}
            </div>
          )}
        </div>
        <CreatorGoalAndStoryCard
          detail={detail}
          participation={participation}
          submission={submission}
          activeStoryId={submission?.storyId || selectedStoryId}
          eligibleCount={eligibleStories.length}
        />
      </>
      )}
      {(!participation || pageTab === "participate") && eventRewards.length > 0 && (
        <div className="ev-card">
          <div className="ev-card-head">
            <h3 className="display">Giải thưởng của tôi</h3>
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
                  <button
                    type="button"
                    className="btn btn-gold"
                    disabled={busy}
                    onClick={() => openClaim(aw)}
                  >
                    Nhận thưởng
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {appealOpen && (
        <Dialog title="Khiếu nại kết quả xác minh" onClose={closeAppeal}>
          <label className="ev-field">
            <span>Lý do khiếu nại</span>
            <textarea className="inp" rows={4} value={appealReason} onChange={(event) => setAppealReason(event.target.value)} />
          </label>
          <button type="button" className="btn btn-p" disabled={busy || !appealReason.trim()} onClick={() => void submitAppeal()}>
            Gửi khiếu nại
          </button>
        </Dialog>
      )}

      {claimingAward && (
        <Dialog title={`Nhận giải: ${claimingAward.rewardName}`} onClose={() => { setClaimingAward(null); setClaimFields({}); }}>
          {claimFieldsFor(claimingAward.rewardType).length === 0 ? (
            <p className="sub">
              Xác nhận nhận{" "}
              {claimingAward.rewardType === "PlatformCredits"
                ? `${claimingAward.creditGrantAmount} Credits`
                : REWARD_TYPE_LABEL[claimingAward.rewardType]}{" "}
              vào tài khoản của bạn.
            </p>
          ) : (
            <EventClaimFields rewardType={claimingAward.rewardType} fields={claimFields}
              onChange={(field, value) => setClaimFields((current) => ({ ...current, [field]: value }))} />
          )}
          <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
            <button type="button" className="btn btn-g" onClick={() => { setClaimingAward(null); setClaimFields({}); }}>
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-gold"
              disabled={busy}
              onClick={() => void submitClaim()}
            >
              Xác nhận nhận thưởng
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
