'use client';
import { useState } from 'react';
import { aiStoryCreationService as api } from '@/app/services/aiStoryCreationService';
import type { StoryMediaPackage } from '@/app/types/aiStory';
export default function MediaAssets({storyId,versionId,onChanged}:{storyId:number;versionId?:number|null;onChanged:()=>void}){
 const [pack,setPack]=useState<StoryMediaPackage|null>(null);const [busy,setBusy]=useState(false);const [note,setNote]=useState('');
 const load=async()=>{if(busy)return;setBusy(true);const r=await api.getMediaPackage(storyId);setBusy(false);if(r.success&&r.data&&(!versionId||r.data.storyVersionId===versionId))setPack(r.data);else setNote(r.message||'Gói media không còn khớp phiên bản.');};
 const regenerate=async(beatId:number)=>{if(busy||!window.confirm('Yêu cầu tạo lại tranh này? Hệ thống sẽ kiểm tra lại độ an toàn.'))return;setBusy(true);const r=await api.regenerateIllustration(storyId,beatId);setBusy(false);setNote(r.message);if(r.success){setPack(null);onChanged();}};
 return <details><summary>Ảnh và âm thanh thực tế</summary><button className="btn btn-s" disabled={busy} onClick={()=>void load()}>Tải gói media mới nhất</button>{note&&<p className="notice" role="status">{note}</p>}{pack?.scenes.map(s=><article key={s.sceneId}><h4>Cảnh {s.sceneIndex+1}</h4><p>{s.text}</p>{s.illustrations.map(i=><div key={i.beatId}>
   {/* Signed storage URLs are returned by the API. */}
   {/* eslint-disable-next-line @next/next/no-img-element */}
   {i.url&&i.status==='Ready'&&<img src={i.url} alt={i.visualFocus} style={{maxWidth:'100%',maxHeight:320}}/>}
   <p>{i.visualFocus} · {i.status}</p><button className="btn btn-s" disabled={busy} onClick={()=>void regenerate(i.beatId)}>Tạo lại tranh này</button></div>)}{s.audio?.map(a=><div key={a.segmentId}><p>{a.text}</p>{a.url&&a.status==='Ready'&&<audio controls preload="none" src={a.url} aria-label={`Nghe đoạn ${a.segmentOrder+1}`}/>}</div>)}</article>)}</details>;
}
