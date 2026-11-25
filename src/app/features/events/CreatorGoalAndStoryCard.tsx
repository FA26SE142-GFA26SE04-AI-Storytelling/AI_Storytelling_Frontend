"use client";

import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Circle, Trophy } from "lucide-react";
import Dialog from "@/app/components/Dialog";
import { creatorService } from "@/app/services/creatorService";
import type { CreatorDraft } from "@/app/types/creator";
import { formatVnDateTime } from "./eventTime";
import {
  REWARD_TYPE_LABEL,
  type EventDetailDto,
  type EventParticipationDto,
  type EventSubmissionDto,
} from "@/app/types/event";

export type CreatorGoalAndStoryCardProps = {
  detail: EventDetailDto;
  participation: EventParticipationDto;
  submission: EventSubmissionDto | null;
  activeStoryId: number;
  eligibleCount: number;
};

/** Hiển thị lộ trình mục tiêu đạt giải Creator và nội dung chi tiết của truyện dự thi. */
export default function CreatorGoalAndStoryCard({
  detail,
  participation,
  submission,
  activeStoryId,
  eligibleCount,
}: CreatorGoalAndStoryCardProps) {
  const [storyDetail, setStoryDetail] = useState<CreatorDraft | null>(null);
  const [openStoryId, setOpenStoryId] = useState<number | null>(null);
  const [preview, setPreview] = useState<{ storyId: number; content: string; error?: string } | null>(null);

  useEffect(() => {
    if (!activeStoryId) return;
    let active = true;
    void creatorService.get(activeStoryId).then((res) => {
      if (active) setStoryDetail(res.ok ? res.data : null);
    });
    return () => {
      active = false;
    };
  }, [activeStoryId]);

  const story = storyDetail?.storyId === activeStoryId ? storyDetail : null;
  const readOpen = openStoryId === activeStoryId;
  const openPreview = async () => {
    if (!story) return;
    setPreview(null);
    setOpenStoryId(story.storyId);
    const versionId = submission?.lockedStoryVersionId || submission?.currentStoryVersionId || story.selectedVersionId;
    if (!versionId) {
      setPreview({ storyId: story.storyId, content: "", error: "Truyện chưa có nội dung văn bản." });
      return;
    }
    const result = await creatorService.version(story.storyId, versionId);
    setPreview({ storyId: story.storyId, content: result.data?.content ?? "", error: result.ok ? undefined : result.message });
  };

  const creatorTrack = detail.tracks.find((t) => t.trackType === "Creator");
  const creatorAwards = detail.awards.filter((a) => !creatorTrack || a.trackId === creatorTrack.id);
  const awardGroups = Array.from(
    creatorAwards.reduce((map, aw) => {
      const key = `${aw.rankOrTier}|${aw.rewardName}`;
      map.set(key, [...(map.get(key) ?? []), aw]);
      return map;
    }, new Map<string, typeof creatorAwards>()),
  );

  const milestones = [
    { label: "Đăng ký tham gia nhánh Creator", done: true },
    { label: "Chuẩn bị truyện dự thi (chọn truyện hiện có hoặc tạo truyện AI mới)", done: eligibleCount > 0 || Boolean(submission) },
    { label: "Nộp truyện dự thi trước hạn chót", done: Boolean(submission) },
    { label: "Đạt kiểm duyệt an toàn & độ trùng lặp hợp lệ", done: submission?.status === "Approved" },
    {
      label: "Được chấm điểm & xác minh đủ điều kiện xét giải",
      done: participation.status === "Verified" || (submission?.evaluationCount ?? 0) > 0,
    },
  ];
  const doneCount = milestones.filter((m) => m.done).length;
  const pct = Math.round((doneCount / milestones.length) * 100);

  return (
    <>
      <div className="ev-card">
        <div className="ev-card-head">
          <h3 className="display">Mục tiêu đạt phần thưởng Creator</h3>
          <span className="pill">
            {doneCount} / {milestones.length} chặng
          </span>
        </div>
        <div className="ev-progress-track" aria-hidden="true">
          <div className="ev-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="ev-task-list">
          {milestones.map((m) => (
            <div key={m.label} className={`ev-task-row${m.done ? " done" : ""}`}>
              <div className="row" style={{ gap: 8 }}>
                {m.done ? (
                  <CheckCircle2 className="ic" style={{ color: "var(--ok-ink)" }} aria-hidden="true" />
                ) : (
                  <Circle className="ic" style={{ color: "var(--muted)" }} aria-hidden="true" />
                )}
                <span>{m.label}</span>
              </div>
            </div>
          ))}
        </div>
        {awardGroups.length > 0 && (
          <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
            <Trophy className="ic" aria-hidden="true" />
            <span className="sub">Giải thưởng nhánh Sáng tác:</span>
            {awardGroups.map(([key, items]) => {
              const first = items[0];
              return (
                <span key={key} className="pill">
                  {first.rankOrTier} ({items.length} suất) ·{" "}
                  {first.unitValueVnd > 0
                    ? `${first.unitValueVnd.toLocaleString("vi-VN")} đ`
                    : `${first.creditGrantAmount} lượt`}{" "}
                  ({REWARD_TYPE_LABEL[first.rewardType]})
                </span>
              );
            })}
          </div>
        )}
      </div>

      {story && (
        <div className="ev-card">
          <div className="ev-card-head">
            <h3 className="display">Chi tiết câu chuyện dự thi</h3>
            <button type="button" className="btn btn-s" onClick={() => void openPreview()}>
              <BookOpen className="ic" aria-hidden="true" />
              Xem nội dung đầy đủ
            </button>
          </div>
          <div className="ev-task-row">
            <b>
              #{story.storyId} · {story.title || "Chưa đặt tên"}
            </b>
            <span className="sub">
              {story.genre || "Chưa phân loại"} · {story.ageBand} tuổi · Trạng thái: {story.status} ·
              Ngày tạo: {formatVnDateTime(story.createdAt)}
            </span>
            {story.description && (
              <p className="sub" style={{ margin: 0 }}>
                {story.description}
              </p>
            )}
          </div>
        </div>
      )}

      {readOpen && story && (
        <Dialog title={story.title || `Truyện #${story.storyId}`} wide onClose={() => setOpenStoryId(null)}>
          <div className="ev-create-scroll sec" style={{ gap: 10 }}>
            <p className="sub" style={{ margin: 0 }}>
              {story.genre || "Chưa phân loại"} · {story.ageBand} tuổi
            </p>
            <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.65 }}>
              {preview?.storyId !== story.storyId ? "Đang tải nội dung…" : preview.error || preview.content || "Truyện chưa có nội dung văn bản."}
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
