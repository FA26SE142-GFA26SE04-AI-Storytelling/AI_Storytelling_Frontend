'use client';
import { useEffect, useRef, useState } from 'react';
import { childReadingService as api, childNotebookService as notebook } from '@/app/services/childReadingService';
import type * as D from '@/app/types/childReading';
import type { ApiResponse } from '@/app/types/auth';

export function useChildReader(token:string, onLibrary:()=>void) {
  const [session,setSession] = useState<D.ReadingStarted|null>(null);
  const [content,setContent] = useState<D.ReadingContent|null>(null);
  const [page,setPage] = useState(1);
  const [mode,setMode] = useState<D.ReadingMode>('ReadFirst');
  const [definition,setDefinition] = useState<D.VocabularyDefinition|null>(null);
  const [busy,setBusy] = useState(false);
  const [blocked,setBlocked] = useState(false);
  const [done,setDone] = useState(false);
  const [note,setNote] = useState('');
  const scope = useRef(0), lock = useRef(false);
  const activeSeconds=useRef(0);
  const close = () => { scope.current++; lock.current=false; setBusy(false); setContent(null); setSession(null); setDefinition(null); onLibrary(); };
  useEffect(() => () => { scope.current++; }, [token]);
  useEffect(()=>{
    if(!content||done)return;
    const timer=setInterval(()=>{if(document.visibilityState==='visible'&&document.hasFocus())activeSeconds.current=Math.min(600,activeSeconds.current+1);},1000);
    return ()=>clearInterval(timer);
  },[content,done]);
  // Reading permission can be revoked independently of the child login session.
  useEffect(() => {
    if (!session) return;
    const controller = new AbortController(); let running=false;
    const check = async () => {
      if (running) return; running=true;
      const r = await api.signal(token,session.sessionId,controller.signal); running=false;
      if (controller.signal.aborted) return;
      if (r.success && r.data?.shouldExit || r.status===401 || r.status===403 || r.status===404) {
        scope.current++; lock.current=false; setBusy(false); setContent(null); setSession(null); setDefinition(null);
        setNote(r.data?.message || r.message || 'Truyện này đang nghỉ một chút, mình đọc truyện khác nhé!'); onLibrary();
      } else if (!r.success) setNote(r.message);
    };
    void check(); const timer=setInterval(() => void check(),8000);
    return () => { controller.abort(); clearInterval(timer); };
  },[token,session,onLibrary]);
  const execute = async <T,>(call:()=>Promise<ApiResponse<T>>, apply:(data:T)=>void) => {
    if (lock.current || blocked) return false;
    lock.current=true; setBusy(true); setNote(''); const run=scope.current;
    const r=await call();
    if (run!==scope.current) return false;
    lock.current=false; setBusy(false);
    if (!r.success || r.data===null) {
      setNote(r.message || 'Chưa nhận được kết quả. Hãy về thư viện để tải lại.');
      if (r.status===0 || (r.status ?? 0)>=500 || r.status===409) setBlocked(true);
      if (r.status===401 || r.status===403 || r.status===404) { setContent(null); setSession(null); onLibrary(); }
      return false;
    }
    apply(r.data); return true;
  };
  const open = async (target:D.ReadingStart, targetPage?:number) => {
    if (lock.current) return;
    setBlocked(false); setDone(false); setContent(null); setSession(null); setDefinition(null);
    activeSeconds.current=0;
    lock.current=true; setBusy(true); setNote(''); const run=++scope.current;
    const started=await api.start(token,target);
    if (run!==scope.current) return;
    if (!started.success || !started.data || target.storyId != null && started.data.storyId!==target.storyId) {
      lock.current=false; setBusy(false); setNote(started.message || 'Không mở được truyện.'); return;
    }
    const loaded=await api.content(token,started.data.sessionId);
    if (run!==scope.current) return;
    lock.current=false; setBusy(false);
    if (!loaded.success || !loaded.data || loaded.data.sessionId!==started.data.sessionId || loaded.data.storyId!==started.data.storyId) { setNote(loaded.message || 'Nội dung không khớp phiên đọc.'); return; }
    const desired=targetPage ?? started.data.lastPage;
    setPage(loaded.data.scenes.some(s=>s.sceneIndex+1===desired)?desired:(loaded.data.scenes[0]?.sceneIndex ?? 0)+1);
    setMode(started.data.lastReadingMode==='ListenFirst'?'ListenFirst':'ReadFirst');
    setSession(started.data); setContent(loaded.data);
  };
  const save = async (nextPage=page, nextMode=mode) => {
    if (!session || done) return false;
    const seconds=activeSeconds.current;
    return execute(()=>api.progress(token,session.sessionId,{page:nextPage,readingMode:nextMode,addedSeconds:seconds}),r=>{ activeSeconds.current=Math.max(0,activeSeconds.current-seconds);setPage(r.page); setMode(r.readingMode==='ListenFirst'?'ListenFirst':'ReadFirst'); setNote('Đã lưu vị trí đọc.'); });
  };
  const complete = async () => {
    if (!session || done || !await save()) return;
    await execute(()=>api.complete(token,session.sessionId),()=>{setDone(true);setNote('Em đã hoàn thành truyện!');onLibrary();});
  };
  const flag = async (kind:'bookmark'|'favorite') => {
    if (!session) return;
    const value=kind==='bookmark'?!session.isBookmarked:!session.isFavorited;
    await execute(()=>kind==='bookmark'?api.bookmark(token,session.sessionId,value):api.favorite(token,session.sessionId,value),r=>setSession(s=>s?{...s,...r}:s));
  };
  const lookup = async (id:number) => { if(session) {setDefinition(null); await execute(()=>api.definition(token,session.sessionId,id),setDefinition);} };
  const collect = async () => { if(session&&definition) await execute(()=>notebook.collect(token,session.sessionId,definition.vocabularyId),()=>setDefinition(d=>d?{...d,isCollected:true}:d)); };
  const event = async (type:D.ReadingEvent, payload?:string) => {
    if (!session || blocked || done) return;
    const run=scope.current; const r=await api.event(token,session.sessionId,type,payload);
    if(run===scope.current&&!r.success)setNote(r.message);
  };
  return {session,content,page,mode,definition,busy,blocked,done,note,open,close,save,complete,flag,lookup,collect,event};
}
