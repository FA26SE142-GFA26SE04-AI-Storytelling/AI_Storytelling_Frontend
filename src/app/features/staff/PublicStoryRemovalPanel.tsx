'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, Check, RefreshCw, X } from 'lucide-react';
import { confirmDialog } from '@/app/lib/confirm';
import { useRiseIn } from '@/app/lib/motion';
import { moderationService } from '@/app/services/moderationService';
import type { QueueItem } from '@/app/types/staff';
import { Warn } from './PublicReviewEvidence';
import { ReviewPanelHeader } from './ReviewPanelHeader';
import { moderationStatusLabel } from './moderationConfig';
import { formatSubmittedAt, queueDueInfo } from './moderationQueueDisplay';
import { useReviewItem } from './useReviewItem';

/** Tài liệu 07 — Panel Yêu cầu gỡ truyện công khai: dùng metadata ModerationItemDetailDto, không suy diễn Flags/Creator. */
export default function PublicStoryRemovalPanel({
  id,
  queueItem,
  onDecision,
  onBack,
}: {
  id: number;
  queueItem?: QueueItem;
  onDecision: (outcome?: 'Approved' | 'Rejected') => void;
  onBack?: () => void;
}) {
  const { item, message, claimBlocked, busy, act, refresh } = useReviewItem(
    'PublicStoryRemoval',
    id,
    () => onDecision(),
  );
  const riseRef = useRiseIn<HTMLDivElement>('.st-group', [id, item ? 1 : 0], { delay: 40, distance: 10 });
  const [reason, setReason] = useState('');

  useEffect(() => {
    setReason('');
  }, [id]);

  if (!item || item.kind !== 'PublicStoryRemoval') {
    return (
      <div className="st-card">
        <p role="status">{message || 'Đang tải hồ sơ yêu cầu gỡ…'}</p>
        <div className="row st-wrap">
          {onBack && (
            <button type="button" className="btn btn-g" onClick={onBack}>
              <ArrowLeft className="ic" />Quay lại
            </button>
          )}
          <button type="button" className="btn btn-s" onClick={refresh}>
            <RefreshCw className="ic" />Tải lại
          </button>
        </div>
      </div>
    );
  }

  const d = item.data;
  const due = queueDueInfo(d.slaDueAt, d.status);
  const usableReason = !!reason.trim();
  const locked = busy || claimBlocked;

  const submitDecision = async (approve: boolean) => {
    const question = approve
      ? 'Chấp thuận gỡ truyện khỏi thư viện công khai? Hệ thống sẽ đánh dấu ngừng công khai (IsPublished=false, gắn RemovedAt) và chuyển hồ sơ sang Đã chấp thuận gỡ.'
      : 'Không chấp thuận yêu cầu gỡ truyện này? Lưu ý: thao tác không khẳng định truyện vẫn công khai nếu truyện đã bị gỡ từ báo cáo vi phạm khác.';
    if (!(await confirmDialog(question))) return;
    const trimmed = reason.trim();
    const ok = await act(
      () => moderationService.removalDecision(id, { approve, reason: trimmed, rowVersion: d.rowVersion }),
      true,
    );
    if (ok) onDecision(approve ? 'Approved' : 'Rejected');
  };

  return (
    <div className="st-card st-review" ref={riseRef}>
      <ReviewPanelHeader item={item} queueItem={queueItem} message={message} sourceTag="Yêu cầu gỡ truyện" />

      <div className="st-group">
        <b className="st-group-title">Thông tin yêu cầu gỡ (từ hàng đợi hiện có)</b>
        <div className="notice" role="status" data-inline-notice>
          <span>
            Chưa có thông tin chi tiết yêu cầu trong API hiện tại (lý do gỡ chi tiết và trạng thái hiển thị đầy đủ chưa được trả về trong{' '}
            <code>ModerationItemDetailDto</code>). Không gọi thay thế API Creator hoặc suy diễn từ trường kỹ thuật.
          </span>
        </div>
        <div className="st-facts">
          <div><small>Hồ sơ</small><b>#{d.id}</b></div>
          <div><small>Truyện</small><b>{d.storyId != null ? `#${d.storyId}` : '—'}{d.storyTitle ? ` · ${d.storyTitle}` : ''}</b></div>
          <div><small>Phiên bản</small><b>{d.storyVersionId != null ? `#${d.storyVersionId}` : 'Chưa gắn phiên bản'}</b></div>
          <div><small>Trạng thái hồ sơ</small><b>{moderationStatusLabel('PublicStoryRemoval', d.status)}</b></div>
          <div><small>Thời điểm gửi</small><b>{formatSubmittedAt(d.createdAt)}</b></div>
          <div><small>Phiên bản dữ liệu (rowVersion)</small><b>v{d.rowVersion}</b></div>
          <div>
            <small>Tác giả gửi yêu cầu</small>
            <b>{d.createdByName?.trim() || 'Chưa có thông tin trong tóm tắt API hiện tại'}</b>
          </div>
          {due && (
            <div>
              <small>Hạn SLA</small>
              <b className={due.late ? 'st-late' : ''}>{due.text}</b>
            </div>
          )}
        </div>
        <div className="st-quote">
          <small>Lý do Creator yêu cầu gỡ</small>
          <p>Chưa có thông tin chi tiết yêu cầu trong API hiện tại.</p>
        </div>
        <div className="row st-wrap">
          {onBack && (
            <button type="button" className="btn btn-g" disabled={busy} onClick={onBack}>
              <ArrowLeft className="ic" />Quay lại danh sách
            </button>
          )}
          <button type="button" className="btn btn-g" disabled={busy} onClick={refresh}>
            <RefreshCw className="ic" />Tải lại hồ sơ
          </button>
        </div>
      </div>

      <div className="st-group">
        <b className="st-group-title">Quyết định</b>
        {claimBlocked && (
          <div className="notice err" role="alert" data-inline-notice>
            <span>
              Phiên giữ hồ sơ đã hết hạn hoặc trạng thái vừa thay đổi (403/409). Các nút quyết định đã bị khóa; ghi chú của bạn vẫn được giữ bên dưới.
            </span>
          </div>
        )}
        <label className="field">
          <span className="lbl">
            Ghi chú / lý do quyết định
            {!usableReason && !claimBlocked && <Warn why="Bắt buộc nhập lý do trước khi gửi quyết định (1–2000 ký tự)" />}
          </span>
          <textarea
            className="inp"
            rows={4}
            maxLength={2000}
            readOnly={claimBlocked}
            placeholder="Nhập lý do chấp thuận gỡ hoặc lý do không chấp thuận yêu cầu gỡ (tối đa 2000 ký tự)."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </label>
        <p className="sub">
          Không bắt buộc phải quyết định ngay nếu bạn nhận thấy thông tin từ API hiện tại chưa đủ; có thể bấm Quay lại hoặc Tải lại.
        </p>
        <div className="row st-wrap">
          <button
            type="button"
            className="btn btn-ok"
            disabled={locked || !usableReason}
            onClick={() => void submitDecision(true)}
          >
            <Check className="ic" />Chấp thuận gỡ
          </button>
          <button
            type="button"
            className="btn btn-no"
            disabled={locked || !usableReason}
            onClick={() => void submitDecision(false)}
          >
            <X className="ic" />Không chấp thuận gỡ
          </button>
        </div>
      </div>
    </div>
  );
}
