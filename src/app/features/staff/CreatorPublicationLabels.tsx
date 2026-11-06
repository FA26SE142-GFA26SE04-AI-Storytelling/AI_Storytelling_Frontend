'use client';
import { useState } from 'react';
import Dialog from '@/app/components/Dialog';
import type { ContentCategory } from '@/app/types/childProfile';

type Props = { categories: ContentCategory[]; selectedIds: number[]; loading: boolean; error: string; disabled: boolean;
  onChange: (ids: number[]) => void; onReload: () => void };

export default function CreatorPublicationLabels({ categories, selectedIds, loading, error, disabled, onChange, onReload }: Props) {
  const [open, setOpen] = useState(false);
  const selected = categories.filter(c => selectedIds.includes(c.id));
  return <div className="pa-step">
    <b>Nhãn nội dung <span className="hint">(bắt buộc)</span></b>
    <p className="sub">Chọn ít nhất một nhãn mô tả đúng truyện. Các nhãn được gửi cùng yêu cầu để Moderator xem xét.</p>
    {selected.length > 0 && <div className="row" style={{ flexWrap: 'wrap' }}>{selected.map(c => <span className="pill draft" key={c.id}>{c.displayName}</span>)}</div>}
    {loading ? <p className="sub" role="status">Đang tải nhãn nội dung…</p> : error ?
      <div className="notice err" data-inline-notice role="alert">{error} <button type="button" className="btn btn-s" onClick={onReload}>Tải lại nhãn</button></div> : categories.length === 0 ?
      <div className="notice warn" data-inline-notice role="status">Chưa có nhãn đang hoạt động. Hãy liên hệ quản trị viên hoặc tải lại danh mục. <button type="button" className="btn btn-s" onClick={onReload}>Tải lại nhãn</button></div> :
      <button type="button" className="btn btn-s" disabled={disabled} onClick={() => setOpen(true)}>{selected.length ? 'Thay đổi nhãn' : 'Chọn nhãn nội dung'}</button>}
    {!loading && !error && selected.length === 0 && categories.length > 0 && <p className="hint">Cần chọn nhãn trước khi gửi Moderator.</p>}
    {open && <Dialog title="Chọn nhãn nội dung" onClose={() => setOpen(false)}>
      <p className="sub">Có thể chọn nhiều nhãn phù hợp. Nhãn chưa được gửi cho tới khi bạn nộp duyệt truyện.</p>
      <fieldset disabled={disabled || loading || !!error}><legend>Danh mục đang hoạt động</legend>
        {categories.map(c => <label className="row" key={c.id}><input type="checkbox" checked={selectedIds.includes(c.id)}
          onChange={e => onChange(e.target.checked ? [...selectedIds, c.id] : selectedIds.filter(id => id !== c.id))}/>{c.displayName}</label>)}
      </fieldset>
      <div className="pa-actions"><button type="button" className="btn btn-p" onClick={() => setOpen(false)}>Xong</button></div>
    </Dialog>}
  </div>;
}
