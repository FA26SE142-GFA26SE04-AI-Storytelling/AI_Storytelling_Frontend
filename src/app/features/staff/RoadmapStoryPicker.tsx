'use client';
import { useEffect, useMemo, useState } from 'react';
import type * as B from '@/app/types/backendContracts';
import { roadmapTemplateService as service } from '@/app/services/roadmapTemplateService';
import { useStoryCovers } from '@/app/features/roadmap/roadmapData';
import Dialog from '@/app/components/Dialog';
import IconButton from '@/app/components/IconButton';
import { Check, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';

/** Popup chọn truyện cho lộ trình: truyện đủ điều kiện theo độ tuổi của bộ, có ảnh bìa, tìm theo tên; bấm để thêm / bỏ. */
export default function RoadmapStoryPicker({
  ageBand,
  chosen,
  onAdd,
  onRemove,
  onClose,
}: {
  ageBand: string;
  chosen: number[];
  onAdd: (s: B.CandidateStoryDto) => void;
  onRemove: (id: number) => void;
  onClose: () => void;
}) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<B.PagedResult<B.CandidateStoryDto> | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    void service.candidates({ pageIndex: page, pageSize: 24, ageBand }, controller.signal).then(r => {
      if (!controller.signal.aborted) setData(r.data ?? null);
    });
    return () => controller.abort();
  }, [page, ageBand]);

  const needle = q.trim().toLowerCase();
  const shown = useMemo(
    () => (data?.items ?? []).filter(s => !needle || (s.title ?? '').toLowerCase().includes(needle)),
    [data, needle],
  );
  const cover = useStoryCovers(shown.map(s => s.storyId));

  return (
    <Dialog title={`Chọn truyện (${ageBand.replace('-', '–')} tuổi)`} onClose={onClose} wide>
      <label className="rt-search">
        <Search className="ic" aria-hidden />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm theo tên truyện" aria-label="Tìm theo tên truyện" autoFocus />
        {q && (
          <button type="button" className="btn btn-g icon-only" aria-label="Xoá tìm kiếm" onClick={() => setQ('')}>
            <X className="ic" />
          </button>
        )}
      </label>
      {!data ? (
        <p className="empty-line">Đang tải truyện…</p>
      ) : shown.length === 0 ? (
        <p className="empty-line">{needle ? 'Không có truyện khớp tên này ở trang hiện tại.' : 'Chưa có truyện đủ điều kiện cho độ tuổi này.'}</p>
      ) : (
        <div className="rt-pick">
          {shown.map(s => {
            const on = chosen.includes(s.storyId);
            return (
              <button type="button" key={s.storyId} className={`rt-pick-item${on ? ' on' : ''}`} aria-pressed={on} onClick={() => (on ? onRemove(s.storyId) : onAdd(s))}>
                <span className="rt-pick-cover" style={{ background: cover(s.storyId) }}>
                  {on && <span className="rt-pick-check"><Check /></span>}
                </span>
                <b>{s.title ?? `Truyện #${s.storyId}`}</b>
                <span className="rt-pills">
                  {s.readingLevel != null && <span className="pill draft">Mức {s.readingLevel}</span>}
                  {s.labels.slice(0, 2).map(l => <span key={l.id} className="pill draft">{l.displayName}</span>)}
                </span>
              </button>
            );
          })}
        </div>
      )}
      <div className="rt-pick-foot">
        {data && (page > 1 || data.hasNextPage) && (
          <span className="rt-pager">
            <IconButton icon={ChevronLeft} label="Trang trước" className="btn btn-g" disabled={page === 1} onClick={() => setPage(v => v - 1)} />
            <span>Trang {page}</span>
            <IconButton icon={ChevronRight} label="Trang sau" className="btn btn-g" disabled={!data.hasNextPage} onClick={() => setPage(v => v + 1)} />
          </span>
        )}
        <span className="pill ok">Đã chọn {chosen.length} truyện</span>
        <button type="button" className="btn btn-p" onClick={onClose}><Check className="ic" />Xong</button>
      </div>
    </Dialog>
  );
}
