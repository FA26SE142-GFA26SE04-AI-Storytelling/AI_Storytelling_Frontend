"use client";

import { BookOpenText, Eye, Flag, Heart, Lightbulb, Route, Sparkles, UserRound } from "lucide-react";
import Frog from "@/app/components/brand/Frog";
import StoryHandoverButton from "@/app/features/kid/StoryHandoverButton";
import { usePop } from "@/app/lib/motion";
import { ageLabel, type StoryCard } from "@/app/lib/storyView";
import BookCover from "./BookCover";
import { isReady } from "./useLibraryStories";

const sourceLabel = (s: StoryCard) => (s.creator ? "Nhà sáng tạo" : s.fromAi ? "Do AI tạo" : "Nhập sẵn");
const n = (v: number) => v.toLocaleString("vi-VN");

type Props = {
  story: StoryCard | null;
  onKid?: (childId: number, storyId: number) => void;
  onRoadmap: () => void;
  onReport: () => void;
  onPreview: () => void;
};

/** Nội dung khung "Chi tiết" bên phải: bìa, nhãn, số liệu, bài học và các việc phụ huynh làm được với truyện. */
export default function StoryDetail({ story, onKid, onRoadmap, onReport, onPreview }: Props) {
  const ref = usePop<HTMLDivElement>(story?.id ?? null, 0.96);
  if (!story) {
    return (
      <div className="lib-detail-empty">
        <Frog size={96} mood="think" />
        <b className="display">Chọn một truyện</b>
        <p className="sub">Bấm vào bìa truyện để xem nội dung, bài học và cho bé đọc.</p>
      </div>
    );
  }
  const ready = isReady(story);
  return (
    <div ref={ref} className="lib-detail">
      <BookCover url={story.raw.coverImageUrl} title={story.title} seed={story.id} className="lib-detail-cover" />
      <h3 className="display lib-detail-title">{story.title}</h3>
      <div className="lib-tags">
        <span className="lib-tag age">{ageLabel(story.ageBand)}</span>
        {story.topic && <span className="lib-tag">{story.topic}</span>}
        <span className="lib-tag">{sourceLabel(story)}</span>
      </div>
      <div className="lib-stats">
        {story.viewCount !== undefined && <span title="Lượt đọc"><Eye className="ic" />{n(story.viewCount)} lượt đọc</span>}
        {story.favoriteCount !== undefined && <span title="Lượt yêu thích"><Heart className="ic" />{n(story.favoriteCount)}</span>}
        {story.words > 0 && <span title="Độ dài"><BookOpenText className="ic" />{n(story.words)} chữ</span>}
      </div>
      {story.raw.description && <p className="lib-desc">{story.raw.description}</p>}
      {story.raw.moralLesson && (
        <div className="lib-lesson">
          <Lightbulb className="ic" aria-hidden />
          <div><b>Bài học</b><p>{story.raw.moralLesson}</p></div>
        </div>
      )}
      {story.by && <p className="lib-by"><UserRound className="ic" aria-hidden />Người tạo: <b>{story.by}</b></p>}

      {ready ? (
        <div className="lib-actions">
          <StoryHandoverButton storyId={story.id} title={story.title} onKid={onKid} />
          <button className="btn btn-p btn-c" onClick={onRoadmap}><Route className="ic" />Thêm vào lộ trình</button>
          <div className="lib-actions-minor">
            <button className="btn btn-s" onClick={onPreview}><Eye className="ic" />Xem trước</button>
            <button className="btn btn-g" onClick={onReport}><Flag className="ic" />Báo cáo</button>
          </div>
        </div>
      ) : (
        <p className="lib-preparing" role="status"><Sparkles className="ic" aria-hidden />Truyện đã được duyệt, đang chuẩn bị tranh và giọng đọc. Bé sẽ đọc được khi hoàn tất.</p>
      )}
    </div>
  );
}
