'use client';
import {useState} from 'react';
import {ArrowLeft,ChevronLeft,ChevronRight,Heart,Bookmark,Sparkles,BookOpen,Check} from 'lucide-react';
import Frog from '@/app/components/brand/Frog';
import type {useChildReader} from './useChildReader';
import KidNarrator from './KidNarrator';

export default function ChildReader({reader:r}:{reader:ReturnType<typeof useChildReader>}) {
  const [words,setWords]=useState(false),[settings,setSettings]=useState(false);
  const [failedImage,setFailedImage]=useState<string|null>(null);
  const c=r.content;if(!c)return null;
  const scenes=c.scenes.slice().sort((a,b)=>a.sceneIndex-b.sceneIndex);
  const index=scenes.findIndex(s=>s.sceneIndex+1===r.page),scene=scenes[index];
  const disabled=r.busy||r.blocked||r.done;
  return <article className="kid-theater" aria-label="Sân khấu kể chuyện">
    <header className="kid-theater-top"><button className="kid-soft-button" disabled={r.busy} onClick={r.close}><ArrowLeft aria-hidden="true"/>Về danh sách đọc</button><span className="kid-theater-brand"><Frog variant="face" size={32}/>Taletale</span><button className="kid-soft-button" aria-expanded={settings} onClick={()=>setSettings(v=>!v)}><BookOpen aria-hidden="true"/>Cách đọc</button></header>
    <div className="kid-theater-title"><span className="kid-overline">GIỜ KỂ CHUYỆN CỦA EM</span><h1 className="display">{c.title}</h1><p>Cảnh {index+1} trong {scenes.length}</p></div>
    {r.note&&<p className="kid-reading-note" role="status">{r.note}</p>}
    {settings&&<section className="kid-reading-options"><label>Cách đọc<select className="inp" aria-label="Cách đọc" disabled={disabled} value={r.mode} onChange={e=>void r.save(r.page,e.target.value==='ListenFirst'?'ListenFirst':'ReadFirst')}><option value="ReadFirst">Em tự đọc</option><option value="ListenFirst">Em nghe đọc</option></select></label><button className="kid-soft-button" disabled={disabled} onClick={()=>void r.flag('bookmark')}><Bookmark aria-hidden="true"/>{r.session?.isBookmarked?'Bỏ đánh dấu':'Đánh dấu truyện'}</button><button className="kid-soft-button" disabled={disabled} onClick={()=>void r.save()}>Lưu vị trí đọc</button></section>}
    {scene&&<section className="kid-story-stage" key={scene.sceneIndex}>
      <div className="kid-story-picture">{scene.illustrationUrl&&failedImage!==scene.illustrationUrl?
        // Signed media is supplied by the child-authorized content endpoint.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={scene.illustrationUrl} alt={`Tranh cảnh ${r.page}`} onError={()=>setFailedImage(scene.illustrationUrl)}/>
        :<div className="kid-no-picture"><Frog mood="happy" size={100}/><p>{failedImage?'Tranh chưa mở được. Em vẫn có thể nghe và đọc truyện.':'Cùng bước vào câu chuyện nhé!'}</p></div>}</div>
      <div className="kid-story-caption"><span className="kid-overline">LỜI KỂ</span><p>{scene.text}</p></div>
      {!r.done&&<KidNarrator key={`${c.sessionId}:${scene.sceneIndex}`} scene={scene} disabled={disabled} paused={words||settings} onListen={()=>r.mode==='ListenFirst'?Promise.resolve(true):r.save(r.page,'ListenFirst')} onEvent={r.event}/>}
    </section>}
    <nav className="kid-story-navigation" aria-label="Chuyển cảnh"><button className="kid-soft-button" disabled={disabled||index<=0} onClick={()=>void r.save(scenes[index-1].sceneIndex+1)}><ChevronLeft aria-hidden="true"/>Cảnh trước</button><span className="kid-scene-count">Cảnh {index+1}/{scenes.length}</span><button className="kid-soft-button" disabled={disabled||index<0||index>=scenes.length-1} onClick={()=>void r.save(scenes[index+1].sceneIndex+1)}>Cảnh tiếp<ChevronRight aria-hidden="true"/></button></nav>
    <div className="kid-story-extras">{c.vocabulary.length>0&&<button className="kid-soft-button" aria-expanded={words} onClick={()=>setWords(v=>!v)}><Sparkles aria-hidden="true"/>Từ mới trong truyện</button>}<button className="kid-soft-button" disabled={disabled} aria-pressed={!!r.session?.isFavorited} onClick={()=>void r.flag('favorite')}><Heart aria-hidden="true"/>{r.session?.isFavorited?'Bỏ yêu thích':'Yêu thích'}</button></div>
    {words&&<section className="kid-word-panel" aria-label="Khám phá từ mới"><h2 className="display">Một từ mới, một điều hay</h2><div className="kid-word-list">{c.vocabulary.map(v=><button className="kid-soft-button" key={v.id} disabled={r.busy||r.blocked} onClick={()=>void r.lookup(v.id)}>{v.term}</button>)}</div>{r.definition&&<div><h3 className="display">{r.definition.term}</h3><p>{r.definition.definition}</p><button className="kid-listen-primary" disabled={r.busy||r.blocked||r.definition.isCollected} onClick={()=>void r.collect()}>{r.definition.isCollected?<Check aria-hidden="true"/>:<Bookmark aria-hidden="true"/>}{r.definition.isCollected?'Đã lưu vào sổ tay':'Lưu vào sổ tay'}</button></div>}<button className="kid-soft-button" onClick={()=>setWords(false)}>Về với câu chuyện</button></section>}
    {index===scenes.length-1&&scene&&!r.done&&<div className="kid-story-finish"><Frog mood="happy" size={60}/><p>Em đã đi đến cuối câu chuyện rồi!</p><button className="kid-listen-primary" disabled={disabled} onClick={()=>void r.complete()}><Check aria-hidden="true"/>Em đã đọc xong</button></div>}
    {r.done&&<section className="kid-story-finish"><Frog mood="happy" size={90}/><h2 className="display">Câu chuyện đã khép lại!</h2>{c.lesson&&<p>{c.lesson}</p>}<button className="kid-listen-primary" onClick={r.close}>Về thư viện của em</button></section>}
  </article>;
}
