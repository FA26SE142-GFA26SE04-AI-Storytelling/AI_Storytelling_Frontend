'use client';
import { useEffect, useRef, useState } from 'react';
import { Lock, RotateCcw, ShieldCheck, Sparkles, Upload } from 'lucide-react';
import StepDone from '@/app/features/studio/StepDone';
import { creatorPublicationService as service } from '@/app/services/creatorPublicationService';
import { confirmDialog } from '@/app/lib/confirm';
import type { CreatorDraft } from '@/app/types/creator';
import type * as B from '@/app/types/backendContracts';

/** Ba mức kết quả kiểm tra nội dung của backend: Safe, GrayZone, HardBlock. */
const ZONE: Record<string, { tone: 'ok' | 'warn' | 'err'; title: string; advice: string }> = {
  Safe: { tone: 'ok', title: 'An toàn', advice: 'Nội dung qua kiểm tra. Bạn có thể chốt nội dung.' },
  GrayZone: { tone: 'warn', title: 'Vùng xám', advice: 'Có chỗ có thể gây tranh cãi với nhóm tuổi này. Truyện được chuyển cho Moderator xem trước; hãy chờ quyết định hoặc sửa nội dung rồi kiểm tra lại.' },
  HardBlock: { tone: 'err', title: 'Bị chặn', advice: 'Nội dung vi phạm nghiêm trọng với nhóm tuổi này. Quay lại bước 1, sửa và lưu bản mới rồi kiểm tra lại.' },
};

/** Mã lỗi backend của bước kiểm tra và chốt; mã lạ giữ nguyên lời nhắn của API. */
const ERROR: Record<string, string> = {
  MODERATION_NOT_CONFIGURED: 'Máy chủ chưa bật kiểm duyệt nội dung bằng AI. Hãy báo quản trị viên.',
  CURRENT_SAVED_VERSION_REQUIRED: 'Bản này không còn là bản hiện tại. Tải lại trang rồi thử lại.',
  STALE_STORY_VERSION: 'Truyện vừa thay đổi ở nơi khác. Tải lại trang rồi thử lại.',
  CONTENT_MODERATION_CHECK_REQUIRED: 'Kết quả kiểm tra đã cũ. Hãy bấm Kiểm tra lại rồi chốt.',
  MANUAL_CONTENT_INCOMPLETE: 'Còn thiếu tên, nội dung, nguồn nội dung hoặc cam kết bản quyền ở bản đã lưu.',
  MANUAL_CONTENT_INVALID: 'Nội dung không hợp lệ (quá dài hoặc ngôn ngữ, nhóm tuổi không hỗ trợ).',
  INVALID_STORY_STATUS: 'Truyện không còn ở trạng thái bản nháp nên không chốt được.',
  MEDIA_JOB_ACTIVE: 'Đang có lượt tạo media chạy cho truyện này. Hãy chờ xong.',
  MEDIA_MODE_INVALID: 'Cách tạo media không hợp lệ. Tải lại trang rồi thử lại.',
  AUTHORING_ACCESS_REQUIRED: 'Bạn không có quyền với truyện này.',
};
const errorText = (message: string | undefined, fallback: string) => (message && ERROR[message.trim()]) || message || fallback;

/**
 * Bước 2 của truyện thủ công (Luồng 3, mục 3d): Creator tự kiểm tra nội dung (`content/check`)
 * rồi chốt nội dung (`manual/confirm-content`). Chốt xong backend xếp hàng tạo tranh và giọng đọc.
 */
export default function CreatorContentCheck({ draft, disabled, missing, onWorkingChange, onConfirmed }: {
  draft: CreatorDraft;
  disabled: boolean;
  /** Ô bắt buộc của bản đã lưu còn trống; backend từ chối chốt khi thiếu. */
  missing: string[];
  onWorkingChange: (value: boolean) => void;
  onConfirmed: (status: string) => void;
}) {
  const versionId = draft.selectedVersionId;
  const [zone, setZone] = useState<B.GrayZoneContentCheckDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  // Chốt bị mất mạng / lỗi máy chủ: thử lại đúng lệnh cũ để không tạo trùng job media.
  const [pending, setPending] = useState<B.ConfirmManualContentRequest | null>(null);
  // Cách tạo media sau khi chốt: AI tạo hết, hoặc tự chọn từng tranh / đoạn (tải tệp của mình hoặc nhờ AI).
  const [mediaMode, setMediaMode] = useState<'auto' | 'choose'>('auto');
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => { onWorkingChange(busy || !!pending); return () => onWorkingChange(false); }, [busy, pending, onWorkingChange]);

  const confirmed = draft.status !== 'Draft';
  const result = zone && zone.storyVersionId === versionId ? zone : null;
  const meta = result ? ZONE[result.status] : null;
  const canConfirm = !confirmed && !!versionId && missing.length === 0 && result?.status === 'Safe';

  const check = async () => {
    if (busy || !versionId) return;
    setBusy(true); setNote(null); setZone(null);
    const r = await service.check(draft.storyId, versionId);
    if (!alive.current) return;
    setBusy(false);
    if (r.success && r.data) setZone(r.data); else setNote({ ok: false, text: errorText(r.message, 'Không kiểm tra được nội dung.') });
  };

  const confirm = async () => {
    if (busy || !versionId) return;
    if (!pending && !(await confirmDialog(mediaMode === 'auto'
      ? 'Chốt nội dung này? Sau khi chốt, AI sẽ tạo tranh và giọng đọc, bạn không sửa nội dung bản này được nữa.'
      : 'Chốt nội dung này? Sau khi chốt, bạn chọn tranh và giọng đọc cho từng phần ở bước 3, không sửa nội dung bản này được nữa.'))) return;
    const body = pending ?? { versionId, revisionToken: draft.revisionToken, mediaMode };
    setBusy(true); setNote(null);
    const r = await service.confirmManual(draft.storyId, body);
    if (!alive.current) return;
    setBusy(false);
    if (r.success && r.data && r.data.versionId === versionId) {
      setPending(null);
      setNote({ ok: true, text: body.mediaMode === 'choose' ? 'Đã chốt nội dung. Hãy chọn tranh và giọng đọc ở bước 3.' : 'Đã chốt nội dung. AI đang tạo tranh và giọng đọc.' });
      onConfirmed(r.data.status);
      return;
    }
    setPending(r.status === 0 || (r.status ?? 0) >= 500 ? body : null);
    setNote({ ok: false, text: errorText(r.message, 'Không chốt được nội dung.') });
  };

  return (
    <section className="pa-card" aria-label="Kiểm tra và chốt nội dung">
      <div className="pa-head"><h3><span className="pa-num">2</span>Kiểm tra và chốt nội dung</h3></div>
      {note && <p className={`notice ${note.ok ? 'ok' : 'err'}`} role="status">{note.text}</p>}

      {confirmed
        ? <StepDone />
        : <>
          {missing.length > 0 && <p className="notice warn" role="status" data-inline-notice>Còn thiếu: {missing.join(', ')}. Quay lại bước 1 điền đủ rồi lưu.</p>}

          <div className="pa-step">
            <h4><span className="pa-num">1</span>Tự kiểm tra nội dung</h4>
            <p className="sub">AI đánh giá truyện theo nhóm tuổi: An toàn, Vùng xám hoặc Bị chặn.</p>
            {/* Lời khuyên hiện một lần dạng toast; kết quả giữ lại thành nhãn cạnh nút. */}
            {result && meta && <p className={`notice ${meta.tone}`} role={meta.tone === 'err' ? 'alert' : 'status'}>Kết quả: {meta.title}. {result.status === 'GrayZone' && !result.waitingForModeration ? 'Nội dung ở vùng xám nhưng không còn chờ Moderator. Nếu sửa nội dung, hãy kiểm tra lại.' : meta.advice}</p>}
            <div className="pa-actions">
              <button className="btn btn-s" disabled={busy || disabled || !versionId} onClick={() => void check()}><ShieldCheck className="ic" />{busy && !pending ? 'Đang kiểm tra…' : result ? 'Kiểm tra lại' : 'Kiểm tra'}</button>
              {result && meta && <span className={`pill ${meta.tone === 'ok' ? 'ok' : meta.tone === 'warn' ? 'wait' : 'flag'}`}>Kết quả: {meta.title}</span>}
            </div>
          </div>

          <div className="pa-step">
            <h4><span className="pa-num">2</span>Chốt nội dung</h4>
            <p className="sub">Chỉ chốt được khi kết quả kiểm tra là An toàn.</p>
            <div className="seg" role="radiogroup" aria-label="Cách tạo tranh và giọng đọc" style={{ maxWidth: 420 }}>
              <button type="button" role="radio" aria-checked={mediaMode === 'auto'} className={mediaMode === 'auto' ? 'on' : ''} disabled={busy || !!pending} onClick={() => setMediaMode('auto')} title="AI tạo mọi tranh và giọng đọc"><Sparkles className="ic" />AI tạo hết</button>
              <button type="button" role="radio" aria-checked={mediaMode === 'choose'} className={mediaMode === 'choose' ? 'on' : ''} disabled={busy || !!pending} onClick={() => setMediaMode('choose')} title="Với từng tranh / đoạn: tải tệp của bạn lên hoặc nhờ AI tạo"><Upload className="ic" />Tự chọn từng phần</button>
            </div>
            <div className="pa-actions">
              {pending
                ? <button className="btn btn-p" disabled={busy} onClick={() => void confirm()}><RotateCcw className="ic" />Thử lại</button>
                : <button className="btn btn-p" disabled={busy || disabled || !canConfirm} title={!result ? 'Hãy kiểm tra nội dung trước' : undefined} onClick={() => void confirm()}><Lock className="ic" />Chốt nội dung</button>}
            </div>
          </div>
        </>}
    </section>
  );
}
