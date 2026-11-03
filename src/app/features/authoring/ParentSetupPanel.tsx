'use client';
import { useState } from 'react';
import type { ParentDraftDto, ParentSetupRequest } from '@/app/types/backendContracts';

/** Mục đích viết: backend chỉ nhận đúng bốn giá trị này (WRITING_PURPOSE_INVALID với giá trị khác). */
const PURPOSES: { id: string; label: string }[] = [
  { id: 'free', label: 'Tự do' },
  { id: 'family_memory', label: 'Kỷ niệm gia đình' },
  { id: 'understanding', label: 'Giúp bé hiểu một điều' },
  { id: 'message', label: 'Gửi một lời nhắn' },
];
const LANGUAGE: Record<string, string> = { vi: 'Tiếng Việt', en: 'Tiếng Anh' };

/** Mục đích và cách đọc của bản nháp (PATCH /parent/stories/{id}/setup). Ngôn ngữ luôn theo hồ sơ bé nên chỉ hiển thị, không sửa. */
export default function ParentSetupPanel({ draft, disabled, onSave }: { draft: ParentDraftDto; disabled: boolean; onSave: (value: Pick<ParentSetupRequest, 'purpose' | 'language' | 'experienceMode'>) => void }) {
  const [purpose, setPurpose] = useState(draft.purpose);
  const [mode, setMode] = useState(draft.story.experienceMode);
  const language = draft.story.language;
  const unchanged = purpose === draft.purpose && mode === draft.story.experienceMode;
  return (
    <fieldset className="pa-fieldset pa-setup" disabled={disabled}>
      <b className="pa-setup-title">Mục đích và cách đọc</b>
      <div className="pa-fields">
        <label className="field">Mục đích
          <select className="inp" value={purpose} onChange={e => setPurpose(e.target.value)}>
            {!PURPOSES.some(p => p.id === purpose) && <option value={purpose}>{purpose}</option>}
            {PURPOSES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <label className="field">Cách đọc
          <select className="inp" value={mode} onChange={e => setMode(e.target.value)}>
            <option value="reading">Đọc</option>
            <option value="listening">Nghe</option>
            <option value="combined">Đọc và nghe</option>
          </select>
        </label>
        <div className="field">Ngôn ngữ<span className="pa-readonly">{LANGUAGE[language] ?? language} · theo hồ sơ của bé</span></div>
      </div>
      <div className="pa-actions"><button className="btn btn-s" disabled={unchanged} onClick={() => onSave({ purpose, language, experienceMode: mode })}>Lưu cách đọc</button></div>
    </fieldset>
  );
}
