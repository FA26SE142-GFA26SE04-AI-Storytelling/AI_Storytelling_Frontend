import {
  EVENT_ACTIVITY_LABEL,
  EVENT_AUDIENCE_LABEL,
  EVENT_RESULT_SOURCE_LABEL,
  EVENT_STORY_SOURCE_LABEL,
  REWARD_TYPE_LABEL,
  type EventActivityType,
  type EventAwardSlotDto,
  type EventDetailDto,
} from "@/app/types/event";
import { eventScheduleWindow, formatVnDate, formatVnDateTime } from "./eventTime";

const executionLabels: Record<EventActivityType, string> = {
  Submission: "Thời gian nhận bài",
  ReadingMissions: "Thời gian đọc và làm nhiệm vụ",
  Voting: "Thời gian bình chọn",
};

const displayEnd = (value: string) => formatVnDateTime(value).replace(/ 23:59:59$/, "");

function displayRange(start: string, end: string) {
  const first = formatVnDateTime(start).replace(/ 00:00:00$/, "");
  const last = displayEnd(end);
  return first === last ? first : `${first} – ${last}`;
}

export default function EventConfigurationSummary({ detail }: { detail: EventDetailDto }) {
  const activities = detail.activities ?? [];
  const { start, end } = eventScheduleWindow(detail, detail);
  const tiers = new Map<string, { award: EventAwardSlotDto; slots: Set<number> }>();
  for (const award of detail.awards) {
    const key = JSON.stringify([award.eventActivityId ?? award.activityType, award.resultSource, award.rankOrTier]);
    const tier = tiers.get(key);
    if (tier) tier.slots.add(award.slotIndex);
    else tiers.set(key, { award, slots: new Set([award.slotIndex]) });
  }

  return (
    <section className="ev-card ev-configuration-summary">
      <div className="ev-card-head">
        <h3 className="display">Tóm tắt cấu hình hoạt động và giải thưởng</h3>
      </div>
      {start !== null && end !== null && (
        <p className="ev-configuration-period">
          <b>{detail.opensAt && detail.closesAt ? "Lịch sự kiện" : "Khoảng hoạt động"}</b>
          <span>{formatVnDate(start)} – {formatVnDate(end)} · Giờ Việt Nam</span>
        </p>
      )}
      {activities.length ? (
        <div className="ev-configuration-grid">
          {activities.map((activity) => (
            <section key={activity.id} className="ev-configuration-item">
              <h4>{EVENT_ACTIVITY_LABEL[activity.activityType]}</h4>
              <dl>
                <dt>Đối tượng</dt>
                <dd>{EVENT_AUDIENCE_LABEL[activity.allowedAudience]}</dd>
                <dt>Thời gian ghi danh</dt>
                <dd>{displayRange(activity.registrationStartAt, activity.registrationEndAt)}</dd>
                <dt>{executionLabels[activity.activityType]}</dt>
                <dd>{displayRange(activity.startAt, activity.endAt)}</dd>
                {activity.activityType === "Submission" && (
                  <>
                    {activity.reviewCutoffAt && <><dt>Hạn duyệt bài</dt><dd>{displayEnd(activity.reviewCutoffAt)}</dd></>}
                    <dt>Số bài mỗi người</dt>
                    <dd>{activity.maxSubmissionsPerUser ? `Tối đa ${activity.maxSubmissionsPerUser} bài` : "Không giới hạn"}</dd>
                    {activity.grantAiCredits > 0 && <><dt>Khi đăng ký</dt><dd>Tặng {activity.grantAiCredits} lượt AI</dd></>}
                  </>
                )}
                {activity.activityType === "ReadingMissions" && (
                  <>
                    <dt>Nguồn truyện</dt>
                    <dd>{EVENT_STORY_SOURCE_LABEL[activity.storySource]}</dd>
                    <dt>Giới hạn đăng ký</dt>
                    <dd>{activity.maxRegistrations ? `Tối đa ${activity.maxRegistrations} người` : "Không giới hạn"}</dd>
                    {activity.waiveWeeklyLibraryLimit && <><dt>Quyền lợi</dt><dd>Miễn giới hạn thư viện tuần</dd></>}
                  </>
                )}
                {activity.activityType === "Voting" && (
                  <>
                    <dt>Điều kiện xếp hạng</dt>
                    <dd>Ít nhất {activity.minVotesPerSubmission} phiếu hợp lệ mỗi bài</dd>
                  </>
                )}
              </dl>
            </section>
          ))}
        </div>
      ) : <p className="sub">Chưa bật hoạt động nào.</p>}

      <section className="ev-configuration-prizes">
        <h4>Hạng giải</h4>
        {tiers.size > 0 ? (
          <ul className="ev-configuration-grid">
            {Array.from(tiers, ([key, { award, slots }]) => (
              <li className="ev-configuration-item" key={key}>
                <div className="ev-configuration-prize-title"><b>{award.rankOrTier}</b><span>{slots.size} suất</span></div>
                <dl>
                  <dt>Xét theo</dt>
                  <dd>{award.resultSource ? EVENT_RESULT_SOURCE_LABEL[award.resultSource] : "Chưa chọn"}</dd>
                  {award.targetAudience && <><dt>Đối tượng nhận</dt><dd>{EVENT_AUDIENCE_LABEL[award.targetAudience]}</dd></>}
                  <dt>Phần thưởng</dt>
                  <dd>{award.rewardName || REWARD_TYPE_LABEL[award.rewardType]}</dd>
                </dl>
              </li>
            ))}
          </ul>
        ) : <p className="sub">Chưa cấu hình giải thưởng.</p>}
      </section>
    </section>
  );
}
