'use client';
import { useEffect, useState } from 'react';
import { Check, CircleAlert, Pencil, RefreshCw, ShieldCheck, X } from 'lucide-react';
import Dialog from '@/app/components/Dialog';
import InfoTip from '@/app/components/InfoTip';
import Select from '@/app/components/Select';
import { confirmDialog } from '@/app/lib/confirm';
import { prefersReducedMotion, useRiseIn } from '@/app/lib/motion';
import { moderationService } from '@/app/services/moderationService';
import type * as B from '@/app/types/backendContracts';
import type { ApiResponse } from '@/app/types/auth';
import type { QueueItem } from '@/app/types/staff';
import ChangeRequestDialog from './ChangeRequestDialog';
import LearningMaterials from './LearningMaterials';
import { ListeningList, SafetyScanSection, SourceNote, StoryFacts, Warn, criterionEvidence } from './PublicReviewEvidence';
import ReviewPicture, { ZoomLightbox } from './ReviewPicture';
import { ReviewPanelHeader } from './ReviewPanelHeader';
import SegmentAudio from './SegmentAudio';
import VersionComparison from './VersionComparison';
import { useReviewItem } from './useReviewItem';

const CHECK_LABEL = {
  safety: 'An toàn',
  ageFit: 'Phù hợp tuổi',
  education: 'Giá trị giáo dục',
  language: 'Ngôn ngữ',
  copyright: 'Bản quyền',
  image: 'Tranh',
  audio: 'Âm thanh',
  interaction: 'Tương tác',
} as const;

const CHECK_OPTIONS = [
  { value: '', label: 'Chưa chấm' },
  { value: 'true', label: 'Đạt' },
  { value: 'false', label: 'Không đạt' },
];

export type PublicAnchorTarget = { id: string; label: string };

export function publicBlockerAnchor(code: string): PublicAnchorTarget {
  if (/view|scene|audio|image/i.test(code)) return { id: 'creator-sec-media', label: 'Xem Nội dung & media' };
  if (/checklist/i.test(code)) return { id: 'creator-sec-checklist', label: 'Xem Checklist' };
  if (/flag|safety/i.test(code)) return { id: 'creator-sec-ai', label: 'Xem Bằng chứng AI' };
  if (/label/i.test(code)) return { id: 'creator-sec-labels', label: 'Xem Nhãn nội dung' };
  return { id: 'creator-sec-decision', label: 'Xem Quyết định' };
}

function jumpTo(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    block: 'start',
  });
}

export default function PublicStoryReviewPanel({
  id,
  queueItem,
  onDecision,
}: {
  id: number;
  queueItem?: QueueItem;
  onDecision: (outcome?: 'Approved' | 'ChangesRequested' | 'Rejected') => void;
}) {
  const { item, message, claimBlocked, busy, act, patch, refresh } = useReviewItem(
    'PublicStoryReview',
    id,
    () => onDecision(),
  );
  const riseRef = useRiseIn<HTMLDivElement>('.st-group', [id, item ? 1 : 0], { delay: 40, distance: 10 });

  const [reason, setReason] = useState('');
  const [compare, setCompare] = useState<B.PublicVersionComparisonDto | null>(null);
  const [changeOpen, setChangeOpen] = useState(false);
  const [changeFailed, setChangeFailed] = useState(false);
  const [flagDialog, setFlagDialog] = useState<{ flagId: string; name: string } | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [zoom, setZoom] = useState<{ url: string; alt: string } | null>(null);

  useEffect(() => {
    setCompare(null);
    setChangeOpen(false);
    setChangeFailed(false);
    setFlagDialog(null);
  }, [id]);

  if (!item || item.kind !== 'PublicStoryReview') {
    return (
      <div className="st-card">
        <p role="status">{message || 'Đang tải gói duyệt truyện Creator…'}</p>
        <div className="row">
          <button type="button" className="btn btn-s" onClick={refresh}>
            <RefreshCw className="ic" />Tải lại
          </button>
        </div>
      </div>
    );
  }

  const d = item.data;
  const content = d.version.content ?? '';
  const blockers = d.approveBlockers;
  const has = (code: string) => blockers.some(b => b.code === code);
  const locked = busy || claimBlocked;
  const usableReason = !!reason.trim();

  const setCheck = async (key: keyof typeof CHECK_LABEL, value: boolean) => {
    patch(cur => cur.kind === 'PublicStoryReview'
      ? { ...cur, data: { ...cur.data, checklist: { ...cur.data.checklist, [key]: value } } }
      : cur);
    if (!(await act(() => moderationService.publicChecklist(id, { [key]: value })))) refresh();
  };

  const viewScene = async (sceneId: number) => {
    patch(cur => cur.kind === 'PublicStoryReview'
      ? { ...cur, data: { ...cur.data, scenes: cur.data.scenes.map(s => s.sceneId === sceneId ? { ...s, viewed: true } : s) } }
      : cur);
    if (!(await act(() => moderationService.view(id, 'scene', sceneId)))) refresh();
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
      <nav className="mod-anchors" aria-label="Điều hướng nhanh gói duyệt">
        <button type="button" onClick={() => jumpTo('creator-sec-media')}>Nội dung &amp; media</button>
        <button type="button" onClick={() => jumpTo('creator-sec-learning')}>Học liệu</button>
        <button type="button" onClick={() => jumpTo('creator-sec-ai')}>Bằng chứng AI</button>
        <button type="button" onClick={() => jumpTo('creator-sec-decision')}>Quyết định</button>
      </nav>

      <ReviewPanelHeader item={item} queueItem={queueItem} message={message} />

      {claimBlocked && (
        <div className="notice err row st-wrap" role="alert" data-inline-notice>
          <span>Quyền giữ hồ sơ không còn hiệu lực hoặc dữ liệu đã thay đổi. Ghi chú chưa gửi vẫn được giữ nguyên; hãy tải lại danh sách để kiểm tra trạng thái mới.</span>
          <button type="button" className="btn btn-s" onClick={refresh}><RefreshCw className="ic" />Tải lại quyền</button>
        </div>
      )}

      <div id="creator-sec-media" className="mod-anchor-target">
        <StoryFacts d={d} />
        <div className="st-group">
          <b className="st-group-title">
            Các cảnh cần xem và nghe
            {has('views_incomplete') && <Warn why="Chưa xem đủ các cảnh hoặc chưa nghe audio" />}
          </b>
          {d.scenes.length === 0 ? (
            content
              ? <div className="st-content" style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
              : <p className="sub">Phiên bản này chưa có cảnh hoặc nội dung văn bản.</p>
          ) : (
            d.scenes.map(scene => (
              <section className={`st-scene${scene.viewed ? ' viewed' : ''}`} key={scene.sceneId}>
                <b>
                  Cảnh {scene.sceneIndex + 1}
                  {!scene.viewed && <Warn why="Chưa xác nhận đã xem cảnh này" />}
                </b>
                <p className="st-scene-text">{scene.sceneText}</p>
                {scene.illustrations.length > 0 && (
                  <div className="st-scene-part st-scene-pics">
                    <b className="st-scene-label">Tranh minh hoạ</b>
                    <div className="st-pics">
                      {scene.illustrations.map(i => (
                        <div className="pr-pic" key={i.beatOrder}>
                          {i.url
                            ? <ReviewPicture url={i.url} alt={i.visualFocus} onZoom={(url, alt) => setZoom({ url, alt })} />
                            : <div className="st-pic st-pic-empty"><span>Tranh chưa sẵn sàng</span></div>}
                          <SourceNote source={i.source} sourceDeclaration={i.sourceDeclaration} rightsDeclaration={i.rightsDeclaration} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {scene.segments.length > 0 && (
                  <div className="st-scene-part st-scene-audio">
                    <b className="st-scene-label">Âm thanh</b>
                    {scene.segments.map(s => (
                      <div key={s.segmentId} className="st-seg">
                        <div className="row">
                          <SourceNote source={s.audioSource} sourceDeclaration={s.sourceDeclaration} rightsDeclaration={s.rightsDeclaration} />
                          {s.hasPronunciationWarning && <span className="pill wait">Cần nghe kỹ phát âm</span>}
                        </div>
                        {!scene.sceneText.includes(s.text.trim()) && <p>{s.text}</p>}
                        <SegmentAudio
                          url={s.audioUrl}
                          heard={s.heard}
                          onHeard={() => void act(() => moderationService.view(id, 'audio', s.segmentId))}
                        />
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" className="btn btn-s" disabled={locked || scene.viewed} onClick={() => void viewScene(scene.sceneId)}>
                  <Check className="ic" aria-hidden="true" />
                  {scene.viewed ? 'Đã xem' : 'Xác nhận đã xem'}
                </button>
              </section>
            ))
          )}
        </div>
      </div>

      <div id="creator-sec-learning" className="mod-anchor-target">
        <ListeningList items={d.listeningInteractions ?? []} />
        <div className="st-group">
          <b className="st-group-title">Học liệu và so sánh phiên bản</b>
          <details open>
            <summary>Học liệu</summary>
            <LearningMaterials vocabulary={d.vocabulary} quizzes={d.quizzes} />
          </details>
          <div className="row">
            {(['previous', 'public'] as const).map(against => (
              <button
                key={against}
                type="button"
                className="btn btn-s"
                disabled={locked}
                onClick={() => void moderationService.compare(id, against).then(r => { if (r.success) setCompare(r.data); })}
              >
                So với {against === 'previous' ? 'bản trước' : 'bản công khai'}
              </button>
            ))}
          </div>
          {compare && (
            <details open>
              <summary>So sánh phiên bản</summary>
              <VersionComparison data={compare} />
            </details>
          )}
        </div>
      </div>

      <div id="creator-sec-ai" className="mod-anchor-target">
        <SafetyScanSection
          packageData={d}
          content={content}
          busy={locked}
          onResolveFlag={(flagId, name) => { setFlagReason(''); setFlagDialog({ flagId, name }); }}
        />
      </div>

      <div id="creator-sec-checklist" className="st-group mod-anchor-target">
        <b className="st-group-title">
          Checklist chấm điểm của Moderator
          {has('checklist_incomplete') && <Warn why="Checklist chưa chấm đủ" />}
        </b>
        <div className="st-checks">
          {(Object.keys(CHECK_LABEL) as (keyof typeof CHECK_LABEL)[]).map(key => (
            <div className="field" key={key}>
              <span className="st-flabel">
                {CHECK_LABEL[key]} <InfoTip text={criterionEvidence(d, key)} />
                {d.checklist[key] === null && <Warn why="Chưa chấm" />}
              </span>
              <Select<string>
                ariaLabel={CHECK_LABEL[key]}
                disabled={locked}
                value={d.checklist[key] === null ? '' : String(d.checklist[key])}
                options={CHECK_OPTIONS}
                onChange={v => { if (v && !locked) void setCheck(key, v === 'true'); }}
              />
            </div>
          ))}
        </div>
      </div>

      <div id="creator-sec-labels" className="st-group mod-anchor-target">
        <b className="st-group-title">
          Nhãn nội dung Creator đề xuất
          {has('no_labels') && <Warn why="Creator chưa đề xuất nhãn nào" />}
        </b>
        {d.proposedLabels.length > 0 ? (
          <div className="st-label-pills">
            {d.proposedLabels.map(l => <span className="pill ok" key={l.contentCategoryId}>{l.displayName}</span>)}
          </div>
        ) : (
          <div className="st-quote">
            <small>Chưa có nhãn</small>
            <p>Chưa duyệt được khi chưa có nhãn. Dùng &ldquo;Yêu cầu sửa&rdquo; (phần Thông tin chung) để Creator bổ sung.</p>
          </div>
        )}
      </div>

      <div id="creator-sec-decision" className="st-group mod-anchor-target">
        <b className="st-group-title">Quyết định</b>
        {blockers.length > 0 && (
          <ul className="st-blockers" role="status" aria-label="Việc còn thiếu trước khi duyệt">
            {blockers.map(b => {
              const target = publicBlockerAnchor(b.code);
              return (
                <li key={b.code} className="mod-blocker-item">
                  <span className="row" style={{ flex: '1 1 220px' }}>
                    <CircleAlert className="ic" aria-hidden="true" />
                    <span>{b.message}</span>
                  </span>
                  <button type="button" className="mod-blocker-link" onClick={() => jumpTo(target.id)}>
                    {target.label}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <label className="field">
          <span className="lbl">
            Lý do / ghi chú quyết định <InfoTip text="Bắt buộc khi Từ chối hoặc Yêu cầu sửa." />
          </span>
          <textarea
            className="inp"
            maxLength={1000}
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Ghi rõ lý do nếu từ chối hoặc yêu cầu Creator chỉnh sửa…"
          />
        </label>
        <div className="row st-wrap">
          <button
            type="button"
            className="btn btn-ok"
            disabled={locked || !d.canApprove}
            title={blockers.map(b => b.message).join(' · ') || undefined}
            onClick={() => void decide('Duyệt truyện này? Truyện sẽ được công khai lên thư viện cộng đồng.', 'Approved', () => moderationService.approve('PublicStoryReview', id))}
          >
            <Check className="ic" />Duyệt và công khai
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
            onClick={() => void decide('Từ chối phiên bản này? Lý do sẽ được gửi cho Creator.', 'Rejected', () => moderationService.reject('PublicStoryReview', id, reason))}
          >
            <X className="ic" />Từ chối
          </button>
        </div>
      </div>

      <ChangeRequestDialog
        open={changeOpen}
        item={{ kind: 'PublicStoryReview', data: d }}
        initialNote={reason}
        busy={locked}
        errorMessage={changeFailed ? message : ''}
        onClose={() => { setChangeFailed(false); setChangeOpen(false); }}
        onSubmit={async payload => {
          if (payload.kind !== 'PublicStoryReview') return false;
          setChangeFailed(false);
          const ok = await act(() => moderationService.publicChanges(id, payload.body), false);
          if (ok) onDecision('ChangesRequested');
          else setChangeFailed(true);
          return ok;
        }}
      />

      {flagDialog && (
        <Dialog title={`Xác nhận cờ “${flagDialog.name}” là an toàn`} onClose={() => setFlagDialog(null)}>
          <label className="field">
            <span className="lbl">Lý do</span>
            <textarea
              className="inp"
              autoFocus
              rows={3}
              maxLength={1000}
              placeholder="Ví dụ: Tên nhân vật hư cấu, không phải thông tin thật của trẻ"
              value={flagReason}
              onChange={e => setFlagReason(e.target.value)}
            />
          </label>
          <div className="row">
            <button type="button" className="btn btn-g" disabled={locked} onClick={() => setFlagDialog(null)}>Huỷ</button>
            <button
              type="button"
              className="btn btn-p"
              disabled={locked || !flagReason.trim()}
              onClick={() => {
                const target = flagDialog;
                setFlagDialog(null);
                void act(() => moderationService.resolveFlag(id, target.flagId, flagReason));
              }}
            >
              <ShieldCheck className="ic" />Xác nhận
            </button>
          </div>
        </Dialog>
      )}

      <ZoomLightbox zoom={zoom} onClose={() => setZoom(null)} />
    </div>
  );
}
