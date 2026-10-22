'use client';
import { useState } from 'react';
import type * as B from '@/app/types/backendContracts';
import { moderationService, type ReviewKind } from '@/app/services/moderationService';
import { staffService } from '@/app/services/staffService';
import { useAuth } from '@/app/context/AuthContext';
import { useReviewItem } from './useReviewItem';

export default function ReviewPanel({ kind, id, onDecision }: { kind: ReviewKind; id: number; onDecision: () => void }) {
  const { item, message, busy, act, refresh } = useReviewItem(kind, id, onDecision);
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [archiveReason, setArchiveReason] = useState<'SafetyConcern' | 'Copyright' | 'Inappropriate'>('SafetyConcern');
  const [partType, setPartType] = useState(kind === 'RoadmapTemplateReview' ? 'name_description' : 'metadata');
  const [partId, setPartId] = useState('');
  const [labelIds, setLabelIds] = useState<number[]>([]);
  const [categories, setCategories] = useState<{ id: number; displayName: string }[] | null>(null);
  const [compare, setCompare] = useState<B.PublicVersionComparisonDto | null>(null);
  const labelLoader = async () => { const r = await staffService.categories(); if (r.success) setCategories(r.data ?? []); };
  const usableReason = !!reason.trim();
  if (!item) return <div className="st-card"><p role="status">{message || 'Đang tải gói kiểm duyệt…'}</p><button className="btn btn-s" onClick={refresh}>Tải lại</button></div>;
  const data = item.data;
  const canApprove = 'canApprove' in data && data.canApprove;
  const blockers = 'approveBlockers' in data ? data.approveBlockers : 'blockers' in data ? data.blockers : [];
  const decisionKind = item.kind === 'PublicStoryReview' || item.kind === 'CommunitySubmission' || item.kind === 'RoadmapTemplateReview' ? item.kind : null;
  const content = item.kind === 'PublicStoryReview' ? item.data.version.content : item.kind === 'CommunitySubmission' ? item.data.version.content : item.kind === 'ContentReport' ? item.data.version?.content : item.kind === 'GrayZoneStory' ? item.data.content : null;
  const title = item.kind === 'PublicStoryReview' ? item.data.story.title : item.kind === 'CommunitySubmission' || item.kind === 'ContentReport' ? item.data.story.title : item.kind === 'RoadmapTemplateReview' ? item.data.roadmap.name : item.kind === 'GrayZoneStory' ? item.data.title : 'Yêu cầu gỡ truyện';
  return <div className="st-card">
    <h3>{title}</h3>
    {message && <div className="notice" role="status">{message}</div>}
    {content && <div className="st-content" style={{ whiteSpace: 'pre-wrap' }}>{content}</div>}
    {'claimExpiresAt' in data && <p className="sub">Hạn giữ mục: {new Date(data.claimExpiresAt ?? '').toLocaleString('vi-VN')}</p>}
    {item.kind === 'PublicStoryRemoval' && <p style={{ whiteSpace: 'pre-wrap' }}>{item.data.flags}</p>}
    {item.kind === 'GrayZoneStory' && <p style={{ whiteSpace: 'pre-wrap' }}>{item.data.flags}</p>}
    {item.kind === 'ContentReport' && <><p>{item.data.reason}: {item.data.description}</p>{item.data.escalationReason && <p>Chuyển cấp: {item.data.escalationReason}</p>}</>}
    {item.kind === 'PublicStoryReview' && <>
      {item.data.scenes.map(scene => <section className="sec" key={scene.sceneId}>
        <b>Cảnh {scene.sceneIndex + 1}</b><p>{scene.sceneText}</p>
        {scene.illustrations.map(i => i.url ? <a key={i.beatOrder} href={i.url} target="_blank" rel="noreferrer">Xem tranh {i.beatOrder + 1}: {i.visualFocus}</a> : <p key={i.beatOrder}>Tranh chưa sẵn sàng</p>)}
        <button className="btn btn-s" disabled={busy || scene.viewed} onClick={() => void act(() => moderationService.view(id, 'scene', scene.sceneId))}>{scene.viewed ? 'Đã xem cảnh' : 'Xác nhận đã xem cảnh'}</button>
        {scene.segments.map(s => <div key={s.segmentId}><p>{s.text}</p>{s.audioUrl && <audio controls src={s.audioUrl} onEnded={() => { if (!s.heard) void act(() => moderationService.view(id, 'audio', s.segmentId)); }} />}{s.heard && <small>Đã nghe</small>}</div>)}
      </section>)}
      <h4>Checklist</h4>
      {(['safety', 'ageFit', 'education', 'language', 'copyright', 'image', 'audio', 'interaction'] as const).map(key => <label className="row" key={key}>{({ safety: 'An toàn', ageFit: 'Phù hợp tuổi', education: 'Giá trị giáo dục', language: 'Ngôn ngữ', copyright: 'Bản quyền', image: 'Tranh', audio: 'Âm thanh', interaction: 'Tương tác' })[key]}
        <select className="inp" disabled={busy} value={item.data.checklist[key] === null ? '' : String(item.data.checklist[key])} onChange={e => { if (e.target.value) void act(() => moderationService.publicChecklist(id, { [key]: e.target.value === 'true' })); }}><option value="">Chưa chấm</option><option value="true">Đạt</option><option value="false">Không đạt</option></select></label>)}
      <h4>Cờ cần xử lý</h4>{item.data.flags.map(f => <div key={f.flagId}><p>{f.name}: {f.reason}</p><blockquote>{f.evidenceQuote}</blockquote><p>{f.contextNote}</p><button className="btn btn-s" disabled={busy || f.resolved || !usableReason} onClick={() => void act(() => moderationService.resolveFlag(id, f.flagId, reason))}>{f.resolved ? 'Đã xử lý' : 'Xác nhận an toàn với lý do bên dưới'}</button></div>)}
      <details><summary>Học liệu</summary>{item.data.vocabulary.map((v,i) => <p key={i}>{v.term}: {v.definition}</p>)}{item.data.quizzes.map((q,i) => <p key={i}>{q.question} — {q.correctAnswer}</p>)}{item.data.discussionQuestions.map((q,i) => <p key={i}>{q.question}</p>)}</details>
      <div className="row">{(['previous','public'] as const).map(against => <button key={against} className="btn btn-s" disabled={busy} onClick={() => void moderationService.compare(id, against).then(r => { if (r.success) setCompare(r.data); })}>So với {against === 'previous' ? 'bản trước' : 'bản công khai'}</button>)}</div>
      {compare && <details open><summary>So sánh phiên bản</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(compare, null, 2)}</pre></details>}
    </>}
    {(item.kind === 'RoadmapTemplateReview' || item.kind === 'CommunitySubmission') && <>
      <h4>Checklist</h4>{item.data.checklist.map(entry => <label className="row" key={entry.code}>{entry.label}<select className="inp" disabled={busy} value={String(entry.passed)} onChange={e => { const updated = { ...entry, passed: e.target.value === 'true' }; void act(() => item.kind === 'CommunitySubmission' ? moderationService.communityChecklist(id, [updated]) : moderationService.roadmapChecklist(id, [updated])); }}><option value="false">Không đạt / chưa chấm</option><option value="true">Đạt</option></select></label>)}
      {item.kind === 'RoadmapTemplateReview' && <ol>{item.data.stories.map(s => <li key={s.storyId}>{s.title} · {s.isEligible ? 'Đủ điều kiện' : 'Không còn đủ điều kiện'}</li>)}</ol>}
      {item.kind === 'CommunitySubmission' && <><p>Bản quyền: {item.data.copyrightDeclaration}</p>{item.data.piiRescan.map((p,i) => <p key={i}>Thông tin cá nhân: {p.kind} · {p.location}</p>)}</>}
    </>}
    {(item.kind === 'PublicStoryReview' || item.kind === 'CommunitySubmission') && <section className="sec"><button className="btn btn-s" disabled={busy} onClick={() => void labelLoader()}>Chọn lại nhãn nội dung</button>
      {categories && <><p className="sub">Chọn toàn bộ tập nhãn muốn giữ, sau đó lưu.</p>{categories.map(c => <label className="row" key={c.id}><input type="checkbox" checked={labelIds.includes(c.id)} onChange={e => setLabelIds(v => e.target.checked ? [...v,c.id] : v.filter(x => x !== c.id))} />{c.displayName}</label>)}<button className="btn btn-s" disabled={busy || !labelIds.length} onClick={() => void act(() => moderationService.labels(item.kind as 'PublicStoryReview' | 'CommunitySubmission', id, labelIds))}>Lưu tập nhãn</button></>}
    </section>}
    {blockers.map((b,i) => <p className="notice warn" key={i}>{b.message}</p>)}
    <label className="field"><span className="lbl">Lý do / ghi chú quyết định</span><textarea className="inp" maxLength={item.kind === 'GrayZoneStory' || item.kind === 'PublicStoryRemoval' ? 2000 : 1000} rows={3} value={reason} onChange={e => setReason(e.target.value)} /></label>
    {decisionKind && <div className="row"><button className="btn btn-ok" disabled={busy || !canApprove} onClick={() => void act(() => moderationService.approve(decisionKind, id), true)}>Duyệt</button><button className="btn btn-no" disabled={busy || !usableReason} onClick={() => void act(() => moderationService.reject(decisionKind, id, reason), true)}>Từ chối</button></div>}
    {(item.kind === 'PublicStoryReview' || item.kind === 'RoadmapTemplateReview') && <section className="sec"><label className="field">Phần cần sửa<select className="inp" value={partType} onChange={e => setPartType(e.target.value)}>{(item.kind === 'PublicStoryReview' ? ['metadata','scene_text','scene_image','scene_audio','quiz','vocabulary','discussion'] : ['name_description','order','age_level','story']).map(p => <option key={p} value={p}>{p}</option>)}</select></label><label className="field">ID phần / truyện (bỏ trống với metadata)<input className="inp" type="number" min={1} value={partId} onChange={e => setPartId(e.target.value)} /></label><button className="btn btn-s" disabled={busy || !usableReason} onClick={() => void act(() => item.kind === 'PublicStoryReview' ? moderationService.publicChanges(id, { generalNote: reason, parts: [{ partType, partId: partId ? Number(partId) : null, note: reason }] }) : moderationService.roadmapChanges(id, { generalNote: reason, parts: [{ partType, storyId: partId ? Number(partId) : null, action: partType === 'story' ? 'replace' : null, note: reason }] }), true)}>Yêu cầu sửa</button></section>}
    {item.kind === 'GrayZoneStory' && <div className="row">{(['Clear','Block'] as const).map(decision => <button className="btn btn-s" key={decision} disabled={busy || !usableReason} onClick={() => void act(() => moderationService.grayDecision(id, { decision, reason, rowVersion: item.data.rowVersion }), true)}>{decision === 'Clear' ? 'Cho phép tiếp tục' : 'Chặn nội dung'}</button>)}</div>}
    {item.kind === 'PublicStoryRemoval' && <div className="row">{[true,false].map(approve => <button className="btn btn-s" key={String(approve)} disabled={busy || !usableReason} onClick={() => void act(() => moderationService.removalDecision(id, { approve, reason, rowVersion: item.data.rowVersion }), true)}>{approve ? 'Chấp thuận gỡ' : 'Không chấp thuận gỡ'}</button>)}</div>}
    {item.kind === 'ContentReport' && <><select className="inp" value={archiveReason} onChange={e => setArchiveReason(e.target.value as typeof archiveReason)}><option value="SafetyConcern">Không an toàn</option><option value="Copyright">Bản quyền</option><option value="Inappropriate">Không phù hợp</option></select><div className="row">{(['dismiss','archive','escalate'] as const).filter(action => action !== 'escalate' || user?.role === 'Moderator').map(action => <button className="btn btn-s" key={action} disabled={busy || !usableReason} onClick={() => void act(() => moderationService.reportDecision(id, action, reason, archiveReason), true)}>{({ dismiss: 'Bỏ qua báo cáo', archive: 'Gỡ truyện vi phạm', escalate: 'Chuyển Administrator' })[action]}</button>)}</div></>}
  </div>;
}
