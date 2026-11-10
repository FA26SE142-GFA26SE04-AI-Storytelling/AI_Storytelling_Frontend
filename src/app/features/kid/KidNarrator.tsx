'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Volume1,Volume2,VolumeX} from 'lucide-react';
import type {ReadingScene,ReadingEvent} from '@/app/types/childReading';
import {markKidActivity} from '@/app/lib/kidActivity';
import {charInSegment,parseWordTimings,segmentStarts} from './scenePictures';

/**
 * onPosition: vị trí ký tự đang được đọc trong chữ của cảnh, báo liên tục khi phát để khung tranh đổi tranh theo.
 */
export default function KidNarrator({scene,disabled,onListen,onEvent,onSceneEnd,onPosition,paused}:{scene:ReadingScene;disabled:boolean;onListen:()=>Promise<boolean>;onEvent:(type:ReadingEvent,payload?:string)=>Promise<void>;onSceneEnd?:()=>void;onPosition?:(offset:number)=>void;paused:boolean}) {
  const segments=scene.segments.slice().sort((a,b)=>a.segmentOrder-b.segmentOrder);
  const [part,setPart]=useState(0),[playing,setPlaying]=useState(false),[busy,setBusy]=useState(false);
  const [failed,setFailed]=useState(false);
  const audio=useRef<HTMLAudioElement>(null),auto=useRef(false),generation=useRef(0),lock=useRef(false);
  const pauseGate=useRef(paused);
  const current=segments[part];
  const starts=useMemo(()=>segmentStarts(scene),[scene]);
  const timings=useMemo(()=>parseWordTimings(current?.wordTimingsJson??null),[current?.wordTimingsJson]);
  const report=()=>{const a=audio.current;if(!a||!current||!onPosition)return;onPosition((starts[part]??0)+charInSegment(current.text,timings,a.currentTime,a.duration));};
  useEffect(()=>{const player=audio.current;const run=++generation.current;return()=>{generation.current=run+1;player?.pause();};},[part]);
  useEffect(()=>{pauseGate.current=paused;if(disabled||paused){auto.current=false;audio.current?.pause();}},[disabled,paused]);
  useEffect(()=>{
    setFailed(false);
    audio.current?.load();
    if(auto.current&&audio.current){auto.current=false;void audio.current.play().catch(()=>{});}
  },[part]);
  const toggle=async()=>{
    if(!audio.current||disabled||lock.current||paused)return;
    if(!audio.current.paused){audio.current.pause();return;}
    lock.current=true;setBusy(true);const run=generation.current;
    const allowed=await onListen();
    if(run!==generation.current)return;
    lock.current=false;setBusy(false);
    if(allowed&&!pauseGate.current)void audio.current?.play().catch(()=>setFailed(true));
  };
  const unavailable=disabled||busy||!current?.audioUrl||paused||failed;
  // Một nút biểu tượng ở góc tranh: chưa có giọng hoặc không tải được thì nút mờ đi, không hiện chữ.
  return <div className="kid-narrator-corner" aria-label="Giọng kể">
    {current?.audioUrl&&<audio ref={audio} src={current.audioUrl} preload="metadata" aria-label={`Nghe đoạn ${current.segmentOrder+1}`} onTimeUpdate={report} onPlay={()=>{setPlaying(true);markKidActivity();report();void onEvent('TtsStarted',JSON.stringify({page:scene.sceneIndex+1,segmentOrder:current.segmentOrder}));}} onPause={()=>setPlaying(false)} onEnded={()=>{setPlaying(false);void onEvent('TtsCompleted',JSON.stringify({page:scene.sceneIndex+1,segmentOrder:current.segmentOrder}));if(part<segments.length-1&&segments[part+1].audioUrl&&!disabled&&!paused){auto.current=true;setPart(v=>v+1);}else if(part>=segments.length-1)onSceneEnd?.();}} onError={()=>{setPlaying(false);setFailed(true);}}/>}
    <button type="button" className={`kid-narrate-btn${failed||!current?.audioUrl?' off':''}${playing?' on':''}`} aria-label={playing?'Tạm dừng':'Nghe truyện'} title={playing?'Tạm dừng':'Nghe truyện'} aria-pressed={playing} disabled={unavailable} onClick={()=>void toggle()}>{failed||!current?.audioUrl?<VolumeX aria-hidden="true"/>:playing?<Volume2 aria-hidden="true"/>:<Volume1 aria-hidden="true"/>}</button>
  </div>;
}
