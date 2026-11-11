'use client';
import { useEffect, useRef, useState } from 'react';
import { childReadingService as api, childNotebookService as notebook } from '@/app/services/childReadingService';
import type * as D from '@/app/types/childReading';
import type { ApiResponse } from '@/app/types/auth';
import { confirmDialog } from '@/app/lib/confirm';

/**
 * Bộ nhớ tạm đường dẫn tranh/giọng đọc theo cảnh (sống đến khi tải lại trang). Mỗi lần mở truyện backend vẫn cấp phiên đọc mới
 * nên phải gọi lại start + content; nhưng đường dẫn media là URL có chữ ký, đổi mỗi lần gọi thì trình duyệt phải tải lại.
 * Dùng lại đường dẫn cũ (còn trong 5 phút) để trình duyệt lấy ảnh/tiếng từ bộ nhớ của nó.
 */
const MEDIA_CACHE = new Map<number, { illustrationUrl: string | null; audio: Record<number, string | null>; at: number }>();
const MEDIA_TTL_MS = 5 * 60_000;
function reuseMedia(content: D.ReadingContent): D.ReadingContent {
  const now = Date.now();
  return { ...content, scenes: content.scenes.map(scene => {
    const hit = MEDIA_CACHE.get(scene.sceneId);
    if (hit && now - hit.at < MEDIA_TTL_MS) {
      return { ...scene, illustrationUrl: hit.illustrationUrl ?? scene.illustrationUrl, segments: scene.segments.map(g => ({ ...g, audioUrl: hit.audio[g.segmentOrder] ?? g.audioUrl })) };
    }
    MEDIA_CACHE.set(scene.sceneId, { illustrationUrl: scene.illustrationUrl, audio: Object.fromEntries(scene.segments.map(g => [g.segmentOrder, g.audioUrl])), at: now });
    return scene;
  }) };
}

export function useChildReader(token:string, onLibrary:()=>void) {
  const [session,setSession] = useState<D.ReadingStarted|null>(null);
  const [content,setContent] = useState<D.ReadingContent|null>(null);
  const [page,setPage] = useState(1);
  const [mode,setMode] = useState<D.ReadingMode>('ReadFirst');
  const [definition,setDefinition] = useState<D.VocabularyDefinition|null>(null);
  const [busy,setBusy] = useState(false);
  const [blocked,setBlocked] = useState(false);
  const [done,setDone] = useState(false);
  const [completed,setCompleted] = useState<D.ReadingCompleted|null>(null);
  const [note,setNote] = useState('');
  /** Tương tác bé đã trả lời trong phiên này (backend cũng đánh dấu attemptedInSession khi mở lại). */
  const [attempted,setAttempted] = useState<number[]>([]);
  const scope = useRef(0), lock = useRef(false);
  /** Mã của thao tác đang giữ khóa; thao tác cũ xong muộn (phiên đã đổi) chỉ được nhả khóa nếu chưa có thao tác mới giữ. */
  const ticket = useRef(0);
  const activeSeconds=useRef(0);
  const close = () => { scope.current++; ticket.current++; lock.current=false; setBusy(false); setContent(null); setSession(null); setDefinition(null); onLibrary(); };
  /** Thoát khi chưa đọc xong thì hỏi lại; tiến độ vẫn được lưu. */
  const leave = async () => { if (!done && !completed && !await confirmDialog('Em muốn thoát truyện?')) return; close(); };
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
        scope.current++; ticket.current++; lock.current=false; setBusy(false); setContent(null); setSession(null); setDefinition(null);
        setNote(r.data?.message || r.message || 'Truyện này đang nghỉ một chút, mình đọc truyện khác nhé!'); onLibrary();
      } else if (!r.success) setNote(r.message);
    };
    void check(); const timer=setInterval(() => void check(),8000);
    return () => { controller.abort(); clearInterval(timer); };
  },[token,session,onLibrary]);
  const execute = async <T,>(call:()=>Promise<ApiResponse<T>>, apply:(data:T)=>void) => {
    if (lock.current || blocked) return false;
    lock.current=true; setBusy(true); setNote(''); const run=scope.current; const mine=++ticket.current;
    const r=await call();
    // Luôn nhả khóa khi xong, kể cả lúc phiên đã đổi giữa chừng (vd. token làm mới): trước đây thoát sớm mà không nhả nên khóa kẹt
    // và mọi nút (kể cả "Em đã đọc xong") im lặng không làm gì dù không bị tắt.
    if (ticket.current===mine) { lock.current=false; setBusy(false); }
    if (run!==scope.current) return false;
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
    setBlocked(false); setDone(false); setCompleted(null); setContent(null); setSession(null); setDefinition(null); setAttempted([]);
    activeSeconds.current=0;
    lock.current=true; setBusy(true); setNote(''); const run=++scope.current; ticket.current++;
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
    setSession(started.data); setContent(reuseMedia(loaded.data));
  };
  // Tải sẵn tranh và giọng đọc của cảnh đang đọc và cảnh kế tiếp để lật trang không phải chờ.
  const warm = useRef<(HTMLImageElement|HTMLAudioElement)[]>([]);
  useEffect(()=>{
    if(!content)return;
    const at=content.scenes.findIndex(s=>s.sceneIndex+1===page);
    const items:(HTMLImageElement|HTMLAudioElement)[]=[];
    for(const scene of [content.scenes[at],content.scenes[at+1]]){
      if(!scene)continue;
      if(scene.illustrationUrl){const im=new Image();im.src=scene.illustrationUrl;items.push(im);}
      const first=scene.segments.find(g=>g.audioUrl);
      if(first?.audioUrl){const au=new Audio();au.preload='auto';au.src=first.audioUrl;items.push(au);}
    }
    warm.current=items;
  },[content,page]);
  const save = async (nextPage=page, nextMode=mode) => {
    if (!session || done) return false;
    const seconds=activeSeconds.current;
    return execute(()=>api.progress(token,session.sessionId,{page:nextPage,readingMode:nextMode,addedSeconds:seconds}),r=>{ activeSeconds.current=Math.max(0,activeSeconds.current-seconds);setPage(r.page); setMode(r.readingMode==='ListenFirst'?'ListenFirst':'ReadFirst'); setNote('Đã lưu vị trí đọc.'); });
  };
  const complete = async () => {
    if (!session || done || !await confirmDialog('Em đã đọc xong truyện này?') || !await save()) return;
    await execute(()=>api.complete(token,session.sessionId),r=>{setDone(true);setCompleted(r);setNote('Em đã hoàn thành truyện!');onLibrary();});
  };
  /** "Chỉ nghe truyện": bật thì app không dừng lại để hỏi tương tác. */
  const listenOnly = session?.listenOnly ?? content?.listenOnly ?? false;
  const flag = async (kind:'bookmark'|'favorite'|'listenOnly') => {
    if (!session) return;
    const call = kind==='bookmark' ? api.bookmark(token,session.sessionId,!session.isBookmarked)
      : kind==='favorite' ? api.favorite(token,session.sessionId,!session.isFavorited)
      : api.listenOnly(token,session.sessionId,!listenOnly);
    await execute(()=>call,r=>setSession(s=>s?{...s,...r}:s));
  };
  /** Tương tác đang chờ bé trả lời ở cảnh này (chưa thử, và bé không bật "chỉ nghe"). */
  const pending = (scene:D.ReadingScene) => !!scene.interaction && !scene.attemptedInSession && !attempted.includes(scene.interaction.id) && !listenOnly;
  /** Gửi câu trả lời; trả về kết quả của backend hoặc null khi gửi không được. */
  const attempt = async (interactionId:number, body:D.ListeningAttemptRequest) => {
    if (!session) return null;
    const box:{value:D.ListeningAttemptResult|null} = {value:null};
    await execute(()=>api.attempt(token,session.sessionId,interactionId,body),r=>{ box.value=r; setAttempted(v=>v.includes(interactionId)?v:[...v,interactionId]); });
    return box.value;
  };
  const lookup = async (id:number) => { if(session) {setDefinition(null); await execute(()=>api.definition(token,session.sessionId,id),setDefinition);} };
  const collect = async () => { if(session&&definition) await execute(()=>notebook.collect(token,session.sessionId,definition.vocabularyId),()=>setDefinition(d=>d?{...d,isCollected:true}:d)); };
  const event = async (type:D.ReadingEvent, payload?:string) => {
    if (!session || blocked || done) return;
    const run=scope.current; const r=await api.event(token,session.sessionId,type,payload);
    if(run===scope.current&&!r.success)setNote(r.message);
  };
  const readAloud = async (segmentId:number, audio:Blob) => {
    if (!session) return { success:false, status:401, message:'Phiên của bé đã hết hạn.', data:null };
    return api.readAloud(token, session.sessionId, segmentId, audio);
  };
  return {token,session,content,page,mode,definition,busy,blocked,done,completed,note,listenOnly,open,close,leave,save,complete,flag,pending,attempt,lookup,collect,event,readAloud};
}
