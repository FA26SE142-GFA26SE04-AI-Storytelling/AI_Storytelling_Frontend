"use client";

import { useEffect, useState } from "react";
import { showToast } from "@/app/lib/toast";
import { eventService } from "@/app/services/eventService";
import type { EventDetailDto, EventLeaderboardDto, EventMissionDashboardDto } from "@/app/types/event";
import { formatVnDateTime } from "./eventTime";

export default function CreatorEventBallot({ event }: { event: EventDetailDto }) {
  const [dashboard, setDashboard] = useState<EventMissionDashboardDto | null>(null);
  const [leaderboard, setLeaderboard] = useState<EventLeaderboardDto | null>(null);
  const [stars, setStars] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState(false);
  const schedule = event.creatorVotingSchedule;

  useEffect(() => {
    let active = true;
    void eventService.missionDashboard(event.id).then((result) => {
      if (active && result.success) setDashboard(result.data ?? null);
    });
    return () => { active = false; };
  }, [event.id]);

  async function vote(storyId: number, previous?: number | null) {
    setBusy(true);
    const result = await eventService.castVote(event.id, { storyId, stars: stars[storyId] ?? previous ?? 5 });
    setBusy(false);
    if (!result.success) {
      showToast(result.message || "Không gửi được phiếu bình chọn.", "err");
      return;
    }
    const refresh = await eventService.missionDashboard(event.id);
    if (refresh.success) setDashboard(refresh.data ?? null);
    showToast("Đã lưu phiếu bình chọn.", "ok");
  }

  if (!schedule) return null;
  const start = new Date(schedule.votingStartAt);
  const end = new Date(schedule.votingEndAt);
  const open = event.status === "Published" && Date.now() >= start.getTime() && Date.now() <= end.getTime();
  const parentEntries = leaderboard?.entries.filter((entry) => entry.authorTrackType === "Parent") ?? [];

  return (
    <div className="ev-card">
      <h3 className="display">Creator bình chọn truyện Parent</h3>
      <p className="sub">{formatVnDateTime(schedule.votingStartAt)} – {formatVnDateTime(schedule.votingEndAt)}</p>
      <div className="row">
        {event.status === "Published" && (
          <button type="button" className="btn btn-g" disabled={busy} onClick={() => void eventService.missionDashboard(event.id)
            .then((result) => { if (result.success) setDashboard(result.data ?? null); })}>Tải bài dự thi</button>
        )}
        <button type="button" className="btn btn-g" onClick={() => void eventService.leaderboard(event.id)
          .then((result) => { if (result.success) setLeaderboard(result.data ?? null); })}>Xem kết quả bài Parent</button>
      </div>
      {leaderboard?.hidden && <p className="sub">Kết quả sẽ hiện sau khi các hoạt động bình chọn kết thúc.</p>}
      {leaderboard && !leaderboard.hidden && (
        parentEntries.length === 0 ? <p className="sub">Chưa có bài Parent trong bảng kết quả.</p> :
          <ul>
            {parentEntries.map((entry) => (
              <li key={entry.submissionId}>
                {entry.rank > 0 ? `Hạng ${entry.rank} · ` : ""}{entry.storyTitle} · {entry.averageStars} sao ({entry.validVoteCount} phiếu)
              </li>
            ))}
          </ul>
      )}
      {dashboard && <p className="sub">Nhiệm vụ đã hoàn thành {dashboard.completedTasksCount}/{dashboard.tasks.length}</p>}
      {open && dashboard?.stories.length === 0 && <p className="sub">Chưa có bài đã duyệt để bình chọn.</p>}
      {open && dashboard?.stories.map((story) => (
        <details key={story.storyId} className="ev-task-row">
          <summary>{story.title}</summary>
          <div style={{ whiteSpace: "pre-wrap" }}>{story.votingText}</div>
          <label className="ev-field">
            <span>Số sao</span>
            <select className="inp" value={stars[story.storyId] ?? story.myVoteStars ?? 5}
              onChange={(e) => setStars((prev) => ({ ...prev, [story.storyId]: Number(e.target.value) }))}>
              {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} sao</option>)}
            </select>
          </label>
          <button type="button" className="btn btn-s" disabled={busy} onClick={() => void vote(story.storyId, story.myVoteStars)}>
            {story.myVoteStars ? "Cập nhật phiếu" : "Gửi bình chọn"}
          </button>
        </details>
      ))}
    </div>
  );
}
