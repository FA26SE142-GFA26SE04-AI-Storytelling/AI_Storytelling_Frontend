'use client';
import { useEffect, useRef, useState, type SetStateAction } from 'react';
import { Archive, ChevronLeft, ChevronRight, CircleAlert, Copy, RefreshCw, X } from 'lucide-react';
import Dialog from '@/app/components/Dialog';
import IconButton from '@/app/components/IconButton';
import Select from '@/app/components/Select';
import Frog from '@/app/components/brand/Frog';
import { useAuth } from '@/app/context/AuthContext';
import { moderationService } from '@/app/services/moderationService';
import { roadmapTemplateService } from '@/app/services/roadmapTemplateService';
import type * as B from '@/app/types/backendContracts';
import { Page, fmt } from './ui';

const AGE_LABELS: Record<string, string> = { '6-8': '6–8 tuổi', '9-10': '9–10 tuổi' };

/** Tài liệu 08 — Phân khu Đang phát hành (PublishedContentReview?source=RoadmapTemplate) và Lưu trữ (group=Archived). */
export default function RoadmapPublishedView({
  mode,
  onCloneToDraft,
}: {
  mode: 'published' | 'archived';
  onCloneToDraft?: (roadmapId: number) => void;
}) {
  const { user } = useAuth();
  const isModerator = user?.role === 'Moderator';
  const [ageBand, setAgeBand] = useState('');
  const [pages, setPages] = useState({ published: 1, archived: 1 });
  const page = pages[mode];
  const setPage = (next: SetStateAction<number>) => setPages(current => ({
    ...current,
    [mode]: typeof next === 'function' ? next(current[mode]) : next,
  }));
  const [pubList, setPubList] = useState<B.PagedResult<B.PublishedContentItemDto> | null>(null);
  const [pubDetail, setPubDetail] = useState<B.PublishedRoadmapDto | null>(null);
  const [archList, setArchList] = useState<B.PagedResult<B.RoadmapListItemDto> | null>(null);
  const [archDetail, setArchDetail] = useState<B.RoadmapDetailDto | null>(null);
  const [archivingId, setArchivingId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [rev, setRev] = useState(0);
  const scope = useRef(Symbol());
  const detailScope = useRef(Symbol());

  useEffect(() => {
    const run = Symbol();
    scope.current = run;
    detailScope.current = Symbol();
    const controller = new AbortController();
    setBusy(false);
    setPubList(null);
    setPubDetail(null);
    setArchList(null);
    setArchDetail(null);
    setNote('');

    if (mode === 'published') {
      void moderationService.published({ source: 'RoadmapTemplate', ageBand: ageBand || null, pageIndex: page, pageSize: 20 }, controller.signal).then(r => {
        if (scope.current !== run) return;
        setPubList(r.data);
        if (!r.success) setNote(r.message);
      });
    } else {
      void roadmapTemplateService.list('Archived', page, controller.signal).then(r => {
        if (scope.current !== run) return;
        setArchList(r.data);
        if (!r.success) setNote(r.message);
      });
    }

    return () => {
      scope.current = Symbol();
      detailScope.current = Symbol();
      controller.abort();
    };
  }, [mode, ageBand, page, rev, user?.id]);

  const openPublished = async (id: number) => {
    const run = scope.current;
    const detailRun = Symbol();
    detailScope.current = detailRun;
    setBusy(true);
    setPubDetail(null);
    setNote('');
    const r = await moderationService.publishedRoadmap(id);
    if (scope.current !== run || detailScope.current !== detailRun) return;
    setBusy(false);
    if (r.success && r.data) {
      setPubDetail(r.data);
      return;
    }
    if (r.status === 404) {
      setPubDetail(null);
      setNote('Lộ trình này không còn công khai hoặc vừa bị lưu trữ. Danh sách đã được tải lại.');
      setRev(v => v + 1);
      return;
    }
    setNote(r.message);
  };

  const openArchived = async (id: number) => {
    const run = scope.current;
    const detailRun = Symbol();
    detailScope.current = detailRun;
    setBusy(true);
    setArchDetail(null);
    setNote('');
    const r = await roadmapTemplateService.get(id);
    if (scope.current !== run || detailScope.current !== detailRun) return;
    setBusy(false);
    if (r.success && r.data) setArchDetail(r.data);
    else setNote(r.message);
  };

  const cloneRoadmap = async (id: number) => {
    const run = scope.current;
    setBusy(true);
    const r = await roadmapTemplateService.clone(id);
    if (scope.current !== run) return;
    setBusy(false);
    setNote(r.message || (r.success ? 'Đã nhân bản lộ trình thành bản nháp.' : 'Không nhân bản được.'));
    if (r.success && r.data) onCloneToDraft?.(r.data.roadmapId);
  };

  const submitArchive = async () => {
    if (archivingId == null || reason.trim().length < 3 || busy) return;
    const run = scope.current;
    setBusy(true);
    const r = await roadmapTemplateService.archive(archivingId, reason.trim());
    if (scope.current !== run) return;
    setBusy(false);
    setNote(r.message || (r.success ? 'Đã lưu trữ lộ trình.' : 'Chưa lưu trữ được.'));
    if (r.success) {
      setArchivingId(null);
      setReason('');
      setRev(v => v + 1);
    }
  };

  return (
    <Page fit title={mode === 'published' ? 'Lộ trình đang phát hành' : 'Lộ trình đã lưu trữ'}>
      {note && <div className="notice" role="status" data-inline-notice>{note}</div>}
      <div className="st-split fill rt">
        <div className="st-list rt-side">
          <div className="row st-wrap">
            {mode === 'published' && (
              <Select<string>
                ariaLabel="Lọc theo độ tuổi"
                value={ageBand}
                options={[{ value: '', label: 'Mọi độ tuổi' }, { value: '6-8', label: '6–8 tuổi' }, { value: '9-10', label: '9–10 tuổi' }]}
                onChange={v => { setAgeBand(v); setPage(1); }}
              />
            )}
            <IconButton icon={RefreshCw} label="Tải lại" className="btn btn-g" disabled={busy} onClick={() => setRev(v => v + 1)} />
          </div>

          {mode === 'published' ? (
            <>
              {pubList && pubList.items.length === 0 && <p className="empty-line">Chưa có lộ trình đang phát hành.</p>}
              {pubList?.items.map(item => (
                <button type="button" key={item.id} className={`st-item rt-item${pubDetail?.roadmapId === item.id ? ' on' : ''}`} onClick={() => void openPublished(item.id)}>
                  <b>{item.title}</b>
                  <span className="rt-pills">
                    <span className="pill ok">Đang công khai</span>
                    <span className="pill draft">{AGE_LABELS[item.ageBand] ?? item.ageBand}</span>
                    {item.storyCount != null && <span className="pill draft">{item.storyCount} truyện</span>}
                    {item.needsUpdate && <span className="pill wait">Cần cập nhật</span>}
                  </span>
                  {item.publishedAt && <small>Phát hành: {fmt(item.publishedAt)}</small>}
                </button>
              ))}
              {pubList && (page > 1 || pubList.hasNextPage) && (
                <div className="rt-pager">
                  <IconButton icon={ChevronLeft} label="Trang trước" className="btn btn-g" disabled={page === 1} onClick={() => setPage(p => p - 1)} />
                  <span>Trang {page}</span>
                  <IconButton icon={ChevronRight} label="Trang sau" className="btn btn-g" disabled={!pubList.hasNextPage} onClick={() => setPage(p => p + 1)} />
                </div>
              )}
            </>
          ) : (
            <>
              {archList && archList.items.length === 0 && <p className="empty-line">Chưa có lộ trình nào trong kho lưu trữ (Archived).</p>}
              {archList?.items.map(item => (
                <button type="button" key={item.id} className={`st-item rt-item${archDetail?.id === item.id ? ' on' : ''}`} onClick={() => void openArchived(item.id)}>
                  <b>{item.name}</b>
                  <span className="rt-pills">
                    <span className="pill draft">Đã lưu trữ</span>
                    <span className="pill draft">{item.storyCount} truyện</span>
                    {item.needsUpdate && <span className="pill wait">Có truyện đã rút/ẩn</span>}
                  </span>
                  {item.publishedAt && <small>{fmt(item.publishedAt)}</small>}
                </button>
              ))}
              {archList && (page > 1 || archList.hasNextPage) && (
                <div className="rt-pager">
                  <IconButton icon={ChevronLeft} label="Trang trước" className="btn btn-g" disabled={page === 1} onClick={() => setPage(p => p - 1)} />
                  <span>Trang {page}</span>
                  <IconButton icon={ChevronRight} label="Trang sau" className="btn btn-g" disabled={!archList.hasNextPage} onClick={() => setPage(p => p + 1)} />
                </div>
              )}
            </>
          )}
        </div>

        {mode === 'published' && pubDetail ? (
          <section className="st-card rt-editor">
            <header className="rt-head">
              <h3 className="display">{pubDetail.name}</h3>
              <span className="pill ok">Đang phát hành</span>
              {pubDetail.needsUpdate && <span className="pill wait">Cần cập nhật</span>}
            </header>
            {pubDetail.needsUpdate && (
              <p className="notice warn" role="status" data-inline-notice>
                Lộ trình có truyện thành phần đã bị lưu trữ hoặc ngừng công khai. Hãy nhân bản để thay thế truyện và gửi duyệt lại.
              </p>
            )}
            <div className="st-facts">
              <div><small>Mã lộ trình</small><b>#{pubDetail.roadmapId}</b></div>
              <div><small>Độ tuổi</small><b>{AGE_LABELS[pubDetail.ageBand] ?? pubDetail.ageBand}</b></div>
              <div><small>Chủ đề chính</small><b>{pubDetail.mainCategory?.displayName ?? '—'}</b></div>
              <div><small>Mức đọc</small><b>Mức {pubDetail.readingLevelMin} – {pubDetail.readingLevelMax}</b></div>
              <div><small>Phát hành</small><b>{pubDetail.publishedAt ? fmt(pubDetail.publishedAt) : '—'}</b></div>
            </div>
            {pubDetail.description && <div className="st-quote"><small>Mô tả</small><p>{pubDetail.description}</p></div>}
            <div className="st-group">
              <b className="st-group-title">Truyện thành phần ({pubDetail.stories.length})</b>
              <div className="st-storylist">
                {pubDetail.stories.slice().sort((a, b) => a.position - b.position).map((s, idx) => (
                  <div className={`st-storyrow${s.isArchived ? ' bad' : ''}`} key={s.storyId}>
                    <b>{idx + 1}. {s.title || `Truyện #${s.storyId}`}</b>
                    <span>
                      {AGE_LABELS[s.ageBand] ?? s.ageBand}
                      {s.days != null ? ` · ${s.days} ngày` : ''}
                      {s.isArchived ? ' · Truyện đã lưu trữ/gỡ' : ' · Đang công khai'}
                      {s.isArchived && <CircleAlert className="ic" aria-hidden />}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {isModerator && (
              <div className="row st-wrap">
                <button type="button" className="btn btn-s" disabled={busy} onClick={() => void cloneRoadmap(pubDetail.roadmapId)}>
                  <Copy className="ic" />Nhân bản để sửa
                </button>
                <button type="button" className="btn btn-no" disabled={busy} onClick={() => { setReason(''); setArchivingId(pubDetail.roadmapId); }}>
                  <Archive className="ic" />Lưu trữ
                </button>
              </div>
            )}
          </section>
        ) : mode === 'archived' && archDetail ? (
          <section className="st-card rt-editor">
            <header className="rt-head">
              <h3 className="display">{archDetail.name}</h3>
              <span className="pill draft">Đã lưu trữ (Archived)</span>
            </header>
            <p className="notice" role="status" data-inline-notice>
              Đây là các lộ trình mẫu đã chuyển sang trạng thái Archived (lấy trực tiếp từ group=Archived, tách biệt với hồ sơ bị từ chối ở hàng đợi).
            </p>
            <div className="st-facts">
              <div><small>Mã lộ trình</small><b>#{archDetail.id}</b></div>
              <div><small>Độ tuổi</small><b>{AGE_LABELS[archDetail.ageBand] ?? archDetail.ageBand}</b></div>
              <div><small>Chủ đề chính</small><b>{archDetail.mainCategory?.displayName ?? '—'}</b></div>
              <div><small>Mức đọc</small><b>Mức {archDetail.readingLevelMin} – {archDetail.readingLevelMax}</b></div>
            </div>
            {archDetail.description && <div className="st-quote"><small>Mô tả</small><p>{archDetail.description}</p></div>}
            <div className="st-group">
              <b className="st-group-title">Truyện thành phần ({archDetail.stories.length})</b>
              <div className="st-storylist">
                {archDetail.stories.slice().sort((a, b) => a.position - b.position).map((s, idx) => {
                  const retired = archDetail.retiredStoryIds.includes(s.storyId) || !s.isEligible;
                  return (
                    <div className={`st-storyrow${retired ? ' bad' : ''}`} key={s.storyId}>
                      <b>{idx + 1}. {s.title || `Truyện #${s.storyId}`}</b>
                      <span>
                        {retired ? 'Không còn đủ điều kiện / đã rút' : 'Còn đủ điều kiện'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ) : (
          <div className="st-card st-empty">
            <Frog size={120} mood="think" />
            <b className="display">Chọn một lộ trình để xem</b>
          </div>
        )}
      </div>

      {archivingId != null && (
        <Dialog title="Lưu trữ lộ trình" onClose={() => { if (!busy) setArchivingId(null); }}>
          <p style={{ margin: 0 }}>Lộ trình sẽ ngừng hiển thị trong thư viện của phụ huynh.</p>
          <label className="field">
            <span className="lbl">Lý do <em className="rt-req">*</em></span>
            <textarea className="inp" rows={3} maxLength={500} value={reason} onChange={e => setReason(e.target.value)} placeholder="Ít nhất 3 ký tự" autoFocus />
          </label>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-g" disabled={busy} onClick={() => setArchivingId(null)}><X className="ic" />Hủy</button>
            <button type="button" className="btn btn-no" disabled={busy || reason.trim().length < 3} onClick={() => void submitArchive()}><Archive className="ic" />Lưu trữ</button>
          </div>
        </Dialog>
      )}
    </Page>
  );
}
