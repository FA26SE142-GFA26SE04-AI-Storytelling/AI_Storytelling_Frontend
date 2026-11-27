"use client";

import { useEffect, useState } from "react";
import { Award, Gift, MessageSquareWarning, Trophy } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import { useAuth } from "@/app/context/AuthContext";
import { showToast } from "@/app/lib/toast";
import { eventService } from "@/app/services/eventService";
import {
  APPEAL_KIND_LABEL,
  AWARD_STATUS_LABEL,
  EVENT_ACTIVITY_LABEL,
  PARTICIPATION_STATUS_LABEL,
  REWARD_TYPE_LABEL,
  type EventAppealKind,
  type EventDetailDto,
  type EventRewardType,
  type MyAwardDto,
  type MyEventResultDto,
  type PublicEventResultsDto,
} from "@/app/types/event";
import EventClaimFields from "./EventClaimFields";
import type { EventResultTarget } from "./eventNavigation";
import { buildClaimRequest, claimFieldsFor, type ClaimRewardPayload } from "./eventRewards";
import { formatVnDateTime } from "./eventTime";

export type EventResultsViewProps = {
  detail: EventDetailDto;
  myResult: MyEventResultDto | null;
  publicResults: PublicEventResultsDto | null;
  resultTarget?: EventResultTarget | null;
  onResultTargetHandled?: (target: EventResultTarget) => void;
  onRefresh: () => void;
};

function rewardLocation(rewardType: EventRewardType, isCreator: boolean): { label: string; href?: string } {
  if (rewardType === "PlatformCredits") {
    return { label: "Tài khoản › Thông tin cá nhân", href: isCreator ? "/staff/account" : "/app/account" };
  }
  if (rewardType === "CreatorPackage") {
    return { label: "Tài khoản › Nâng cấp gói", href: isCreator ? "/staff/account-plan" : "/app/account-payment" };
  }
  return { label: "Điền thông tin nhận ngay trên trang này" };
}

export default function EventResultsView({
  detail,
  myResult,
  publicResults,
  resultTarget,
  onResultTargetHandled,
  onRefresh,
}: EventResultsViewProps) {
  const { user } = useAuth();
  const isCreator = user?.role === "ContentCreator";

  const [busy, setBusy] = useState(false);
  const [claimingAward, setClaimingAward] = useState<MyAwardDto | null>(null);
  const [claimFields, setClaimFields] = useState<ClaimRewardPayload>({});
  const [showChildNames, setShowChildNames] = useState(false);
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealKind, setAppealKind] = useState<EventAppealKind>("Verification");
  const [appealTargetAwardId, setAppealTargetAwardId] = useState<string>("");
  const [appealReason, setAppealReason] = useState("");

  useEffect(() => {
    if (!resultTarget || (resultTarget.claimAwardId && !myResult)) return;
    if (resultTarget.focusResult) {
      document.getElementById("my-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const found = myResult?.awards.find((a) => a.awardId === resultTarget.claimAwardId && a.status === "AwaitingClaim");
    if (found) {
      setClaimFields({});
      setShowChildNames(false);
      setClaimingAward(found);
    }
    onResultTargetHandled?.(resultTarget);
  }, [resultTarget, myResult, onResultTargetHandled]);

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#my-result") return;
    const el = document.getElementById("my-result");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [detail.id, myResult?.resultsPublishedAt]);

  // Chỉ những hồ sơ backend xác nhận gửi được khiếu nại (hoạt động nguồn xét giải, chưa có đơn mở).
  const appealable = (myResult?.activities ?? []).filter((a) => a.canAppeal);
  const failedState = appealable.find((a) => a.status === "VerificationFailed");
  const verifiedState = appealable.find((a) => a.status === "Verified");
  const defaultKind: EventAppealKind = failedState ? "Verification" : "Ranking";

  const openAppeal = () => {
    setAppealKind(defaultKind);
    setAppealTargetAwardId("");
    setAppealReason("");
    setAppealOpen(true);
  };

  const submitAppeal = async () => {
    const targetPart =
      (appealKind === "Verification" ? failedState : verifiedState) ?? failedState ?? verifiedState;
    if (!targetPart?.participationId || !appealReason.trim()) return;
    setBusy(true);
    const res = await eventService.createAppeal(detail.id, targetPart.participationId, appealReason.trim(), {
      kind: appealKind,
      targetAwardId: appealKind === "Ranking" && appealTargetAwardId ? Number(appealTargetAwardId) : null,
    });
    setBusy(false);
    if (!res.success) {
      showToast(res.message || "Không gửi được đơn khiếu nại.", "err");
      return;
    }
    showToast("Đã gửi đơn khiếu nại.", "ok");
    setAppealOpen(false);
    onRefresh();
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
      const payload = claimingAward.asksChildNameConsent
        ? { ...built.request, showChildNames }
        : built.request;
      const res = await eventService.claimReward(claimingAward.awardId, payload);
      if (!res.success) showToast(res.message || "Không xác nhận nhận thưởng được.", "err");
      else {
        showToast("Đã xác nhận nhận thưởng.", "ok");
        setClaimingAward(null);
        setClaimFields({});
        setShowChildNames(false);
        onRefresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const isPublished = Boolean(detail.resultsPublishedAt || myResult?.resultsPublishedAt);
  const recap = myResult?.recap;

  return (
    <div className="sec ev-results-view">
      <section id="my-result" className="ev-card">
        <div className="ev-card-head">
          <h3 className="display">Kết quả của bạn</h3>
          {isPublished && (detail.appealWindowEndsAt || myResult?.appealDeadlineAt) && (
            <span className="pill">
              Hạn khiếu nại đến {formatVnDateTime(myResult?.appealDeadlineAt ?? detail.appealWindowEndsAt)}
            </span>
          )}
        </div>

        {!isPublished ? (
          <div className="ev-results-pending">
            <p style={{ margin: 0 }}>
              <strong>Ban tổ chức đang xét kết quả</strong> — bạn sẽ nhận thông báo ngay khi danh sách được công bố.
            </p>
            {recap && (
              <dl className="ev-kpi-grid">
                <div className="ev-kpi"><dt>Truyện bé đã đọc xong</dt><dd><strong>{recap.storiesRead}</strong></dd></div>
                <div className="ev-kpi"><dt>Bài dự thi đã nộp</dt><dd><strong>{recap.submissions}</strong></dd></div>
                <div className="ev-kpi"><dt>Phiếu bình chọn</dt><dd><strong>{recap.votes}</strong></dd></div>
                <div className="ev-kpi"><dt>Nhiệm vụ hoàn thành</dt><dd><strong>{recap.tasksCompleted}/{recap.tasksTotal}</strong></dd></div>
              </dl>
            )}
          </div>
        ) : (
          <div className="ev-task-list">
            {myResult && myResult.activities.length > 0 && (
              <div className="ev-task-list">
                {myResult.activities.map((act, idx) => (
                  <div key={`${act.activityType}-${idx}`} className="ev-task-row">
                    <div className="row" style={{ justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <b>{EVENT_ACTIVITY_LABEL[act.activityType]}</b>
                      <span className="pill">{PARTICIPATION_STATUS_LABEL[act.status]}</span>
                    </div>
                    {act.reason && <span className="sub">{act.reason}</span>}
                  </div>
                ))}
              </div>
            )}

            {myResult && myResult.awards.length > 0 ? (
              myResult.awards.map((aw) => {
                const dest = rewardLocation(aw.rewardType, isCreator);
                return (
                  <div key={aw.awardId} className="ev-task-row ev-result-award-card">
                    <div className="row" style={{ justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                      <b><Award className="ic" aria-hidden="true" /> {aw.rankOrTier} · {aw.rewardName}</b>
                      <span className="pill">{AWARD_STATUS_LABEL[aw.status]}</span>
                    </div>
                    <span className="sub">
                      {REWARD_TYPE_LABEL[aw.rewardType]}
                      {aw.creditGrantAmount > 0 ? ` · +${aw.creditGrantAmount} lượt AI` : ""}
                      {aw.submitCreditGrantAmount > 0 ? ` · +${aw.submitCreditGrantAmount} lượt gửi duyệt` : ""}
                      {aw.unitValueVnd > 0 ? ` · ${aw.unitValueVnd.toLocaleString("vi-VN")} đ` : ""}
                    </span>
                    {aw.status === "AppealHold" && (
                      <p className="sub" style={{ margin: 0 }}>
                        Giải mở nhận từ {aw.claimOpensAt ? formatVnDateTime(aw.claimOpensAt) : "sau khi hết hạn khiếu nại"}. Kết quả có thể thay đổi nếu có khiếu nại được chấp nhận.
                      </p>
                    )}
                    {aw.status === "AwaitingClaim" && (
                      <div className="row" style={{ gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <button
                          type="button"
                          className="btn btn-gold"
                          disabled={busy}
                          onClick={() => {
                            setClaimFields({});
                            setShowChildNames(false);
                            setClaimingAward(aw);
                          }}
                        >
                          <Gift className="ic" aria-hidden="true" />
                          Nhận thưởng
                        </button>
                        {aw.claimDeadlineAt && (
                          <span className="sub">Hạn nhận trước {formatVnDateTime(aw.claimDeadlineAt)}</span>
                        )}
                      </div>
                    )}
                    {aw.status === "Revoked" && aw.revokedReason && (
                      <p className="sub" style={{ margin: 0 }}>Lý do thu hồi: {aw.revokedReason}</p>
                    )}
                    <span className="sub">
                      Nơi giải hiển thị:{" "}
                      {dest.href ? <a href={dest.href}>{dest.label}</a> : dest.label}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="sub" style={{ margin: 0 }}>Bạn chưa nằm trong danh sách nhận giải của sự kiện này.</p>
            )}

            {myResult?.canAppeal && (
              <div className="row" style={{ gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <button type="button" className="btn btn-s" disabled={busy} onClick={openAppeal}>
                  <MessageSquareWarning className="ic" aria-hidden="true" />
                  Khiếu nại
                </button>
                {myResult.appealDeadlineAt && (
                  <span className="sub">Hạn gửi khiếu nại đến {formatVnDateTime(myResult.appealDeadlineAt)}</span>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {isPublished && publicResults && (
        <section className="ev-card">
          <div className="ev-card-head">
            <h3 className="display"><Trophy className="ic" aria-hidden="true" /> Danh sách giải đã công bố</h3>
            <span className="sub">
              {publicResults.participantCount} người tham gia · {publicResults.storyCount} truyện · {publicResults.awards.length} suất giải
            </span>
          </div>
          {publicResults.awards.length === 0 ? (
            <p className="sub" style={{ margin: 0 }}>Chưa có suất giải thưởng nào được công bố.</p>
          ) : (
            <div className="ev-task-list">
              {publicResults.awards.map((aw, idx) => (
                <div key={`${aw.rankOrTier}-${aw.slotIndex}-${idx}`} className="ev-task-row">
                  <div className="row" style={{ justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <b>{aw.rankOrTier} · Suất #{aw.slotIndex}</b>
                    <span className="pill">{aw.rewardName}</span>
                  </div>
                  {aw.resultSource === "MissionCompletion" ? (
                    <span className="sub">
                      {aw.winnerName || "Gia đình tham gia"}
                      {aw.childNicknames.length > 0
                        ? ` cùng ${aw.childNicknames.join(", ")}`
                        : aw.childCount > 0
                          ? ` cùng ${aw.childCount} bé`
                          : ""}
                    </span>
                  ) : (
                    <span className="sub">
                      {aw.storyTitle ? `Truyện “${aw.storyTitle}”` : "Bài dự thi đạt giải"}
                      {aw.winnerName ? ` · Tác giả: ${aw.winnerName}` : ""}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {appealOpen && (
        <Dialog title="Gửi đơn khiếu nại kết quả" onClose={() => setAppealOpen(false)}>
          <div className="ev-award-edit-form">
            <fieldset className="ev-award-candidates">
              <legend className="sub">Loại khiếu nại</legend>
              {(["Verification", "Ranking"] as EventAppealKind[]).map((kind) => (
                <label key={kind} className={`ev-award-candidate-item${appealKind === kind ? " is-selected" : ""}`}>
                  <input
                    type="radio"
                    name="appeal-kind"
                    value={kind}
                    checked={appealKind === kind}
                    onChange={() => setAppealKind(kind)}
                  />
                  <div><strong>{APPEAL_KIND_LABEL[kind]}</strong></div>
                </label>
              ))}
            </fieldset>
            {appealKind === "Ranking" && detail.awards.length > 0 && (
              <label className="ev-field">
                <span className="sub">Suất giải liên quan (tùy chọn)</span>
                <select className="inp" value={appealTargetAwardId} onChange={(e) => setAppealTargetAwardId(e.target.value)}>
                  <option value="">-- Không chọn suất cụ thể --</option>
                  {detail.awards.map((a) => (
                    <option key={a.id} value={a.id}>{a.rankOrTier} · Suất #{a.slotIndex}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="ev-field">
              <span className="sub">Lý do khiếu nại (bắt buộc)</span>
              <textarea
                className="inp"
                rows={4}
                placeholder="Trình bày cụ thể nội dung cần Ban tổ chức rà soát…"
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
              />
            </label>
            <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
              <button type="button" className="btn btn-g" disabled={busy} onClick={() => setAppealOpen(false)}>Hủy</button>
              <button type="button" className="btn btn-p" disabled={busy || !appealReason.trim()} onClick={() => void submitAppeal()}>
                Gửi khiếu nại
              </button>
            </div>
          </div>
        </Dialog>
      )}

      {claimingAward && (
        <Dialog title={`Nhận thưởng: ${claimingAward.rankOrTier}`} onClose={() => { setClaimingAward(null); setClaimFields({}); }}>
          <div className="sec" style={{ gap: 10 }}>
            {claimFieldsFor(claimingAward.rewardType).length === 0 ? (
              <p className="sub" style={{ margin: 0 }}>
                Xác nhận nhận{" "}
                {claimingAward.rewardType === "PlatformCredits"
                  ? `${claimingAward.creditGrantAmount} lượt AI`
                  : REWARD_TYPE_LABEL[claimingAward.rewardType]}{" "}
                vào tài khoản của bạn.
              </p>
            ) : (
              <EventClaimFields
                rewardType={claimingAward.rewardType}
                fields={claimFields}
                onChange={(field, value) => setClaimFields((cur) => ({ ...cur, [field]: value }))}
              />
            )}
            {claimingAward.asksChildNameConsent && (
              <label className="row" style={{ gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={showChildNames}
                  onChange={(e) => setShowChildNames(e.target.checked)}
                />
                <span className="sub">Cho phép hiện tên bé trong danh sách giải</span>
              </label>
            )}
            <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
              <button type="button" className="btn btn-g" disabled={busy} onClick={() => setClaimingAward(null)}>Hủy</button>
              <button type="button" className="btn btn-p" disabled={busy} onClick={() => void submitClaim()}>
                Xác nhận nhận thưởng
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
