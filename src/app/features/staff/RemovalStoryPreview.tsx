'use client';

import { useEffect, useState } from 'react';
import { BookOpenText } from 'lucide-react';
import type * as B from '@/app/types/backendContracts';
import { moderationService } from '@/app/services/moderationService';
import ReviewPicture, { ZoomLightbox } from './ReviewPicture';

const AGE_LABEL: Record<string, string> = { '6-8': '6–8 tuổi', '9-10': '9–10 tuổi' };

/** Hiển thị nội dung câu chuyện công khai mà Creator yêu cầu gỡ để Moderator đối chiếu trước khi quyết định. */
export default function RemovalStoryPreview({ storyId }: { storyId?: number | null }) {
  const [story, setStory] = useState<B.PublishedStoryContentDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState<{ url: string; alt: string } | null>(null);

  useEffect(() => {
    if (storyId == null) {
      setStory(null);
      setLoading(false);
      setError('');
      return;
    }
    let alive = true;
    setLoading(true);
    setError('');
    setStory(null);
    moderationService.publishedStory(storyId).then(
      (r) => {
        if (!alive) return;
        setLoading(false);
        if (r.success && r.data) setStory(r.data);
        else setError(r.message || 'Không tải được nội dung công khai của truyện (truyện có thể đã được gỡ hoặc chưa công khai).');
      },
      (err) => {
        if (!alive) return;
        setLoading(false);
        setError(err instanceof Error ? err.message : 'Không tải được nội dung truyện.');
      },
    );
    return () => {
      alive = false;
    };
  }, [storyId]);

  if (storyId == null) {
    return (
      <div className="st-group">
        <b className="st-group-title">Nội dung câu chuyện yêu cầu gỡ</b>
        <p className="sub">Hồ sơ này chưa gắn mã truyện nên chưa thể tải nội dung.</p>
      </div>
    );
  }

  return (
    <div className="st-group">
      <b className="st-group-title row">
        <BookOpenText className="ic" aria-hidden />
        <span>Nội dung câu chuyện yêu cầu gỡ</span>
      </b>
      {loading && <p className="sub" role="status">Đang tải nội dung truyện…</p>}
      {!loading && error && (
        <div className="notice" role="status" data-inline-notice>
          <span>{error}</span>
        </div>
      )}
      {!loading && story && (
        <>
          <div className="st-facts">
            <div><small>Tên truyện</small><b>{story.story.title ?? `Truyện #${story.story.storyId}`}</b></div>
            <div><small>Độ tuổi</small><b>{AGE_LABEL[story.story.ageBand] ?? story.story.ageBand}</b></div>
            <div><small>Mức đọc</small><b>{story.story.readingLevel ?? '—'}</b></div>
            <div><small>Thể loại</small><b>{story.story.genre ?? '—'}</b></div>
            {story.version?.versionNo != null && <div><small>Phiên bản</small><b>V{story.version.versionNo}</b></div>}
          </div>
          {story.story.description && (
            <div className="st-quote"><small>Mô tả</small><p>{story.story.description}</p></div>
          )}
          {story.version?.lesson && (
            <div className="st-quote"><small>Bài học</small><p>{story.version.lesson}</p></div>
          )}
          {story.scenes.length > 0 ? (
            story.scenes.slice().sort((a, b) => a.sceneIndex - b.sceneIndex).map((sc) => (
              <section className="st-scene" key={sc.sceneIndex}>
                <b>Cảnh {sc.sceneIndex + 1}</b>
                <p className="st-scene-text">{sc.text}</p>
                {sc.imageUrls.length > 0 && (
                  <div className="st-scene-part st-scene-pics">
                    <b className="st-scene-label">Tranh minh hoạ</b>
                    <div className="st-pics">
                      {sc.imageUrls.map((url, idx) => (
                        <ReviewPicture key={idx} url={url} alt={`Cảnh ${sc.sceneIndex + 1}`} onZoom={(u, alt) => setZoom({ url: u, alt })} />
                      ))}
                    </div>
                  </div>
                )}
                {sc.audioUrls.length > 0 && (
                  <div className="st-scene-part st-scene-audio">
                    <b className="st-scene-label">Âm thanh</b>
                    {sc.audioUrls.map((url, idx) => (
                      <div key={idx} className="st-seg">
                        <audio controls preload="none" src={url} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))
          ) : (
            <p className="mod-pre">{story.version?.content || 'Chưa có nội dung.'}</p>
          )}
        </>
      )}
      <ZoomLightbox zoom={zoom} onClose={() => setZoom(null)} />
    </div>
  );
}
