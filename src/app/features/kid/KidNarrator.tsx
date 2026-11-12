'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {Volume1,Volume2,VolumeX} from 'lucide-react';
import type {ReadingScene,ReadingEvent} from '@/app/types/childReading';
import {markKidActivity} from '@/app/lib/kidActivity';
import {charInSegment,parseWordTimings,secondsAtChar,segmentStarts} from './scenePictures';
import {useAuthedMediaUrl} from '@/app/lib/useAuthedMediaUrl';

export default function KidNarrator({scene,disabled,onListen,onEvent,onSceneEnd,paused,onSegmentChange,range}:{scene:ReadingScene;disabled:boolean;onListen:()=>Promise<boolean>;onEvent:(type:ReadingEvent,payload?:string)=>Promise<void>;onSceneEnd?:()=>void;paused:boolean;onSegmentChange?:(part:number)=>void;range:{start:number;end:number}}) {
  const segments=scene.segments.slice().sort((a,b)=>a.segmentOrder-b.segmentOrder);
  const [part,setPart]=useState(0),[playing,setPlaying]=useState(false),[busy,setBusy]=useState(false);
  const [failed,setFailed]=useState(false);
  const audio=useRef<HTMLAudioElement>(null),auto=useRef(false),generation=useRef(0),lock=useRef(false);
  const pauseGate=useRef(paused);
  const rangeRef=useRef(range);
  useEffect(()=>{rangeRef.current=range;});
  const held=useRef(false);
  const pendingSeek=useRef<number|null>(null),pendingRel=useRef(0);
  const current=segments[part];
  // Tải src audio qua hook (hỗ trợ URL proxy cần token; trả blob URL hoặc URL gốc)
  const media=useAuthedMediaUrl(current?.audioUrl);
  // Kết hợp lỗi từ state nội bộ và lỗi tải media
  const broken=failed||media.failed;
  const starts=useMemo(()=>segmentStarts(scene),[scene]);
  const timings=useMemo(()=>parseWordTimings(current?.wordTimingsJson??null),[current?.wordTimingsJson]);
  const report=()=>{
    const a=audio.current;
    if(!a||!current)return;
    const r=rangeRef.current;
    const offset=(starts[part]??0)+charInSegment(current.text,timings,a.currentTime,a.duration);
    if(!a.paused&&offset>=r.end&&r.end<scene.text.length){
      a.pause();
      held.current=true;
    }
  };
  const prevRange=useRef({start:range.start,end:range.end});
  useEffect(()=>{
    const isAdvance=range.start>prevRange.current.start;
    const isBack=range.start<prevRange.current.start;
    const changed=range.start!==prevRange.current.start||range.end!==prevRange.current.end;
    if(isBack)held.current=false;
    prevRange.current={start:range.start,end:range.end};

    if(isAdvance&&held.current&&!disabled&&!paused){
      held.current=false;
      if(media.src&&audio.current){
        void audio.current.play().catch(()=>{});
      }else{
        auto.current=true;
      }
      return;
    }

    // Bé tự lật trang: đưa giọng kể về đầu trang mới; đang phát thì đọc tiếp từ đó.
    const isAudioPlaying=audio.current?!audio.current.paused:playing;
    if(changed&&!held.current){
      let targetIndex=0;
      for(let i=0;i<starts.length;i++){
        if(starts[i]<=range.start)targetIndex=i;
      }
      if(isAudioPlaying&&targetIndex!==part)auto.current=true;
      setPart(targetIndex);
      const segStart=starts[targetIndex]??0;
      if(segStart<range.start){
        const rel=range.start-segStart;
        const seg=segments[targetIndex];
        const segTimings=seg?parseWordTimings(seg.wordTimingsJson??null):timings;
        const dur=audio.current?.duration||0;
        const sec=secondsAtChar(seg?.text??scene.text,segTimings,rel,dur);
        if(targetIndex===part&&audio.current&&audio.current.readyState>=1&&dur>0){
          audio.current.currentTime=sec;
          pendingSeek.current=null;
          pendingRel.current=0;
        }else{
          pendingSeek.current=sec;
          pendingRel.current=rel;
        }
      }else{
        if(targetIndex===part&&audio.current&&audio.current.readyState>=1){
          audio.current.currentTime=0;
        }
        pendingSeek.current=0;
        pendingRel.current=0;
      }
    }
  },[range.start,range.end,disabled,paused,media.src,playing,starts,scene.text,segments,timings,part]);
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
    {current?.audioUrl&&<audio ref={audio} src={media.src??undefined} preload="metadata" aria-label={`Nghe đoạn ${current.segmentOrder+1}`} onTimeUpdate={report} onLoadedMetadata={()=>{const a=audio.current;if(!a)return;if(pendingSeek.current!==null){let s=pendingSeek.current;if(pendingRel.current>0&&a.duration){s=secondsAtChar(current?.text??scene.text,timings,pendingRel.current,a.duration);}a.currentTime=s;pendingSeek.current=null;pendingRel.current=0;}}} onPlay={()=>{setPlaying(true);markKidActivity();report();void onEvent('TtsStarted',JSON.stringify({page:scene.sceneIndex+1,segmentOrder:current.segmentOrder}));}} onPause={()=>setPlaying(false)} onEnded={()=>{setPlaying(false);void onEvent('TtsCompleted',JSON.stringify({page:scene.sceneIndex+1,segmentOrder:current.segmentOrder}));if(part<segments.length-1&&segments[part+1].audioUrl&&!disabled&&!paused){if((starts[part+1]??0)>=rangeRef.current.end){held.current=true;setPart(v=>v+1);}else{auto.current=true;setPart(v=>v+1);}}else if(!segments.slice(part+1).some(s=>s.audioUrl))onSceneEnd?.();}} onError={()=>{setPlaying(false);setFailed(true);}}/>}
    <button type="button" className={`kid-narrate-btn${broken||!current?.audioUrl?' off':''}${playing?' on':''}`} aria-label={playing?'Tạm dừng':'Nghe truyện'} title={playing?'Tạm dừng':'Nghe truyện'} aria-pressed={playing} disabled={unavailable} onClick={()=>void toggle()}>{broken||!current?.audioUrl?<VolumeX aria-hidden="true"/>:playing?<Volume2 aria-hidden="true"/>:<Volume1 aria-hidden="true"/>}</button>
  </div>;
}
