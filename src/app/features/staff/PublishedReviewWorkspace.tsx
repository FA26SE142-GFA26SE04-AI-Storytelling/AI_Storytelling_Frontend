'use client';
import { useEffect, useRef, useState } from 'react';
import type * as B from '@/app/types/backendContracts';
import { moderationService as service } from '@/app/services/moderationService';
import { useAuth } from '@/app/context/AuthContext';
import Frog from '@/app/components/brand/Frog';
import Select from '@/app/components/Select';
import { ArrowLeft } from 'lucide-react';
import { gradientFor } from '@/app/lib/storyView';
import '@/app/features/library/library.css';
import '@/app/features/created/created.css';
import { Page } from './ui';
import StoryWishCards from './StoryWishCards';
import LearningMaterials from './LearningMaterials';
export default function PublishedReviewWorkspace() {
  const { user } = useAuth();
  const [source, setSource] = useState<B.PublishedContentSourceName>('PublicLibrary');
  const [page, setPage] = useState(1);
  const [ageBand, setAgeBand] = useState('');
  const [list, setList] = useState<B.PagedResult<B.PublishedContentItemDto> | null>(null);
  const [story, setStory] = useState<B.PublishedStoryContentDto | null>(null);
  const [roadmap, setRoadmap] = useState<B.PublishedRoadmapDto | null>(null);
  const [reason, setReason] = useState<B.ContentReportReasonName>('SafetyConcern');
  const [description, setDescription] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false);
  const scope = useRef(Symbol());
  const grantView = async () => {
    if (busy || !story && !roadmap) return;
    const run = scope.current; setBusy(true);
    const r = await service.grantReviewView(roadmap
      ? {sourceTab:'roadmap_templates',storyId:null,storyVersionId:null,readingRoadmapId:roadmap.roadmapId}
      : {sourceTab:'published_content',storyId:story!.story.storyId,storyVersionId:story!.version?.versionId??null,readingRoadmapId:null});
    if (scope.current!==run) return;
    setBusy(false); setMessage(r.success&&r.data?`Quyền rà soát có hiệu lực đến ${new Date(r.data.expiresAt).toLocaleString('vi-VN')}.`:r.message);
  };
  useEffect(() => { const run = Symbol(); scope.current = run; const controller = new AbortController();
    setList(null); setStory(null); setRoadmap(null); setMessage('');
    void service.published({source,ageBand:ageBand||null,pageIndex:page,pageSize:20},controller.signal).then(r => { if (scope.current === run) { setList(r.data); if (!r.success) setMessage(r.message); } });
    return () => { scope.current = Symbol(); controller.abort(); };
  }, [source,ageBand,page,user?.id]);
  const openStory = async (id: number) => { const run = scope.current; setBusy(true); const r = await service.publishedStory(id); if (scope.current !== run) return; setBusy(false); if (r.success) setStory(r.data); else setMessage(r.message); };
  const open = async (item: B.PublishedContentItemDto) => {
    setStory(null); setRoadmap(null); setDescription(''); setAttachmentUrl(''); setMessage('');
    // Source values are defined by PublishedContentSource, never inferred from the numeric id.
    if (item.source !== 'RoadmapTemplate') { await openStory(item.id); return; }
    const run = scope.current; setBusy(true); const r = await service.publishedRoadmap(item.id); if (scope.current !== run) return; setBusy(false); if (r.success) setRoadmap(r.data); else setMessage(r.message);
  };
  const report = async () => {
    if (!story || busy) return;
    const run = scope.current; setBusy(true);
    const r = await service.createReviewItem({storyId:story.story.storyId,readingRoadmapId:roadmap?.roadmapId ?? null,reason,description:description.trim() || null,attachmentUrl:attachmentUrl.trim() || null});
    if (scope.current !== run) return;
    setBusy(false); setMessage(r.success && r.data ? `Đã tạo báo cáo #${r.data.reportId}. Mở hàng đợi và nhận xử lý theo quyền.` : r.message);
  };
  const inDetail = !!story || !!roadmap;
  const SOURCES = [{ id: 'PublicLibrary', label: 'Thư viện công khai' }, { id: 'RoadmapTemplate', label: 'Bộ truyện mẫu' }] as const;
  return <Page title="Rà soát nội dung công khai">
    {message && <p className="notice" role="status">{message}</p>}
    {inDetail ? <>
      <div className="row"><button className="btn btn-g" onClick={() => { setStory(null); setRoadmap(null); setMessage(''); }}><ArrowLeft className="ic" />Về thư viện</button></div>
      <div className="st-card">
          <div className="st-group"><div className="row"><button className="btn btn-s" disabled={busy} onClick={()=>void grantView()}>Ghi nhận lượt xem để rà soát</button></div></div>
          {roadmap && <section><div className="st-group"><h3>{roadmap.name}</h3><p>{roadmap.description}</p></div><div className="st-group"><b className="st-group-title">Truyện trong bộ</b><div className="row">{roadmap.stories.map(s => <button className="btn btn-s" disabled={busy} key={s.storyId} onClick={() => void openStory(s.storyId)}>{s.title}</button>)}</div></div></section>}
          {story && <section><div className="st-group"><h3>{story.story.title}</h3><p style={{whiteSpace:'pre-wrap'}}>{story.version?.content}</p></div><div className="st-group"><details open><summary>Học liệu</summary><LearningMaterials vocabulary={story.vocabulary} quizzes={story.quizzes} /></details></div>
            {(user?.role==='Moderator'||user?.role==='Administrator') && <StoryWishCards key={story.story.storyId} storyId={story.story.storyId}/>}
            {user?.role==='Moderator' && <div className="st-group"><b className="st-group-title">Tạo mục rà soát</b><label className="field">Lý do<select className="inp" value={reason} onChange={e => setReason(e.target.value as B.ContentReportReasonName)}>{[['SafetyConcern','Không an toàn'],['Inappropriate','Không phù hợp'],['WrongAgeBand','Không đúng độ tuổi'],['Copyright','Bản quyền'],['Cultural','Văn hóa'],['Other','Khác']].map(([v,label]) => <option key={v} value={v}>{label}</option>)}</select></label><label className="field">Ghi chú rà soát<textarea className="inp" rows={4} placeholder="Mô tả vấn đề bạn thấy ở nội dung này (không bắt buộc)" maxLength={2000} value={description} onChange={e => setDescription(e.target.value)} /></label><label className="field">Nguồn đính kèm<input className="inp" type="url" placeholder="Đường dẫn minh chứng, bắt đầu bằng https:// (không bắt buộc)" maxLength={500} value={attachmentUrl} onChange={e => setAttachmentUrl(e.target.value)} /></label><button className="btn btn-p" disabled={busy} onClick={() => void report()}>Tạo mục rà soát</button></div>}
          </section>}
          </div>
    </> : <div className="created">
      <div className="created-bar">
        <div className="created-pills" role="tablist" aria-label="Nguồn nội dung">
          {SOURCES.map(s => <button key={s.id} role="tab" aria-selected={source === s.id} className={source === s.id ? 'on' : ''} disabled={busy} onClick={() => { setSource(s.id); setPage(1); }}>{s.label}{source === s.id && list ? <em>{list.totalCount}</em> : null}</button>)}
        </div>
        <div className="created-actions">
          <Select<string> className="created-select" ariaLabel="Lọc theo độ tuổi" value={ageBand} options={[{ value: '', label: 'Mọi độ tuổi' }, { value: '6-8', label: '6–8 tuổi' }, { value: '9-10', label: '9–10 tuổi' }]} onChange={v => { setAgeBand(v); setPage(1); }} />
        </div>
      </div>
      {list && list.items.length > 0 ? <div className="created-grid">
        {list.items.map(i => <button className="bk" key={`${i.source}:${i.id}`} disabled={busy} onClick={() => void open(i)} aria-label={`Xem ${i.title}`}>
          <span className="bk-cover" style={{ background: gradientFor(i.id) }}>
            {i.needsUpdate && <span className="pill wait bk-badge">Cần cập nhật</span>}
            <span className="bk-name display">{i.title}</span>
          </span>
          <span className="bk-title">{i.title}</span>
          <span className="bk-meta">{i.storyCount != null ? `${i.storyCount} truyện · ` : ''}{i.ageBand}{i.labels.length ? ` · ${i.labels.map(l => l.displayName).join(', ')}` : ''}</span>
        </button>)}
      </div> : list ? <div className="empty"><Frog size={110} mood="think" /><b className="display">Không có nội dung nào</b></div> : <p className="sub" role="status">Đang tải…</p>}
      <div className="row" style={{ justifyContent: 'center', gap: 12 }}><button className="btn btn-s" disabled={busy || page === 1} onClick={() => setPage(p => p - 1)}>Trước</button><span>Trang {page}</span><button className="btn btn-s" disabled={busy || !list?.hasNextPage} onClick={() => setPage(p => p + 1)}>Tiếp</button></div>
    </div>}
  </Page>;
}
