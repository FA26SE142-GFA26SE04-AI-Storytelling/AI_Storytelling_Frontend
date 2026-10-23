'use client';
import { useState } from 'react';
import type { AuthoringGuide } from '@/app/types/backendContracts';
import type { UpsertGuideItemRequest } from '@/app/types/authoringGuideManagement';
export const GUIDE_GROUPS = { starting_point:'Bắt đầu', opening:'Mở đầu', events:'Diễn biến', emotion:'Cảm xúc', dialogue:'Hội thoại', transition:'Chuyển đoạn', ending:'Kết thúc' };
export const GUIDE_PURPOSES = { free:'Viết tự do', family_memory:'Kỷ niệm gia đình', understanding:'Giúp con hiểu', message:'Lời nhắn' };
const blank: AuthoringGuide = { id:'', audienceRole:'Parent', purposes:['free'], supportGroup:'starting_point', itemType:'question', title:'', instruction:'', example:null, templateText:null, placeholderDefinitions:[], order:0 };
export default function GuideItemEditor({ item, disabled, onSave, onDirty }: {
  item?: AuthoringGuide; disabled:boolean; onSave:(id:string, value:Omit<UpsertGuideItemRequest,'revisionToken'>)=>void; onDirty:()=>void;
}) {
  const [form, setForm] = useState(item ?? blank);
  const set = (value:Partial<AuthoringGuide>) => { onDirty(); setForm(f => ({...f,...value})); };
  const valid = /^[A-Za-z0-9_-]{1,100}$/.test(form.id) && form.title.trim() && form.instruction.trim() && form.purposes.length && (form.itemType !== 'template' || form.templateText?.trim());
  const save = () => {
    const { id, audienceRole: _audience, ...value } = form;
    void _audience;
    onSave(id, {...value, templateText:form.itemType === 'template' ? form.templateText : null,
      placeholderDefinitions:form.itemType === 'template' ? [...new Set([...(form.templateText ?? '').matchAll(/\{\{([a-z_]+)\}\}/g)].map(m => m[1]))] : [] });
  };
  return <fieldset className="st-card" disabled={disabled} style={{border:'1px solid var(--line)'}}><legend>{item ? 'Sửa hướng dẫn' : 'Thêm hướng dẫn'}</legend>
    <label className="field">Mã hướng dẫn<input className="inp" value={form.id} disabled={!!item} maxLength={100} onChange={e => set({id:e.target.value})}/></label>
    <label className="field">Tiêu đề<input className="inp" value={form.title} onChange={e => set({title:e.target.value})}/></label>
    <label className="field">Lời hướng dẫn<textarea className="inp" rows={3} value={form.instruction} onChange={e => set({instruction:e.target.value})}/></label>
    <div className="row" style={{flexWrap:'wrap'}}>{Object.entries(GUIDE_PURPOSES).map(([id,label]) => <label key={id}><input type="checkbox" checked={form.purposes.includes(id)} onChange={e => set({purposes:e.target.checked ? [...form.purposes,id] : form.purposes.filter(p => p !== id)})}/>{label}</label>)}</div>
    <div className="st-form"><label className="field">Nhóm<select className="inp" value={form.supportGroup} onChange={e => set({supportGroup:e.target.value})}>{Object.entries(GUIDE_GROUPS).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label className="field">Loại<select className="inp" value={form.itemType} onChange={e => set({itemType:e.target.value})}><option value="question">Câu hỏi gợi ý</option><option value="template">Mẫu điền</option></select></label>
      <label className="field">Thứ tự<input className="inp" type="number" value={form.order} onChange={e => set({order:Number(e.target.value)})}/></label></div>
    <label className="field">Ví dụ<textarea className="inp" value={form.example ?? ''} onChange={e => set({example:e.target.value || null})}/></label>
    {form.itemType === 'template' && <label className="field">Mẫu điền (chỗ trống dạng {'{{ten_bien}}'})<textarea className="inp" rows={4} value={form.templateText ?? ''} onChange={e => set({templateText:e.target.value})}/></label>}
    <button className="btn btn-p" disabled={!valid} onClick={save}>Lưu hướng dẫn vào bản nháp</button>
  </fieldset>;
}
