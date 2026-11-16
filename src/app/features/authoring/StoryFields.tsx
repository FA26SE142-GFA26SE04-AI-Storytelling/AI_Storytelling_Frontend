'use client';
import type { AssistanceSelection } from '@/app/features/story-workflow/assistanceSelection';

export type StoryFormValue = { title: string; content: string; sourceDeclaration: string; rightsDeclaration: string };

/** Bốn ô soạn truyện dùng chung cho Creator và phụ huynh để hai giao diện luôn giống nhau; chỉ lời cam kết quyền khác nhau theo vai trò. */
export default function StoryFields({ form, onChange, onSelect, rightsLabel = 'Cam kết bản quyền', rightsPlaceholder = 'VD: Tôi có quyền phát hành nội dung này' }: {
  form: StoryFormValue;
  onChange: (patch: Partial<StoryFormValue>) => void;
  onSelect: (selection: AssistanceSelection) => void;
  rightsLabel?: string;
  rightsPlaceholder?: string;
}) {
  const trimmed = form.content.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const paraCount = trimmed ? trimmed.split(/\n\s*\n/).filter(p => p.trim().length > 0).length : 0;

  return <>
    <label className="field"><span className="lbl">Tên truyện</span>
      <input className="inp pa-title-inp" maxLength={200} placeholder="Nhập tên câu chuyện…" value={form.title} onChange={e => onChange({ title: e.target.value })} /></label>
    <div className="pa-manuscript-box">
      <label className="field"><span className="lbl">Nội dung (mỗi đoạn cách nhau một dòng trống)</span>
        <textarea className="inp pa-story-textarea" rows={13} maxLength={200_000}
          placeholder="Viết từng đoạn câu chuyện tại đây. Mỗi đoạn cách nhau một dòng trống để tách cảnh rõ ràng…"
          value={form.content}
          onSelect={e => onSelect({ snapshot: { title: form.title, content: e.currentTarget.value }, start: e.currentTarget.selectionStart, length: e.currentTarget.selectionEnd - e.currentTarget.selectionStart })}
          onChange={e => onChange({ content: e.target.value })} /></label>
      <div className="pa-editor-foot" aria-hidden="true">
        <span><b>{wordCount}</b> từ · <b>{paraCount}</b> đoạn</span>
        <span>Bôi đen một đoạn trong bài nếu muốn AI gợi ý sửa đoạn đó</span>
      </div>
    </div>
    <div className="pa-fields">
      <label className="field"><span className="lbl">Nguồn nội dung</span>
        <input className="inp" maxLength={2000} value={form.sourceDeclaration} placeholder="VD: Tự sáng tác" onChange={e => onChange({ sourceDeclaration: e.target.value })} /></label>
      <label className="field"><span className="lbl">{rightsLabel}</span>
        <input className="inp" maxLength={2000} value={form.rightsDeclaration} placeholder={rightsPlaceholder} onChange={e => onChange({ rightsDeclaration: e.target.value })} /></label>
    </div>
  </>;
}
