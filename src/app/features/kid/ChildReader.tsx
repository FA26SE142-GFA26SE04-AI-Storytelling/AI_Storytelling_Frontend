'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ChevronLeft,ChevronRight,Heart,Bookmark,Sparkles,BookOpen,Check,Volume2,Headphones} from 'lucide-react';
import Frog from '@/app/components/brand/Frog';
import SafeImage from '@/app/components/SafeImage';
import type {useChildReader} from './useChildReader';
import KidNarrator from './KidNarrator';
import KidAfterReading from './KidAfterReading';
import {useDialog} from './useDialog';
import KidInteraction from './KidInteraction';
import type {ReadingScene} from '@/app/types/childReading';
import {pictureAt,pictureParts,scenePictures,type ScenePicture} from './scenePictures';

/** Khi bé đọc xong: lời chúc, cảm nhận và câu đố hiện trong cửa sổ giữa màn hình, không bắt bé lăn xuống. */
function FinishPopup({reader:r}:{reader:ReturnType<typeof useChildReader>}) {
  const ref=useDialog<HTMLDivElement>(r.close);
  const lesson=r.content?.lesson;
  return <div className="kid-quiz-backdrop"><div className="kid-quiz-modal kid-finish-modal" role="dialog" aria-modal="true" aria-label="Em đã đọc xong" ref={ref} tabIndex={-1}>
    <Frog mood="happy" size={96}/>
    <h2 className="display">Câu chuyện đã khép lại!</h2>
    {lesson&&<p className="kid-finish-lesson">{lesson}</p>}
    {r.completed&&<KidAfterReading token={r.token} completed={r.completed} scenes={r.content?.scenes??[]} onLibrary={r.close}/>}
    <button type="button" className="kid-listen-primary" onClick={r.close}>Về thư viện của em</button>
  </div></div>;
}

/**
 * Khung tranh của cảnh (1–3 tranh xếp chồng): tranh đang hiện rõ dần, tranh cũ mờ đi.
 * Mọi tranh được tải sẵn ngay khi vào cảnh để lúc chuyển không bị chờ. Có từ 2 tranh thì hiện chấm để bé tự bấm xem.
 * Hiện khung chờ nhấp nháy cho tới khi tranh đầu tải xong (tranh lỗi thì đã có ảnh mặc định).
 */
function ScenePictures({pictures,active,onPick,alt,children}:{pictures:ScenePicture[];active:number;onPick:(i:number)=>void;alt:string;children?:React.ReactNode}) {
  const [ready,setReady]=useState(false);
  return <div className={`kid-story-picture${ready?'':' loading'}${pictures.length>1?' multi':''}`}>
    {pictures.map((p,i)=><span key={i} className={`kid-pic-layer${i===active?' on':''}`} aria-hidden={i!==active}>
      <SafeImage src={p.url} alt={pictures.length>1?`${alt}, tranh ${i+1}`:alt} onLoad={()=>{if(i===0)setReady(true);}} onError={()=>{if(i===0)setReady(true);}}/>
    </span>)}
    {!ready&&<span className="kid-skeleton" role="status" aria-label="Đang tải tranh"/>}
    {pictures.length>1&&<div className="kid-pic-dots" role="group" aria-label="Chọn tranh">
      {pictures.map((_,i)=><button key={i} type="button" className={`kid-pic-dot${i===active?' on':''}`} aria-label={`Xem tranh ${i+1}`} aria-pressed={i===active} onClick={()=>onPick(i)}/>)}
    </div>}
    {children}
  </div>;
}

/**
 * Chữ của cả cảnh; part (đoạn thuộc tranh đang hiện) được highlight, null khi cảnh chỉ có 1 tranh.
 * Đổi tranh thì tự cuộn tới đoạn được highlight.
 */
function Caption({text,part}:{text:string;part:{start:number;end:number}|null}) {
  const mark=useRef<HTMLElement>(null);
  useEffect(()=>{mark.current?.scrollIntoView({block:'nearest',behavior:'smooth'});},[part?.start]);
  if(!part||part.end<=part.start)return <p>{text}</p>;
  return <p>{text.slice(0,part.start)}<mark ref={mark} key={part.start} className="kid-pic-part">{text.slice(part.start,part.end)}</mark>{text.slice(part.end)}</p>;
}

export default function ChildReader({reader:r}:{reader:ReturnType<typeof useChildReader>}) {
  const [words,setWords]=useState(false);
  /** Tương tác đang hiện và việc làm tiếp sau khi bé trả lời xong (sang cảnh khác, hoàn thành truyện). */
  const [ask,setAsk]=useState<{scene:ReadingScene;then:()=>void}|null>(null);
  /** Tranh đang hiện của cảnh nào; đổi cảnh thì về tranh đầu. lastAuto: tranh giọng đọc vừa chuyển tới, để bé bấm tranh khác thì không bị kéo lại ngay. */
  const [pic,setPic]=useState<{scene:number;i:number}>({scene:-1,i:0});
  const lastAuto=useRef<{scene:number;i:number}>({scene:-1,i:0});
  const c=r.content;if(!c)return null;
  const scenes=c.scenes.slice().sort((a,b)=>a.sceneIndex-b.sceneIndex);
  const found=scenes.findIndex(s=>s.sceneIndex+1===r.page);
  // Số trang không khớp cảnh nào (ví dụ vị trí đọc cũ) thì hiện cảnh đầu, không để màn hình trống.
  const index=found>=0?found:0,scene=scenes[index];
  const disabled=r.busy||r.blocked||r.done;
  const pictures=scene?scenePictures(scene):[];
  const active=scene&&pic.scene===scene.sceneIndex?Math.min(pic.i,pictures.length-1):0;
  /** Đoạn chữ của tranh đang hiện, được highlight trong khung chữ (cảnh 1 tranh thì không highlight). */
  const part=scene?pictureParts(pictures,scene.text)[active]:null;
  // Giọng đọc tới đoạn chữ của tranh khác thì chuyển tranh (chỉ khi tranh cần hiện thật sự đổi).
  const follow=(offset:number)=>{if(!scene)return;const i=pictureAt(pictures,offset);const last=lastAuto.current;if(last.scene===scene.sceneIndex&&last.i===i)return;lastAuto.current={scene:scene.sceneIndex,i};setPic({scene:scene.sceneIndex,i});};
  /** Cảnh đang có tương tác chưa trả lời thì hỏi trước, rồi mới làm việc tiếp theo. */
  const guarded=(then:()=>void)=>{if(scene&&r.pending(scene))setAsk({scene,then});else then();};
  const goTo=(p:number)=>guarded(()=>void r.save(p));
  return <article className="kid-theater" aria-label="Sân khấu kể chuyện">
    <header className="kid-theater-top"><button className="kid-soft-button" disabled={r.busy} onClick={()=>void r.leave()}><ArrowLeft aria-hidden="true"/>Về danh sách đọc</button><button type="button" role="switch" aria-checked={r.mode==='ListenFirst'} aria-label={r.mode==='ListenFirst'?'Đang ở chế độ nghe đọc. Bấm để tự đọc':'Đang ở chế độ tự đọc. Bấm để nghe đọc'} className={`kid-mode-switch${r.mode==='ListenFirst'?' listen':''}`} disabled={disabled} onClick={()=>void r.save(r.page,r.mode==='ListenFirst'?'ReadFirst':'ListenFirst')}><span className="kid-mode-opt"><BookOpen aria-hidden="true"/>Tự đọc</span><span className="kid-mode-opt"><Volume2 aria-hidden="true"/>Nghe đọc</span><span className="kid-mode-thumb" aria-hidden="true"/></button><button type="button" className="kid-soft-button" aria-pressed={r.listenOnly} title="Chỉ nghe truyện, không dừng lại để chơi" disabled={disabled} onClick={()=>void r.flag('listenOnly')}><Headphones aria-hidden="true"/>Chỉ nghe</button></header>
    {r.note&&<p className="kid-reading-note" role="status">{r.note}</p>}
    {!scene&&<section className="kid-reader-empty" role="status"><Frog mood="think" size={96}/><h2 className="display">Truyện này chưa có nội dung để đọc</h2><p>Em chọn truyện khác nhé!</p></section>}
    {scene&&<div className="kid-reader" key={scene.sceneIndex}>
      <div className="kid-reader-visual">
          <ScenePictures pictures={pictures} active={active} onPick={i=>setPic({scene:scene.sceneIndex,i})} alt={`Tranh cảnh ${index+1}`}>
          {!r.done&&<KidNarrator key={`${c.sessionId}:${scene.sceneIndex}`} scene={scene} disabled={disabled} paused={words} onListen={()=>r.mode==='ListenFirst'?Promise.resolve(true):r.save(r.page,'ListenFirst')} onEvent={r.event} onPosition={follow} onSceneEnd={()=>{if(!ask&&r.pending(scene))setAsk({scene,then:()=>{}});}}/>}
        </ScenePictures>
      </div>
      <div className="kid-reader-side">
        <div className="kid-story-caption"><Caption text={scene.text} part={pictures.length>1?part:null}/></div>
        <nav className="kid-story-navigation" aria-label="Tiến độ truyện"><button type="button" className="kid-side-nav" aria-label="Cảnh trước" title="Cảnh trước" disabled={disabled||index<=0} onClick={()=>goTo(scenes[index-1].sceneIndex+1)}><ChevronLeft aria-hidden="true"/></button><span className="kid-scene-count">Cảnh {index+1}/{scenes.length}</span><button type="button" className="kid-side-nav" aria-label="Cảnh sau" title="Cảnh sau" disabled={disabled||index<0||index>=scenes.length-1} onClick={()=>goTo(scenes[index+1].sceneIndex+1)}><ChevronRight aria-hidden="true"/></button><span className="kid-bar-actions">{c.vocabulary.length>0&&<button className="kid-soft-button" aria-expanded={words} onClick={()=>setWords(v=>!v)}><Sparkles aria-hidden="true"/>Từ mới</button>}<button className="kid-soft-button" disabled={disabled} aria-pressed={!!r.session?.isFavorited} onClick={()=>void r.flag('favorite')}><Heart aria-hidden="true"/>Yêu thích</button></span>{index===scenes.length-1&&scene&&!r.done&&<button className="kid-listen-primary" disabled={disabled} onClick={()=>guarded(()=>void r.complete())}><Check aria-hidden="true"/>Em đã đọc xong</button>}</nav>
        {words&&<section className="kid-word-panel" aria-label="Từ mới"><div className="kid-word-list">{c.vocabulary.map(v=><button className="kid-soft-button" key={v.id} aria-pressed={r.definition?.vocabularyId===v.id} disabled={r.busy||r.blocked} onClick={()=>void r.lookup(v.id)}>{v.term}</button>)}</div>{r.definition&&<div><p>{r.definition.definition}</p><button className="kid-listen-primary" disabled={r.busy||r.blocked||r.definition.isCollected} onClick={()=>void r.collect()}>{r.definition.isCollected?<Check aria-hidden="true"/>:<Bookmark aria-hidden="true"/>}{r.definition.isCollected?'Đã lưu':'Lưu vào sổ tay'}</button></div>}<button className="kid-soft-button" onClick={()=>setWords(false)}>Đóng</button></section>}
      </div>
    </div>}
    {ask&&!r.done&&<KidInteraction key={ask.scene.interaction!.id} interaction={ask.scene.interaction!} busy={r.busy}
      onSubmit={body=>r.attempt(ask.scene.interaction!.id,body)}
      onReplay={i=>{setAsk(null);void r.save(i+1);}}
      onContinue={()=>{const next=ask.then;setAsk(null);next();}}/>}
    {r.done&&<FinishPopup reader={r}/>}
  </article>;
}
