'use client';
import { useEffect,useState } from 'react';
import { storyManagementService as service } from '@/app/services/storyManagementService';
import { storyService } from '@/app/services/storyService';
import { useAuth } from '@/app/context/AuthContext';
import type { CreateStoryRequestDto,StoryDto } from '@/app/types/backendContracts';
const blank=():CreateStoryRequestDto=>({title:'',content:'',description:null,coverImageUrl:null,genre:null,moralLesson:null,ageBand:'6-8',language:'vi',isAiGenerated:false});
export default function PersonalStoryEditor({onClose,onChanged}:{onClose:()=>void;onChanged:()=>void}){
 const {user}=useAuth();const [form,setForm]=useState(blank);const [saved,setSaved]=useState<StoryDto|null>(null);const [lookup,setLookup]=useState('');const [busy,setBusy]=useState(false);const [uncertain,setUncertain]=useState(false);const [note,setNote]=useState('');
 useEffect(()=>{setNote('');},[]);
 const read=async()=>{if(busy||Number(lookup)<1)return;setBusy(true);const r=await storyService.getStoryById(Number(lookup));setBusy(false);if(r.success&&r.data){const d=r.data;setSaved(d as StoryDto);setForm({title:d.title,content:d.content??'',description:d.description??null,coverImageUrl:d.coverImageUrl??null,genre:d.genre??null,moralLesson:d.moralLesson??null,ageBand:d.ageBand,language:d.language??'vi',isAiGenerated:false});setUncertain(false);}else setNote(r.message);};
 const owned=!saved||saved.authorUserId===user?.id&&saved.source==='Manual';
 const write=async(action:'save'|'publish'|'remove')=>{
  if(busy||uncertain||!owned)return;
  if(action!=='save'&&!window.confirm(action==='remove'?'Xóa truyện riêng này?':'Yêu cầu phát hành công khai truyện này? Backend sẽ kiểm tra điều kiện.'))return;
  setBusy(true);setNote('');
  const r=action==='save'?(saved?await service.update(saved.id,form):await service.create(form)):action==='publish'?await service.publish(saved!.id):await service.remove(saved!.id);
  setBusy(false);setNote(r.message);
  if(!r.success){if(r.status===0||(r.status??0)>=500)setUncertain(true);return;}
  if(action==='save'&&r.data&&typeof r.data==='object'){setSaved(r.data);setLookup(String(r.data.id));}
  if(action==='publish'&&saved){const latest=await storyService.getStoryById(saved.id);if(latest.success&&latest.data)setSaved(latest.data as StoryDto);else setNote(latest.message);}
  if(action==='remove'){setSaved(null);setForm(blank());setLookup('');}
  onChanged();
 };
 return <div className="dlg-backdrop" role="dialog" aria-modal="true" aria-label="Quản lý truyện riêng"><div className="dlg wide" style={{maxHeight:'90vh',overflowY:'auto'}}><div className="row"><h3 className="grow">Quản lý truyện riêng</h3><button className="btn btn-g" disabled={busy} onClick={onClose}>Đóng</button></div><p className="sub">Truyện riêng không tự được giao vào hồ sơ hay lộ trình của trẻ. Dùng mục Tự soạn truyện gia đình khi muốn giao một phiên bản cho bé.</p>
  <div className="row"><input className="inp" aria-label="Mã truyện riêng" type="number" min={1} value={lookup} onChange={e=>setLookup(e.target.value)}/><button className="btn btn-s" disabled={busy||Number(lookup)<1} onClick={()=>void read()}>Mở theo mã</button><button className="btn btn-s" disabled={busy||uncertain} onClick={()=>{setSaved(null);setForm(blank());}}>Soạn truyện mới</button></div>
  {note&&<p className="notice" role="status">{note}</p>}{uncertain&&<p className="notice warn">Chưa rõ kết quả lệnh. Mở lại đúng mã truyện để đối chiếu; không tạo lại lệnh mới. Nếu tạo mới chưa nhận mã, cần kiểm tra với hỗ trợ.</p>}{saved&&<p>Truyện #{saved.id} · {saved.status} · {saved.isPublished?'Đang công khai':'Riêng tư'}</p>}
  <fieldset disabled={busy||!owned||uncertain} style={{border:0,padding:0}}><label className="field">Tên truyện<input className="inp" maxLength={200} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label className="field">Nội dung<textarea className="inp" rows={8} value={form.content??''} onChange={e=>setForm({...form,content:e.target.value})}/></label><label className="field">Mô tả<textarea className="inp" value={form.description??''} onChange={e=>setForm({...form,description:e.target.value})}/></label><label className="field">Độ tuổi<select className="inp" value={form.ageBand} onChange={e=>setForm({...form,ageBand:e.target.value})}><option>6-8</option><option>9-10</option></select></label><button className="btn btn-p" disabled={!form.title.trim()} onClick={()=>void write('save')}>Lưu truyện riêng</button>{saved&&<div className="row"><button className="btn btn-s" disabled={saved.isPublished||saved.status!=='Ready'} onClick={()=>void write('publish')}>Yêu cầu phát hành</button><button className="btn btn-no" onClick={()=>void write('remove')}>Xóa truyện riêng</button></div>}</fieldset>
 </div></div>;
}
