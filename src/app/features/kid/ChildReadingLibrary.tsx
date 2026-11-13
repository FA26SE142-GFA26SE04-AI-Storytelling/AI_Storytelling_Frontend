'use client';
import { confirmDialog } from "@/app/lib/confirm";
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
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
import {ArrowRight,Award,BookOpen,ChevronLeft,ChevronRight,NotebookPen,RefreshCw,Search,Sparkles,Trash2} from 'lucide-react';
import PaneSwap from './PaneSwap';

const TABS=[{id:'stories' as const,label:'Truyện',icon:BookOpen},{id:'notebook' as const,label:'Sổ tay',icon:NotebookPen},{id:'wishes' as const,label:'Điều ước',icon:Sparkles},{id:'rewards' as const,label:'Phần thưởng',icon:Award}];
const SOURCES=[{id:'',label:'Tất cả'},{id:'mine',label:'Của em'},{id:'library',label:'Thư viện'}];

export default function ChildReadingLibrary({childId,story,unlockTitle,hero,onStoryOpened,onLockChange,onPaneChange,onReadingChange}:{childId:number;/** Khung "Hôm nay em đọc" hiện đầu tab Truyện. */hero?:ReactNode;story?:{storyId:number}|null;unlockTitle?:string;onStoryOpened?:()=>void;onLockChange?:(lock:{locked:boolean;unlockStoryId:number|null})=>void;onPaneChange?:(pane:string)=>void;onReadingChange?:(active:boolean)=>void}) {
  const session=childAccessService.readSession();
  const token=session?.childProfileId===childId?session.accessToken:'';
  const [revision,setRevision]=useState(0);
  const refresh=useCallback(()=>setRevision(v=>v+1),[]);
  const reader=useChildReader(token,refresh);
  const reading=!!reader.content;
  type Pane='stories'|'notebook'|'wishes'|'rewards';
  // Hướng trượt theo thứ tự tab: sang tab bên phải thì nội dung trượt vào từ phải, về tab bên trái thì từ trái.
  const PANE_ORDER:Pane[]=['stories','notebook','wishes','rewards'];
  const [nav,setNav]=useState<{pane:Pane;dir:1|-1}>({pane:'stories',dir:1});
  const {pane,dir}=nav;
  const setPane=(next:Pane)=>setNav(cur=>({pane:next,dir:PANE_ORDER.indexOf(next)>=PANE_ORDER.indexOf(cur.pane)?1:-1}));
  // Các kệ bên dưới chỉ thuộc tab Truyện của em; báo tab đang chọn cho trang cha.
  useEffect(()=>{onPaneChange?.(pane);},[pane,onPaneChange]);
  // Bé bấm truyện trong "Hành trình của em" thì mở đọc luôn (backend vẫn tự kiểm quyền đọc).
  useEffect(()=>{
    if(!story)return;
    void reader.open({storyId:story.storyId});
    onStoryOpened?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[story?.storyId]);
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
    {reader.busy&&!reader.content&&<div className="kid-loading" role="status" aria-live="polite"><Frog mood="think" size={96}/><p>Đang mở truyện…</p><span className="kid-spinner" aria-hidden="true"/></div>}
    <div className="kid-library-tabs" aria-label="Thư viện của em">
      {/* Bé chưa đọc giỏi nên mỗi nút có cả hình và chữ ngắn. */}
      {TABS.map(t=><button key={t.id} type="button" className="kid-soft-button kid-tab" aria-pressed={pane===t.id} onClick={()=>setPane(t.id)}><t.icon aria-hidden="true"/>{t.label}</button>)}
      <IconButton icon={RefreshCw} label="Tải lại" iconClassName="" className="kid-soft-button kid-library-refresh" disabled={loading} onClick={refresh}/>
      <span className="kid-library-frog" aria-hidden="true"><Frog mood="happy" size={64}/></span>
    </div>
    {reader.note&&<p role="status" className="kid-toast">{reader.note}</p>}
    {note&&<p role="status" className="kid-toast">{note}</p>}
    <PaneSwap key={pane} dir={dir}>
    {pane==='stories'&&<>
    {hero}
    {!stories?.isLocked&&<div className="kid-toolbar">
      <form className="kid-search" role="search" onSubmit={e=>{e.preventDefault();setPage(1);setQuery(search.trim());}}>
        <Search aria-hidden="true"/>
        <input className="inp" type="search" aria-label="Tìm truyện" placeholder="Em muốn đọc truyện gì?" value={search} onChange={e=>setSearch(e.target.value)}/>
        <button type="submit" className="kid-search-go" aria-label="Tìm truyện" title="Tìm truyện" disabled={loading}><ArrowRight aria-hidden="true"/></button>
      </form>
      <div className="kid-source" role="group" aria-label="Nguồn truyện">
        {SOURCES.map(s=><button key={s.id} type="button" className="kid-soft-button" aria-pressed={source===s.id} onClick={()=>{setPage(1);setSource(s.id);}}>{s.label}</button>)}
      </div>
    </div>}
    {loading&&<p role="status">Đang tải thư viện…</p>}
    {stories?.isLocked?<>{stories.unlockStoryId&&<Shelf title="Truyện em có thể đọc" items={[{id:stories.unlockStoryId}]}><ShelfRow><button className="bk" disabled={reader.busy} aria-label={`Đọc lại truyện ${unlockTitle??'đang mở'}`} onClick={()=>void reader.open({storyId:stories.unlockStoryId!})}><span className="bk-cover" style={{background:coverFor()}}><span className="pill ok bk-badge"><BookOpen className="ic" aria-hidden="true"/>Đọc được</span><span className="bk-name display">{unlockTitle??'Truyện đang mở'}</span></span><span className="bk-title">{unlockTitle??'Truyện đang mở'}</span><span className="bk-meta">Em đọc lại truyện này nhé</span></button></ShelfRow></Shelf>}</>:<>
    {stories?.message&&<p>{stories.message}</p>}
    {!!stories?.items.length&&<Shelf title={source==='mine'?'Truyện của em':source==='library'?'Thư viện':'Chọn truyện em thích'} items={stories.items.map(s=>({id:s.storyId}))}><ShelfRow>{stories.items.map(s=><button key={s.storyId} className="bk" disabled={reader.busy} aria-label={`Đọc truyện ${s.title}`} onClick={()=>void reader.open({storyId:s.storyId})}><span className="bk-cover" style={{background:coverFor(s.coverImageUrl)}}><span className="pill ok bk-badge"><BookOpen className="ic" aria-hidden="true"/>Đọc được</span>{!s.coverImageUrl&&<span className="bk-name display">{s.title}</span>}</span><span className="bk-title">{s.title}</span>{s.description&&<span className="bk-meta">{s.description}</span>}</button>)}</ShelfRow></Shelf>}
    {!loading&&stories&&!stories.items.length&&<p>Chưa có truyện phù hợp trong mục này. Em thử mục khác hoặc nhờ bố mẹ chọn truyện nhé.</p>}
    {stories&&!stories.isLocked&&(page>1||stories.totalCount>stories.pageSize)&&<div className="kid-pager">
      <IconButton icon={ChevronLeft} label="Trang trước" disabled={loading||page===1} onClick={()=>setPage(v=>v-1)}/>
      <span>Trang {page}/{Math.max(1,Math.ceil(stories.totalCount/stories.pageSize))}</span>
      <IconButton icon={ChevronRight} label="Trang sau" disabled={loading||page*stories.pageSize>=stories.totalCount} onClick={()=>setPage(v=>v+1)}/>
    </div>}
    </>}
    </>}
    {pane==='notebook'&&<>
    {!loading&&!entries.length&&<p className="kid-empty">Chưa có từ nào trong sổ tay.</p>}
    <div className="kid-notebook">{entries.map(e=><article className="kcard kid-word-card" key={e.entryId}><h3>{e.term}</h3><p>{e.definition}</p><div className="row"><IconButton icon={BookOpen} label={`Đọc lại đoạn có từ ${e.term}`} disabled={reader.busy} onClick={()=>void reader.open({storyId:e.storyId},e.sceneIndex==null?undefined:e.sceneIndex+1)}/><IconButton icon={Trash2} label={`Xóa từ ${e.term} khỏi sổ tay`} className="btn btn-no" disabled={removing} onClick={()=>void remove(e.entryId)}/></div></article>)}</div>
    </>}
    {pane==='rewards'&&<KidRewards key={revision} token={token}/>}
    {pane==='wishes'&&<KidWish key={revision} token={token} busy={reader.busy} onRead={target=>void reader.open(target)}/>}
    </PaneSwap>
  </section>;
}
