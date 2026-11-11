'use client';
import { useEffect, useRef, useState } from 'react';
import type * as B from '@/app/types/backendContracts';
import { moderationService as service } from '@/app/services/moderationService';
import { useAuth } from '@/app/context/AuthContext';
import Frog from '@/app/components/brand/Frog';
import Select from '@/app/components/Select';
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, Flag, RefreshCw, Send } from 'lucide-react';
import Dialog from '@/app/components/Dialog';
import { coverFor } from '@/app/lib/storyView';
import '@/app/features/library/library.css';
import '@/app/features/created/created.css';
import { Page } from './ui';
import StoryWishCards from './StoryWishCards';
import LearningMaterials from './LearningMaterials';
import ReviewPicture, { ZoomLightbox } from './ReviewPicture';

const REASONS: { value: B.ContentReportReasonName; label: string }[] = [
  ['SafetyConcern', 'Không an toàn'],
  ['Inappropriate', 'Không phù hợp'],
  ['WrongAgeBand', 'Không đúng độ tuổi'],
  ['Copyright', 'Bản quyền'],
  ['Cultural', 'Văn hóa'],
  ['Other', 'Khác'],
].map(([value, label]) => ({ value: value as B.ContentReportReasonName, label }));

const AGE_LABEL: Record<string, string> = { '6-8': '6–8 tuổi', '9-10': '9–10 tuổi' };

function formatDay(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('vi-VN');
}

export default function PublishedReviewWorkspace({ go }: { go?: (pageId: string) => void }) {
  const { user } = useAuth();
  const [source, setSource] = useState<B.PublishedContentSourceName>('PublicLibrary');
  const [page, setPage] = useState(1);
  const [ageBand, setAgeBand] = useState('');
  const [list, setList] = useState<B.PagedResult<B.PublishedContentItemDto> | null>(null);
  const [selectedItem, setSelectedItem] = useState<B.PublishedContentItemDto | null>(null);
  const [story, setStory] = useState<B.PublishedStoryContentDto | null>(null);
  const [roadmap, setRoadmap] = useState<B.PublishedRoadmapDto | null>(null);
  const [reason, setReason] = useState<B.ContentReportReasonName>('SafetyConcern');
  const [description, setDescription] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [createdReportId, setCreatedReportId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const [zoom, setZoom] = useState<{ url: string; alt: string } | null>(null);
  const scope = useRef(Symbol());

  useEffect(() => {
    const run = Symbol();
    scope.current = run;
    const controller = new AbortController();
    setList(null);
    setSelectedItem(null);
    setStory(null);
    setRoadmap(null);
    setMessage('');
    setCreatedReportId(null);
    setFailed(false);
    void service.published({ source, ageBand: ageBand || null, pageIndex: page, pageSize: 20 }, controller.signal).then(r => {
      if (scope.current !== run) return;
      setList(r.data);
      if (!r.success) {
        setFailed(true);
        setMessage(r.message);
      }
    });
    return () => {
      scope.current = Symbol();
      controller.abort();
    };
  }, [source, ageBand, page, user?.id, retry]);

  const handleUnavailable = (status: number | undefined, fallbackMsg: string) => {
    if (status === 404) {
      setStory(null);
      setRoadmap(null);
      setSelectedItem(null);
      setReportOpen(false);
      setMessage('Nội dung này không còn công khai hoặc đã bị gỡ. Danh sách đã được tải lại.');
      setRetry(n => n + 1);
      return;
    }
    setMessage(fallbackMsg);
  };

  const grantView = async () => {
    if (busy || (!story && !roadmap)) return;
    const run = scope.current;
    setBusy(true);
    const r = await service.grantReviewView(
      roadmap
        ? { sourceTab: 'roadmap_templates', storyId: null, storyVersionId: null, readingRoadmapId: roadmap.roadmapId }
        : { sourceTab: 'published_content', storyId: story!.story.storyId, storyVersionId: story!.version?.versionId ?? null, readingRoadmapId: null },
    );
    if (scope.current !== run) return;
    setBusy(false);
    if (r.success && r.data) {
      setMessage(`Quyền rà soát có hiệu lực đến ${new Date(r.data.expiresAt).toLocaleString('vi-VN')}.`);
    } else {
      handleUnavailable(r.status, r.message);
    }
  };

  const openStory = async (id: number) => {
    const run = scope.current;
    setBusy(true);
    const r = await service.publishedStory(id);
    if (scope.current !== run) return;
    setBusy(false);
    if (r.success) setStory(r.data);
    else handleUnavailable(r.status, r.message);
  };

  const open = async (item: B.PublishedContentItemDto) => {
    setSelectedItem(item);
    setStory(null);
    setRoadmap(null);
    setDescription('');
    setAttachmentUrl('');
    setMessage('');
    setCreatedReportId(null);
    // Source values are defined by PublishedContentSource, never inferred from the numeric id.
    if (item.source !== 'RoadmapTemplate') {
      await openStory(item.id);
      return;
    }
    const run = scope.current;
    setBusy(true);
    const r = await service.publishedRoadmap(item.id);
    if (scope.current !== run) return;
    setBusy(false);
    if (r.success) setRoadmap(r.data);
    else handleUnavailable(r.status, r.message);
  };

  const report = async () => {
    if (!story || busy) return;
    const run = scope.current;
    setBusy(true);
    const r = await service.createReviewItem({
      storyId: story.story.storyId,
      readingRoadmapId: roadmap?.roadmapId ?? null,
      reason,
      description: description.trim() || null,
      attachmentUrl: attachmentUrl.trim() || null,
    });
    if (scope.current !== run) return;
    setBusy(false);
    if (r.success && r.data) {
      setReportOpen(false);
      setCreatedReportId(r.data.reportId);
      const nextLabel = user?.role === 'Administrator' ? 'Hàng đợi quản trị' : 'Báo cáo nội dung';
      setMessage(`Đã tạo báo cáo #${r.data.reportId}. Mở ${nextLabel} để nhận xử lý theo quyền.`);
    } else {
      handleUnavailable(r.status, r.message);
    }
  };

  const inDetail = !!story || !!roadmap;
  const isModerator = user?.role === 'Moderator';
  const SOURCES = isModerator
    ? ([{ id: 'PublicLibrary', label: 'Truyện Creator đang công khai' }] as const)
    : ([
        { id: 'PublicLibrary', label: 'Truyện Creator đang công khai' },
        { id: 'RoadmapTemplate', label: 'Lộ trình mẫu công khai' },
      ] as const);

  const publishedDate = formatDay(roadmap?.publishedAt ?? selectedItem?.publishedAt ?? null);

  return (
    <Page title={isModerator ? 'Thư viện cộng đồng' : 'Rà soát thư viện'}>
      <div className="st-group" style={{ paddingTop: 0, paddingBottom: 8 }}>
        <h2 className="display" style={{ margin: 0, fontSize: 'var(--fs-xl)' }}>
          {isModerator ? 'Thư viện cộng đồng' : 'Rà soát thư viện'}
        </h2>
        <p className="sub">
          {isModerator
            ? 'Truyện Creator đang công khai trên thư viện (lộ trình mẫu đang phát hành xem tại Lộ trình mẫu → Đang phát hành).'
            : 'Truyện Creator và lộ trình mẫu đang công khai trên thư viện.'}
        </p>
      </div>

      {message && (
        <div className="notice row st-wrap" role="status" data-inline-notice>
          <span className="grow">{message}</span>
          {createdReportId != null && go && (
            <button
              type="button"
              className="btn btn-s"
              onClick={() => go(user?.role === 'Administrator' ? 'escalated' : 'content-reports')}
            >
              {user?.role === 'Administrator' ? 'Mở Hàng đợi quản trị' : 'Mở Báo cáo nội dung'}
            </button>
          )}
        </div>
      )}

      {inDetail ? (
        <>
          <div className="row">
            <button
              type="button"
              className="btn btn-g"
              onClick={() => {
                setStory(null);
                setRoadmap(null);
                setSelectedItem(null);
                setMessage('');
                setCreatedReportId(null);
              }}
            >
              <ArrowLeft className="ic" />Về thư viện
            </button>
          </div>
          <div className="st-card">
            <div className="st-group">
              <div className="row">
                <button type="button" className="btn btn-s" disabled={busy} onClick={() => void grantView()} title="Ghi nhận lượt xem để rà soát">
                  <Eye className="ic" />Bắt đầu rà soát
                </button>
              </div>
            </div>
            {roadmap && (
              <section>
                <div className="st-group">
                  <h3>{roadmap.name}</h3>
                  <p>{roadmap.description}</p>
                </div>
                <div className="st-group">
                  <b className="st-group-title">Truyện trong lộ trình</b>
                  <div className="row">
                    {roadmap.stories.map(s => (
                      <button type="button" className="btn btn-s" disabled={busy} key={s.storyId} onClick={() => void openStory(s.storyId)}>
                        {s.title}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}
            {story && (
              <section>
                <div className="st-group">
                  <h3>{story.story.title ?? `Truyện #${story.story.storyId}`}</h3>
                  <div className="st-facts">
                    <div><small>Nguồn</small><b>Truyện Creator</b></div>
                    <div><small>Độ tuổi</small><b>{AGE_LABEL[story.story.ageBand] ?? story.story.ageBand}</b></div>
                    <div><small>Mức đọc</small><b>{story.story.readingLevel ?? '—'}</b></div>
                    <div><small>Thể loại</small><b>{story.story.genre ?? '—'}</b></div>
                    {story.version?.versionNo != null && <div><small>Phiên bản</small><b>V{story.version.versionNo}</b></div>}
                    {publishedDate && <div><small>Ngày công khai</small><b>{publishedDate}</b></div>}
                  </div>
                  {story.story.labels.length > 0 && (
                    <div className="st-label-pills">
                      {story.story.labels.map(l => <span key={l.code} className="pill ok">{l.displayName}</span>)}
                    </div>
                  )}
                  {story.story.description && <div className="st-quote"><small>Mô tả</small><p>{story.story.description}</p></div>}
                  {story.version?.lesson && <div className="st-quote"><small>Bài học</small><p>{story.version.lesson}</p></div>}
                </div>

                <div className="st-group">
                  <b className="st-group-title">Nội dung &amp; media</b>
                  {story.scenes.length > 0 ? (
                    story.scenes.slice().sort((a, b) => a.sceneIndex - b.sceneIndex).map(sc => (
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
                    <p style={{ whiteSpace: 'pre-wrap' }}>{story.version?.content || 'Chưa có nội dung.'}</p>
                  )}
                </div>

                <div className="st-group">
                  <details open>
                    <summary>Học liệu</summary>
                    <LearningMaterials vocabulary={story.vocabulary} quizzes={story.quizzes} />
                  </details>
                </div>

                {(user?.role === 'Moderator' || user?.role === 'Administrator') && (
                  <StoryWishCards key={story.story.storyId} storyId={story.story.storyId} versionId={story.version?.versionId} />
                )}

                {user?.role === 'Moderator' && (
                  <div className="st-group">
                    <b className="st-group-title">Báo cáo nội dung</b>
                    <div className="row">
                      <button type="button" className="btn btn-s" disabled={busy} onClick={() => setReportOpen(true)}>
                        <Flag className="ic" />Tạo mục rà soát
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>

          {reportOpen && (
            <Dialog title="Tạo mục rà soát" onClose={() => setReportOpen(false)}>
              <div className="field">
                <span className="lbl">Lý do</span>
                <Select<B.ContentReportReasonName> ariaLabel="Lý do" value={reason} options={REASONS} onChange={setReason} />
              </div>
              <label className="field">
                <span className="lbl">Ghi chú rà soát</span>
                <textarea className="inp" rows={4} placeholder="Mô tả vấn đề bạn thấy ở nội dung này (không bắt buộc)" maxLength={2000} value={description} onChange={e => setDescription(e.target.value)} />
              </label>
              <label className="field">
                <span className="lbl">Nguồn đính kèm</span>
                <input className="inp" type="url" placeholder="Đường dẫn minh chứng, bắt đầu bằng https:// (không bắt buộc)" maxLength={500} value={attachmentUrl} onChange={e => setAttachmentUrl(e.target.value)} />
              </label>
              <div className="row">
                <button type="button" className="btn btn-g" disabled={busy} onClick={() => setReportOpen(false)}>Huỷ</button>
                <button type="button" className="btn btn-p" disabled={busy} onClick={() => void report()}>
                  <Send className="ic" />{busy ? 'Đang gửi…' : 'Gửi'}
                </button>
              </div>
            </Dialog>
          )}
          <ZoomLightbox zoom={zoom} onClose={() => setZoom(null)} />
        </>
      ) : (
        <div className="created">
          <div className="created-bar">
            <div className="created-pills" role="tablist" aria-label="Nguồn nội dung">
              {SOURCES.map(s => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={source === s.id}
                  className={source === s.id ? 'on' : ''}
                  disabled={busy}
                  onClick={() => { setSource(s.id); setPage(1); }}
                >
                  {s.label}
                  {source === s.id && list ? <em>{list.totalCount}</em> : null}
                </button>
              ))}
            </div>
            <div className="created-actions">
              <Select<string>
                className="created-select"
                ariaLabel="Lọc theo độ tuổi"
                value={ageBand}
                options={[{ value: '', label: 'Mọi độ tuổi' }, { value: '6-8', label: '6–8 tuổi' }, { value: '9-10', label: '9–10 tuổi' }]}
                onChange={v => { setAgeBand(v); setPage(1); }}
              />
            </div>
          </div>

          {list && list.items.length > 0 ? (
            <div className="created-grid">
              {list.items.map(i => {
                const pub = formatDay(i.publishedAt);
                return (
                  <button className="bk" key={`${i.source}:${i.id}`} disabled={busy} onClick={() => void open(i)} aria-label={`Xem ${i.title}`}>
                    <span className="bk-cover" style={{ background: coverFor() }}>
                      {i.needsUpdate && <span className="pill wait bk-badge">Cần cập nhật</span>}
                      <span className="bk-name display">{i.title}</span>
                    </span>
                    <span className="bk-title">{i.title}</span>
                    <span className="bk-meta">
                      {i.storyCount != null ? `${i.storyCount} truyện · ` : ''}
                      {AGE_LABEL[i.ageBand] ?? i.ageBand}
                      {pub ? ` · ${pub}` : ''}
                      {i.labels.length ? ` · ${i.labels.map(l => l.displayName).join(', ')}` : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : list ? (
            <div className="empty"><Frog size={110} mood="think" /><b className="display">Không có nội dung nào</b></div>
          ) : failed ? (
            <div className="empty">
              <Frog size={110} mood="think" />
              <b className="display">Chưa tải được nội dung</b>
              <button type="button" className="btn btn-s" onClick={() => setRetry(n => n + 1)}>
                <RefreshCw className="ic" />Thử lại
              </button>
            </div>
          ) : (
            <p className="sub">Đang tải…</p>
          )}

          <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
            <button type="button" className="btn btn-g" aria-label="Trang trước" title="Trang trước" disabled={busy || page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="ic" />
            </button>
            <span>Trang {page}</span>
            <button type="button" className="btn btn-g" aria-label="Trang tiếp" title="Trang tiếp" disabled={busy || !list?.hasNextPage} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="ic" />
            </button>
          </div>
        </div>
      )}
    </Page>
  );
}
