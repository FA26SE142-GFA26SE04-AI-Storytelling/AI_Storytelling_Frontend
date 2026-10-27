'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { childAccessService } from '@/app/services/childAccessService';
import { childReadingService, childNotebookService } from '@/app/services/childReadingService';
import type { ChildStoryPage, NotebookEntry } from '@/app/types/childReading';
import { useChildReader } from './useChildReader';
import ChildReader from './ChildReader';
import './child-reading.css';
import Frog from '@/app/components/brand/Frog';
import {BookOpen,NotebookPen,Search} from 'lucide-react';

export default function ChildReadingLibrary({childId,community,onReadingChange}:{childId:number;community?:{submissionId:number;title:string}|null;onReadingChange?:(active:boolean)=>void}) {
  const session=childAccessService.readSession();
  const token=session?.childProfileId===childId?session.accessToken:'';
  const [revision,setRevision]=useState(0);
  const refresh=useCallback(()=>setRevision(v=>v+1),[]);
  const reader=useChildReader(token,refresh);
  const reading=!!reader.content;
  const [pane,setPane]=useState<'stories'|'notebook'>('stories');
  useEffect(()=>{onReadingChange?.(reading);return()=>onReadingChange?.(false);},[reading,onReadingChange]);
  const [stories,setStories]=useState<ChildStoryPage|null>(null);
  const [entries,setEntries]=useState<NotebookEntry[]>([]);
  const [search,setSearch]=useState(''), [query,setQuery]=useState(''), [source,setSource]=useState('');
  const [page,setPage]=useState(1), [loading,setLoading]=useState(false), [note,setNote]=useState('');
  const [removing,setRemoving]=useState(false); const removeLock=useRef(false);
  const scope=useRef(0);
  useEffect(()=>{
    const controller=new AbortController(); const run=++scope.current;
    setStories(null);setEntries([]);setLoading(true);setNote('');
    void Promise.all([childReadingService.stories(token,{search:query,source,pageIndex:page},controller.signal),childNotebookService.list(token,controller.signal)]).then(([r,n])=>{
      if(controller.signal.aborted||run!==scope.current)return;
      setLoading(false);
      if(r.success&&r.data)setStories(r.data); else setNote(r.message);
      if(n.success)setEntries(n.data ?? []); else setNote(v=>[v,n.message].filter(Boolean).join(' '));
    });
    return ()=>{scope.current=run+1;controller.abort();};
  },[token,query,source,page,revision]);
  const remove=async(id:number)=>{
    if(removeLock.current||!window.confirm('Xóa từ này khỏi sổ tay?'))return;
    removeLock.current=true;setRemoving(true);const run=scope.current;
    const r=await childNotebookService.remove(token,id);
    removeLock.current=false;setRemoving(false);
    if(run!==scope.current)return;
    if(r.success)refresh();else setNote(r.message);
  };
  if(!token)return <p className="notice">Phiên của bé đã hết hạn. Em nhờ bố mẹ mở lại nhé.</p>;
  if(reader.content)return <ChildReader reader={reader}/>;
  return <section className="ksection kid-reading">
    <header className="kid-library-heading"><div><span className="kid-overline">MỖI CÂU CHUYỆN, MỘT CHUYẾN ĐI</span><h2 className="display">Đọc và nghe truyện</h2></div><Frog mood="happy" size={76}/></header>
    <div className="kid-library-tabs" aria-label="Thư viện của em"><button className="kid-soft-button" aria-pressed={pane==='stories'} onClick={()=>setPane('stories')}><BookOpen aria-hidden="true"/>Truyện của em</button><button className="kid-soft-button" aria-pressed={pane==='notebook'} onClick={()=>setPane('notebook')}><NotebookPen aria-hidden="true"/>Sổ tay của em</button></div>
    {community&&<button className="btn btn-p" disabled={reader.busy} onClick={()=>void reader.open({communitySubmissionId:community.submissionId})}>Đọc truyện cộng đồng: {community.title}</button>}
    {reader.note&&<p role="status" className="notice">{reader.note}</p>}
    {note&&<p role="status" className="notice">{note}</p>}
    {pane==='stories'&&<>
    {!stories?.isLocked&&<form className="row kid-story-search" onSubmit={e=>{e.preventDefault();setPage(1);setQuery(search.trim());}}>
      <input className="inp" aria-label="Tìm truyện" value={search} onChange={e=>setSearch(e.target.value)}/>
      <button className="btn btn-s" disabled={loading}><Search className="ic"/>Tìm truyện</button>
      <select className="inp" aria-label="Nguồn truyện" value={source} onChange={e=>{setPage(1);setSource(e.target.value);}}><option value="">Tất cả</option><option value="mine">Truyện của em</option><option value="library">Thư viện</option></select>
    </form>}
    {loading&&<p role="status">Đang tải thư viện…</p>}
    {stories?.isLocked?<div className="kid-library-invitation"><Frog mood="think" size={100}/><div><h3 className="display">Câu chuyện đang chờ em</h3>{stories.message&&<p>{stories.message}</p>}{stories.unlockStoryId&&<button className="kid-listen-primary" disabled={reader.busy} onClick={()=>void reader.open({storyId:stories.unlockStoryId!})}>Đọc lại truyện đang mở</button>}</div></div>:<>
    {stories?.message&&<p>{stories.message}</p>}
    <div className="kid-story-shelf">{stories?.items.map(s=><article key={s.storyId} className="kid-story-tile"><Frog variant="face" size={52}/><div><h3 className="display">{s.title}</h3>{s.description&&<p>{s.description}</p>}</div><button className="kid-listen-primary" disabled={reader.busy} onClick={()=>void reader.open({storyId:s.storyId})}>Đọc truyện</button></article>)}</div>
    {!loading&&stories&&!stories.items.length&&<p>Chưa có truyện phù hợp trong mục này. Em thử mục khác hoặc nhờ bố mẹ chọn truyện nhé.</p>}
    <div className="row"><button className="btn btn-s" disabled={loading||page===1} onClick={()=>setPage(v=>v-1)}>Trang trước</button><span>Trang {page}</span><button className="btn btn-s" disabled={loading||!stories||page*stories.pageSize>=stories.totalCount} onClick={()=>setPage(v=>v+1)}>Trang sau</button></div>
    </>}
    </>}
    {pane==='notebook'&&<>
    <h2 className="display">Sổ tay từ vựng của em</h2>
    {!loading&&!entries.length&&<p>Chưa có từ được lưu.</p>}
    {entries.map(e=><article className="kcard" key={e.entryId}><h3>{e.term}</h3><p>{e.definition}</p><p>{e.storyTitle}</p><button className="btn btn-s" disabled={reader.busy} onClick={()=>void reader.open({storyId:e.storyId},e.sceneIndex==null?undefined:e.sceneIndex+1)}>Đọc lại đoạn này</button><button className="btn btn-s" disabled={removing} onClick={()=>void remove(e.entryId)}>Xóa từ khỏi sổ tay</button></article>)}
    </>}
    <button className="kid-soft-button kid-library-refresh" disabled={loading} onClick={refresh}>Tải lại thư viện và sổ tay</button>
  </section>;
}
