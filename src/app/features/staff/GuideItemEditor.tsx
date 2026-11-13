'use client';
import { useState } from 'react';
import type { AuthoringGuide, GuidePlaceholder } from '@/app/types/backendContracts';
import type { UpsertGuideItemRequest } from '@/app/types/authoringGuideManagement';
export const GUIDE_GROUPS = { starting_point:'Bắt đầu', opening:'Mở đầu', events:'Diễn biến', emotion:'Cảm xúc', dialogue:'Hội thoại', transition:'Chuyển đoạn', ending:'Kết thúc' };
export const GUIDE_PURPOSES = { free:'Viết tự do', family_memory:'Kỷ niệm gia đình', understanding:'Giúp con hiểu', message:'Lời nhắn' };
export const PLACEHOLDER_LABEL_MAX = 100;
export const PLACEHOLDER_HINT_MAX = 200;

export function extractTemplateKeys(templateText: string | null): string[] {
  if (!templateText) return [];
  const matches = templateText.matchAll(/\{\{([a-z_]+)\}\}/g);
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const m of matches) {
    const key = m[1];
    if (!seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  }
  return keys;
}

export function mergePlaceholders(prev: GuidePlaceholder[], templateText: string | null): GuidePlaceholder[] {
  const keys = extractTemplateKeys(templateText);
  const prevMap = new Map((prev ?? []).map(p => [p.key, p]));
  return keys.map(key => prevMap.get(key) ?? { key, label: null, hint: null });
}

export function validatePlaceholders(list: GuidePlaceholder[]): string | null {
  for (const p of list) {
    const trimmedLabel = p.label?.trim() ?? '';
    if (!trimmedLabel) {
      return `Nhập nhãn cho biến {{${p.key}}}.`;
    }
    if (trimmedLabel.length > PLACEHOLDER_LABEL_MAX) {
      return `Nhãn của biến {{${p.key}}} tối đa ${PLACEHOLDER_LABEL_MAX} ký tự.`;
    }
    const trimmedHint = p.hint?.trim();
    if (trimmedHint && trimmedHint.length > PLACEHOLDER_HINT_MAX) {
      return `Gợi ý của biến {{${p.key}}} tối đa ${PLACEHOLDER_HINT_MAX} ký tự.`;
    }
  }
  return null;
}

export function toPlaceholderPayload(list: GuidePlaceholder[]): GuidePlaceholder[] {
  return list.map(p => ({
    key: p.key,
    label: (p.label ?? '').trim(),
    hint: p.hint?.trim() || null,
  }));
}

const blank: AuthoringGuide = { id:'', audienceRole:'Parent', purposes:['free'], supportGroup:'starting_point', itemType:'question', title:'', instruction:'', example:null, templateText:null, placeholderDefinitions:[], order:0 };
export default function GuideItemEditor({ item, disabled, onSave, onDirty }: {
  item?: AuthoringGuide; disabled:boolean; onSave:(id:string, value:Omit<UpsertGuideItemRequest,'revisionToken'>)=>void; onDirty:()=>void;
}) {
  const [form, setForm] = useState(item ?? blank);
  const set = (value: Partial<AuthoringGuide>) => {
    onDirty();
    setForm(f => {
      const next = { ...f, ...value };
      if ('templateText' in value || 'itemType' in value) {
        next.placeholderDefinitions = next.itemType === 'template'
          ? mergePlaceholders(f.placeholderDefinitions, next.templateText)
          : [];
      }
      return next;
    });
  };
  const changed = JSON.stringify(form) !== JSON.stringify(item ?? blank);
  const placeholderError = validatePlaceholders(form.placeholderDefinitions);
  const valid = /^[A-Za-z0-9_-]{1,100}$/.test(form.id) && form.title.trim() && form.instruction.trim() && form.purposes.length && (form.itemType !== 'template' || form.templateText?.trim()) && (form.itemType !== 'template' || placeholderError === null);
  const save = () => {
    const { id, audienceRole: _audience, ...value } = form;
    void _audience;
    onSave(id, {
      ...value,
      templateText: form.itemType === 'template' ? form.templateText : null,
      placeholderDefinitions: form.itemType === 'template' ? toPlaceholderPayload(form.placeholderDefinitions) : [],
    });
  };
  return <fieldset className="st-guide-form" disabled={disabled}>
    <label className="field">Mã hướng dẫn<input className="inp" value={form.id} disabled={!!item} maxLength={100} onChange={e => set({id:e.target.value})}/></label>
    <label className="field">Tiêu đề<input className="inp" value={form.title} onChange={e => set({title:e.target.value})}/></label>
    <label className="field">Lời hướng dẫn<textarea className="inp" rows={3} value={form.instruction} onChange={e => set({instruction:e.target.value})}/></label>
    <div className="row" style={{flexWrap:'wrap'}}>{Object.entries(GUIDE_PURPOSES).map(([id,label]) => <label key={id}><input type="checkbox" checked={form.purposes.includes(id)} onChange={e => set({purposes:e.target.checked ? [...form.purposes,id] : form.purposes.filter(p => p !== id)})}/>{label}</label>)}</div>
    <div className="st-form"><label className="field">Nhóm<select className="inp" value={form.supportGroup} onChange={e => set({supportGroup:e.target.value})}>{Object.entries(GUIDE_GROUPS).map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label className="field">Loại<select className="inp" value={form.itemType} onChange={e => set({itemType:e.target.value})}><option value="question">Câu hỏi gợi ý</option><option value="template">Mẫu điền</option></select></label>
      <label className="field">Thứ tự<input className="inp" type="number" value={form.order} onChange={e => set({order:Number(e.target.value)})}/></label></div>
    <label className="field">Ví dụ<textarea className="inp" value={form.example ?? ''} onChange={e => set({example:e.target.value || null})}/></label>
    {form.itemType === 'template' && (
      <>
        <label className="field">Mẫu điền (chỗ trống dạng {'{{ten_bien}}'})<textarea className="inp" rows={4} value={form.templateText ?? ''} onChange={e => set({templateText:e.target.value})}/></label>
        {form.placeholderDefinitions.length === 0 ? (
          <p className="sub">Chưa có biến nào. Dùng dạng {'{{ten_bien}}'} trong mẫu để thêm biến.</p>
        ) : (
          <div className="st-vars">
            {form.placeholderDefinitions.map(p => (
              <div key={p.key} className="st-var">
                <span className="st-var-key">{`{{${p.key}}}`}</span>
                <label className="field">Nhãn (bắt buộc)<input className="inp" value={p.label ?? ''} onChange={e => set({ placeholderDefinitions: form.placeholderDefinitions.map(x => x.key === p.key ? { ...x, label: e.target.value } : x) })} /></label>
                <label className="field">Gợi ý (tuỳ chọn)<input className="inp" value={p.hint ?? ''} onChange={e => set({ placeholderDefinitions: form.placeholderDefinitions.map(x => x.key === p.key ? { ...x, hint: e.target.value } : x) })} /></label>
              </div>
            ))}
          </div>
        )}
        {placeholderError && <p className="notice err">{placeholderError}</p>}
      </>
    )}
    {changed && <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn btn-p" disabled={!valid} onClick={save}>Lưu</button></div>}
  </fieldset>;
}
