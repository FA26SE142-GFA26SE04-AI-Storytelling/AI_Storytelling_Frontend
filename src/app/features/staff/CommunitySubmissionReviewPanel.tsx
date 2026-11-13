'use client';
import { useEffect, useState } from 'react';
import { Check, CircleAlert, RefreshCw, Tag, X } from 'lucide-react';
import Select from '@/app/components/Select';
import { confirmDialog } from '@/app/lib/confirm';
import { prefersReducedMotion, useRiseIn } from '@/app/lib/motion';
import { moderationService } from '@/app/services/moderationService';
import { staffService } from '@/app/services/staffService';
import type { ApiResponse } from '@/app/types/auth';
import type { QueueItem } from '@/app/types/staff';
import LearningMaterials from './LearningMaterials';
import { Warn } from './PublicReviewEvidence';
import ReviewPicture, { ZoomLightbox } from './ReviewPicture';
import { ReviewPanelHeader } from './ReviewPanelHeader';
import { useReviewItem } from './useReviewItem';

const COPYRIGHT: Record<string, string> = {
  OwnWork: 'Tác giả tự sáng tác',
  AiGenerated: 'Do AI của nền tảng tạo ra',
  FamilyUse: 'Chỉ dùng trong gia đình',
};

const CRITERION_SHORT: Record<string, string> = {
  safety_baseline: 'An toàn cơ bản',
  no_personal_info: 'Không lộ thông tin cá nhân',
  metadata_labels: 'Nhãn nội dung đúng',
};

const PASS_OPTIONS = [
  { value: 'false', label: 'Chưa đạt' },
  { value: 'true', label: 'Đạt' },
];

const AGE: Record<string, string> = { '6-8': '6–8 tuổi', '9-10': '9–10 tuổi' };

function piiSummary(raw: string): string {
  try {
    const v = JSON.parse(raw) as { passed?: boolean };
    if (typeof v.passed === 'boolean') {
      return v.passed
        ? 'Đạt: không phát hiện thông tin cá nhân.'
        : 'Không đạt: có thể có thông tin cá nhân.';
    }
  } catch { /* giữ nguyên nếu không phải JSON */ }
  return /^[[{]/.test(raw.trim()) ? 'Đã kiểm tra thông tin cá nhân.' : raw;
}

function jumpTo(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
  });
}

export default function CommunitySubmissionReviewPanel({
  id,
  queueItem,
  onDecision,
}: {
  id: number;
  queueItem?: QueueItem;
  onDecision: (outcome?: 'Approved' | 'Rejected') => void;
}) {
  const { item, message, claimBlocked, busy, act, refresh } = useReviewItem(
    'CommunitySubmission',
    id,
    () => onDecision(),
  );
  const riseRef = useRiseIn<HTMLDivElement>('.st-group', [id, item ? 1 : 0], { delay: 40, distance: 10 });

  const [reason, setReason] = useState('');
  const [labelIds, setLabelIds] = useState<number[]>([]);
  const [savedLabelIds, setSavedLabelIds] = useState<number[]>([]);
  const [categories, setCategories] = useState<{ id: number; displayName: string }[] | null>(null);
  const [zoom, setZoom] = useState<{ url: string; alt: string } | null>(null);

  useEffect(() => {
    setCategories(null);
    setLabelIds([]);
    setSavedLabelIds([]);
  }, [id]);

  const currentPackageLabels = item?.kind === 'CommunitySubmission'
    ? item.data.labels.map(l => l.id).sort((a, b) => a - b).join(',')
    : '';

  useEffect(() => {
    if (item?.kind !== 'CommunitySubmission') return;
    const ids = item.data.labels.map(l => l.id);
    setLabelIds(ids);
    setSavedLabelIds(ids);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- đồng bộ khi nhãn của package từ backend thay đổi
  }, [id, currentPackageLabels]);

  if (!item || item.kind !== 'CommunitySubmission') {
    return (
      <div className="st-card">
        <p role="status">{message || 'Đang tải hồ sơ chia sẻ cộng đồng…'}</p>
        <div className="row">
          <button type="button" className="btn btn-s" onClick={refresh}>
            <RefreshCw className="ic" />Tải lại
          </button>
        </div>
      </div>
    );
  }

  const d = item.data;
  const discussion = d.discussionQuestions ?? [];
  const locked = busy || claimBlocked;
  const labelsDirty = [...labelIds].sort().join(',') !== [...savedLabelIds].sort().join(',');
  const has = (code: string) => d.blockers.some(b => b.code === code);
  const usableReason = !!reason.trim();

  const loadCategories = async () => {
    const r = await staffService.categories();
    if (r.success) setCategories(r.data ?? []);
  };

  const decide = async (
    question: string,
    outcome: 'Approved' | 'Rejected',
    fn: () => Promise<ApiResponse<unknown>>,
  ) => {
    if (!(await confirmDialog(question))) return;
    const ok = await act(fn, false);
    if (ok) onDecision(outcome);
  };

  return (
    <div className="st-card st-review" ref={riseRef}>
      <nav className="mod-anchors" aria-label="Điều hướng nhanh hồ sơ chia sẻ">
        <button type="button" onClick={() => jumpTo('shared-sec-content')}>Nội dung</button>
        <button type="button" onClick={() => jumpTo('shared-sec-checks')}>Kiểm tra chia sẻ</button>
        <button type="button" onClick={() => jumpTo('shared-sec-decision')}>Quyết định</button>
      </nav>

      <ReviewPanelHeader item={item} queueItem={queueItem} message={message} sourceTag="Gia đình chia sẻ" />

      {claimBlocked && (
        <div className="notice err row st-wrap" role="alert" data-inline-notice>
          <span>Quyền giữ hồ sơ không còn hiệu lực hoặc dữ liệu đã thay đổi. Ghi chú chưa gửi vẫn được giữ nguyên; hãy tải lại hồ sơ.</span>
          <button type="button" className="btn btn-s" onClick={refresh}><RefreshCw className="ic" />Tải lại quyền</button>
        </div>
      )}

      <div id="shared-sec-content" className="mod-anchor-target">
        <div className="st-group">
          <b className="st-group-title">Thông tin truyện chia sẻ</b>
          <div className="st-facts">
            <div><small>Nguồn</small><b>Gia đình chia sẻ</b></div>
            <div><small>Độ tuổi</small><b>{AGE[d.story.ageBand] ?? d.story.ageBand}</b></div>
            <div><small>Mức đọc</small><b>{d.story.readingLevel ?? '—'}</b></div>
            <div><small>Thể loại</small><b>{d.story.genre ?? '—'}</b></div>
            <div><small>Phiên bản</small><b>V{d.version.versionNo}{d.isResubmission ? ' · gửi lại' : ''}</b></div>
          </div>
          {d.story.description && <div className="st-quote"><small>Mô tả</small><p>{d.story.description}</p></div>}
          <div className="st-quote"><small>Bài học</small><p>{d.version.lesson || 'Chưa có thông tin bài học.'}</p></div>
        </div>

        <div className="st-group">
          <b className="st-group-title">Nội dung truyện &amp; media</b>
          {d.scenes.length > 0 ? (
            d.scenes.slice().sort((a, b) => a.sceneIndex - b.sceneIndex).map(scene => (
              <section className="st-scene" key={scene.sceneIndex}>
                <b>Cảnh {scene.sceneIndex + 1}</b>
                <p className="st-scene-text">{scene.text}</p>
                <div className="st-scene-part st-scene-pics">
                  <b className="st-scene-label">Tranh minh hoạ</b>
                  {scene.imageUrls.length > 0 ? (
                    <div className="st-pics">
                      {scene.imageUrls.map((url, idx) => (
                        <ReviewPicture key={idx} url={url} alt={`Cảnh ${scene.sceneIndex + 1}`} onZoom={(u, alt) => setZoom({ url: u, alt })} />
                      ))}
                    </div>
                  ) : (
                    <p className="sub">Cảnh này chưa có tranh minh hoạ.</p>
                  )}
                </div>
                <div className="st-scene-part st-scene-audio">
                  <b className="st-scene-label">Âm thanh</b>
                  {scene.audioUrls.length > 0 ? (
                    scene.audioUrls.map((url, idx) => (
                      <div key={idx} className="st-seg">
                        <audio controls preload="none" src={url} />
                      </div>
                    ))
                  ) : (
                    <p className="sub">Cảnh này chưa có âm thanh.</p>
                  )}
                </div>
              </section>
            ))
          ) : (
            <>
              <p className="sub">Truyện chia sẻ này chưa có cảnh tranh/âm thanh trong gói.</p>
              {d.version.content
                ? <div className="st-content" style={{ whiteSpace: 'pre-wrap' }}>{d.version.content}</div>
                : <p className="sub">Không có văn bản nội dung.</p>}
            </>
          )}
        </div>

        <div className="st-group">
          <b className="st-group-title">Học liệu đi kèm</b>
          {d.vocabulary.length === 0 && d.quizzes.length === 0 && discussion.length === 0 ? (
            <p className="sub">Truyện chia sẻ này chưa có từ vựng, câu đố hoặc câu hỏi thảo luận.</p>
          ) : (
            <>
              <LearningMaterials vocabulary={d.vocabulary} quizzes={d.quizzes} />
              {discussion.length > 0 && (
                <div className="st-learn" style={{ marginTop: 12 }}>
                  <section>
                    <b className="st-learn-title">Câu hỏi thảo luận ({discussion.length})</b>
                    {discussion.map((dq, idx) => (
                      <p key={idx}>• {dq.question}{dq.isMoralLesson ? ' (Bài học đạo đức)' : ''}</p>
                    ))}
                  </section>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div id="shared-sec-checks" className="mod-anchor-target">
        <div className="st-group">
          <b className="st-group-title">
            Bản quyền và kiểm tra thông tin cá nhân
            {(!d.copyrightDeclaration || d.piiRescan.length > 0) && <Warn why="Cần xem lại bản quyền hoặc thông tin cá nhân" />}
          </b>
          <div className="st-quote">
            <small>Cam kết bản quyền</small>
            <p>
              {d.copyrightDeclaration ? (COPYRIGHT[d.copyrightDeclaration] ?? d.copyrightDeclaration) : 'Chưa có cam kết bản quyền.'}
              {!d.copyrightDeclaration && <Warn why="Chưa có cam kết bản quyền" />}
            </p>
          </div>
          {d.piiCheckSummary && (
            <div className="st-quote">
              <small>Kết quả kiểm tra thông tin cá nhân</small>
              <p>{piiSummary(d.piiCheckSummary)}</p>
            </div>
          )}
          {d.piiRescan.length > 0 ? (
            <div className="st-storylist">
              {d.piiRescan.map((p, idx) => (
                <div className="st-storyrow bad" key={idx}>
                  <b>{p.kind}</b>
                  <span>{p.location}<Warn why="Có thể là thông tin cá nhân, cần kiểm tra" /></span>
                </div>
              ))}
            </div>
          ) : (
            <span className="pill ok" style={{ width: 'fit-content' }}>
              <Check className="ic" />Không phát hiện thông tin cá nhân
            </span>
          )}
        </div>

        <div className="st-group">
          <b className="st-group-title">
            Checklist chia sẻ cộng đồng
            {has('checklist_incomplete') && <Warn why="Checklist chưa đạt đủ" />}
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
                    void act(() => moderationService.communityChecklist(id, [updated]));
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="st-group">
          <b className="st-group-title">Nhãn nội dung</b>
          {d.labels.length > 0 ? (
            <div className="st-label-pills">
              {d.labels.map(l => <span key={l.id} className="pill ok">{l.displayName}</span>)}
            </div>
          ) : (
            <p className="sub">Chưa gắn nhãn nội dung nào.</p>
          )}
          <div className="row">
            <button type="button" className="btn btn-s" disabled={locked} onClick={() => void loadCategories()}>
              <Tag className="ic" />Chọn lại nhãn
            </button>
          </div>
          {categories && (
            <>
              <div className="st-labels">
                {categories.map(c => (
                  <label className="row" key={c.id}>
                    <input
                      type="checkbox"
                      disabled={locked}
                      checked={labelIds.includes(c.id)}
                      onChange={e => setLabelIds(v => e.target.checked ? [...v, c.id] : v.filter(x => x !== c.id))}
                    />
                    {c.displayName}
                  </label>
                ))}
              </div>
              {labelsDirty && (
                <div className="row">
                  <button
                    type="button"
                    className="btn btn-p"
                    disabled={locked || labelIds.length === 0}
                    onClick={() => void act(async () => {
                      const chosen = labelIds;
                      const r = await moderationService.labels('CommunitySubmission', id, chosen);
                      if (r.success) setSavedLabelIds(chosen);
                      return r;
                    })}
                  >
                    <Check className="ic" />Lưu tập nhãn
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div id="shared-sec-decision" className="st-group mod-anchor-target">
        <b className="st-group-title">Quyết định</b>
        {d.blockers.length > 0 && (
          <ul className="st-blockers" role="status" aria-label="Việc còn thiếu trước khi duyệt">
            {d.blockers.map(b => (
              <li key={b.code} className="mod-blocker-item">
                <span className="row" style={{ flex: '1 1 220px' }}>
                  <CircleAlert className="ic" aria-hidden="true" />
                  <span>{b.message}</span>
                </span>
                <button type="button" className="mod-blocker-link" onClick={() => jumpTo('shared-sec-checks')}>
                  Xem Kiểm tra chia sẻ
                </button>
              </li>
            ))}
          </ul>
        )}
        <label className="field">
          <span className="lbl">Lý do quyết định (bắt buộc khi Từ chối)</span>
          <textarea
            className="inp"
            maxLength={1000}
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Nhập lý do rõ ràng và an toàn nếu từ chối chia sẻ…"
          />
        </label>
        <div className="row st-wrap">
          <button
            type="button"
            className="btn btn-ok"
            disabled={locked || !d.canApprove}
            title={d.blockers.map(b => b.message).join(' · ') || undefined}
            onClick={() => void decide('Duyệt chia sẻ truyện này lên cộng đồng?', 'Approved', () => moderationService.approve('CommunitySubmission', id))}
          >
            <Check className="ic" />Duyệt chia sẻ
          </button>
          <button
            type="button"
            className="btn btn-no"
            disabled={locked || !usableReason}
            onClick={() => void decide('Từ chối yêu cầu chia sẻ này?', 'Rejected', () => moderationService.reject('CommunitySubmission', id, reason))}
          >
            <X className="ic" />Từ chối chia sẻ
          </button>
        </div>
      </div>

      <ZoomLightbox zoom={zoom} onClose={() => setZoom(null)} />
    </div>
  );
}
