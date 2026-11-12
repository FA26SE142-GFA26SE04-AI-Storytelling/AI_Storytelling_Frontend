'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, Check, RefreshCw, X } from 'lucide-react';
import { confirmDialog } from '@/app/lib/confirm';
import { useRiseIn } from '@/app/lib/motion';
import { moderationService } from '@/app/services/moderationService';
import type { QueueItem } from '@/app/types/staff';
import { EditorialReviewSplit, ModerationCallout } from './ModerationInspectionPrimitives';
import { Warn } from './PublicReviewEvidence';
import { ReviewPanelHeader } from './ReviewPanelHeader';
import { moderationStatusLabel } from './moderationConfig';
import { formatSubmittedAt, queueDueInfo } from './moderationQueueDisplay';
import { extractRemovalRequestReason } from './readableJson';
import { useReviewItem } from './useReviewItem';

/** Tài liệu 07 — Panel Yêu cầu gỡ truyện công khai: hiển thị `Flags.requestReason` và metadata hàng đợi hiện có. */
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
  const requestReason = extractRemovalRequestReason(d.flags);
  const usableReason = !!reason.trim();
  const locked = busy || claimBlocked;

  const submitDecision = async (approve: boolean) => {
    const question = approve
      ? 'Chấp thuận gỡ truyện khỏi thư viện công khai? Truyện sẽ ngừng hiển thị trên thư viện công khai và hồ sơ được chuyển sang mục Đã chấp thuận gỡ.'
      : 'Không chấp thuận yêu cầu gỡ truyện này? Hồ sơ sẽ chuyển sang mục Đã từ chối yêu cầu gỡ; lưu ý thao tác này không đồng nghĩa truyện vẫn đang công khai nếu đã bị gỡ do vi phạm khác.';
    if (!(await confirmDialog(question))) return;
    const trimmed = reason.trim();
    const ok = await act(
      () => moderationService.removalDecision(id, { approve, reason: trimmed, rowVersion: d.rowVersion }),
      true,
    );
    if (ok) onDecision(approve ? 'Approved' : 'Rejected');
  };

  return (
    <EditorialReviewSplit
      innerRef={riseRef}
      header={
        <ReviewPanelHeader item={item} queueItem={queueItem} message={message} sourceTag="Yêu cầu gỡ truyện" />
      }
      left={
        <div className="st-group">
          <b className="st-group-title">Thông tin yêu cầu gỡ</b>
          {!requestReason && (
            <div className="notice" role="status" data-inline-notice>
              <span>
                Hồ sơ này chưa có nội dung lý do từ Creator; bạn có thể quay lại danh sách hoặc tải lại nếu chưa đủ cơ sở quyết định.
              </span>
            </div>
          )}
          <div className="st-facts">
            <div><small>Hồ sơ</small><b>#{d.id}</b></div>
            <div><small>Truyện</small><b>{d.storyId != null ? `#${d.storyId}` : '—'}{d.storyTitle ? ` · ${d.storyTitle}` : ''}</b></div>
            <div><small>Phiên bản</small><b>{d.storyVersionId != null ? `#${d.storyVersionId}` : 'Chưa gắn phiên bản'}</b></div>
            <div><small>Trạng thái hồ sơ</small><b>{moderationStatusLabel('PublicStoryRemoval', d.status)}</b></div>
            <div><small>Thời điểm gửi</small><b>{formatSubmittedAt(d.createdAt)}</b></div>
            <div><small>Phiên bản dữ liệu</small><b>v{d.rowVersion}</b></div>
            <div>
              <small>Tác giả gửi yêu cầu</small>
              <b>{d.createdByName?.trim() || 'Không hiển thị trong hồ sơ hàng đợi'}</b>
            </div>
            {due && (
              <div>
                <small>Hạn SLA</small>
                <b className={due.late ? 'st-late' : ''}>{due.text}</b>
              </div>
            )}
          </div>
          <ModerationCallout label="Lý do Creator yêu cầu gỡ" tone="warn">
            <p className="mod-pre">
              {requestReason || 'Creator không ghi lý do hoặc chưa có dữ liệu lý do.'}
            </p>
          </ModerationCallout>
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
      }
      right={
        <div className="st-group mod-decision-dock">
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
            Nếu chưa đủ cơ sở quyết định, bạn có thể bấm Quay lại danh sách hoặc Tải lại hồ sơ bất cứ lúc nào.
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
      }
    />
  );
}
