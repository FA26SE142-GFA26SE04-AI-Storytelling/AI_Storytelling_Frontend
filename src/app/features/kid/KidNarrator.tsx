'use client';
import {useEffect,useRef,useState} from 'react';
import {Play,Pause,RotateCcw,Volume2} from 'lucide-react';
import type {ReadingScene,ReadingEvent} from '@/app/types/childReading';
import {markKidActivity} from '@/app/lib/kidActivity';

export default function KidNarrator({scene,disabled,onListen,onEvent,paused}:{scene:ReadingScene;disabled:boolean;onListen:()=>Promise<boolean>;onEvent:(type:ReadingEvent,payload?:string)=>Promise<void>;paused:boolean}) {
  const segments=scene.segments.slice().sort((a,b)=>a.segmentOrder-b.segmentOrder);
  const [part,setPart]=useState(0),[playing,setPlaying]=useState(false),[busy,setBusy]=useState(false);
  const [time,setTime]=useState(0),[duration,setDuration]=useState(0),[error,setError]=useState('');
  const audio=useRef<HTMLAudioElement>(null),auto=useRef(false),generation=useRef(0),lock=useRef(false);
  const pauseGate=useRef(paused);
  const current=segments[part];
  useEffect(()=>{const player=audio.current;const run=++generation.current;return()=>{generation.current=run+1;player?.pause();};},[part]);
  useEffect(()=>{pauseGate.current=paused;if(disabled||paused){auto.current=false;audio.current?.pause();}},[disabled,paused]);
  useEffect(()=>{
    setTime(0);setDuration(0);setError('');
    audio.current?.load();
    if(auto.current&&audio.current){auto.current=false;void audio.current.play().catch(()=>setError('Chạm Nghe truyện để nghe tiếp nhé.'));}
  },[part]);
  const toggle=async()=>{
    if(!audio.current||disabled||lock.current||paused)return;
    if(!audio.current.paused){audio.current.pause();return;}
    lock.current=true;setBusy(true);const run=generation.current;
    const allowed=await onListen();
    if(run!==generation.current)return;
    lock.current=false;setBusy(false);
    if(allowed&&!pauseGate.current)void audio.current?.play().catch(()=>setError('Chưa mở được giọng đọc. Em thử lại hoặc nhờ bố mẹ nhé.'));
  };
  const clock=(n:number)=>`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;
  if(!segments.length)return <p className="kid-soft-note"><Volume2 aria-hidden="true"/>Cảnh này chưa có giọng đọc. Em có thể tự đọc nhé.</p>;
  return <section className="kid-narrator" aria-label="Giọng kể của em">
    {current?.audioUrl&&<audio ref={audio} src={current.audioUrl} preload="metadata" aria-label={`Nghe đoạn ${current.segmentOrder+1}`} onLoadedMetadata={e=>setDuration(Number.isFinite(e.currentTarget.duration)?e.currentTarget.duration:0)} onTimeUpdate={e=>setTime(e.currentTarget.currentTime)} onPlay={()=>{setPlaying(true);setError('');markKidActivity();void onEvent('TtsStarted',JSON.stringify({page:scene.sceneIndex+1,segmentOrder:current.segmentOrder}));}} onPause={()=>setPlaying(false)} onEnded={()=>{setPlaying(false);void onEvent('TtsCompleted',JSON.stringify({page:scene.sceneIndex+1,segmentOrder:current.segmentOrder}));if(part<segments.length-1&&segments[part+1].audioUrl&&!disabled&&!paused){auto.current=true;setPart(v=>v+1);}}} onError={()=>{setPlaying(false);setError('Giọng đọc chưa tải được. Em quay về thư viện để tải lại nhé.');}}/>}
    <div className="kid-listen-row"><button className="kid-small-action" aria-label="Nghe lại đoạn này" disabled={disabled||busy||!current?.audioUrl||paused} onClick={()=>{if(audio.current){audio.current.pause();audio.current.currentTime=0;setTime(0);void toggle();}}}><RotateCcw aria-hidden="true"/></button><button className="kid-listen-primary" aria-pressed={playing} disabled={disabled||busy||!current?.audioUrl||paused} onClick={()=>void toggle()}>{playing?<Pause aria-hidden="true"/>:<Play aria-hidden="true"/>}{busy?'Đang mở giọng kể…':playing?'Tạm dừng':'Nghe truyện'}</button><span className="kid-audio-time">{duration>0?`${clock(time)} / ${clock(duration)}`:'Giọng kể cho em'}</span></div>
    {duration>0&&<input type="range" min={0} max={duration} step={.1} value={Math.min(time,duration)} disabled={disabled} aria-label="Vị trí nghe trong đoạn" onChange={e=>{if(audio.current){audio.current.currentTime=Number(e.target.value);setTime(Number(e.target.value));}}}/>}
    {segments.length>1&&<div className="kid-segments" aria-label="Các đoạn giọng đọc">{segments.map((s,i)=><button key={s.segmentOrder} aria-pressed={part===i} disabled={disabled} onClick={()=>{audio.current?.pause();auto.current=false;setPart(i);}}>Đoạn {i+1}</button>)}</div>}
    {playing&&current?.text&&<p className="kid-current-line" aria-label="Đoạn đang được kể">{current.text}</p>}
    {!current?.audioUrl&&<p role="status">Đoạn này chưa có giọng đọc.</p>}
    {error&&<p className="notice" role="status">{error}</p>}
  </section>;
}
