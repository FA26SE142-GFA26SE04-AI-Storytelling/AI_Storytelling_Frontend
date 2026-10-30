'use client';
import { confirmDialog } from "@/app/lib/confirm";
import { useState } from 'react';
import { contentCategoryService } from '@/app/services/contentCategoryService';
import type { ContentCategory } from '@/app/types/childProfile';
export default function CategoryDetails({id,onChanged}:{id:number;onChanged:()=>void}){
 const [detail,setDetail]=useState<ContentCategory|null>(null);const [note,setNote]=useState('');const [busy,setBusy]=useState(false);
 const read=async()=>{setBusy(true);const r=await contentCategoryService.get(id);setBusy(false);setDetail(r.data);if(!r.success)setNote(r.message);};
 const remove=async()=>{if(busy||!await confirmDialog(`Xóa danh mục #${id}? Backend có thể từ chối nếu danh mục đang được dùng.`))return;setBusy(true);const r=await contentCategoryService.remove(id);setBusy(false);setNote(r.message);if(r.success)onChanged();};
 return <details><summary>Chi tiết danh mục</summary><button className="btn btn-s" disabled={busy} onClick={()=>void read()}>Tải chi tiết</button>{detail&&<p>{detail.code} · {detail.displayName} · {detail.isActive?'Đang dùng':'Đã ẩn'}</p>}<button className="btn btn-no" disabled={busy} onClick={()=>void remove()}>Xóa danh mục</button>{note&&<p className="notice" role="status">{note}</p>}</details>;
}
