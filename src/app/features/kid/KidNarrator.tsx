'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Volume1,Volume2,VolumeX} from 'lucide-react';
import type {ReadingScene,ReadingEvent} from '@/app/types/childReading';
import {markKidActivity} from '@/app/lib/kidActivity';
import {charInSegment,parseWordTimings,segmentStarts} from './scenePictures';
import {useAuthedMediaUrl} from '@/app/lib/useAuthedMediaUrl';

/**
 * onPosition: vị trí ký tự đang được đọc trong chữ của cảnh, báo liên tục khi phát để khung tranh đổi tranh theo.
 */
export default function KidNarrator({scene,disabled,onListen,onEvent,onSceneEnd,onPosition,paused,onSegmentChange}:{scene:ReadingScene;disabled:boolean;onListen:()=>Promise<boolean>;onEvent:(type:ReadingEvent,payload?:string)=>Promise<void>;onSceneEnd?:()=>void;onPosition?:(offset:number)=>void;paused:boolean;onSegmentChange?:(part:number)=>void}) {
  const segments=scene.segments.slice().sort((a,b)=>a.segmentOrder-b.segmentOrder);
  const [part,setPart]=useState(0),[playing,setPlaying]=useState(false),[busy,setBusy]=useState(false);
  const [failed,setFailed]=useState(false);
  const audio=useRef<HTMLAudioElement>(null),auto=useRef(false),generation=useRef(0),lock=useRef(false);
  const pauseGate=useRef(paused);
  const current=segments[part];
  // Tải src audio qua hook (hỗ trợ URL proxy cần token; trả blob URL hoặc URL gốc)
  const media=useAuthedMediaUrl(current?.audioUrl);
  // Kết hợp lỗi từ state nội bộ và lỗi tải media
  const broken=failed||media.failed;
  const starts=useMemo(()=>segmentStarts(scene),[scene]);
  const timings=useMemo(()=>parseWordTimings(current?.wordTimingsJson??null),[current?.wordTimingsJson]);
  const report=()=>{const a=audio.current;if(!a||!current||!onPosition)return;onPosition((starts[part]??0)+charInSegment(current.text,timings,a.currentTime,a.duration));};
  useEffect(()=>{onSegmentChange?.(part);},[part,onSegmentChange]);
  useEffect(()=>{const player=audio.current;const run=++generation.current;return()=>{generation.current=run+1;player?.pause();};},[part]);
  useEffect(()=>{pauseGate.current=paused;if(disabled||paused){auto.current=false;audio.current?.pause();}},[disabled,paused]);
  useEffect(()=>{
    // Khi đổi đoạn: reset lỗi và tải lại; KHÔNG phát ngay vì blob chưa sẵn sàng
    setFailed(false);
    audio.current?.load();
  },[part]);
  // Phát tự động khi src mới (blob URL) đã sẵn sàng sau khi đổi đoạn
  useEffect(()=>{
    if(auto.current&&media.src&&audio.current){auto.current=false;void audio.current.play().catch(()=>{});}
  },[media.src]);
  // Huỷ cờ tự phát nếu tải media thất bại
  useEffect(()=>{
    if(media.failed)auto.current=false;
  },[media.failed]);
  const toggle=async()=>{
    if(!audio.current||disabled||lock.current||paused)return;
    if(!audio.current.paused){audio.current.pause();return;}
    lock.current=true;setBusy(true);const run=generation.current;
    const allowed=await onListen();
    if(run!==generation.current)return;
    lock.current=false;setBusy(false);
    if(allowed&&!pauseGate.current)void audio.current?.play().catch(()=>setFailed(true));
  };
  // Nút không dùng được khi đang tải media, lỗi, hoặc không có audio
  const unavailable=disabled||busy||!current?.audioUrl||paused||media.loading||broken;
  // Một nút biểu tượng ở góc tranh: chưa có giọng hoặc không tải được thì nút mờ đi, không hiện chữ.
  return <div className="kid-narrator-corner" aria-label="Giọng kể">
    {current?.audioUrl&&<audio ref={audio} src={media.src??undefined} preload="metadata" aria-label={`Nghe đoạn ${current.segmentOrder+1}`} onTimeUpdate={report} onPlay={()=>{setPlaying(true);markKidActivity();report();void onEvent('TtsStarted',JSON.stringify({page:scene.sceneIndex+1,segmentOrder:current.segmentOrder}));}} onPause={()=>setPlaying(false)} onEnded={()=>{setPlaying(false);void onEvent('TtsCompleted',JSON.stringify({page:scene.sceneIndex+1,segmentOrder:current.segmentOrder}));if(part<segments.length-1&&segments[part+1].audioUrl&&!disabled&&!paused){auto.current=true;setPart(v=>v+1);}else if(!segments.slice(part+1).some(s=>s.audioUrl))onSceneEnd?.();}} onError={()=>{setPlaying(false);setFailed(true);}}/>}
    <button type="button" className={`kid-narrate-btn${broken||!current?.audioUrl?' off':''}${playing?' on':''}`} aria-label={playing?'Tạm dừng':'Nghe truyện'} title={playing?'Tạm dừng':'Nghe truyện'} aria-pressed={playing} disabled={unavailable} onClick={()=>void toggle()}>{broken||!current?.audioUrl?<VolumeX aria-hidden="true"/>:playing?<Volume2 aria-hidden="true"/>:<Volume1 aria-hidden="true"/>}</button>
  </div>;
}
