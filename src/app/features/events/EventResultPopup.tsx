"use client";

import "@/app/styles/features/events/event-popup.css";
import Dialog from "@/app/components/Dialog";
import Frog from "@/app/components/brand/Frog";
import { usePop } from "@/app/lib/motion";
import { AWARD_STATUS_LABEL, REWARD_TYPE_LABEL, type EventRewardType } from "@/app/types/event";
import { formatVnDateTime } from "./eventTime";
import type { EventPopup } from "./eventPopups";
import { useEventResultPopups } from "./useEventResultPopups";

function strField(payload: Record<string, unknown> | undefined, key: string): string {
  const val = payload?.[key];
  return typeof val === "string" ? val.trim() : "";
}

function numField(payload: Record<string, unknown> | undefined, key: string): number {
  const val = payload?.[key];
  return typeof val === "number" && Number.isFinite(val) ? val : 0;
}

function rewardDestinationText(rewardType: EventRewardType): string {
  switch (rewardType) {
    case "PlatformCredits":
      return "Lượt AI sau khi nhận sẽ nằm tại Tài khoản › Thông tin cá nhân.";
    case "CreatorPackage":
      return "Gói Creator sau khi nhận sẽ nằm tại Tài khoản › Nâng cấp gói.";
    default:
      return "Bạn điền thông tin nhận quà trực tiếp trên trang kết quả sự kiện.";
  }
}

export function EventResultPopupCard({
  popup,
  onClose,
  onOpenDetail,
  onClaim,
}: {
  popup: EventPopup;
  onClose: () => void;
  onOpenDetail: (eventId: number) => void;
  onClaim?: (eventId: number, awardId: number) => void;
}) {
  const popRef = usePop<HTMLDivElement>(`${popup.kind}-${popup.eventId}-${popup.award?.awardId ?? popup.notificationId ?? 0}`);
  const eventTitle = popup.result?.eventTitle || strField(popup.payload, "eventTitle") || `Sự kiện #${popup.eventId}`;

  let dialogTitle = "Thông báo sự kiện";
  let frogMood: "idle" | "happy" | "think" = "happy";
  if (popup.kind === "ended") dialogTitle = `Sự kiện ${eventTitle} đã khép lại!`;
  else if (popup.kind === "award") dialogTitle = "Chúc mừng bạn đã đạt giải!";
  else if (popup.kind === "noAward") {
    dialogTitle = "Kết quả sự kiện đã được công bố";
    frogMood = "think";
  } else if (popup.kind === "revoked") {
    dialogTitle = "Thông báo thu hồi suất giải thưởng";
    frogMood = "think";
  } else if (popup.kind === "appealAccepted") {
    dialogTitle = "Khiếu nại của bạn đã được chấp nhận";
  }

  return (
    <Dialog title={dialogTitle} onClose={onClose}>
      <div ref={popRef} className="ev-popup-body">
        <div className="ev-popup-hero">
          <Frog size={68} mood={frogMood} />
          <div className="ev-popup-lead">
            <strong>{eventTitle}</strong>
            {popup.kind === "ended" && (
              <p className="sub">Cảm ơn bạn đã đồng hành cùng sự kiện. Kết quả sẽ được công bố sớm — bạn sẽ nhận thông báo ngay khi có.</p>
            )}
            {popup.kind === "award" && popup.award && (
              <p className="sub">
                {popup.award.rankOrTier} · {popup.award.rewardName} ({REWARD_TYPE_LABEL[popup.award.rewardType]})
              </p>
            )}
            {popup.kind === "noAward" && (
              <p className="sub">Bạn chưa nằm trong danh sách nhận giải của sự kiện này.</p>
            )}
            {popup.kind === "revoked" && (
              <p className="sub">
                Suất giải {strField(popup.payload, "rankOrTier") || ""} {strField(popup.payload, "rewardName") ? `(${strField(popup.payload, "rewardName")})` : ""} đã bị thu hồi.
              </p>
            )}
            {popup.kind === "appealAccepted" && (
              <p className="sub">Khiếu nại của bạn đã được chấp nhận bởi Ban tổ chức.</p>
            )}
          </div>
        </div>

        {popup.kind === "ended" && (() => {
          const recap = popup.result?.recap ?? {
            storiesRead: numField(popup.payload, "storiesRead"),
            submissions: numField(popup.payload, "submissions"),
            votes: numField(popup.payload, "votes"),
            tasksCompleted: numField(popup.payload, "tasksCompleted"),
            tasksTotal: numField(popup.payload, "tasksTotal"),
          };
          return (
            <div className="ev-popup-recap">
              <b>Tóm tắt đóng góp của bạn</b>
              <ul>
                {recap.storiesRead > 0 && <li>Truyện bé đã đọc xong: <strong>{recap.storiesRead}</strong></li>}
                {recap.submissions > 0 && <li>Bài dự thi đã nộp: <strong>{recap.submissions}</strong></li>}
                {recap.votes > 0 && <li>Phiếu bình chọn đã gửi: <strong>{recap.votes}</strong></li>}
                {recap.tasksTotal > 0 && <li>Nhiệm vụ hoàn thành: <strong>{recap.tasksCompleted}/{recap.tasksTotal}</strong></li>}
                {recap.storiesRead === 0 && recap.submissions === 0 && recap.votes === 0 && recap.tasksTotal === 0 && (
                  <li>Cảm ơn bạn đã đăng ký tham gia sự kiện!</li>
                )}
              </ul>
            </div>
          );
        })()}

        {popup.kind === "award" && popup.award && (
          <>
            <div className="ev-popup-status-row">
              <span className="pill">{AWARD_STATUS_LABEL[popup.award.status]}</span>
              {popup.award.creditGrantAmount > 0 && <span className="sub">+{popup.award.creditGrantAmount} lượt AI</span>}
              {popup.award.submitCreditGrantAmount > 0 && <span className="sub">+{popup.award.submitCreditGrantAmount} lượt gửi duyệt</span>}
              {popup.award.unitValueVnd > 0 && <span className="sub">Giá trị {popup.award.unitValueVnd.toLocaleString("vi-VN")} đ</span>}
            </div>
            <div className="ev-popup-note">
              <h4>Lưu ý</h4>
              <ul>
                {popup.award.status === "AppealHold" && (
                  <li>
                    Giải mở nhận từ {popup.award.claimOpensAt ? formatVnDateTime(popup.award.claimOpensAt) : "sau khi hết hạn khiếu nại"}; kết quả có thể thay đổi nếu có khiếu nại được chấp nhận.
                  </li>
                )}
                {popup.award.status === "AwaitingClaim" && (
                  <li>
                    Hãy nhận trước {popup.award.claimDeadlineAt ? formatVnDateTime(popup.award.claimDeadlineAt) : "khi hết hạn"}; quá hạn suất sẽ chuyển cho người kế tiếp.
                  </li>
                )}
                {popup.award.rewardType === "PhysicalGift" && (
                  <li>Hãy chuẩn bị họ tên, số điện thoại và địa chỉ nhận quà.</li>
                )}
                {popup.award.rewardType === "CashTransfer" && (
                  <li>Hãy chuẩn bị tên ngân hàng, số tài khoản và tên chủ tài khoản nhận tiền.</li>
                )}
                {popup.award.asksChildNameConsent && (
                  <li>Khi nhận thưởng, bạn có thể chọn có cho phép hiện tên bé trong danh sách giải hay không.</li>
                )}
                <li>{rewardDestinationText(popup.award.rewardType)}</li>
              </ul>
            </div>
          </>
        )}

        {popup.kind === "noAward" && (
          <div className="ev-popup-note">
            {popup.result?.activities.some((a) => a.reason) && (
              <ul>
                {popup.result.activities.filter((a) => a.reason).map((a, idx) => (
                  <li key={idx}>{a.reason}</li>
                ))}
              </ul>
            )}
            {popup.result?.appealDeadlineAt && (
              <p className="sub" style={{ margin: 0 }}>
                Nếu cần rà soát lại, bạn có thể gửi khiếu nại trước {formatVnDateTime(popup.result.appealDeadlineAt)}.
              </p>
            )}
          </div>
        )}

        {popup.kind === "revoked" && (
          <div className="ev-popup-note">
            <h4>Lý do thu hồi</h4>
            <p style={{ margin: 0 }}>
              {strField(popup.payload, "reason") ||
                popup.result?.awards.find((a) => a.status === "Revoked")?.revokedReason ||
                "Theo quyết định xử lý khiếu nại của Ban tổ chức."}
            </p>
          </div>
        )}

        {popup.kind === "appealAccepted" && (
          <div className="ev-popup-note">
            <h4>Kết luận của Ban tổ chức</h4>
            <p style={{ margin: 0 }}>
              {strField(popup.payload, "resolutionNote") || "Kết quả xác minh của bạn đã được cập nhật."}
            </p>
          </div>
        )}

        <div className="ev-popup-actions">
          <button type="button" className="btn btn-g" onClick={onClose}>
            Đã hiểu
          </button>
          {popup.eventId > 0 && (
            <button type="button" className="btn btn-s" onClick={() => onOpenDetail(popup.eventId)}>
              {popup.kind === "ended" ? "Xem sự kiện" : "Xem chi tiết"}
            </button>
          )}
          {popup.kind === "award" && popup.award?.status === "AwaitingClaim" && onClaim && (
            <button type="button" className="btn btn-gold" onClick={() => onClaim(popup.eventId, popup.award!.awardId)}>
              Nhận thưởng
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
}

export default function EventResultPopupHost({
  onNavigateToEvent,
}: {
  onNavigateToEvent: (eventId: number, claimAwardId?: number) => void | Promise<boolean>;
}) {
  const { current, dismissCurrent } = useEventResultPopups();
  if (!current) return null;
  const navigate = async (eventId: number, claimAwardId?: number) => {
    if (await onNavigateToEvent(eventId, claimAwardId) !== false) dismissCurrent();
  };

  return (
    <EventResultPopupCard
      popup={current}
      onClose={dismissCurrent}
      onOpenDetail={(eventId) => void navigate(eventId)}
      onClaim={(eventId, awardId) => void navigate(eventId, awardId)}
    />
  );
}
