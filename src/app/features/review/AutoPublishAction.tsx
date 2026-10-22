'use client';
import { useState } from 'react';
import { aiStoryCreationService } from '@/app/services/aiStoryCreationService';
export default function AutoPublishAction({storyId,disabled,onApproved}:{storyId:number;disabled:boolean;onApproved:()=>void}){
 const [busy,setBusy]=useState(false);const [note,setNote]=useState('');
 const check=async()=>{if(busy||disabled||!window.confirm('Áp dụng kiểm tra duyệt tự động theo chính sách hiện tại? Nếu đạt, backend sẽ chuyển sang tạo media.'))return;setBusy(true);const r=await aiStoryCreationService.autoPublishCheck(storyId);setBusy(false);setNote(r.message);if(r.success&&r.data)onApproved();};
 return <div><button className="btn btn-s" disabled={busy||disabled} onClick={()=>void check()}>Kiểm tra duyệt tự động theo chính sách</button>{note&&<p className="notice" role="status">{note}</p>}</div>;
}
