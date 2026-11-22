'use client';

import { useEffect, useRef, useState } from 'react';
import { RotateCw } from 'lucide-react';
import Dialog from '@/app/components/Dialog';
import RatingSummary from '@/app/components/ratings/RatingSummary';
import MyRatingForm from '@/app/components/ratings/MyRatingForm';
import RatingComments from '@/app/components/ratings/RatingComments';
import { showToast } from '@/app/lib/toast';
import { storyRatingService } from '@/app/services/storyRatingService';
import type { StoryRatingListDto, StoryRatingOrder, StoryRatingSummaryDto } from '@/app/types/storyRating';
import '@/app/styles/components/StoryRatingDialog.css';

export default function StoryRatingDialog({
  storyId,
  title,
  mode,
  onClose,
  onChanged,
}: {
  storyId: number;
  title: string;
  mode: 'parent' | 'creator';
  onClose: () => void;
  onChanged?: (summary: StoryRatingSummaryDto) => void;
}) {
  const [page, setPage] = useState(1);
  const [orderBy, setOrderBy] = useState<StoryRatingOrder>('newest');
  const [data, setData] = useState<StoryRatingListDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const notifyRef = useRef(false);
  const onChangedRef = useRef(onChanged);
  useEffect(() => { onChangedRef.current = onChanged; });

  const reload = () => {
    notifyRef.current = true;
    setRefreshKey((k) => k + 1);
  };

  const onRetry = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleOrderBy = (newOrder: StoryRatingOrder) => {
    setPage(1);
    setOrderBy(newOrder);
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);

    const loadData = async () => {
      try {
        const fetcher = mode === 'creator' ? storyRatingService.listForCreator : storyRatingService.list;
        const r = await fetcher(storyId, { pageIndex: page, pageSize: 5, orderBy }, controller.signal);

        if (controller.signal.aborted) return;

        if (r.success && r.data) {
          setData(r.data);
          setError(false);
          if (notifyRef.current) {
            onChangedRef.current?.(r.data.summary);
            notifyRef.current = false;
          }
        } else {
          setError(true);
          showToast(r.message || 'Không tải được đánh giá.', 'err');
        }
      } catch (err: unknown) {
        if (controller.signal.aborted || (err instanceof Error && err.name === 'AbortError')) {
          return;
        }
        setError(true);
        showToast('Không tải được đánh giá.', 'err');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      controller.abort();
    };
  }, [storyId, mode, page, orderBy, refreshKey]);

  return (
    <Dialog title={`Đánh giá “${title}”`} onClose={onClose} wide>
      {!data && loading && (
        <div className="srd-empty">Đang tải…</div>
      )}

      {!data && error && (
        <div className="srd-empty">
          <p className="srd-hint">Không tải được đánh giá.</p>
          <button type="button" className="btn btn-s" onClick={onRetry}>
            <RotateCw className="ic" size={16} />
            <span>Thử lại</span>
          </button>
        </div>
      )}

      {data && (
        <>
          <section className="srd-block">
            <RatingSummary summary={data.summary} />
          </section>

          {mode === 'parent' && (
            <section className="srd-block">
              <MyRatingForm
                storyId={storyId}
                myRating={data.myRating ?? null}
                canRate={data.canRate}
                onSaved={reload}
                onDeleted={reload}
              />
            </section>
          )}

          {/* Chưa có đánh giá nào: phần tóm tắt đã báo, không lặp câu trống ở khối bình luận. */}
          {data.summary.ratingCount > 0 && (
          <section className="srd-block">
            <RatingComments
              mode={mode}
              data={data.ratings}
              loading={loading}
              error={error}
              orderBy={orderBy}
              onOrderBy={handleOrderBy}
              page={page}
              onPage={setPage}
              onRetry={onRetry}
              myRatingId={data.myRating?.ratingId ?? null}
            />
          </section>
          )}
        </>
      )}
    </Dialog>
  );
}
