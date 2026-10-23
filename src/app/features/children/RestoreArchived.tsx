'use client';
import { useState } from 'react';
import { profileLifecycleService } from '@/app/services/profileLifecycleService';
export default function RestoreArchived({ onRestored }: { onRestored:(id:number)=>void }) {
  const [id,setId]=useState('');const [busy,setBusy]=useState(false);const [note,setNote]=useState('');
  const restore=async()=>{if(busy||!Number.isInteger(Number(id))||Number(id)<1)return;setBusy(true);const r=await profileLifecycleService.restore(Number(id));setBusy(false);setNote(r.message);if(r.success&&r.data)onRestored(r.data.id);};
  return <details><summary>Khôi phục hồ sơ đã lưu trữ</summary><p className="sub">Nhập mã hồ sơ của con đã lưu trữ. Chỉ chủ hồ sơ có quyền khôi phục.</p><label className="field">Mã hồ sơ<input className="inp" type="number" min={1} step={1} value={id} onChange={e=>setId(e.target.value)}/></label><button className="btn btn-s" disabled={busy||Number(id)<1} onClick={()=>void restore()}>Khôi phục hồ sơ</button>{note&&<p className="notice" role="status">{note}</p>}</details>;
}
