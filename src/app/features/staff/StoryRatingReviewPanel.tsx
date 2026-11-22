'use client';

import { useEffect, useState } from 'react';
import { Check, EyeOff, RefreshCw } from 'lucide-react';
import Dialog from '@/app/components/Dialog';
import { StarRating } from '@/app/components/StarRating';
import { useAuth } from '@/app/context/AuthContext';
import { confirmDialog } from '@/app/lib/confirm';
import { useRiseIn } from '@/app/lib/motion';
import { showToast } from '@/app/lib/toast';
import { storyRatingService } from '@/app/services/storyRatingService';
import type { QueueItem } from '@/app/types/staff';
import {
  RATING_HIDE_REASON_MAX,
  type StoryRatingModerationDetailDto,
} from '@/app/types/storyRating';
import { formatSubmittedAt } from './moderationQueueDisplay';

const REPORT_REASON_MAP: Record<string, string> = {
  Offensive: 'Xúc phạm, thô tục',
  Spam: 'Quảng cáo, spam',
  PersonalInfo: 'Lộ thông tin cá nhân',
  Irrelevant: 'Không liên quan đến truyện',
  Other: 'Lý do khác',
};

const SCREENING_REASON_MAP: Record<string, string> = {
  LINK: 'Có đường link',
  BLOCKED_TERM: 'Có từ ngữ bị chặn',
  LOW_RATING_WITH_TEXT: 'Đánh giá thấp kèm bình luận',
};

export default function StoryRatingReviewPanel({
  id,
  queueItem,
  onDecision,
}: {
  id: number;
  queueItem?: QueueItem;
  onDecision: () => void;
}) {
  const { user } = useAuth();
  const [detail, setDetail] = useState<StoryRatingModerationDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [busy, setBusy] = useState(false);
  const [hideDialogOpen, setHideDialogOpen] = useState(false);
  const [hideReason, setHideReason] = useState('');

  const riseRef = useRiseIn<HTMLDivElement>('.st-group', [id, detail ? 1 : 0], {
    delay: 40,
    distance: 10,
  });

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    storyRatingService
      .moderationDetail(id, controller.signal)
      .then(r => {
        // apiRequest không throw: request bị huỷ (đổi mục, StrictMode) trả success=false, phải bỏ qua.
        if (controller.signal.aborted) return;
        if (r.success && r.data) {
          setDetail(r.data);
        } else {
          setError(r.message || 'Không tải được đánh giá cần kiểm duyệt.');
        }
        setLoading(false);
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        const msg =
          err instanceof Error && err.message
            ? err.message
            : 'Không tải được đánh giá cần kiểm duyệt.';
        setError(msg);
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [id, reloadKey]);

  useEffect(() => {
    setHideReason('');
    setHideDialogOpen(false);
  }, [id]);

  if (loading) {
    return (
      <div className="st-card">
        <p role="status">Đang tải đánh giá…</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="st-card">
        <p role="status">{error || 'Không tìm thấy đánh giá cần kiểm duyệt.'}</p>
        <button
          type="button"
          className="btn btn-s"
          onClick={() => setReloadKey(k => k + 1)}
        >
          <RefreshCw className="ic" />Tải lại
        </button>
      </div>
    );
  }

  const isAssignedToMe =
    queueItem?.status === 'Claimed' && queueItem.claimedByUserId === user?.id;

  const handleApprove = async () => {
    if (busy) return;
    const ok = await confirmDialog('Giữ đánh giá này và cho hiển thị?');
    if (!ok) return;

    setBusy(true);
    const r = await storyRatingService.approve(id);
    setBusy(false);
    if (!r.success) { showToast(r.message, 'err'); return; }
    showToast('Đã giữ đánh giá.');
    onDecision();
  };

  const handleConfirmHide = async () => {
    const trimmed = hideReason.trim();
    if (!trimmed || busy) return;

    setBusy(true);
    const r = await storyRatingService.hide(id, trimmed);
    setBusy(false);
    if (!r.success) { showToast(r.message, 'err'); return; }
    showToast('Đã ẩn đánh giá.');
    setHideDialogOpen(false);
    onDecision();
  };

  const screeningReasonText =
    detail.screeningReasonCode && SCREENING_REASON_MAP[detail.screeningReasonCode]
      ? SCREENING_REASON_MAP[detail.screeningReasonCode]
      : detail.screeningReasonCode;

  return (
    <div ref={riseRef} className="col" style={{ gap: 'var(--sp-md)' }}>
      {/* 2. Đầu panel: Tên truyện và hàng pill */}
      <div className="st-group">
        <h2 className="sec-h">{detail.storyTitle || 'Đánh giá truyện'}</h2>
        <div className="row st-wrap">
          {detail.holdSource === 'Report' && (
            <span className="pill flag">
              Bị báo cáo ({detail.reports.length})
            </span>
          )}
          {detail.holdSource === 'Screening' && (
            <span className="pill wait">
              Bộ lọc tự động giữ lại
              {screeningReasonText ? `: ${screeningReasonText}` : ''}
            </span>
          )}
          {detail.ratingStatus === 'Published' && (
            <span className="pill ok">Đang hiển thị</span>
          )}
          {detail.ratingStatus === 'PendingModeration' && (
            <span className="pill draft">Chưa hiển thị</span>
          )}
        </div>
      </div>

      {/* 3. Khối đánh giá */}
      <div className="st-group st-card">
        <div className="row st-wrap" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="row st-wrap" style={{ alignItems: 'center' }}>
            <b>{detail.reviewerName}</b>
            <StarRating value={detail.rating} size={18} />
          </div>
          <span className="sub">{formatSubmittedAt(detail.createdAt)}</span>
        </div>
        <p className="mod-pre" style={{ marginBlockStart: 'var(--sp-xs)', whiteSpace: 'pre-line' }}>
          {detail.comment?.trim() || 'Không có bình luận'}
        </p>
      </div>

      {/* 4. Khối Báo cáo (chỉ hiện khi có báo cáo) */}
      {detail.reports.length > 0 && (
        <div className="st-group">
          <h3 className="sec-h">Báo cáo ({detail.reports.length})</h3>
          <div className="col" style={{ gap: 'var(--sp-xs)' }}>
            {detail.reports.map((report, idx) => (
              <div key={idx} className="st-card">
                <div className="row st-wrap" style={{ justifyContent: 'space-between' }}>
                  <b>{REPORT_REASON_MAP[report.reason] ?? report.reason}</b>
                  <span className="sub">{formatSubmittedAt(report.createdAt)}</span>
                </div>
                {report.note?.trim() ? (
                  <p className="mod-pre" style={{ marginBlockStart: 'var(--sp-xs)', whiteSpace: 'pre-line' }}>
                    {report.note}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Hàng nút quyết định (chỉ hiện khi queueItem Claimed và do mình nhận) */}
      {isAssignedToMe && (
        <div className="st-group mod-decision-dock">
          <div className="row st-wrap">
            <button
              type="button"
              className="btn btn-ok"
              disabled={busy}
              onClick={handleApprove}
            >
              <Check className="ic" />Giữ đánh giá
            </button>
            <button
              type="button"
              className="btn btn-no"
              disabled={busy}
              onClick={() => setHideDialogOpen(true)}
            >
              <EyeOff className="ic" />Ẩn đánh giá
            </button>
          </div>
        </div>
      )}

      {/* Dialog ẩn đánh giá */}
      {hideDialogOpen && (
        <Dialog
          onClose={() => {
            if (!busy) setHideDialogOpen(false);
          }}
          title="Ẩn đánh giá"
        >
          <div className="field">
            <span className="lbl">Lý do ẩn đánh giá</span>
            <textarea
              className="inp"
              rows={4}
              maxLength={RATING_HIDE_REASON_MAX}
              placeholder="Nhập lý do ẩn đánh giá..."
              value={hideReason}
              onChange={e => setHideReason(e.target.value)}
            />
            <small className="sub">
              Phụ huynh viết đánh giá sẽ đọc được lý do này
            </small>
          </div>
          <div className="row st-wrap" style={{ marginBlockStart: 'var(--sp-md)' }}>
            <button
              type="button"
              className="btn btn-g"
              disabled={busy}
              onClick={() => setHideDialogOpen(false)}
            >
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-no"
              disabled={busy || !hideReason.trim()}
              onClick={handleConfirmHide}
            >
              <EyeOff className="ic" />Xác nhận ẩn
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
