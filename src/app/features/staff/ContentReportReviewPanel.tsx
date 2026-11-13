'use client';
import { useEffect, useState } from 'react';
import { Archive, Check, ExternalLink, RefreshCw } from 'lucide-react';
import Select from '@/app/components/Select';
import { confirmDialog } from '@/app/lib/confirm';
import { useRiseIn } from '@/app/lib/motion';
import { moderationService } from '@/app/services/moderationService';
import type { QueueItem } from '@/app/types/staff';
import { EditorialReviewSplit, ModerationCallout } from './ModerationInspectionPrimitives';
import { Warn } from './PublicReviewEvidence';
import ReportedContentSection from './ReportedContentSection';
import { ReviewPanelHeader } from './ReviewPanelHeader';
import { moderationStatusLabel } from './moderationConfig';
import { formatSubmittedAt } from './moderationQueueDisplay';
import { useReviewItem } from './useReviewItem';

const REPORT_REASON: Record<string, string> = {
  SafetyConcern: 'Không an toàn',
  Inappropriate: 'Không phù hợp',
  WrongAgeBand: 'Không đúng độ tuổi',
  Copyright: 'Bản quyền',
  Cultural: 'Văn hóa',
  Other: 'Khác',
};

const ARCHIVE_OPTIONS = [
  { value: 'SafetyConcern', label: 'Không an toàn' },
  { value: 'Copyright', label: 'Vi phạm bản quyền' },
  { value: 'Inappropriate', label: 'Nội dung không phù hợp' },
] as const;

/** Chỉ cho phép liên kết HTTP(S) hợp lệ để tránh javascript:/data: khi hiển thị minh chứng báo cáo. */
export function safeHttpUrl(raw?: string | null): string | null {
  const trimmed = raw?.trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return null;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

/** Tài liệu 06 — Panel Báo cáo nội dung: Báo cáo & minh chứng, Nội dung bị báo cáo, Quyết định xử lý. */
export default function ContentReportReviewPanel({
  id,
  queueItem,
  onDecision,
}: {
  id: number;
  queueItem?: QueueItem;
  onDecision: (outcome?: 'Dismissed' | 'Archived') => void;
}) {
  const { item, message, claimBlocked, busy, act, refresh } = useReviewItem(
    'ContentReport',
    id,
    () => onDecision(),
  );
  const riseRef = useRiseIn<HTMLDivElement>('.st-group', [id, item ? 1 : 0], { delay: 40, distance: 10 });
  const [reason, setReason] = useState('');
  const [archiveReason, setArchiveReason] = useState<'SafetyConcern' | 'Copyright' | 'Inappropriate'>('SafetyConcern');

  useEffect(() => {
    setReason('');
    setArchiveReason('SafetyConcern');
  }, [id]);

  if (!item || item.kind !== 'ContentReport') {
    return (
      <div className="st-card">
        <p role="status">{message || 'Đang tải hồ sơ báo cáo…'}</p>
        <button type="button" className="btn btn-s" onClick={refresh}>
          <RefreshCw className="ic" />Tải lại
        </button>
      </div>
    );
  }

  const d = item.data;
  const story = d.story;
  const safeAttachment = safeHttpUrl(d.attachmentUrl);
  const usableReason = !!reason.trim();
  const locked = busy || claimBlocked;

  const submitAction = async (action: 'dismiss' | 'archive') => {
    const selectedLabel = ARCHIVE_OPTIONS.find(opt => opt.value === archiveReason)?.label ?? archiveReason;
    const prompts = {
      dismiss: 'Bác báo cáo này? Truyện giữ nguyên trạng thái hiện tại và hồ sơ chuyển sang Đã bác báo cáo.',
      archive: `Gỡ truyện vi phạm (${selectedLabel})? Thao tác sẽ đánh dấu lưu trữ để ngừng hiển thị công khai (không xóa vật lý dữ liệu gốc) và đóng hồ sơ liên quan.`,
    };
    if (!(await confirmDialog(prompts[action]))) return;
    const trimmed = reason.trim();
    const ok = await act(
      () => moderationService.reportDecision(id, action, trimmed, archiveReason),
      true,
    );
    if (ok) {
      const outcomeMap = { dismiss: 'Dismissed', archive: 'Archived' } as const;
      onDecision(outcomeMap[action]);
    }
  };

  return (
    <EditorialReviewSplit
      innerRef={riseRef}
      header={
        <ReviewPanelHeader item={item} queueItem={queueItem} message={message} sourceTag="Báo cáo nội dung" />
      }
      left={<ReportedContentSection key={d.reportId} detail={d} />}
      right={
        <>
          <div id="cr-sec-report" className="st-group mod-anchor-target">
            <b className="st-group-title">Báo cáo &amp; minh chứng</b>
            <div className="st-facts">
              <div><small>Mã báo cáo</small><b>#{d.reportId}</b></div>
              <div><small>Lý do báo cáo</small><b>{REPORT_REASON[d.reason] ?? d.reason}</b></div>
              <div><small>Nguồn ghi nhận</small><b>{d.isReviewItem ? 'Rà soát nội bộ (ẩn danh)' : 'Báo cáo cộng đồng (ẩn danh)'}</b></div>
              {d.requestedByName?.trim() ? (
                <div><small>Người yêu cầu rà soát</small><b>{d.requestedByName}</b></div>
              ) : null}
              {story.authorName?.trim() ? (
                <div><small>Tác giả</small><b>{story.authorName}</b></div>
              ) : null}
              <div><small>Thời điểm báo cáo</small><b>{formatSubmittedAt(d.createdAt)}</b></div>
              <div><small>Trạng thái hồ sơ</small><b>{moderationStatusLabel('ContentReport', d.itemStatus)}</b></div>
            </div>

            <ModerationCallout label="Mô tả vấn đề" tone="warn">
              <p className="mod-pre">{d.description?.trim() || 'Không có mô tả chi tiết đi kèm báo cáo.'}</p>
            </ModerationCallout>

            {d.attachmentUrl?.trim() && (
              safeAttachment ? (
                <div className="st-quote">
                  <small>Liên kết minh chứng đính kèm</small>
                  <div className="row st-wrap">
                    <a className="btn btn-s" href={safeAttachment} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="ic" />Mở minh chứng đính kèm
                    </a>
                    <code className="sub">{safeAttachment}</code>
                  </div>
                </div>
              ) : (
                <div className="notice err" role="alert" data-inline-notice>
                  <span>Đường dẫn minh chứng không hợp lệ hoặc không thuộc HTTP(S), đã chặn mở liên kết.</span>
                </div>
              )
            )}

          </div>

          <div id="cr-sec-decision" className="st-group mod-anchor-target mod-decision-dock">
            <b className="st-group-title">Quyết định</b>
            {claimBlocked && (
              <div className="notice err" role="alert" data-inline-notice>
                <span>Phiên giữ hoặc trạng thái hồ sơ đã thay đổi (403/409). Nút quyết định đã bị khóa; ghi chú của bạn vẫn được giữ.</span>
              </div>
            )}
            <div className="field">
              <span className="lbl">Phân loại lý do gỡ vi phạm (chỉ áp dụng khi chọn Gỡ truyện vi phạm)</span>
              <Select<typeof archiveReason>
                ariaLabel="Phân loại lý do gỡ vi phạm"
                disabled={locked}
                value={archiveReason}
                options={[...ARCHIVE_OPTIONS]}
                onChange={setArchiveReason}
              />
            </div>
            <label className="field">
              <span className="lbl">
                Ghi chú / căn cứ quyết định
                {!usableReason && !claimBlocked && <Warn why="Bắt buộc nhập căn cứ quyết định trước khi gửi" />}
              </span>
              <textarea
                className="inp"
                rows={4}
                maxLength={1000}
                readOnly={claimBlocked}
                placeholder="Ghi rõ kết quả đối chiếu minh chứng hoặc mức độ vi phạm (tối đa 1000 ký tự)."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </label>
            <div className="row st-wrap">
              <button type="button" className="btn btn-ok" disabled={locked || !usableReason} onClick={() => void submitAction('dismiss')}>
                <Check className="ic" />Bỏ qua báo cáo
              </button>
              <button type="button" className="btn btn-no" disabled={locked || !usableReason} onClick={() => void submitAction('archive')}>
                <Archive className="ic" />Gỡ truyện vi phạm
              </button>
            </div>
          </div>
        </>
      }
    />
  );
}
