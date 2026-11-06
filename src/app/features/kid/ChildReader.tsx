'use client';
import {useState} from 'react';
import {Image as ImageIcon,ArrowLeft,ChevronLeft,ChevronRight,Heart,Bookmark,Sparkles,BookOpen,Check,Volume2} from 'lucide-react';
import Frog from '@/app/components/brand/Frog';
import type {useChildReader} from './useChildReader';
import KidNarrator from './KidNarrator';
import KidAfterReading from './KidAfterReading';
import {useDialog} from './useDialog';

/** Khi bé đọc xong: lời chúc, cảm nhận và câu đố hiện trong cửa sổ giữa màn hình, không bắt bé lăn xuống. */
function FinishPopup({reader:r}:{reader:ReturnType<typeof useChildReader>}) {
  const ref=useDialog<HTMLDivElement>(r.close);
  const lesson=r.content?.lesson;
  return <div className="kid-quiz-backdrop"><div className="kid-quiz-modal kid-finish-modal" role="dialog" aria-modal="true" aria-label="Em đã đọc xong" ref={ref} tabIndex={-1}>
    <Frog mood="happy" size={96}/>
    <h2 className="display">Câu chuyện đã khép lại!</h2>
    {lesson&&<p className="kid-finish-lesson">{lesson}</p>}
    {r.completed&&<KidAfterReading token={r.token} completed={r.completed} onLibrary={r.close}/>}
    <button type="button" className="kid-listen-primary" onClick={r.close}>Về thư viện của em</button>
  </div></div>;
}

export default function ChildReader({reader:r}:{reader:ReturnType<typeof useChildReader>}) {
  const [words,setWords]=useState(false);
  const [failedImage,setFailedImage]=useState<string|null>(null);
  const c=r.content;if(!c)return null;
  const scenes=c.scenes.slice().sort((a,b)=>a.sceneIndex-b.sceneIndex);
  const index=scenes.findIndex(s=>s.sceneIndex+1===r.page),scene=scenes[index];
  const disabled=r.busy||r.blocked||r.done;
  return <article className="kid-theater" aria-label="Sân khấu kể chuyện">
    <header className="kid-theater-top"><button className="kid-soft-button" disabled={r.busy} onClick={r.close}><ArrowLeft aria-hidden="true"/>Về danh sách đọc</button><button type="button" role="switch" aria-checked={r.mode==='ListenFirst'} aria-label={r.mode==='ListenFirst'?'Đang ở chế độ nghe đọc. Bấm để tự đọc':'Đang ở chế độ tự đọc. Bấm để nghe đọc'} className={`kid-mode-switch${r.mode==='ListenFirst'?' listen':''}`} disabled={disabled} onClick={()=>void r.save(r.page,r.mode==='ListenFirst'?'ReadFirst':'ListenFirst')}><span className="kid-mode-opt"><BookOpen aria-hidden="true"/>Tự đọc</span><span className="kid-mode-opt"><Volume2 aria-hidden="true"/>Nghe đọc</span><span className="kid-mode-thumb" aria-hidden="true"/></button></header>
    <div className="kid-theater-title"><h1 className="display">{c.title}</h1></div>
    {r.note&&<p className="kid-reading-note" role="status">{r.note}</p>}
    {scene&&<div className="kid-story-row">
    <button type="button" className="kid-side-nav" aria-label="Cảnh trước" disabled={disabled||index<=0} onClick={()=>void r.save(scenes[index-1].sceneIndex+1)}><ChevronLeft aria-hidden="true"/></button>
    <section className="kid-story-stage" key={scene.sceneIndex}>
      <div className="kid-story-visual">
        <div className={`kid-story-picture${scene.illustrationUrl&&failedImage!==scene.illustrationUrl?'':' empty'}`}>
          {scene.illustrationUrl&&failedImage!==scene.illustrationUrl?(
            // eslint-disable-next-line @next/next/no-img-element
            <img src={scene.illustrationUrl} alt={`Tranh cảnh ${r.page}`} onError={()=>setFailedImage(scene.illustrationUrl)}/>
          ):<ImageIcon aria-hidden="true"/>}
          {!r.done&&<KidNarrator key={`${c.sessionId}:${scene.sceneIndex}`} scene={scene} disabled={disabled} paused={words} onListen={()=>r.mode==='ListenFirst'?Promise.resolve(true):r.save(r.page,'ListenFirst')} onEvent={r.event}/>}
        </div>
      </div>
      <div className="kid-story-caption"><p>{scene.text}</p></div>
    </section>
    <button type="button" className="kid-side-nav" aria-label="Cảnh sau" disabled={disabled||index<0||index>=scenes.length-1} onClick={()=>void r.save(scenes[index+1].sceneIndex+1)}><ChevronRight aria-hidden="true"/></button>
    </div>}
    <nav className="kid-story-navigation" aria-label="Tiến độ truyện"><span className="kid-scene-count">Cảnh {index+1}/{scenes.length}</span><span className="kid-bar-actions">{c.vocabulary.length>0&&<button className="kid-soft-button" aria-expanded={words} onClick={()=>setWords(v=>!v)}><Sparkles aria-hidden="true"/>Từ mới</button>}<button className="kid-soft-button" disabled={disabled} aria-pressed={!!r.session?.isFavorited} onClick={()=>void r.flag('favorite')}><Heart aria-hidden="true"/>Yêu thích</button></span>{index===scenes.length-1&&scene&&!r.done&&<button className="kid-listen-primary" disabled={disabled} onClick={()=>void r.complete()}><Check aria-hidden="true"/>Em đã đọc xong</button>}</nav>
    {words&&<section className="kid-word-panel" aria-label="Từ mới"><div className="kid-word-list">{c.vocabulary.map(v=><button className="kid-soft-button" key={v.id} aria-pressed={r.definition?.vocabularyId===v.id} disabled={r.busy||r.blocked} onClick={()=>void r.lookup(v.id)}>{v.term}</button>)}</div>{r.definition&&<div><p>{r.definition.definition}</p><button className="kid-listen-primary" disabled={r.busy||r.blocked||r.definition.isCollected} onClick={()=>void r.collect()}>{r.definition.isCollected?<Check aria-hidden="true"/>:<Bookmark aria-hidden="true"/>}{r.definition.isCollected?'Đã lưu':'Lưu vào sổ tay'}</button></div>}<button className="kid-soft-button" onClick={()=>setWords(false)}>Đóng</button></section>}
    {r.done&&<FinishPopup reader={r}/>}
  </article>;
}
