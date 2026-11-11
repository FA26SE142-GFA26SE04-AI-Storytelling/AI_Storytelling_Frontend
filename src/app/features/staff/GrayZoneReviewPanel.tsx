'use client';
import { useEffect, useState } from 'react';
import { Check, RefreshCw, X } from 'lucide-react';
import { confirmDialog } from '@/app/lib/confirm';
import { prefersReducedMotion, useRiseIn } from '@/app/lib/motion';
import { moderationService } from '@/app/services/moderationService';
import type { QueueItem } from '@/app/types/staff';
import { parseGrayZoneFlags } from './GrayZoneEvidence';
import ModerationEvidence from './ModerationEvidence';
import { Warn } from './PublicReviewEvidence';
import { ReviewPanelHeader } from './ReviewPanelHeader';
import { formatSubmittedAt, queueDueInfo } from './moderationQueueDisplay';
import { useReviewItem } from './useReviewItem';

const AGE_LABELS: Record<string, string> = { '6-8': '6–8 tuổi', '9-10': '9–10 tuổi' };

function jumpTo(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
  });
}

/** Tài liệu 05 — Panel Kiểm tra vùng xám: Ngữ cảnh nguồn, Evidence AI trung thực, Nhận định Moderator, Quyết định Clear/Block. */
export default function GrayZoneReviewPanel({
  id,
  queueItem,
  onDecision,
}: {
  id: number;
  queueItem?: QueueItem;
  onDecision: (outcome?: 'Cleared' | 'Blocked') => void;
}) {
  const { item, message, claimBlocked, busy, act, refresh } = useReviewItem(
    'GrayZoneStory',
    id,
    () => onDecision(),
  );
  const riseRef = useRiseIn<HTMLDivElement>('.st-group', [id, item ? 1 : 0], { delay: 40, distance: 10 });
  const [reason, setReason] = useState('');

  useEffect(() => {
    setReason('');
  }, [id]);

  if (!item || item.kind !== 'GrayZoneStory') {
    return (
      <div className="st-card">
        <p role="status">{message || 'Đang tải hồ sơ vùng xám…'}</p>
        <button type="button" className="btn btn-s" onClick={refresh}>
          <RefreshCw className="ic" />Tải lại
        </button>
      </div>
    );
  }

  const d = item.data;
  const parsed = parseGrayZoneFlags(d.flags);
  const metaFacts = [
    parsed.metadata.model ? ['Mô hình AI', parsed.metadata.model] : null,
    parsed.metadata.rubric ? ['Tiêu chí / chính sách', parsed.metadata.rubric] : null,
    parsed.metadata.phase ? ['Giai đoạn / vùng', parsed.metadata.phase] : null,
    parsed.metadata.risk ? ['Mức rủi ro', parsed.metadata.risk] : null,
  ].filter((entry): entry is [string, string] => entry !== null);

  const due = queueItem ? queueDueInfo(queueItem.slaDueAt, queueItem.status) : null;
  const sourceFlow = 'Quy trình kiểm tra vùng xám (đã ẩn danh tính tác giả, phụ huynh và trẻ)';
  const usableReason = !!reason.trim();
  const locked = busy || claimBlocked;

  const submitDecision = async (decision: 'Clear' | 'Block') => {
    const question = decision === 'Clear'
      ? 'Cho phép phiên bản này tiếp tục? Lưu ý: quyết định này chỉ mở khóa quy trình nguồn, KHÔNG xuất bản truyện lên thư viện công khai.'
      : 'Chặn nội dung phiên bản này? Phiên bản sẽ bị dừng xử lý và không thể tiếp tục.';
    if (!(await confirmDialog(question))) return;
    const ok = await act(
      () => moderationService.grayDecision(id, { decision, reason: reason.trim(), rowVersion: d.rowVersion }),
      true,
    );
    if (ok) onDecision(decision === 'Clear' ? 'Cleared' : 'Blocked');
  };

  return (
    <div className="st-card st-review" ref={riseRef}>
      <nav className="mod-anchors" aria-label="Điều hướng nhanh gói vùng xám">
        <button type="button" onClick={() => jumpTo('gz-sec-source')}>Ngữ cảnh nguồn</button>
        <button type="button" onClick={() => jumpTo('gz-sec-evidence')}>Evidence AI</button>
        <button type="button" onClick={() => jumpTo('gz-sec-note')}>Nhận định Moderator</button>
        <button type="button" onClick={() => jumpTo('gz-sec-decision')}>Quyết định</button>
      </nav>

      <ReviewPanelHeader item={item} queueItem={queueItem} message={message} sourceTag="Kiểm tra vùng xám" />

      <div id="gz-sec-source" className="st-group mod-anchor-target">
        <b className="st-group-title">Ngữ cảnh nguồn</b>
        <div className="notice" role="status" data-inline-notice>
          <span>
            Đây là cổng kiểm tra vùng xám trước khi quy trình nguồn tiếp tục — KHÔNG phải hồ sơ duyệt xuất bản công khai.
          </span>
        </div>
        <div className="st-facts">
          <div><small>Hồ sơ vùng xám</small><b>#{d.itemId}</b></div>
          <div><small>Phiên bản</small><b>Bản {d.versionNo} (#{d.storyVersionId})</b></div>
          <div><small>Độ tuổi mục tiêu</small><b>{AGE_LABELS[d.ageBand] ?? d.ageBand}</b></div>
          <div><small>Mức đọc</small><b>{d.readingLevel ?? 'Chưa gắn'}</b></div>
          <div><small>Luồng nguồn</small><b>{sourceFlow}</b></div>
          {queueItem && (
            <div><small>Vào hàng đợi lúc</small><b>{formatSubmittedAt(queueItem.createdAt)}</b></div>
          )}
          {due && (
            <div>
              <small>Hạn SLA</small>
              <b className={due.late ? 'st-late' : ''}>{due.text}</b>
            </div>
          )}
        </div>
      </div>

      <div id="gz-sec-evidence" className="st-group mod-anchor-target">
        <b className="st-group-title">Evidence AI</b>
        {metaFacts.length > 0 && (
          <div className="st-facts">
            {metaFacts.map(([label, value]) => (
              <div key={label}><small>{label}</small><b>{value}</b></div>
            ))}
          </div>
        )}
        {parsed.metadata.reason && (
          <div className="st-quote"><small>Tóm tắt lý do từ hệ thống</small><p>{parsed.metadata.reason}</p></div>
        )}
        {parsed.plainNote && (
          <div className="st-quote"><small>Ghi chú hệ thống</small><p style={{ whiteSpace: 'pre-wrap' }}>{parsed.plainNote}</p></div>
        )}
        {parsed.findings.length > 0 ? (
          <div className="st-storylist">
            {parsed.findings.map((flag, idx) => (
              <div className="st-ev" key={`${flag.flagId}-${idx}`}>
                <div className="row st-wrap">
                  <b>{flag.name}</b>
                  {flag.kind && <span className="pill wait">{flag.kind}</span>}
                  {flag.criterionCode && <span className="pill draft">{flag.criterionCode}</span>}
                </div>
                <ModerationEvidence flag={flag} content={d.content} />
              </div>
            ))}
          </div>
        ) : !parsed.plainNote && !parsed.metadata.reason ? (
          <p className="sub">
            Gói hồ sơ không có mục evidence AI chi tiết (điểm rủi ro/tên mô hình và dữ liệu nội bộ không được trả ra). Hãy đối chiếu trực tiếp toàn văn bên dưới.
          </p>
        ) : null}

        <div className="st-quote">
          <small>Nội dung phiên bản cần kiểm tra</small>
          <div className="st-content" style={{ whiteSpace: 'pre-wrap' }}>
            {d.content || 'Không có nội dung văn bản.'}
          </div>
        </div>
      </div>

      <div id="gz-sec-note" className="st-group mod-anchor-target">
        <b className="st-group-title">Nhận định Moderator</b>
        {claimBlocked && (
          <div className="notice err" role="alert" data-inline-notice>
            <span>
              Phiên giữ hoặc trạng thái hồ sơ vừa thay đổi (403/409). Nút quyết định đã bị khóa; ghi chú của bạn vẫn được giữ bên dưới.
            </span>
          </div>
        )}
        <label className="field">
          <span className="lbl">
            Căn cứ nhận định và quyết định
            {!usableReason && !claimBlocked && <Warn why="Bắt buộc nhập nhận định trước khi quyết định" />}
          </span>
          <textarea
            className="inp"
            rows={4}
            maxLength={2000}
            readOnly={claimBlocked}
            placeholder="Ghi rõ đoạn nội dung đã đối chiếu, lý do cho phép tiếp tục hoặc lý do chặn (tối đa 2000 ký tự)."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </label>
      </div>

      <div id="gz-sec-decision" className="st-group mod-anchor-target">
        <b className="st-group-title">Quyết định</b>
        <p className="sub">
          <strong>Cho phép tiếp tục</strong> chỉ cho quy trình nguồn chạy tiếp và KHÔNG tự động xuất bản truyện lên thư viện cộng đồng.{' '}
          <strong>Chặn nội dung</strong> sẽ dừng phiên bản này.
        </p>
        <div className="row st-wrap">
          <button
            type="button"
            className="btn btn-ok"
            disabled={locked || !usableReason}
            onClick={() => void submitDecision('Clear')}
          >
            <Check className="ic" />Cho phép tiếp tục
          </button>
          <button
            type="button"
            className="btn btn-no"
            disabled={locked || !usableReason}
            onClick={() => void submitDecision('Block')}
          >
            <X className="ic" />Chặn nội dung
          </button>
        </div>
      </div>
    </div>
  );
}
