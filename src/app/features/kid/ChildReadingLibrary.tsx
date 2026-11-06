'use client';
import { confirmDialog } from "@/app/lib/confirm";
import { useCallback, useEffect, useRef, useState } from 'react';
import { childAccessService } from '@/app/services/childAccessService';
import { childReadingService, childNotebookService } from '@/app/services/childReadingService';
import type { ChildStoryPage, NotebookEntry } from '@/app/types/childReading';
import { useChildReader } from './useChildReader';
import ChildReader from './ChildReader';
import KidWish from './KidWish';
import KidRewards from './KidRewards';
import IconButton from '@/app/components/IconButton';
import './child-reading.css';
import Frog from '@/app/components/brand/Frog';
import { Shelf, ShelfRow } from '@/app/features/library/LibraryWorkspace';
import { coverFor } from '@/app/lib/storyView';
import {Award,BookOpen,ChevronLeft,ChevronRight,Lock,NotebookPen,RefreshCw,Search,Sparkles,Trash2} from 'lucide-react';

export default function ChildReadingLibrary({childId,community,unlockTitle,onCommunityOpened,onLockChange,onPaneChange,onReadingChange}:{childId:number;community?:{submissionId:number;title:string}|null;unlockTitle?:string;onCommunityOpened?:()=>void;onLockChange?:(lock:{locked:boolean;unlockStoryId:number|null})=>void;onPaneChange?:(pane:string)=>void;onReadingChange?:(active:boolean)=>void}) {
  const session=childAccessService.readSession();
  const token=session?.childProfileId===childId?session.accessToken:'';
  const [revision,setRevision]=useState(0);
  const refresh=useCallback(()=>setRevision(v=>v+1),[]);
  const reader=useChildReader(token,refresh);
  const reading=!!reader.content;
  const [pane,setPane]=useState<'stories'|'notebook'|'wishes'|'rewards'>('stories');
  // Các kệ bên dưới chỉ thuộc tab Truyện của em; báo tab đang chọn cho trang cha.
  useEffect(()=>{onPaneChange?.(pane);},[pane,onPaneChange]);
  // Bé bấm bìa truyện cộng đồng ở kệ bên dưới thì mở đọc luôn, không cần bấm thêm nút nào.
  useEffect(()=>{
    if(!community)return;
    void reader.open({communitySubmissionId:community.submissionId});
    onCommunityOpened?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[community?.submissionId]);
  useEffect(()=>{onReadingChange?.(reading);return()=>onReadingChange?.(false);},[reading,onReadingChange]);
  const [stories,setStories]=useState<ChildStoryPage|null>(null);
  const [entries,setEntries]=useState<NotebookEntry[]>([]);
  const [search,setSearch]=useState(''), [query,setQuery]=useState(''), [source,setSource]=useState('');
  const [page,setPage]=useState(1), [loading,setLoading]=useState(false), [note,setNote]=useState('');
  // Báo cho trang cha biết thư viện đang khóa và truyện nào đang mở, để các kệ khác đánh dấu đúng truyện đọc được.
  const lockedNow=!!stories?.isLocked, unlockId=stories?.unlockStoryId??null;
  useEffect(()=>{if(stories)onLockChange?.({locked:lockedNow,unlockStoryId:unlockId});},[stories,lockedNow,unlockId,onLockChange]);
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
    if(removeLock.current||!await confirmDialog('Xóa từ này khỏi sổ tay?'))return;
    removeLock.current=true;setRemoving(true);const run=scope.current;
    const r=await childNotebookService.remove(token,id);
    removeLock.current=false;setRemoving(false);
    if(run!==scope.current)return;
    if(r.success)refresh();else setNote(r.message);
  };
  if(!token)return <p className="notice">Phiên của bé đã hết hạn. Em nhờ bố mẹ mở lại nhé.</p>;
  if(reader.content)return <ChildReader reader={reader}/>;
  return <section className="ksection kid-reading">
    <div className="kid-library-tabs" aria-label="Thư viện của em">
      <IconButton icon={BookOpen} label="Truyện của em" iconClassName="" className="kid-soft-button" aria-pressed={pane==='stories'} onClick={()=>setPane('stories')}/>
      <IconButton icon={NotebookPen} label="Sổ tay của em" iconClassName="" className="kid-soft-button" aria-pressed={pane==='notebook'} onClick={()=>setPane('notebook')}/>
      <IconButton icon={Sparkles} label="Em ước" iconClassName="" className="kid-soft-button" aria-pressed={pane==='wishes'} onClick={()=>setPane('wishes')}/>
      <IconButton icon={Award} label="Phần thưởng" iconClassName="" className="kid-soft-button" aria-pressed={pane==='rewards'} onClick={()=>setPane('rewards')}/>
      <span className="kid-library-frog" aria-hidden="true"><Frog mood="happy" size={64}/></span>
    </div>
    {reader.note&&<p role="status" className="kid-toast">{reader.note}</p>}
    {note&&<p role="status" className="kid-toast">{note}</p>}
    {pane==='stories'&&<>
    {!stories?.isLocked&&<form className="row kid-story-search" onSubmit={e=>{e.preventDefault();setPage(1);setQuery(search.trim());}}>
      <input className="inp" aria-label="Tìm truyện" value={search} onChange={e=>setSearch(e.target.value)}/>
      <IconButton icon={Search} label="Tìm truyện" type="submit" disabled={loading}/>
      <select className="inp" aria-label="Nguồn truyện" value={source} onChange={e=>{setPage(1);setSource(e.target.value);}}><option value="">Tất cả</option><option value="mine">Truyện của em</option><option value="library">Thư viện</option></select>
    </form>}
    {loading&&<p role="status">Đang tải thư viện…</p>}
    {stories?.isLocked?<>{stories.unlockStoryId&&<Shelf title="Truyện em có thể đọc" items={[{id:stories.unlockStoryId}]}><ShelfRow><button className="bk" disabled={reader.busy} aria-label={`Đọc lại truyện ${unlockTitle??'đang mở'}`} onClick={()=>void reader.open({storyId:stories.unlockStoryId!})}><span className="bk-cover" style={{background:coverFor()}}><span className="pill ok bk-badge"><BookOpen className="ic" aria-hidden="true"/>Đọc được</span><span className="bk-name display">{unlockTitle??'Truyện đang mở'}</span></span><span className="bk-title">{unlockTitle??'Truyện đang mở'}</span><span className="bk-meta">Em đọc lại truyện này nhé</span></button></ShelfRow></Shelf>}</>:<>
    {stories?.message&&<p>{stories.message}</p>}
    {!!stories?.items.length&&<Shelf title={source==='mine'?'Truyện của em':source==='library'?'Thư viện':'Tất cả truyện'} items={stories.items.map(s=>({id:s.storyId}))}><ShelfRow>{stories.items.map(s=><button key={s.storyId} className="bk" disabled={reader.busy} aria-label={`Đọc truyện ${s.title}`} onClick={()=>void reader.open({storyId:s.storyId})}><span className="bk-cover" style={{background:coverFor(s.coverImageUrl)}}><span className="pill ok bk-badge"><BookOpen className="ic" aria-hidden="true"/>Đọc được</span>{!s.coverImageUrl&&<span className="bk-name display">{s.title}</span>}</span><span className="bk-title">{s.title}</span>{s.description&&<span className="bk-meta">{s.description}</span>}</button>)}</ShelfRow></Shelf>}
    {!loading&&stories&&!stories.items.length&&<p>Chưa có truyện phù hợp trong mục này. Em thử mục khác hoặc nhờ bố mẹ chọn truyện nhé.</p>}
    <div className="row"><IconButton icon={ChevronLeft} label="Trang trước" disabled={loading||page===1} onClick={()=>setPage(v=>v-1)}/><span>Trang {page}</span><IconButton icon={ChevronRight} label="Trang sau" disabled={loading||!stories||page*stories.pageSize>=stories.totalCount} onClick={()=>setPage(v=>v+1)}/></div>
    </>}
    </>}
    {pane==='notebook'&&<>
    {!loading&&!entries.length&&<p className="kid-empty">Chưa có từ nào trong sổ tay.</p>}
    <div className="kid-notebook">{entries.map(e=><article className="kcard kid-word-card" key={e.entryId}><h3>{e.term}</h3><p>{e.definition}</p><div className="row"><IconButton icon={BookOpen} label={`Đọc lại đoạn có từ ${e.term}`} disabled={reader.busy} onClick={()=>void reader.open({storyId:e.storyId},e.sceneIndex==null?undefined:e.sceneIndex+1)}/><IconButton icon={Trash2} label={`Xóa từ ${e.term} khỏi sổ tay`} className="btn btn-no" disabled={removing} onClick={()=>void remove(e.entryId)}/></div></article>)}</div>
    </>}
    {pane==='rewards'&&<KidRewards key={revision} token={token}/>}
    {pane==='wishes'&&<KidWish key={revision} token={token} busy={reader.busy} onRead={target=>void reader.open(target)}/>}
    <IconButton icon={RefreshCw} label="Tải lại thư viện và sổ tay" iconClassName="" className="kid-soft-button kid-library-refresh" disabled={loading} onClick={refresh}/>
  </section>;
}
