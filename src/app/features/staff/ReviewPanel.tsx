'use client';
import { useEffect, useState } from 'react';
import type * as B from '@/app/types/backendContracts';
import { moderationService, type ReviewKind } from '@/app/services/moderationService';
import { staffService } from '@/app/services/staffService';
import { useAuth } from '@/app/context/AuthContext';
import { useReviewItem } from './useReviewItem';
import VersionComparison from './VersionComparison';
import SegmentAudio from './SegmentAudio';
import LearningMaterials from './LearningMaterials';
import '@/app/features/review/review-tools.css';
import SafeImage from "@/app/components/SafeImage";
import { RefreshCw } from "lucide-react";

/** Tên tiếng Việt của các phần cần sửa (giá trị gửi lên backend giữ nguyên). */
const PART_LABEL: Record<string, string> = {
  metadata: 'Thông tin chung (tiêu đề, mô tả, nhãn)', scene_text: 'Chữ của cảnh', scene_image: 'Tranh của cảnh', scene_audio: 'Âm thanh của cảnh',
  quiz: 'Câu đố', vocabulary: 'Từ vựng', listening: 'Câu hỏi tương tác khi nghe',
  name_description: 'Tên và mô tả bộ truyện', order: 'Thứ tự các truyện', age_level: 'Độ tuổi và mức đọc', story: 'Một truyện trong bộ',
};

const COPYRIGHT: Record<string, string> = { OwnWork: 'Tác giả tự sáng tác', AiGenerated: 'Do AI của nền tảng tạo ra', FamilyUse: 'Chỉ dùng trong gia đình' };
/** Kết quả kiểm tra thông tin cá nhân của backend là chuỗi JSON như {"passed": true}; đổi thành câu đọc được. */
function piiSummary(raw: string): string {
  try { const v = JSON.parse(raw) as { passed?: boolean }; if (typeof v.passed === 'boolean') return v.passed ? 'Đạt: không phát hiện thông tin cá nhân.' : 'Không đạt: có thể có thông tin cá nhân.'; } catch { /* không phải JSON thì giữ nguyên */ }
  return raw;
}
/** Tên ngắn của tiêu chí checklist (mã do backend định nghĩa); nhãn đầy đủ của backend hiện khi rê chuột. */
const CRITERION_SHORT: Record<string, string> = {
  safety_baseline: 'An toàn', no_personal_info: 'Không lộ thông tin cá nhân', metadata_labels: 'Nhãn nội dung đúng',
  order: 'Thứ tự theo độ khó', theme: 'Cùng chủ đề chính', name_description: 'Tên và mô tả phù hợp', age_level: 'Độ tuổi, mức đọc khớp',
};
const REPORT_REASON: Record<string, string> = { SafetyConcern: 'Không an toàn', Inappropriate: 'Không phù hợp', WrongAgeBand: 'Không đúng độ tuổi', Copyright: 'Bản quyền', Cultural: 'Văn hoá', Other: 'Khác' };

/** Dấu ! báo mục còn thiếu; rê chuột để xem lý do. */
const Warn = ({ why }: { why: string }) => <span className="st-warn" role="img" aria-label={why} title={why}>!</span>;

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
  const [flagDialog, setFlagDialog] = useState<{ flagId: string; name: string } | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [zoom, setZoom] = useState<{ url: string; alt: string } | null>(null);
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoom(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoom]);
  const usableReason = !!reason.trim();
  if (!item) return <div className="st-card"><p role="status">{message || 'Đang tải gói kiểm duyệt…'}</p><button className="btn btn-s" onClick={refresh}><RefreshCw className="ic" />Tải lại</button></div>;
  const data = item.data;
  const canApprove = 'canApprove' in data && data.canApprove;
  const blockers = 'approveBlockers' in data ? data.approveBlockers : 'blockers' in data ? data.blockers : [];
  const has = (code: string) => blockers.some(b => b.code === code);
  const decisionKind = item.kind === 'PublicStoryReview' || item.kind === 'CommunitySubmission' || item.kind === 'RoadmapTemplateReview' ? item.kind : null;
  const content = item.kind === 'PublicStoryReview' ? item.data.version.content : item.kind === 'CommunitySubmission' ? item.data.version.content : item.kind === 'ContentReport' ? item.data.version?.content : item.kind === 'GrayZoneStory' ? item.data.content : null;
  const title = item.kind === 'PublicStoryReview' ? item.data.story.title : item.kind === 'CommunitySubmission' || item.kind === 'ContentReport' ? item.data.story.title : item.kind === 'RoadmapTemplateReview' ? item.data.roadmap.name : item.kind === 'GrayZoneStory' ? item.data.title : 'Yêu cầu gỡ truyện';
  return <div className="st-card st-review">
    <div className="st-group">
      <h3>{title}</h3>
      {'claimExpiresAt' in data && <p className="sub">Hạn giữ mục: {new Date(data.claimExpiresAt ?? '').toLocaleString('vi-VN')}</p>}
      {message && <div className="notice" role="status">{message}</div>}
    </div>
    {item.kind === 'ContentReport' && <div className="st-group"><b className="st-group-title">Nội dung báo cáo</b>
      <div className="st-facts">
        <div><small>Lý do báo cáo</small><b>{REPORT_REASON[item.data.reason] ?? item.data.reason}</b></div>
        <div><small>Gửi lúc</small><b>{new Date(item.data.createdAt).toLocaleString('vi-VN')}</b></div>
      </div>
      <div className="st-quote"><small>Mô tả của người báo cáo</small><p>{item.data.description || 'Người báo cáo không ghi mô tả.'}</p></div>
      {item.data.attachmentUrl && <a className="btn btn-s" href={item.data.attachmentUrl} target="_blank" rel="noreferrer">Mở bằng chứng đính kèm</a>}
      {item.data.escalationReason && <div className="st-quote"><small>Lý do chuyển cấp</small><p>{item.data.escalationReason}</p></div>}
    </div>}
    {(item.kind === 'GrayZoneStory' || item.kind === 'PublicStoryRemoval') && <div className="st-group"><b className="st-group-title">{item.kind === 'GrayZoneStory' ? 'Vì sao truyện bị đưa vào vùng xám' : 'Yêu cầu gỡ truyện'}</b>
      {item.kind === 'GrayZoneStory' && <div className="st-facts"><div><small>Độ tuổi</small><b>{item.data.ageBand}</b></div><div><small>Mức đọc</small><b>{item.data.readingLevel ?? '—'}</b></div><div><small>Phiên bản</small><b>Bản {item.data.versionNo}</b></div></div>}
      <div className="st-quote"><small>Ghi chú của hệ thống</small><p style={{ whiteSpace: 'pre-wrap' }}>{item.data.flags || 'Không có ghi chú.'}</p></div>
    </div>}
    {content && <div className="st-group"><b className="st-group-title">{item.kind === 'ContentReport' ? 'Truyện bị báo cáo' : 'Nội dung cần xem'}</b>
      <div className="st-content" style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
    </div>}
    {item.kind === 'PublicStoryReview' && <>
      <div className="st-group"><b className="st-group-title">Các cảnh cần xem và nghe{has('views_incomplete') && <Warn why="Chưa xem đủ các cảnh hoặc chưa nghe audio" />}</b>
        {item.data.scenes.map(scene => <section className="st-scene" key={scene.sceneId}>
          <b>Cảnh {scene.sceneIndex + 1}{!scene.viewed && <Warn why="Chưa xác nhận đã xem cảnh này" />}</b><p>{scene.sceneText}</p>
          {scene.illustrations.length > 0 && <div className="st-scene-part"><b className="st-scene-label">Tranh minh hoạ</b><div className="st-pics">{scene.illustrations.map(i => i.url ? <button type="button" key={i.beatOrder} className="st-pic" onClick={() => setZoom({ url: i.url!, alt: i.visualFocus })} title="Phóng to tranh"><SafeImage src={i.url} alt={i.visualFocus} loading="lazy" /><span>{i.visualFocus}</span><em>Phóng to</em></button> : <div key={i.beatOrder} className="st-pic st-pic-empty"><span>Tranh chưa sẵn sàng</span></div>)}</div></div>}
          {scene.segments.length > 0 && <div className="st-scene-part"><b className="st-scene-label">Âm thanh</b>{scene.segments.map(s => <div key={s.segmentId} className="st-seg">{!scene.sceneText.includes(s.text.trim()) && <p>{s.text}</p>}<SegmentAudio url={s.audioUrl} heard={s.heard} onHeard={() => void act(() => moderationService.view(id, 'audio', s.segmentId))} /></div>)}</div>}
          <button className="btn btn-s" disabled={busy || scene.viewed} onClick={() => void act(() => moderationService.view(id, 'scene', scene.sceneId))}>{scene.viewed ? 'Đã xem cảnh' : 'Xác nhận đã xem cảnh'}</button>
        </section>)}
      </div>
      <div className="st-group"><b className="st-group-title">Checklist chấm điểm{has('checklist_incomplete') && <Warn why="Checklist chưa chấm đủ" />}</b>
        <div className="st-checks">{(['safety', 'ageFit', 'education', 'language', 'copyright', 'image', 'audio', 'interaction'] as const).map(key => <label className="field" key={key}><span className="st-flabel">{({ safety: 'An toàn', ageFit: 'Phù hợp tuổi', education: 'Giá trị giáo dục', language: 'Ngôn ngữ', copyright: 'Bản quyền', image: 'Tranh', audio: 'Âm thanh', interaction: 'Tương tác' })[key]}{item.data.checklist[key] === null && <Warn why="Chưa chấm" />}</span>
          <select className="inp" disabled={busy} value={item.data.checklist[key] === null ? '' : String(item.data.checklist[key])} onChange={e => { if (e.target.value) void act(() => moderationService.publicChecklist(id, { [key]: e.target.value === 'true' })); }}><option value="">Chưa chấm</option><option value="true">Đạt</option><option value="false">Không đạt</option></select></label>)}</div>
      </div>
      {item.data.flags.length > 0 && <div className="st-group"><b className="st-group-title">Cờ cần xử lý{item.data.flags.some(f => !f.resolved) && <Warn why="Còn cờ chưa xử lý" />}</b>
        {item.data.flags.map(f => <div className="st-scene" key={f.flagId}><b>{f.name}{!f.resolved && <Warn why="Cờ chưa xử lý" />}</b><p>{f.reason}</p>{f.evidenceQuote && <blockquote>{f.evidenceQuote}</blockquote>}{f.contextNote && <p className="sub">{f.contextNote}</p>}<button className="btn btn-s" disabled={busy || f.resolved} onClick={() => { setFlagReason(''); setFlagDialog({ flagId: f.flagId, name: f.name }); }}>{f.resolved ? 'Đã xử lý' : 'Xác nhận an toàn'}</button></div>)}
      </div>}
      <div className="st-group"><b className="st-group-title">Học liệu và so sánh phiên bản</b>
        <details open><summary>Học liệu</summary><LearningMaterials vocabulary={item.data.vocabulary} quizzes={item.data.quizzes} /></details>
        <div className="row">{(['previous','public'] as const).map(against => <button key={against} className="btn btn-s" disabled={busy} onClick={() => void moderationService.compare(id, against).then(r => { if (r.success) setCompare(r.data); })}>So với {against === 'previous' ? 'bản trước' : 'bản công khai'}</button>)}</div>
        {compare && <details open><summary>So sánh phiên bản</summary><VersionComparison data={compare} /></details>}
      </div>
    </>}
    {(item.kind === 'RoadmapTemplateReview' || item.kind === 'CommunitySubmission') && <>
      <div className="st-group"><b className="st-group-title">Checklist chấm điểm{has('checklist_incomplete') && <Warn why="Checklist chưa đạt đủ" />}</b>
        <div className="st-checks">{item.data.checklist.map(entry => <label className="field" key={entry.code}><span className="st-flabel" title={entry.label}>{CRITERION_SHORT[entry.code] ?? entry.label}{!entry.passed && <Warn why="Chưa đạt / chưa chấm" />}</span><select className="inp" disabled={busy} value={String(entry.passed)} onChange={e => { const updated = { ...entry, passed: e.target.value === 'true' }; void act(() => item.kind === 'CommunitySubmission' ? moderationService.communityChecklist(id, [updated]) : moderationService.roadmapChecklist(id, [updated])); }}><option value="false">Không đạt / chưa chấm</option><option value="true">Đạt</option></select></label>)}</div>
      </div>
      {item.kind === 'RoadmapTemplateReview' && <div className="st-group"><b className="st-group-title">Truyện trong bộ</b><div className="st-storylist">{item.data.stories.map(s => <div className={`st-storyrow${s.isEligible ? '' : ' bad'}`} key={s.storyId}><b>{s.title}</b><span>{s.isEligible ? 'Đủ điều kiện' : 'Không còn đủ điều kiện'}{!s.isEligible && <Warn why="Truyện không còn đủ điều kiện, hãy chọn Yêu cầu sửa" />}</span></div>)}</div></div>}
      {item.kind === 'CommunitySubmission' && <div className="st-group"><b className="st-group-title">Bản quyền và thông tin cá nhân{(!item.data.copyrightDeclaration || item.data.piiRescan.length > 0) && <Warn why="Cần xem lại bản quyền hoặc thông tin cá nhân" />}</b>
        <div className="st-quote"><small>Cam kết bản quyền của tác giả</small><p>{item.data.copyrightDeclaration ? (COPYRIGHT[item.data.copyrightDeclaration] ?? item.data.copyrightDeclaration) : 'Tác giả chưa ghi cam kết bản quyền.'}{!item.data.copyrightDeclaration && <Warn why="Chưa có cam kết bản quyền" />}</p></div>
        {item.data.piiCheckSummary && <div className="st-quote"><small>Kết quả kiểm tra thông tin cá nhân</small><p>{piiSummary(item.data.piiCheckSummary)}</p></div>}
        {item.data.piiRescan.length > 0 ? <div className="st-storylist">{item.data.piiRescan.map((p,i) => <div className="st-storyrow bad" key={i}><b>{p.kind}</b><span>{p.location}<Warn why="Có thể là thông tin cá nhân, cần kiểm tra" /></span></div>)}</div> : <p className="sub">Không phát hiện thông tin cá nhân.</p>}
      </div>}
    </>}
    {(item.kind === 'PublicStoryReview' || item.kind === 'CommunitySubmission') && <div className="st-group"><b className="st-group-title">Nhãn nội dung</b><button className="btn btn-s" disabled={busy} onClick={() => void labelLoader()}>Chọn lại nhãn nội dung</button>
      {categories && <><p className="sub">Chọn toàn bộ tập nhãn muốn giữ, sau đó lưu.</p><div className="st-labels">{categories.map(c => <label className="row" key={c.id}><input type="checkbox" checked={labelIds.includes(c.id)} onChange={e => setLabelIds(v => e.target.checked ? [...v,c.id] : v.filter(x => x !== c.id))} />{c.displayName}</label>)}</div><button className="btn btn-s" disabled={busy || !labelIds.length} onClick={() => void act(() => moderationService.labels(item.kind as 'PublicStoryReview' | 'CommunitySubmission', id, labelIds))}>Lưu tập nhãn</button></>}
    </div>}
    <div className="st-group"><b className="st-group-title">Quyết định</b>
      <label className="field"><span className="lbl">Lý do / ghi chú quyết định{(item.kind === 'GrayZoneStory' || item.kind === 'PublicStoryRemoval' || item.kind === 'ContentReport') ? (!reason.trim() && <Warn why="Cần nhập lý do trước khi bấm quyết định" />) : <small> (bắt buộc khi Từ chối hoặc Yêu cầu sửa)</small>}</span><textarea className="inp" maxLength={item.kind === 'GrayZoneStory' || item.kind === 'PublicStoryRemoval' ? 2000 : 1000} rows={3} value={reason} onChange={e => setReason(e.target.value)} /></label>
      {decisionKind && <div className="row"><button className="btn btn-ok" disabled={busy || !canApprove} title={blockers.map(b => b.message).join(' · ') || undefined} onClick={() => void act(() => moderationService.approve(decisionKind, id), true)}>Duyệt</button><button className="btn btn-no" disabled={busy || !usableReason} onClick={() => void act(() => moderationService.reject(decisionKind, id, reason), true)}>Từ chối</button></div>}
      {item.kind === 'GrayZoneStory' && <div className="row">{(['Clear','Block'] as const).map(decision => <button className="btn btn-s" key={decision} disabled={busy || !usableReason} onClick={() => void act(() => moderationService.grayDecision(id, { decision, reason, rowVersion: item.data.rowVersion }), true)}>{decision === 'Clear' ? 'Cho phép tiếp tục' : 'Chặn nội dung'}</button>)}</div>}
      {item.kind === 'PublicStoryRemoval' && <div className="row">{[true,false].map(approve => <button className="btn btn-s" key={String(approve)} disabled={busy || !usableReason} onClick={() => void act(() => moderationService.removalDecision(id, { approve, reason, rowVersion: item.data.rowVersion }), true)}>{approve ? 'Chấp thuận gỡ' : 'Không chấp thuận gỡ'}</button>)}</div>}
      {item.kind === 'ContentReport' && <><label className="field"><span className="lbl">Lý do gỡ truyện</span><select className="inp" value={archiveReason} onChange={e => setArchiveReason(e.target.value as typeof archiveReason)}><option value="SafetyConcern">Không an toàn</option><option value="Copyright">Bản quyền</option><option value="Inappropriate">Không phù hợp</option></select></label><div className="row">{(['dismiss','archive','escalate'] as const).filter(action => action !== 'escalate' || user?.role === 'Moderator').map(action => <button className="btn btn-s" key={action} disabled={busy || !usableReason} onClick={() => void act(() => moderationService.reportDecision(id, action, reason, archiveReason), true)}>{({ dismiss: 'Bỏ qua báo cáo', archive: 'Gỡ truyện vi phạm', escalate: 'Chuyển Administrator' })[action]}</button>)}</div></>}
    </div>
    {(item.kind === 'PublicStoryReview' || item.kind === 'RoadmapTemplateReview') && <div className="st-group"><b className="st-group-title">Yêu cầu chỉnh sửa</b><label className="field">Phần cần sửa<select className="inp" value={partType} onChange={e => setPartType(e.target.value)}>{(item.kind === 'PublicStoryReview' ? ['metadata','scene_text','scene_image','scene_audio','quiz','vocabulary','listening'] : ['name_description','order','age_level','story']).map(p => <option key={p} value={p}>{PART_LABEL[p] ?? p}</option>)}</select></label><label className="field">ID phần / truyện (bỏ trống với metadata)<input className="inp" type="number" min={1} value={partId} onChange={e => setPartId(e.target.value)} /></label><button className="btn btn-s" disabled={busy || !usableReason} onClick={() => void act(() => item.kind === 'PublicStoryReview' ? moderationService.publicChanges(id, { generalNote: reason, parts: [{ partType, partId: partId ? Number(partId) : null, note: reason }] }) : moderationService.roadmapChanges(id, { generalNote: reason, parts: [{ partType, storyId: partId ? Number(partId) : null, action: partType === 'story' ? 'replace' : null, note: reason }] }), true)}>Yêu cầu sửa</button></div>}
    {flagDialog && <div className="dlg-backdrop" role="dialog" aria-modal="true" aria-label="Xác nhận cờ an toàn" onClick={e => { if (e.target === e.currentTarget && !busy) setFlagDialog(null); }}>
      <div className="dlg st-dlg">
        <h3>Xác nhận cờ “{flagDialog.name}” là an toàn</h3>
        <label className="field"><span className="lbl">Lý do</span><textarea className="inp" autoFocus rows={3} maxLength={1000} placeholder="Ví dụ: Tên nhân vật hư cấu, không phải thông tin thật của trẻ" value={flagReason} onChange={e => setFlagReason(e.target.value)} /></label>
        <div className="row"><button className="btn btn-g" disabled={busy} onClick={() => setFlagDialog(null)}>Huỷ</button><button className="btn btn-p" disabled={busy || !flagReason.trim()} onClick={() => { const d = flagDialog; setFlagDialog(null); void act(() => moderationService.resolveFlag(id, d.flagId, flagReason)); }}>Xác nhận an toàn</button></div>
      </div>
    </div>}
    {zoom && <div className="dlg-backdrop st-zoom" role="dialog" aria-modal="true" aria-label="Tranh phóng to" onClick={() => setZoom(null)}>
      <SafeImage src={zoom.url} alt={zoom.alt} />
      <button type="button" className="btn btn-s st-zoom-close" onClick={() => setZoom(null)}>Đóng</button>
    </div>}
  </div>;
}
