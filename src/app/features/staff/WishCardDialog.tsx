'use client';
import { useEffect, useState } from 'react';
import { Pencil, Plus, RefreshCw, Save, X } from 'lucide-react';
import Dialog from '@/app/components/Dialog';
import SafeImage from '@/app/components/SafeImage';
import type { ContentCategory } from '@/app/types/childProfile';
import type { ManagedWishCardGroup, WishCardDto } from '@/app/types/storyWish';

export type WishCardForm = {
  group: ManagedWishCardGroup;
  label: string;
  imageUrl: string;
  audioUrl: string;
  ageBand: string;
  contentCategoryId: string;
  sortOrder: string;
};

export const EMPTY_WISH_FORM: WishCardForm = {
  group: 'Character',
  label: '',
  imageUrl: '',
  audioUrl: '',
  ageBand: '',
  contentCategoryId: '',
  sortOrder: '0',
};

const AGE_OPTIONS = [
  ['', 'Mọi nhóm tuổi'],
  ['6-8', '6–8 tuổi'],
  ['9-10', '9–10 tuổi'],
] as const;

export const WISH_LABEL_MAX = 100;
export const WISH_URL_MAX = 500;
export const isWishMediaUrl = (v: string) => /^https?:\/\/\S+$/i.test(v) && v.length <= WISH_URL_MAX;

export function wishCardValidationProblem(form: WishCardForm): string | null {
  const label = form.label.trim();
  const image = form.imageUrl.trim();
  const audio = form.audioUrl.trim();
  if (!label) return 'Nhập nhãn thẻ.';
  if (label.length > WISH_LABEL_MAX) return `Nhãn tối đa ${WISH_LABEL_MAX} ký tự.`;
  if (!isWishMediaUrl(image)) return 'Đường dẫn hình phải bắt đầu bằng http:// hoặc https://.';
  if (audio && !isWishMediaUrl(audio)) return 'Đường dẫn âm thanh phải bắt đầu bằng http:// hoặc https://.';
  if (!/^-?\d+$/.test(form.sortOrder.trim())) return 'Thứ tự phải là số nguyên.';
  return null;
}

/** Popup Xem / Tạo / Sửa thẻ ước dùng Portal Dialog chuẩn, giữ focus, chặn đóng khi đang lưu và kiểm tra media lỗi. */
export default function WishCardDialog({
  mode,
  editing,
  form,
  categories,
  groups,
  busy,
  saveError,
  onFormChange,
  onSwitchToEdit,
  onReloadCard,
  onSave,
  onClose,
}: {
  mode: 'view' | 'edit' | 'create';
  editing: WishCardDto | null;
  form: WishCardForm;
  categories: ContentCategory[];
  groups: { id: ManagedWishCardGroup; label: string }[];
  busy: boolean;
  saveError: string;
  onFormChange: (next: WishCardForm) => void;
  onSwitchToEdit: () => void;
  onReloadCard: () => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [mediaNonce, setMediaNonce] = useState(0);

  useEffect(() => {
    setImgError(false);
  }, [form.imageUrl, editing?.id, mediaNonce]);

  useEffect(() => {
    setAudioError(false);
  }, [form.audioUrl, editing?.id, mediaNonce]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [busy, onClose]);

  const readOnly = mode === 'view';
  const image = form.imageUrl.trim();
  const audio = form.audioUrl.trim();
  const problem = wishCardValidationProblem(form);
  const title = mode === 'create'
    ? 'Thêm thẻ mới'
    : mode === 'view'
      ? `Chi tiết thẻ “${editing?.label ?? form.label}”`
      : `Sửa thẻ “${editing?.label ?? form.label}”`;

  const reloadMedia = () => {
    setImgError(false);
    setAudioError(false);
    setMediaNonce(n => n + 1);
    onReloadCard();
  };

  return (
    <Dialog title={title} wide className="st-dlg" onClose={() => { if (!busy) onClose(); }}>
      {saveError && (
        <div className="notice err" role="alert" data-inline-notice>
          <span>{saveError}</span>
        </div>
      )}

      <fieldset disabled={busy || readOnly} style={{ border: 0, padding: 0, margin: 0 }}>
        <div className="st-form">
          <label className="field">
            Nhóm
            <select
              className="inp"
              value={form.group}
              disabled={readOnly || !!editing}
              onChange={e => onFormChange({ ...form, group: e.target.value as ManagedWishCardGroup })}
            >
              {groups.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </label>
          <label className="field">
            Nhãn
            <input
              className="inp"
              maxLength={WISH_LABEL_MAX}
              autoFocus={mode === 'create' || mode === 'edit'}
              value={form.label}
              onChange={e => onFormChange({ ...form, label: e.target.value })}
              placeholder="Ví dụ: Thỏ con"
            />
          </label>
          <label className="field">
            Đường dẫn hình
            <input
              className="inp"
              maxLength={WISH_URL_MAX}
              value={form.imageUrl}
              onChange={e => onFormChange({ ...form, imageUrl: e.target.value })}
              placeholder="https://…"
            />
          </label>
          <label className="field">
            Đường dẫn âm thanh (không bắt buộc)
            <input
              className="inp"
              maxLength={WISH_URL_MAX}
              value={form.audioUrl}
              onChange={e => onFormChange({ ...form, audioUrl: e.target.value })}
              placeholder="https://…"
            />
          </label>
          <label className="field">
            Nhóm tuổi
            <select className="inp" value={form.ageBand} onChange={e => onFormChange({ ...form, ageBand: e.target.value })}>
              {AGE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          <label className="field">
            Nhãn nội dung
            <select className="inp" value={form.contentCategoryId} onChange={e => onFormChange({ ...form, contentCategoryId: e.target.value })}>
              <option value="">Không gắn</option>
              {categories.filter(c => c.isActive || String(c.id) === form.contentCategoryId).map(c => (
                <option key={c.id} value={c.id}>{c.displayName}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Thứ tự hiển thị
            <input className="inp" inputMode="numeric" value={form.sortOrder} onChange={e => onFormChange({ ...form, sortOrder: e.target.value })} />
          </label>
        </div>
      </fieldset>

      {editing && !readOnly && (
        <small className="sub">Không đổi được nhóm của thẻ đã tạo. Muốn đổi nhóm, hãy tạo thẻ mới rồi ẩn thẻ cũ.</small>
      )}

      {(isWishMediaUrl(image) || isWishMediaUrl(audio)) && (
        <div className="st-group" style={{ paddingBottom: 0 }}>
          <b className="st-group-title">Xem trước hình &amp; nghe thử âm thanh</b>
          <div className="row st-wrap">
            {isWishMediaUrl(image) && (
              <div className="row">
                <SafeImage
                  key={`img-${mediaNonce}-${image}`}
                  src={image}
                  alt={`Xem trước thẻ ${form.label || ''}`}
                  width={88}
                  height={88}
                  style={{ objectFit: 'contain', borderRadius: 12 }}
                  onError={() => setImgError(true)}
                />
                {imgError && <span className="sub" role="alert">Không tải được hình ảnh từ URL này.</span>}
              </div>
            )}
            {isWishMediaUrl(audio) && (
              <div className="row">
                <audio
                  key={`aud-${mediaNonce}-${audio}`}
                  controls
                  preload="none"
                  src={audio}
                  onError={() => setAudioError(true)}
                />
                {audioError && <span className="sub" role="alert">Không phát được âm thanh từ URL này.</span>}
              </div>
            )}
          </div>
          {editing && (imgError || audioError) && (
            <div className="row">
              <button type="button" className="btn btn-s" disabled={busy} onClick={reloadMedia}>
                <RefreshCw className="ic" />Tải lại thông tin thẻ
              </button>
            </div>
          )}
        </div>
      )}

      {!readOnly && problem && (form.label || form.imageUrl) && <small className="sub">{problem}</small>}

      <div className="row st-wrap">
        {editing && (
          <button type="button" className="btn btn-g" disabled={busy} onClick={reloadMedia}>
            <RefreshCw className="ic" />Tải lại chi tiết
          </button>
        )}
        {readOnly ? (
          <button type="button" className="btn btn-p" disabled={busy} onClick={onSwitchToEdit}>
            <Pencil className="ic" />Chỉnh sửa thẻ
          </button>
        ) : (
          <button type="button" className="btn btn-p" disabled={busy || !!problem} onClick={onSave}>
            {editing ? <Save className="ic" /> : <Plus className="ic" />}
            {busy ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Thêm thẻ'}
          </button>
        )}
        <button type="button" className="btn btn-g" disabled={busy} onClick={onClose}>
          <X className="ic" />Đóng
        </button>
      </div>
    </Dialog>
  );
}
