'use client';

import React, { useEffect, useId, useState } from 'react';
import { History } from 'lucide-react';
import { aiStoryCreationService as api } from '../../../services/aiStoryCreationService';
import { OutlineVersionDto } from '../../../types/aiStory';
import { ThreeActsOutlineView } from './ThreeActsOutlineView';

export interface OutlineHistoryPanelProps {
  versions: OutlineVersionDto[] | null;
  selectedVersionNo: number | null;
  selectedVersion: OutlineVersionDto | null;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
  onSelect: (version: number) => void;
  onRefresh: () => void;
}

export function OutlineHistoryPanel({ versions, selectedVersionNo, selectedVersion, loading, detailLoading, error, onSelect, onRefresh }: OutlineHistoryPanelProps) {
  const selectId = useId();
  return <div className="space-y-4 pt-4">
    <p className="text-sm text-tod-text-muted">Chọn một phiên bản để xem lại. Việc xem lịch sử không thay đổi dàn ý đang dùng hoặc bắt đầu viết truyện.</p>
    <div className="flex flex-wrap items-end gap-3">
      {versions && versions.length > 0 && <div className="flex-1 min-w-48 space-y-1">
        <label htmlFor={selectId} className="text-sm font-bold text-tod-text">Phiên bản dàn ý</label>
        <select id={selectId} className="dashboard-input w-full" value={selectedVersionNo ?? ''} disabled={loading} onChange={event => onSelect(Number(event.target.value))}>
          {versions.map(version => <option key={version.versionNo} value={version.versionNo}>
            Phiên bản {version.versionNo}{version.isCurrent ? ' · Hiện hành' : ''}{version.outlineApprovedAt ? ' · Đã duyệt' : ''} — {version.title}
          </option>)}
        </select>
      </div>}
      <button type="button" disabled={loading} onClick={onRefresh} className="dashboard-card px-4 py-2">Tải lại lịch sử</button>
    </div>
    {loading && <p role="status">Đang tải lịch sử dàn ý...</p>}
    {error && <p role="alert" className="text-sm text-rose-500">{error}</p>}
    {!loading && versions?.length === 0 && <p>Chưa có dàn ý nào được lưu cho câu chuyện này.</p>}
    {detailLoading && <p role="status">Đang tải phiên bản đã chọn...</p>}
    {!loading && !detailLoading && selectedVersion && <>
      <p className="text-sm text-tod-text-muted">{selectedVersion.isCurrent ? 'Dàn ý hiện hành' : 'Bản lịch sử — chỉ xem'}{selectedVersion.outlineApprovedAt ? ' · Đã duyệt' : ''}</p>
      <ThreeActsOutlineView isEditing={false} outlineProgress={{ storyId: 0, storyStatus: '', currentVersion: selectedVersion, activeOperation: null, activeJobStatus: null, lastErrorCode: null }} />
    </>}
  </div>;
}

function OutlineHistoryContent({ storyId, currentVersionNo }: { storyId: number; currentVersionNo?: number }) {
  const [versions, setVersions] = useState<OutlineVersionDto[] | null>(null);
  const [selection, setSelection] = useState<number | null>(null);
  const [detail, setDetail] = useState<OutlineVersionDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setListError(null); setVersions(null); setSelection(null); setDetail(null);
    void api.getOutlineVersions(storyId, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setLoading(false);
      if (!result.success || !result.data) { setListError(result.message || 'Không thể tải lịch sử dàn ý.'); return; }
      const sorted = [...result.data].sort((a, b) => b.versionNo - a.versionNo);
      setVersions(sorted);
      setSelection(sorted.find(version => version.isCurrent)?.versionNo ?? sorted[0]?.versionNo ?? null);
    });
    return () => controller.abort();
  }, [storyId, currentVersionNo, run]);

  useEffect(() => {
    setDetail(null); setDetailError(null);
    if (selection === null) { setDetailLoading(false); return; }
    const controller = new AbortController();
    setDetailLoading(true);
    void api.getOutlineVersion(storyId, selection, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setDetailLoading(false);
      if (!result.success || !result.data || result.data.versionNo !== selection) {
        setDetailError(result.message || 'Không thể tải phiên bản dàn ý đã chọn.'); return;
      }
      setDetail(result.data);
    });
    return () => controller.abort();
  }, [storyId, selection, run]);

  return <OutlineHistoryPanel versions={versions} selectedVersionNo={selection} selectedVersion={detail?.versionNo === selection ? detail : null}
    loading={loading} detailLoading={detailLoading} error={listError || detailError}
    onSelect={version => { setDetail(null); setSelection(version); }} onRefresh={() => setRun(value => value + 1)} />;
}

export function AIStoryOutlineHistory({ storyId, currentVersionNo }: { storyId: number; currentVersionNo?: number }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return <section className="dashboard-card p-4">
    <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)} className="flex items-center gap-2 font-bold text-tod-text">
      <History className="h-4 w-4" aria-hidden="true" />{open ? 'Đóng lịch sử dàn ý' : 'Lịch sử dàn ý'}
    </button>
    {open && <div id={panelId}><OutlineHistoryContent key={storyId} storyId={storyId} currentVersionNo={currentVersionNo} /></div>}
  </section>;
}
