'use client';
import { useState } from 'react';
import { aiStoryCreationService as api } from '@/app/services/aiStoryCreationService';
import type { OutlineVersionDto } from '@/app/types/aiStory';
export default function OutlineHistory({storyId}:{storyId:number}){
 const [versions,setVersions]=useState<OutlineVersionDto[]>([]);const [selected,setSelected]=useState<OutlineVersionDto|null>(null);const [busy,setBusy]=useState(false);const [note,setNote]=useState('');
 const list=async()=>{if(busy)return;setBusy(true);const r=await api.getOutlineVersions(storyId);setBusy(false);setVersions(r.data??[]);if(!r.success)setNote(r.message);};
 const read=async(versionNo:number)=>{if(busy)return;setBusy(true);const r=await api.getOutlineVersion(storyId,versionNo);setBusy(false);setSelected(r.data);if(!r.success)setNote(r.message);};
 return <details><summary>Lịch sử dàn ý</summary><button className="btn btn-s" disabled={busy} onClick={()=>void list()}>Tải lịch sử dàn ý</button>{versions.map(v=><button className="btn btn-g" key={v.versionNo} disabled={busy} onClick={()=>void read(v.versionNo)}>V{v.versionNo} · {v.title}</button>)}{selected&&<article><h4>{selected.title} · V{selected.versionNo}</h4><p>{selected.opening}</p><p>{selected.development}</p><p>{selected.ending}</p><p className="sub">Bản lịch sử chỉ để xem.</p></article>}{note&&<p className="notice" role="status">{note}</p>}</details>;
}
