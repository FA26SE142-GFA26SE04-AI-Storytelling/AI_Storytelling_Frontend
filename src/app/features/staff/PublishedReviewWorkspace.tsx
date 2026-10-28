'use client';
import { useEffect, useRef, useState } from 'react';
import type * as B from '@/app/types/backendContracts';
import { moderationService as service } from '@/app/services/moderationService';
import { useAuth } from '@/app/context/AuthContext';
import { Page } from './ui';
import StoryWishCards from './StoryWishCards';
export default function PublishedReviewWorkspace() {
  const { user } = useAuth();
  const [source, setSource] = useState<B.PublishedContentSourceName>('PublicLibrary');
  const [page, setPage] = useState(1);
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
    void service.published({source,pageIndex:page,pageSize:20},controller.signal).then(r => { if (scope.current === run) { setList(r.data); if (!r.success) setMessage(r.message); } });
    return () => { scope.current = Symbol(); controller.abort(); };
  }, [source,page,user?.id]);
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
  return <Page title="Rà soát nội dung công khai" sub="Xem nội dung đã che thông tin. Tạo mục rà soát đưa vào hàng đợi; thao tác này chưa gỡ truyện.">
    {message && <p className="notice" role="status">{message}</p>}
    <button className="btn btn-s" disabled={busy||!story&&!roadmap} onClick={()=>void grantView()}>Ghi nhận lượt xem để rà soát</button>
    <div className="row"><select className="inp" aria-label="Nguồn nội dung" value={source} disabled={busy} onChange={e => { setSource(e.target.value as B.PublishedContentSourceName); setPage(1); }}><option value="PublicLibrary">Thư viện công khai</option><option value="RoadmapTemplate">Bộ truyện mẫu</option></select></div>
    <div className="st-list">{list?.items.map(i => <button className="st-item" key={`${i.source}:${i.id}`} disabled={busy} onClick={() => void open(i)}><b>{i.title}</b><small>{i.ageBand} · {i.labels.map(l => l.displayName).join(', ')}{i.needsUpdate ? ' · Cần cập nhật' : ''}</small></button>)}</div>
    <div className="row"><button className="btn btn-s" disabled={busy || page===1} onClick={() => setPage(p => p-1)}>Trước</button><span>Trang {page}</span><button className="btn btn-s" disabled={busy || !list?.hasNextPage} onClick={() => setPage(p => p+1)}>Tiếp</button></div>
    {roadmap && <section className="st-card"><h3>{roadmap.name}</h3><p>{roadmap.description}</p>{roadmap.stories.map(s => <button className="btn btn-s" disabled={busy} key={s.storyId} onClick={() => void openStory(s.storyId)}>{s.title}</button>)}</section>}
    {story && <section className="st-card"><h3>{story.story.title}</h3><p style={{whiteSpace:'pre-wrap'}}>{story.version?.content}</p><details><summary>Học liệu</summary>{story.vocabulary.map((v,i) => <p key={i}>{v.term}: {v.definition}</p>)}{story.quizzes.map((q,i) => <p key={i}>{q.question}</p>)}{story.discussionQuestions.map((q,i) => <p key={i}>{q.question}</p>)}</details>
      {(user?.role==='Moderator'||user?.role==='Administrator') && <StoryWishCards key={story.story.storyId} storyId={story.story.storyId}/>}
      {user?.role==='Moderator' && <><label className="field">Lý do<select className="inp" value={reason} onChange={e => setReason(e.target.value as B.ContentReportReasonName)}>{[['SafetyConcern','Không an toàn'],['Inappropriate','Không phù hợp'],['WrongAgeBand','Không đúng độ tuổi'],['Copyright','Bản quyền'],['Cultural','Văn hóa'],['Other','Khác']].map(([v,label]) => <option key={v} value={v}>{label}</option>)}</select></label><textarea className="inp" aria-label="Ghi chú rà soát" maxLength={2000} value={description} onChange={e => setDescription(e.target.value)} /><input className="inp" type="url" maxLength={500} aria-label="Nguồn đính kèm" value={attachmentUrl} onChange={e => setAttachmentUrl(e.target.value)} /><button className="btn btn-p" disabled={busy} onClick={() => void report()}>Tạo mục rà soát</button></>}
    </section>}
  </Page>;
}
