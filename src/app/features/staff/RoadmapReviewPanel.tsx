'use client';
import { useEffect, useState } from 'react';
import { Check, CircleAlert, Pencil, RefreshCw, X } from 'lucide-react';
import Select from '@/app/components/Select';
import { confirmDialog } from '@/app/lib/confirm';
import { prefersReducedMotion, useRiseIn } from '@/app/lib/motion';
import { moderationService } from '@/app/services/moderationService';
import type { QueueItem } from '@/app/types/staff';
import ChangeRequestDialog from './ChangeRequestDialog';
import { Warn } from './PublicReviewEvidence';
import { ReviewPanelHeader } from './ReviewPanelHeader';
import { formatSubmittedAt } from './moderationQueueDisplay';
import { useReviewItem } from './useReviewItem';

const CRITERION_SHORT: Record<string, string> = {
  order: 'Thứ tự theo độ khó',
  theme: 'Cùng chủ đề chính',
  name_description: 'Tên và mô tả phù hợp',
  age_level: 'Độ tuổi, mức đọc khớp',
};

const PASS_OPTIONS = [
  { value: 'false', label: 'Chưa đạt' },
  { value: 'true', label: 'Đạt' },
];

const AGE_LABELS: Record<string, string> = { '6-8': '6–8 tuổi', '9-10': '9–10 tuổi' };

function jumpTo(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
  });
}

/** Tài liệu 08 — Panel duyệt lộ trình mẫu: thông tin lộ trình, checklist, truyện thành phần, blockers và quyết định. */
export default function RoadmapReviewPanel({
  id,
  queueItem,
  onDecision,
}: {
  id: number;
  queueItem?: QueueItem;
  onDecision: (outcome?: 'Approved' | 'ChangesRequested' | 'Rejected') => void;
}) {
  const { item, message, claimBlocked, busy, act, refresh } = useReviewItem(
    'RoadmapTemplateReview',
    id,
    () => onDecision(),
  );
  const riseRef = useRiseIn<HTMLDivElement>('.st-group', [id, item ? 1 : 0], { delay: 40, distance: 10 });
  const [reason, setReason] = useState('');
  const [changeOpen, setChangeOpen] = useState(false);
  const [changeFailed, setChangeFailed] = useState(false);

  useEffect(() => {
    setReason('');
    setChangeOpen(false);
    setChangeFailed(false);
  }, [id]);

  if (!item || item.kind !== 'RoadmapTemplateReview') {
    return (
      <div className="st-card">
        <p role="status">{message || 'Đang tải gói duyệt lộ trình mẫu…'}</p>
        <button type="button" className="btn btn-s" onClick={refresh}>
          <RefreshCw className="ic" />Tải lại
        </button>
      </div>
    );
  }

  const d = item.data;
  const r = d.roadmap;
  const usableReason = !!reason.trim();
  const locked = busy || claimBlocked;
  const hasBlocker = (code: string) => d.blockers.some(b => b.code === code);
  const sortedStories = d.stories.slice().sort((a, b) => a.position - b.position);

  const decide = async (
    question: string,
    outcome: 'Approved' | 'Rejected',
    fn: () => ReturnType<typeof moderationService.approve | typeof moderationService.reject>,
  ) => {
    if (!(await confirmDialog(question))) return;
    const ok = await act(fn, true);
    if (ok) onDecision(outcome);
  };

  return (
    <div className="st-card st-review" ref={riseRef}>
      <nav className="mod-anchors" aria-label="Điều hướng nhanh duyệt lộ trình">
        <button type="button" onClick={() => jumpTo('rt-sec-info')}>Thông tin lộ trình</button>
        <button type="button" onClick={() => jumpTo('rt-sec-checklist')}>Checklist</button>
        <button type="button" onClick={() => jumpTo('rt-sec-stories')}>Truyện thành phần</button>
        <button type="button" onClick={() => jumpTo('rt-sec-decision')}>Quyết định</button>
      </nav>

      <ReviewPanelHeader item={item} queueItem={queueItem} message={message} sourceTag="Duyệt lộ trình mẫu" />

      <div id="rt-sec-info" className="st-group mod-anchor-target">
        <b className="st-group-title">Thông tin lộ trình</b>
        <div className="st-facts">
          <div><small>Mã lộ trình</small><b>#{r.id}</b></div>
          <div><small>Độ tuổi</small><b>{AGE_LABELS[r.ageBand] ?? r.ageBand}</b></div>
          <div><small>Chủ đề chính</small><b>{r.mainCategory?.displayName ?? 'Chưa gắn'}</b></div>
          <div><small>Khoảng mức đọc</small><b>Mức {r.readingLevelMin} – {r.readingLevelMax}</b></div>
          <div><small>Số ngày mỗi truyện</small><b>{r.defaultDaysPerStory} ngày</b></div>
          <div><small>Người tạo</small><b>{r.createdByName?.trim() || `Tài khoản #${r.createdByUserId}`}</b></div>
          {r.submittedAt && <div><small>Gửi duyệt lúc</small><b>{formatSubmittedAt(r.submittedAt)}</b></div>}
        </div>
        {r.description && <div className="st-quote"><small>Mô tả lộ trình</small><p>{r.description}</p></div>}
        {d.checks.length > 0 && (
          <ul className="st-blockers" aria-label="Kiểm tra tự động của hệ thống">
            {d.checks.map(c => (
              <li key={c.code}>
                {c.passed ? <Check className="ic" aria-hidden /> : <CircleAlert className="ic" aria-hidden />}
                <span>{c.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div id="rt-sec-checklist" className="st-group mod-anchor-target">
        <b className="st-group-title">
          Checklist chấm điểm
          {hasBlocker('checklist_incomplete') && <Warn why="Checklist chưa đạt đủ" />}
        </b>
        <div className="st-checks">
          {d.checklist.map(entry => (
            <div className="field" key={entry.code}>
              <span className="st-flabel" title={entry.label}>
                {CRITERION_SHORT[entry.code] ?? entry.label}
                {!entry.passed && <Warn why="Chưa đạt / chưa chấm" />}
              </span>
              <Select<string>
                ariaLabel={CRITERION_SHORT[entry.code] ?? entry.label}
                disabled={locked}
                value={String(entry.passed)}
                options={PASS_OPTIONS}
                onChange={v => {
                  if (locked) return;
                  const updated = { ...entry, passed: v === 'true' };
                  void act(() => moderationService.roadmapChecklist(id, [updated]));
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div id="rt-sec-stories" className="st-group mod-anchor-target">
        <b className="st-group-title">Truyện trong lộ trình ({sortedStories.length})</b>
        <div className="st-storylist">
          {sortedStories.map((s, idx) => (
            <div className={`st-storyrow${s.isEligible ? '' : ' bad'}`} key={s.storyId}>
              <b>{idx + 1}. {s.title || `Truyện #${s.storyId}`}</b>
              <span>
                {s.ageBand}
                {s.readingLevel != null ? ` · Mức ${s.readingLevel}` : ''}
                {s.days != null ? ` · ${s.days} ngày` : ''}
                {' · '}
                {s.isEligible ? 'Đủ điều kiện' : 'Không còn đủ điều kiện'}
                {!s.isEligible && <Warn why="Truyện không còn đủ điều kiện, cần yêu cầu sửa lộ trình" />}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div id="rt-sec-decision" className="st-group mod-anchor-target">
        <b className="st-group-title">Quyết định</b>
        {claimBlocked && (
          <div className="notice err" role="alert" data-inline-notice>
            <span>Phiên giữ hoặc trạng thái hồ sơ vừa thay đổi (403/409). Các nút quyết định đã bị khóa; ghi chú của bạn vẫn được giữ.</span>
          </div>
        )}
        {d.blockers.length > 0 && (
          <ul className="st-blockers" role="status" aria-label="Việc còn thiếu trước khi duyệt">
            {d.blockers.map(b => <li key={b.code}><CircleAlert className="ic" aria-hidden />{b.message}</li>)}
          </ul>
        )}
        <label className="field">
          <span className="lbl">
            Lý do / ghi chú quyết định
            {!usableReason && !claimBlocked && <Warn why="Cần nhập lý do trước khi từ chối hoặc yêu cầu sửa" />}
          </span>
          <textarea
            className="inp"
            maxLength={1000}
            rows={3}
            readOnly={claimBlocked}
            placeholder="Nhập lý do từ chối hoặc ghi chú phản hồi cho người soạn (tối đa 1000 ký tự)."
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </label>
        <div className="row st-wrap">
          <button
            type="button"
            className="btn btn-ok"
            disabled={locked || !d.canApprove}
            title={d.blockers.map(b => b.message).join(' · ') || undefined}
            onClick={() => void decide('Duyệt lộ trình này? Lộ trình sẽ được công khai.', 'Approved', () => moderationService.approve('RoadmapTemplateReview', id))}
          >
            <Check className="ic" />Duyệt
          </button>
          <button
            type="button"
            className="btn btn-s"
            disabled={locked}
            onClick={() => { setChangeFailed(false); setChangeOpen(true); }}
          >
            <Pencil className="ic" />Yêu cầu sửa
          </button>
          <button
            type="button"
            className="btn btn-no"
            disabled={locked || !usableReason}
            onClick={() => void decide('Từ chối lộ trình này?', 'Rejected', () => moderationService.reject('RoadmapTemplateReview', id, reason.trim()))}
          >
            <X className="ic" />Từ chối
          </button>
        </div>
      </div>

      <ChangeRequestDialog
        open={changeOpen}
        item={item}
        initialNote={reason}
        busy={locked}
        errorMessage={changeFailed ? message : ''}
        onClose={() => { setChangeFailed(false); setChangeOpen(false); }}
        onSubmit={async payload => {
          if (payload.kind !== 'RoadmapTemplateReview') return false;
          setChangeFailed(false);
          const ok = await act(() => moderationService.roadmapChanges(id, payload.body), true);
          if (ok) onDecision('ChangesRequested');
          else setChangeFailed(true);
          return ok;
        }}
      />
    </div>
  );
}
