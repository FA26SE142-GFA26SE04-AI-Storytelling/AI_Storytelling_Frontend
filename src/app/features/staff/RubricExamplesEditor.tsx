'use client';
import { Plus, Trash2 } from 'lucide-react';
import type * as B from '@/app/types/backendContracts';
import Select from '@/app/components/Select';
import { confirmDialog } from '@/app/lib/confirm';

const LEVEL_OPTIONS = [0, 1, 2, 3, 4].map(n => ({ value: String(n), label: `Mức ${n}` }));
const cardStyle = { display: 'flex', flexDirection: 'column' as const, gap: 10, padding: 14, border: '1px solid var(--line)', borderRadius: 14, background: 'var(--panel)' };

/** Danh sách ví dụ của một tiêu chí: thêm, sửa, xoá (xoá có hỏi xác nhận). Bị khoá theo fieldset cha. */
export default function RubricExamplesEditor({ examples, onChange }: { examples: B.RubricExample[]; onChange: (next: B.RubricExample[]) => void }) {
  const patch = (index: number, p: Partial<B.RubricExample>) => onChange(examples.map((e, i) => i === index ? { ...e, ...p } : e));
  const remove = async (index: number) => {
    if (!(await confirmDialog(`Xoá ví dụ ${index + 1}? Thay đổi chỉ được ghi lại khi bạn bấm Lưu.`))) return;
    onChange(examples.filter((_, i) => i !== index));
  };
  return <div className="field">
    <span>Ví dụ</span>
    {examples.map((ex, index) => <div key={index} style={cardStyle}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <b>Ví dụ {index + 1}</b>
        <button type="button" className="btn btn-g" aria-label={`Xoá ví dụ ${index + 1}`} title="Xoá ví dụ" onClick={() => void remove(index)}><Trash2 className="ic" /></button>
      </div>
      <label className="field">Nội dung ví dụ<textarea className="inp" maxLength={2000} value={ex.text} onChange={e => patch(index, { text: e.target.value })} /></label>
      <div className="field"><span>Mức</span><Select<string> ariaLabel={`Mức của ví dụ ${index + 1}`} value={String(ex.level)} options={LEVEL_OPTIONS} onChange={v => patch(index, { level: Number(v) })} /></div>
      <label className="field">Lý do<textarea className="inp" maxLength={2000} value={ex.reason} onChange={e => patch(index, { reason: e.target.value })} /></label>
    </div>)}
    <button type="button" className="btn btn-s" onClick={() => onChange([...examples, { text: '', level: 0, reason: '' }])}><Plus className="ic" />Thêm ví dụ</button>
  </div>;
}
