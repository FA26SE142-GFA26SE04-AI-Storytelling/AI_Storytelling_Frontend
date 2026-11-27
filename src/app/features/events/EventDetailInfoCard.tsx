"use client";

import { ArrowRight, BookOpen, CheckCircle2, Gift, Leaf, Pencil, ScrollText, Star, Trophy, Users } from "lucide-react";
import { COMPLETION_MODE_LABEL, EVENT_AUDIENCE_LABEL, REWARD_TYPE_LABEL, type EventAwardSlotDto, type EventDetailDto } from "@/app/types/event";
import { formatVnDate } from "./eventTime";

const dateLabel = (value: string) => Number.isFinite(Date.parse(value)) ? formatVnDate(value) : "Chưa có lịch";

/** Tổng quan dành cho người tham gia, lấy lịch trình và thể lệ từ sự kiện đang xem. */
/** Giá trị mỗi suất; rỗng khi giải không có tiền lẫn lượt AI (ví dụ quà hiện vật). */
export const awardValueText = ({ unitValueVnd, creditGrantAmount }: Pick<EventAwardSlotDto, "unitValueVnd" | "creditGrantAmount">) =>
  unitValueVnd > 0 ? `${unitValueVnd.toLocaleString("vi-VN")} đ / suất` : creditGrantAmount > 0 ? `${creditGrantAmount} lượt AI / suất` : "";

export default function EventDetailInfoCard({ detail }: { detail: EventDetailDto }) {
  const activities = detail.activities ?? [];
  const isActivityBased = detail.configVersion === "ActivityBased" || (detail.tracks.length === 0 && activities.length > 0);
  const subAct = activities.find((a) => a.activityType === "Submission");
  const readAct = activities.find((a) => a.activityType === "ReadingMissions");
  const voteAct = activities.find((a) => a.activityType === "Voting");

  const creator = detail.tracks.find((track) => track.trackType === "Creator");
  const parent = detail.tracks.find((track) => track.trackType === "Parent");
  const range = (start: string, end: string) => `${dateLabel(start)} – ${dateLabel(end)}`;
  const end = isActivityBased
    ? (detail.closesAt && Number.isFinite(Date.parse(detail.closesAt))
        ? detail.closesAt
        : activities.flatMap((a) => [a.endAt, a.reviewCutoffAt ?? ""])
            .filter((value) => Number.isFinite(Date.parse(value)))
            .sort((a, b) => Date.parse(b) - Date.parse(a))[0])
    : detail.tracks.map((track) => track.executionEndAt).filter((value) => Number.isFinite(Date.parse(value)))
        .sort((a, b) => Date.parse(b) - Date.parse(a))[0];

  const steps = isActivityBased
    ? [
        ...(subAct ? [{ title: "Sáng tác / Nộp bài", date: range(subAct.startAt, subAct.endAt), icon: Pencil }] : []),
        ...(subAct?.reviewCutoffAt ? [{ title: "Duyệt bài dự thi", date: `Hạn ${dateLabel(subAct.reviewCutoffAt)}`, icon: CheckCircle2 }] : []),
        ...(readAct ? [{ title: "Đọc truyện & Làm nhiệm vụ", date: range(readAct.startAt, readAct.endAt), icon: BookOpen }] : []),
        ...(voteAct ? [{ title: "Bình chọn truyện", date: range(voteAct.startAt, voteAct.endAt), icon: Star }] : []),
        { title: "Tổng kết / Trao thưởng", date: end ? `Sau ${dateLabel(end)}` : "Chưa có lịch", icon: Trophy },
      ]
    : [
        ...(creator ? [{ title: "Sáng tác truyện", date: range(creator.executionStartAt, creator.executionEndAt), icon: Pencil }] : []),
        ...(creator ? [{ title: "Duyệt truyện", date: "Theo lịch kiểm duyệt", icon: CheckCircle2 }] : []),
        ...(parent ? [{ title: "Gia đình tham gia", date: range(parent.executionStartAt, parent.executionEndAt), icon: Users }] : []),
        { title: "Tổng kết / Trao thưởng", date: end ? `Sau ${dateLabel(end)}` : "Chưa có lịch", icon: Trophy },
      ];

  const groups = new Map<string, typeof detail.awards>();
  for (const award of detail.awards) {
    const key = `${award.trackId ?? ""}|${award.eventActivityId ?? ""}|${award.resultSource ?? ""}|${award.targetAudience ?? ""}|${award.rankOrTier}|${award.rewardName}|${award.rewardType}|${award.unitValueVnd}|${award.creditGrantAmount}`;
    groups.set(key, [...(groups.get(key) ?? []), award]);
  }

  return (
    <div className="ev-story-overview">
      <section className="ev-story-section" aria-labelledby="ev-journey-title">
        <div className="ev-story-section-title">
          <Leaf className="ic" aria-hidden="true" />
          <div><h3 id="ev-journey-title" className="display">Hành trình sự kiện</h3>
            <p>Từ sáng tác đến cùng gia đình đọc truyện, làm nhiệm vụ và nhận giải thưởng.</p></div>
        </div>
        <ol className="ev-story-journey">
          {steps.map(({ title, date, icon: Icon }, index) => (
            <li key={title}><span className="ev-journey-icon"><Icon aria-hidden="true" /></span>
              <strong>{index + 1}. {title}</strong><span className="ev-journey-date">{date}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="ev-story-participation" aria-labelledby="ev-how-title">
        <div className="ev-story-section-title">
          <Users className="ic" aria-hidden="true" />
          <div><h3 id="ev-how-title" className="display">Cách tham gia</h3>
            <p>{(isActivityBased ? Boolean(subAct && (readAct || voteAct)) : Boolean(creator && parent))
              ? "Sự kiện dành cho cả Creator và Gia đình, cùng tạo nên hành trình đọc – sáng tác – trải nghiệm."
              : "Cùng tạo nên những câu chuyện ý nghĩa qua các hoạt động của sự kiện."}</p></div>
        </div>
        <div className="ev-story-phases">
          {isActivityBased ? (
            <>
              {subAct && (
                <div className="ev-story-phase">
                  <Pencil className="ic" aria-hidden="true" />
                  <div><h4>Sáng tác &amp; Nộp bài ({EVENT_AUDIENCE_LABEL[subAct.allowedAudience]})</h4>
                    <p>Sáng tạo hoặc chọn truyện sẵn sàng để nộp dự thi theo chủ đề sự kiện.</p>
                    <small>Đăng ký {range(subAct.registrationStartAt, subAct.registrationEndAt)} · {subAct.maxSubmissionsPerUser ? `Tối đa ${subAct.maxSubmissionsPerUser} bài` : "Không giới hạn số bài"}</small>
                    <small>{subAct.grantAiCredits} lượt AI · Hạn nhận giải {subAct.claimWindowHours}h</small>
                  </div>
                </div>
              )}
              {subAct && (readAct || voteAct) && <ArrowRight className="ic ev-phase-arrow" aria-hidden="true" />}
              {readAct && (
                <div className="ev-story-phase ev-family-phase">
                  <BookOpen className="ic" aria-hidden="true" />
                  <div><h4>Đọc truyện &amp; Làm nhiệm vụ</h4><p>Cùng bé đọc truyện, hoàn thành nhiệm vụ và tích lũy điểm.</p>
                    <small>Đăng ký {range(readAct.registrationStartAt, readAct.registrationEndAt)} · Thực hiện {range(readAct.startAt, readAct.endAt)}</small>
                    <small>{readAct.waiveWeeklyLibraryLimit ? "Miễn giới hạn thư viện tuần" : "Theo hạn mức thư viện tuần"} · Hạn nhận giải {readAct.claimWindowHours}h</small>
                  </div>
                </div>
              )}
              {readAct && voteAct && <ArrowRight className="ic ev-phase-arrow" aria-hidden="true" />}
              {voteAct && (
                <div className="ev-story-phase ev-family-phase">
                  <Star className="ic" aria-hidden="true" />
                  <div><h4>Bình chọn truyện</h4><p>Đọc và bình chọn sao cho các bài dự thi đã qua kiểm duyệt.</p>
                    <small>Không cần đăng ký · Bình chọn {range(voteAct.startAt, voteAct.endAt)}</small>
                    <small>Ngưỡng tối thiểu {voteAct.minVotesPerSubmission} phiếu/bài · Hạn nhận giải {voteAct.claimWindowHours}h</small>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {creator && (
                <div className="ev-story-phase">
                  <Pencil className="ic" aria-hidden="true" />
                  <div><h4>Creator sáng tác truyện</h4><p>Sáng tạo và đăng tải truyện dự thi theo chủ đề sự kiện.</p>
                    <small>Đăng ký {range(creator.registrationStartAt, creator.registrationEndAt)} · Tối đa {creator.maxSubmissionsPerUser} bài</small>
                    <small>{creator.grantAiCredits} lượt AI · {creator.grantSubmitCredits} lượt nộp · Hạn nhận giải {creator.claimWindowHours}h</small>
                  </div>
                </div>
              )}
              {creator && parent && <ArrowRight className="ic ev-phase-arrow" aria-hidden="true" />}
              {parent && (
                <div className="ev-story-phase ev-family-phase">
                  <BookOpen className="ic" aria-hidden="true" />
                  <div><h4>Gia đình tham gia</h4><p>Cùng bé đọc truyện, hoàn thành nhiệm vụ và tích lũy điểm.</p>
                    <small>Đăng ký {range(parent.registrationStartAt, parent.registrationEndAt)} · Hạn nhận giải {parent.claimWindowHours}h</small>
                    <small>{parent.waiveWeeklyLibraryLimit ? "Miễn giới hạn thư viện tuần" : "Theo hạn mức thư viện tuần"} · Đôn Runner-up tối đa {parent.maxReallocationRounds} vòng</small>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <section className="ev-story-section" aria-labelledby="ev-rules-title">
        <div className="ev-story-section-title"><ScrollText className="ic" aria-hidden="true" /><h3 id="ev-rules-title" className="display">Thể lệ & nhiệm vụ</h3></div>
        {detail.activeRule ? (
          <div className="ev-story-rules">
            <p className="ev-rules-text">{detail.activeRule.rulesText}</p>
            <p className="sub">{COMPLETION_MODE_LABEL[detail.activeRule.completionMode]}
              {detail.activeRule.completionMode === "MinimumTasksCount" && ` · ${detail.activeRule.requiredTaskCount} nhiệm vụ`}
              {detail.activeRule.completionMode === "MinimumPointsThreshold" && ` · ${detail.activeRule.requiredPoints} điểm`}
            </p>
            <ul>{detail.activeRule.tasks.map((task) => (
              <li key={task.id}><strong>{task.title}</strong>{task.description && <span> — {task.description}</span>}
                <small>Chỉ tiêu {task.targetValue} · {task.points} điểm · {task.isMandatory ? "Bắt buộc" : "Tự chọn"}</small></li>
            ))}</ul>
          </div>
        ) : <p className="sub">Thể lệ và nhiệm vụ chưa được công bố.</p>}
      </section>

      <section className="ev-story-section" aria-labelledby="ev-rewards-title">
        <div className="ev-story-section-title"><Gift className="ic" aria-hidden="true" /><h3 id="ev-rewards-title" className="display">Cơ cấu giải thưởng</h3></div>
        {groups.size > 0 ? (
          <ul className="ev-story-awards">{[...groups.entries()].map(([key, awards]) => {
            const award = awards[0];
            const track = detail.tracks.find((t) => t.id === award.trackId);
            return (
              <li key={key} className="ev-story-award-card">
                <div className="ev-award-card-head">
                  <span className="ev-award-icon" aria-hidden="true"><Trophy className="ic" /></span>
                  <div className="ev-award-title-wrap">
                    <strong className="display">{award.rankOrTier}</strong>
                    <div className="row" style={{ gap: 6, flexWrap: "wrap" }}>
                      {track ? (
                        <span className="pill">{track.trackType === "Creator" ? "Nhánh Sáng tác" : "Nhánh Gia đình"}</span>
                      ) : award.targetAudience ? (
                        <span className="pill">{EVENT_AUDIENCE_LABEL[award.targetAudience]}</span>
                      ) : null}
                      <span className="pill">{awards.length} suất</span>
                    </div>
                  </div>
                </div>
                <p className="ev-award-name">{award.rewardName}</p>
                <div className="ev-award-value-row">
                  {awardValueText(award) && <strong className="ev-award-value">{awardValueText(award)}</strong>}
                  <span className="ev-award-type">{REWARD_TYPE_LABEL[award.rewardType]}</span>
                </div>
              </li>
            );
          })}</ul>
        ) : <p className="sub">Chưa công bố cơ cấu giải thưởng.</p>}
      </section>
    </div>
  );
}
