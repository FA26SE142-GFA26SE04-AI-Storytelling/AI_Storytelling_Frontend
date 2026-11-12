'use client';
import { useState } from 'react';
import type * as B from '@/app/types/backendContracts';
import LearningMaterials from './LearningMaterials';
import { ManuscriptCard, SceneCardShell, countWords } from './ModerationInspectionPrimitives';
import ReviewPicture, { ZoomLightbox } from './ReviewPicture';

const SCOPE_LABELS: Record<string, string> = {
  Parent: 'Truyện gia đình (ẩn danh)',
  Creator: 'Truyện Creator',
  Public: 'Thư viện công khai',
};

const AGE_LABELS: Record<string, string> = { '6-8': '6–8 tuổi', '9-10': '9–10 tuổi' };

/** Khối Nội dung bị báo cáo (cảnh, tranh, âm thanh, học liệu, thảo luận) tách gọn khỏi quyết định xử lý. */
export default function ReportedContentSection({ detail: d }: { detail: B.ContentReportDetailDto }) {
  const [zoom, setZoom] = useState<{ url: string; alt: string } | null>(null);
  const sortedScenes = d.scenes.slice().sort((a, b) => a.sceneIndex - b.sceneIndex);

  return (
    <div id="cr-sec-content" className="st-group mod-anchor-target">
      <b className="st-group-title">Nội dung bị báo cáo</b>
      <div className="st-facts">
        <div><small>Mã truyện</small><b>#{d.story.storyId}</b></div>
        <div><small>Phiên bản báo cáo</small><b>{d.version ? `Bản ${d.version.versionNo}` : 'Không gắn phiên bản cụ thể'}</b></div>
        <div><small>Độ tuổi</small><b>{AGE_LABELS[d.story.ageBand] ?? d.story.ageBand}</b></div>
        <div><small>Mức đọc</small><b>{d.story.readingLevel ?? '—'}</b></div>
        <div><small>Thể loại</small><b>{d.story.genre ?? '—'}</b></div>
        <div><small>Ngôn ngữ</small><b>{d.story.language === 'vi' ? 'Tiếng Việt' : d.story.language}</b></div>
        <div><small>Nguồn truyện</small><b>{SCOPE_LABELS[d.story.scope] ?? d.story.scope}</b></div>
        <div><small>Trạng thái lưu trữ</small><b>{d.story.isArchived ? 'Đã đánh dấu lưu trữ / gỡ' : 'Chưa gắn lưu trữ'}</b></div>
      </div>

      {d.story.labels.length > 0 && (
        <div className="st-label-pills">
          {d.story.labels.map(l => <span key={l.code} className="pill ok">{l.displayName}</span>)}
        </div>
      )}
      {(d.story.description || d.version?.lesson) && (
        <div className="mod-brief-pair">
          {d.story.description && <ManuscriptCard variant="brief" label="Mô tả truyện" text={d.story.description} />}
          {d.version?.lesson && <ManuscriptCard variant="brief" label="Bài học" text={d.version.lesson} />}
        </div>
      )}

      {sortedScenes.length > 0 && d.version?.content?.trim() && (
        <details className="mod-fulltext-acc">
          <summary>Đọc toàn văn phiên bản bị báo cáo ({countWords(d.version.content)} từ)</summary>
          <ManuscriptCard variant="story" label="Văn bản phiên bản bị báo cáo" text={d.version.content} />
        </details>
      )}

      {sortedScenes.length > 0 ? (
        <div className="st-scenes">
          {sortedScenes.map(sc => {
            const hasMedia = sc.imageUrls.length > 0 || sc.audioUrls.length > 0;
            return (
              <SceneCardShell
                key={sc.sceneIndex}
                sceneNumber={sc.sceneIndex + 1}
                prose={sc.text}
                hasMedia={hasMedia}
                mediaSlot={
                  <>
                    {sc.imageUrls.length > 0 && (
                      <div className="st-scene-part st-scene-pics">
                        <b className="st-scene-label">Tranh minh họa</b>
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
                  </>
                }
              />
            );
          })}
        </div>
      ) : d.version?.content ? (
        <ManuscriptCard variant="story" label="Văn bản phiên bản bị báo cáo" text={d.version.content} />
      ) : (
        <p className="sub">Phiên bản bị báo cáo chưa có nội dung cảnh hoặc văn bản.</p>
      )}

      <details open={d.vocabulary.length > 0 || d.quizzes.length > 0}>
        <summary>Học liệu đi kèm</summary>
        <LearningMaterials vocabulary={d.vocabulary} quizzes={d.quizzes} />
      </details>

      {d.discussionQuestions.length > 0 && (
        <div className="st-quote">
          <small>Câu hỏi thảo luận ({d.discussionQuestions.length})</small>
          {d.discussionQuestions.map((q, idx) => (
            <p key={idx}>{idx + 1}. {q.question}{q.isMoralLesson ? ' (Gợi ý bài học)' : ''}</p>
          ))}
        </div>
      )}

      <ZoomLightbox zoom={zoom} onClose={() => setZoom(null)} />
    </div>
  );
}
