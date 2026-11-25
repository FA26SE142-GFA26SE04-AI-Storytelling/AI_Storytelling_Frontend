"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { showToast } from "@/app/lib/toast";
import { eventService } from "@/app/services/eventService";
import { storyService } from "@/app/services/storyService";
import { parentAuthoringService } from "@/app/services/parentAuthoringService";
import { SUBMISSION_STATUS_LABEL, type EventDetailDto, type EventSubmissionDto } from "@/app/types/event";
import { formatVnDateTime } from "./eventTime";

export default function ParentEventSubmission({ event, onRefresh }: { event: EventDetailDto; onRefresh: () => void }) {
  const { user } = useAuth();
  const userId = Number(user?.id);
  const [stories, setStories] = useState<Array<{ id: number; title: string }>>([]);
  const [submission, setSubmission] = useState<EventSubmissionDto | null>(null);
  const [storyId, setStoryId] = useState(0);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const schedule = event.creatorVotingSchedule;

  useEffect(() => {
    if (!userId) return;
    let active = true;
    void Promise.all([
      storyService.getStories({ authorUserId: userId, pageIndex: 1, pageSize: 100, isDescending: true }),
      parentAuthoringService.mine(1, 100),
      eventService.mySubmission(event.id),
    ]).then(([storyResult, manualResult, submissionResult]) => {
        if (!active) return;
        const candidates = [
          ...(storyResult.data?.items ?? []),
          ...(manualResult.data?.items ?? []).map((story) => ({ ...story, id: story.storyId })),
        ].filter((story) => story.status.toLowerCase() === "ready");
        setStories([...new Map(candidates.map((story) => [story.id, story])).values()]);
        setSubmission(submissionResult.data ?? null);
        setLoaded(true);
      });
    return () => { active = false; };
  }, [event.id, userId]);

  async function submit() {
    if (!storyId || !consent || busy) return;
    setBusy(true);
    const result = await eventService.parentSubmit(event.id, storyId);
    setBusy(false);
    if (!result.success || !result.data) {
      showToast(result.message || "Không nộp được bài dự thi.", "err");
      return;
    }
    setSubmission(result.data);
    setConsent(false);
    showToast("Đã nộp bài và đang chờ Moderator duyệt.", "ok");
    onRefresh();
  }

  if (!schedule) return null;
  const deadline = new Date(schedule.submissionCutoffAt);
  const canSubmit = loaded && event.status === "Published" && Date.now() <= deadline.getTime() &&
    (!submission || submission.status === "ChangesRequested");
  const submittedStoryId = submission?.storyId;

  return (
    <div className="ev-card">
      <h3 className="display">Parent nộp truyện dự thi</h3>
      <p className="sub">Hạn nộp {formatVnDateTime(schedule.submissionCutoffAt)}</p>
      {submission && <p>{submission.submittedTitle} · {SUBMISSION_STATUS_LABEL[submission.status]}</p>}
      {canSubmit && (
        <>
          {stories.length === 0 && <p className="sub">Bạn chưa có truyện sẵn sàng để nộp.</p>}
          <label className="ev-field">
            <span>Truyện của bạn</span>
            <select className="inp" value={storyId} onChange={(e) => setStoryId(Number(e.target.value))}>
              <option value={0}>Chọn truyện</option>
              {stories.filter((story) => !submittedStoryId || story.id === submittedStoryId)
                .map((story) => <option key={story.id} value={story.id}>{story.title}</option>)}
            </select>
          </label>
          <label className="row">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            Tôi đồng ý chia sẻ bản văn dự thi đã duyệt với Creator tham gia sự kiện.
          </label>
          <button type="button" className="btn btn-p" disabled={busy || !storyId || !consent} onClick={() => void submit()}>
            Nộp truyện dự thi
          </button>
        </>
      )}
    </div>
  );
}
