'use client';

import { useEffect, useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { StarRating } from '@/app/components/StarRating';
import { confirmDialog } from '@/app/lib/confirm';
import { showToast } from '@/app/lib/toast';
import { storyRatingService } from '@/app/services/storyRatingService';
import type { MyStoryRatingDto } from '@/app/types/storyRating';
import { RATING_COMMENT_MAX } from '@/app/types/storyRating';

function getStatusInfo(status?: string) {
  switch (status) {
    case 'Published':
      return { label: 'Đang hiển thị', cls: 'srd-pill--ok' };
    case 'PendingModeration':
      return { label: 'Đang chờ kiểm duyệt', cls: 'srd-pill--wait' };
    case 'Hidden':
      return { label: 'Đã bị ẩn', cls: 'srd-pill--no' };
    default:
      return null;
  }
}

export default function MyRatingForm({
  storyId,
  myRating,
  canRate,
  onSaved,
  onDeleted,
}: {
  storyId: number;
  myRating: MyStoryRatingDto | null;
  canRate: boolean;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const [value, setValue] = useState(myRating?.rating ?? 0);
  const [comment, setComment] = useState(myRating?.comment ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(myRating?.rating ?? 0);
    setComment(myRating?.comment ?? '');
  }, [myRating?.ratingId, myRating?.rating, myRating?.comment]);

  const dirty = value !== (myRating?.rating ?? 0) || comment !== (myRating?.comment ?? '');

  const handleSave = async () => {
    if (saving || value <= 0) return;
    setSaving(true);
    try {
      const r = await storyRatingService.upsertMine(storyId, {
        rating: value,
        comment: comment.trim() || null,
      });
      if (r.success) {
        if (r.data?.status === 'PendingModeration') {
          showToast('Đã gửi, đánh giá sẽ hiện sau khi được kiểm duyệt.', 'ok');
        } else {
          showToast('Đã gửi đánh giá.', 'ok');
        }
        onSaved();
      } else {
        showToast(r.message, 'err');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (saving) return;
    const confirmed = await confirmDialog('Xoá đánh giá của bạn cho truyện này?');
    if (!confirmed) return;
    setSaving(true);
    try {
      const r = await storyRatingService.deleteMine(storyId);
      if (r.success) {
        showToast('Đã xoá đánh giá.', 'ok');
        onDeleted();
      } else {
        showToast(r.message, 'err');
      }
    } finally {
      setSaving(false);
    }
  };

  const statusInfo = getStatusInfo(myRating?.status);

  return (
    <div className="srd-my-rating">
      <h3 className="srd-section-title">Đánh giá của bạn</h3>
      {!canRate && !myRating ? (
        <p className="srd-hint">Bé cần đọc truyện này trước khi bạn đánh giá.</p>
      ) : (
        <>
          {myRating && (
            <div className="srd-my-status">
              <div className="srd-pill-row">
                {statusInfo && (
                  <span className={`srd-pill ${statusInfo.cls}`}>
                    {statusInfo.label}
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn-g"
                  aria-label="Xoá đánh giá"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  <Trash2 className="ic" size={16} />
                </button>
              </div>
              {myRating.status === 'Hidden' && myRating.hiddenReason && (
                <p className="srd-hint">Lý do: {myRating.hiddenReason}</p>
              )}
            </div>
          )}

          <div className="srd-form">
            <StarRating value={value} onChange={setValue} size={28} />
            <textarea
              className="srd-textarea"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={RATING_COMMENT_MAX}
              placeholder="Chia sẻ cảm nhận của bạn về truyện này (không bắt buộc)..."
              rows={3}
              disabled={saving}
            />
            <div className="srd-counter">
              {comment.length}/{RATING_COMMENT_MAX}
            </div>
            {dirty && value > 0 && (
              <div className="srd-form-actions">
                <button
                  type="button"
                  className="btn btn-p"
                  disabled={saving}
                  onClick={handleSave}
                >
                  <Send className="ic" size={16} />
                  <span>{myRating ? 'Lưu thay đổi' : 'Gửi đánh giá'}</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
