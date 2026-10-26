'use client';
import { useState } from 'react';
import { childProfileService } from '@/app/services/childProfileService';
import { profileLifecycleService } from '@/app/services/profileLifecycleService';
import type { ChildProfile } from '@/app/types/childProfile';
export default function ProfileMaintenance({ child,isOwner,onChanged }: { child:ChildProfile;isOwner:boolean;onChanged:()=>void }) {
 const [busy,setBusy]=useState(false);const [note,setNote]=useState('');const [detail,setDetail]=useState<ChildProfile|null>(null);
 const read=async()=>{setBusy(true);const r=await childProfileService.getChildProfileById(child.id);setBusy(false);setDetail(r.data);setNote(r.message);};
 const remove=async(kind:'learning'|'safety')=>{if(busy||!isOwner||!window.confirm(`Xóa cấu hình ${kind==='learning'?'học tập':'an toàn'} của ${child.nickname}? Hồ sơ phải đáp ứng điều kiện backend trước khi dùng tiếp.`))return;setBusy(true);const r=kind==='learning'?await profileLifecycleService.removeLearning(child.id):await profileLifecycleService.removeSafety(child.id);setBusy(false);setNote(r.message);if(r.success)onChanged();};
 return <details><summary>Kiểm tra và quản lý cấu hình hồ sơ</summary><button className="btn btn-s" disabled={busy} onClick={()=>void read()}>Tải chi tiết từ máy chủ</button>{detail&&<p>{detail.nickname} · {detail.ageBand} · {detail.status}</p>}{isOwner&&<div className="row"><button className="btn btn-no" disabled={busy} onClick={()=>void remove('learning')}>Xóa cấu hình học tập</button><button className="btn btn-no" disabled={busy} onClick={()=>void remove('safety')}>Xóa cấu hình an toàn</button></div>}{note&&<p className="notice" role="status">{note}</p>}</details>;
}
