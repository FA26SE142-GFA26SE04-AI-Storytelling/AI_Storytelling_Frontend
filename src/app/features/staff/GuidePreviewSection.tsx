'use client';
import Select from '@/app/components/Select';
import type { GuideDraftPreview } from '@/app/types/authoringGuideManagement';
import type { AuthoringGuide } from '@/app/types/backendContracts';
import { GUIDE_GROUPS, GUIDE_PURPOSES } from './GuideItemEditor';

const PURPOSE_OPTIONS = [{ value: '', label: 'Mọi mục đích' }, ...Object.entries(GUIDE_PURPOSES).map(([value, label]) => ({ value, label }))];
const GROUP_OPTIONS = [{ value: '', label: 'Mọi nhóm' }, ...Object.entries(GUIDE_GROUPS).map(([value, label]) => ({ value, label }))];

/** Khối Xem thử bản nháp hướng dẫn sáng tác (tài liệu 10): tách riêng, giữ biến nhập khi lỗi và không tự phát hành. */
export default function GuidePreviewSection({
  purpose,
  group,
  previewPage,
  selectedGuide,
  values,
  preview,
  previewValid,
  dirty,
  disabled,
  onPurposeChange,
  onGroupChange,
  onPreviewPageChange,
  onValueChange,
  onRunPreview,
  onPublish,
}: {
  purpose: string;
  group: string;
  previewPage: number;
  selectedGuide?: AuthoringGuide;
  values: Record<string, string>;
  preview: GuideDraftPreview | null;
  previewValid: boolean;
  dirty: boolean;
  disabled: boolean;
  onPurposeChange: (value: string) => void;
  onGroupChange: (value: string) => void;
  onPreviewPageChange: (page: number) => void;
  onValueChange: (key: string, value: string) => void;
  onRunPreview: (render?: boolean) => void;
  onPublish: () => void;
}) {
  return (
    <section className="st-card" aria-label="Xem thử bản nháp">
      <h3>Xem thử bản nháp</h3>
      <p className="sub">
        Xem thử danh sách hoặc điền biến thử cho một mục. Xem thử thành công không tự động phát hành bộ hướng dẫn.
      </p>
      {dirty && (
        <p className="notice warn" role="status" data-inline-notice>
          Bạn có chỉnh sửa đang mở chưa lưu; hãy lưu hoặc đóng form sửa xong trước khi xem thử.
        </p>
      )}
      <fieldset disabled={disabled || dirty} style={{ border: 0, padding: 0 }}>
        <div className="row st-wrap">
          <Select<string> ariaLabel="Lọc mục đích" value={purpose} options={PURPOSE_OPTIONS} onChange={onPurposeChange} />
          <Select<string> ariaLabel="Lọc nhóm" value={group} options={GROUP_OPTIONS} onChange={onGroupChange} />
          <input
            className="inp"
            aria-label="Trang xem trước"
            type="number"
            min={1}
            value={previewPage}
            onChange={e => onPreviewPageChange(Math.max(1, Number(e.target.value) || 1))}
          />
          <button type="button" className="btn btn-s" onClick={() => onRunPreview(false)}>
            Xem danh sách
          </button>
        </div>
        {selectedGuide && (
          <div className="st-group">
            <h4>Điền thử: {selectedGuide.title}</h4>
            {selectedGuide.placeholderDefinitions.length === 0 ? (
              <p className="sub">Hướng dẫn này không có biến placeholder cần điền.</p>
            ) : (
              selectedGuide.placeholderDefinitions.map(p => (
                <label className="field" key={p.key}>
                  <span>{p.label ?? p.key}</span>
                  <input className="inp" placeholder={p.hint ?? undefined} value={values[p.key] ?? ''} onChange={e => onValueChange(p.key, e.target.value)} />
                </label>
              ))
            )}
            <div>
              <button type="button" className="btn btn-s" onClick={() => onRunPreview(true)} title="Xem trước hướng dẫn đã điền">
                Xem trước mục này
              </button>
            </div>
          </div>
        )}
      </fieldset>

      {previewValid && preview && (
        <div className="st-group">
          {preview.page?.items.map(g => (
            <article key={g.id} className="st-quote">
              <h4>{g.title}</h4>
              <p style={{ whiteSpace: 'pre-wrap' }}>{g.instruction}</p>
              {g.example && <p className="sub" style={{ whiteSpace: 'pre-wrap' }}>{g.example}</p>}
            </article>
          ))}
          {preview.render && (
            <div className="st-quote">
              <small>Kết quả dựng xem thử</small>
              <p style={{ whiteSpace: 'pre-wrap' }}>{preview.render.text}</p>
            </div>
          )}
        </div>
      )}

      <div>
        <button type="button" className="btn btn-ok" disabled={disabled || dirty || !previewValid} onClick={onPublish}>
          Phát hành bộ nháp
        </button>
      </div>
    </section>
  );
}
