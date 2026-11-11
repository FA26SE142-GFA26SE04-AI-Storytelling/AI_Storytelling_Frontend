'use client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import IconButton from '@/app/components/IconButton';
import type { GuideVersionDetail, GuideVersionSummary } from '@/app/types/authoringGuideManagement';
import type { PagedResult } from '@/app/types/backendContracts';

const STATUS: Record<string, string> = { Draft: 'Bản nháp', Published: 'Đã phát hành' };

/** Khối Lịch sử phiên bản hướng dẫn sáng tác (chỉ đọc; hủy request muộn khi đổi phiên bản/trang). */
export default function GuideHistorySection({
  history,
  page,
  version,
  hasDraft,
  disabled,
  onPageChange,
  onSelectVersion,
  onCreateDraftFrom,
}: {
  history: PagedResult<GuideVersionSummary> | null;
  page: number;
  version: GuideVersionDetail | null;
  hasDraft: boolean;
  disabled: boolean;
  onPageChange: (nextPage: number) => void;
  onSelectVersion: (versionId: number) => void;
  onCreateDraftFrom: (versionId: number) => void;
}) {
  return (
    <section className="st-card" aria-label="Lịch sử phiên bản hướng dẫn">
      <h3>Lịch sử phiên bản</h3>
      <div className="row st-wrap">
        {history?.items.map(v => (
          <button
            type="button"
            className={`btn btn-s${version?.version.versionId === v.versionId ? ' on' : ''}`}
            key={v.versionId}
            disabled={disabled}
            onClick={() => onSelectVersion(v.versionId)}
          >
            {v.catalogVersion} · {STATUS[v.status] ?? v.status}
          </button>
        ))}
      </div>
      <div className="row">
        <IconButton icon={ChevronLeft} label="Trang trước" className="btn btn-g" disabled={page === 1 || disabled} onClick={() => onPageChange(page - 1)} />
        <span className="sub">Trang {page}</span>
        <IconButton icon={ChevronRight} label="Trang sau" className="btn btn-g" disabled={!history?.hasNextPage || disabled} onClick={() => onPageChange(page + 1)} />
      </div>
      {version && (
        <article className="st-group">
          <h4>{version.version.catalogVersion} ({STATUS[version.version.status] ?? version.version.status} · chỉ đọc)</h4>
          {version.items.map(g => (
            <p key={g.id} style={{ whiteSpace: 'pre-wrap' }}>
              <b>{g.title}</b> · {g.instruction}
            </p>
          ))}
          {!hasDraft && version.version.status === 'Published' && (
            <div>
              <button type="button" className="btn btn-s" disabled={disabled} onClick={() => onCreateDraftFrom(version.version.versionId)}>
                Tạo nháp từ bản này
              </button>
            </div>
          )}
        </article>
      )}
    </section>
  );
}
