'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePop } from '@/app/lib/motion';
import { creatorPublicationService as service } from '@/app/services/creatorPublicationService';
import type * as B from '@/app/types/backendContracts';
import { useAuth } from '@/app/context/AuthContext';
import type { ApiResponse } from '@/app/types/auth';
import { confirmDialog } from "@/app/lib/confirm";
import { Check, ImagePlus } from 'lucide-react';
import '@/app/features/created/created.css';
import CoverPickerDialog, { CoverPickerPanel, prefetchCoverPictures } from '@/app/features/created/CoverPickerDialog';
import { creatorService } from '@/app/services/creatorService';
import { coverFor } from '@/app/lib/storyView';
import CreatorSafetyPanel from './CreatorSafetyPanel';
import { canSubmitWithSafety } from '@/app/features/story-workflow/creatorSafety';
import { publicationLabelIds, togglePublicationLabel, type PublicationLabelSelection } from '@/app/features/story-workflow/publicationLabelSelection';
import { staffService } from '@/app/services/staffService';
import type { ContentCategory } from '@/app/types/childProfile';

/** Ngăn ở khung giữa (màn Tranh & giọng đọc) để vẽ khung Ảnh bìa và Nhãn nội dung; không có thì hai khung nằm ngay trong phần Phát hành. */
export const PublicationDock = createContext<HTMLElement | null>(null);

/** Trạng thái duyệt của backend là chuỗi tiếng Anh; dịch các giá trị đã biết, giá trị lạ giữ nguyên. */
export const REVIEW: Record<string, string> = {
  None: 'Chưa gửi duyệt', Pending: 'Đang chờ Moderator duyệt', Approved: 'Đã được duyệt', Rejected: 'Bị từ chối', ChangesRequested: 'Moderator yêu cầu sửa', Withdrawn: 'Đã rút yêu cầu',
};
const OPEN_ITEM: Record<string, string> = { Pending: 'đang chờ Moderator nhận', Claimed: 'Moderator đang xem xét', Approved: 'đã duyệt', Rejected: 'bị từ chối' };

export default function CreatorPublication({ storyId, versionId, storyStatus, onRevision, onLockChange, hidden = false }: { storyId: number; versionId: number | null; storyStatus?: string; onRevision: () => void; onLockChange?: (locked: boolean) => void; hidden?: boolean }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<B.CreatorPublicationStatus | null>(null);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const checkRequest = useRef<symbol | null>(null);
  /** Nhãn nội dung (nhãn dán) Creator đề xuất khi gửi duyệt; danh sách lấy từ API, chỉ nhãn còn hoạt động. */
  const [categories, setCategories] = useState<ContentCategory[] | null>(null);
  const [labelSelection, setLabelSelection] = useState<PublicationLabelSelection>(null);
  const labelScope = `${user?.id}:${storyId}:${versionId}`;
  const suggestedLabelIds = status?.storyId === storyId && status.versionId === versionId
    && (status.canResubmitLabels || status.canResubmitWithdrawn)
    ? (status.lastProposedLabels ?? []).map(label => label.contentCategoryId) : [];
  const labelIds = publicationLabelIds(labelSelection, labelScope, suggestedLabelIds, categories);
  /** Ảnh bìa hiện tại của truyện (undefined = đang tải, null = chưa có). Backend bắt buộc có bìa trước khi gửi duyệt. */
  const [cover, setCover] = useState<string | null | undefined>(undefined);
  const [pickingCover, setPickingCover] = useState(false);
  const [coverTick, setCoverTick] = useState(0);
  useEffect(() => {
    let alive = true;
    void creatorService.get(storyId).then(r => { if (alive && r.ok) setCover(r.data?.coverImageUrl ?? null); });
    return () => { alive = false; };
  }, [storyId, versionId, coverTick]);
  const dock = useContext(PublicationDock);
  // Chọn ảnh bìa: khung Ảnh bìa mở rộng ngay tại chỗ (chỉ khi có ngăn ở khung giữa; không có thì dùng popup) kèm hiệu ứng bật ra.
  // Lưu xong thì hiện bìa mới ngay, rồi mới tải lại bản đã ký từ backend.
  const onCoverSaved = (next?: string | null) => { if (next !== undefined) setCover(next); setCoverTick(n => n + 1); };
  const expandCover = pickingCover && !!dock;
  const coverRef = usePop<HTMLDivElement>(expandCover, 0.96);
  const scope = useRef(Symbol());
  const knownSubmitted = useRef<number | null>(null);
  const [submittedVersion,setSubmittedVersion] = useState<number | null>(null);
  // Ignore publication/check results from earlier stories, versions or accounts.
  useEffect(() => {
    const controller = new AbortController(); const run = Symbol(); scope.current = run;
    setStatus(null); setBusy(false); checkRequest.current = null; onLockChange?.(true);
    if (!versionId) { onLockChange?.(false); return; }
    void service.status(storyId, controller.signal).then(r => {
      if (scope.current !== run) return;
      if (!r.success || !r.data) { setNote(r.message); return; }
      const s = r.data;
      if (s.storyId !== storyId || s.versionId !== versionId) { setNote('Trạng thái không khớp phiên bản hiện tại. Hãy tải lại trạng thái.'); return; }
      setStatus(s);
      if (s.reviewStatus !== 'None' || s.openItemId) { knownSubmitted.current = s.versionId; setSubmittedVersion(s.versionId); }
      // Content/media remain read-only; resubmission after withdrawal is a separate command.
      const locked = s.isPublished || !!s.openItemId || s.reviewStatus !== 'None' || knownSubmitted.current === s.versionId || ['Ready','Archived'].includes(storyStatus ?? '');
      onLockChange?.(locked);
    });
    return () => { scope.current = Symbol(); controller.abort(); };
  }, [storyId, versionId, storyStatus, refresh, user?.id, onLockChange]);
  const toggleLabel = (id: number) => setLabelSelection(current => togglePublicationLabel(current, labelScope, suggestedLabelIds, categories, id));
  const act = async (fn: () => Promise<ApiResponse<unknown>>, revision = false, lockVersion = true) => {
    if (busy) return;
    setBusy(true); setNote(''); const run = scope.current;
    const r = await fn(); if (run !== scope.current) return;
    setBusy(false); setNote(r.message || (r.success ? 'Đã ghi nhận.' : 'Thao tác chưa hoàn tất.'));
    if (r.success) { if (revision) onRevision(); else { if (lockVersion) { knownSubmitted.current = status?.versionId ?? null; setSubmittedVersion(status?.versionId ?? null); onLockChange?.(true); } setRefresh(n => n + 1); } }
    else if (r.status === 409) setRefresh(n => n + 1);
  };
  const runCheck = async () => {
    if (busy || checkRequest.current || !status || status.storyId !== storyId || status.versionId !== versionId) return;
    const request = Symbol(); checkRequest.current = request;
    setBusy(true); setNote(''); const run = scope.current;
    try {
      const r = await service.check(storyId, status.versionId);
      if (run !== scope.current) return;
      if (!r.success) setNote(`${r.message || 'Chưa xác nhận được kết quả kiểm tra.'} Hãy tải lại trạng thái trước khi thử lại.`);
      setRefresh(n => n + 1);
    } catch {
      if (run === scope.current) {
        setNote('Chưa xác nhận được kết quả kiểm tra. Hãy tải lại trạng thái trước khi thử lại.');
        setRefresh(n => n + 1);
      }
    } finally {
      if (checkRequest.current === request) { checkRequest.current = null; setBusy(false); }
    }
  };
  const ready = storyStatus === 'Ready';
  // Bị trả về chỉ vì nhãn thì gửi lại ngay trên phiên bản này (backend cho phép), không bắt tạo phiên bản mới và làm lại media.
  const labelsOnlyReturn = !!status?.canResubmitLabels;
  const withdrawn = status?.canResubmitWithdrawn === true;
  const lastLabelIds = (status?.lastProposedLabels ?? []).map(l => l.contentCategoryId);
  const canSubmit = ready && !!status && !status.isPublished && !status.openItemId && (status.reviewStatus === 'None' || labelsOnlyReturn);
  // Backend từ chối gửi lại nếu bộ nhãn y hệt lần bị trả về.
  const sameAsReturned = labelsOnlyReturn && labelIds.length === lastLabelIds.length && labelIds.every(id => lastLabelIds.includes(id));
  const pendingReview = !!status && status.openItemType === 'PublicStoryReview' && status.openItemStatus === 'Pending' && !!status.openItemId;
  const grayWaiting = !!status && status.openItemType === 'GrayZoneStory' && ['Pending', 'Claimed'].includes(status.openItemStatus ?? '');
  const canRevise = !!status && !status.isPublished && !status.openItemId && storyStatus !== 'Archived' && (ready || status.reviewStatus !== 'None' || submittedVersion === status.versionId);
  // Chỉ tải danh sách nhãn khi thật sự có thể gửi duyệt.
  const labelsNeeded = canSubmit;
  useEffect(() => {
    if (!labelsNeeded || categories) return;
    const controller = new AbortController(); let alive = true;
    void staffService.categories().then(r => { if (alive && !controller.signal.aborted) { if (r.success) setCategories((r.data ?? []).filter(c => c.isActive)); else setNote(r.message); } });
    return () => { alive = false; controller.abort(); };
  }, [labelsNeeded, categories]);
  const safetyReady = canSubmitWithSafety(status?.safetyCheck);
  const checkable = !!status && !status.isPublished && !status.openItemId && status.reviewStatus === 'None';
  const headline = !status ? 'Đang tải trạng thái…'
    : status.isPublished ? 'Đã công khai'
    : withdrawn ? 'Đã rút yêu cầu duyệt'
    : grayWaiting ? 'Đang chờ Moderator xem xét vùng xám'
    : status.openItemId ? `${REVIEW[status.reviewStatus] ?? status.reviewStatus}${status.openItemStatus ? ` (${OPEN_ITEM[status.openItemStatus] ?? status.openItemStatus})` : ''}`
    : REVIEW[status.reviewStatus] ?? status.reviewStatus;
  const blocker = !status ? null
    : status.isPublished ? 'Truyện đang công khai. Muốn sửa, hãy yêu cầu gỡ ở phần cuối trang.'
    : pendingReview ? 'Khi Moderator chưa nhận xử lý, bạn có thể rút yêu cầu và giữ nguyên truyện cùng media đã xác nhận.'
    : grayWaiting ? 'Truyện đang chờ Moderator xem xét vùng xám nên chưa gửi duyệt được.'
    : !ready ? 'Truyện chưa sẵn sàng: hoàn tất bước 2 (media tạo xong và bạn đã xác nhận gói) rồi mới gửi duyệt được.'
    : withdrawn ? 'Có thể gửi lại phiên bản này, không cần tạo lại nội dung, tranh hoặc giọng đọc. Nếu muốn sửa nội dung, hãy tạo phiên bản chỉnh sửa mới.'
    : labelsOnlyReturn ? 'Moderator trả về chỉ vì nhãn nội dung. Chọn lại nhãn bên dưới rồi gửi lại, không cần sửa truyện hay tạo lại tranh và âm thanh.'
    : status.reviewStatus !== 'None' ? 'Bản này đã từng được gửi duyệt. Muốn gửi lại, hãy tạo phiên bản chỉnh sửa mới.'
    : null;

  // Hai khung Ảnh bìa và Nhãn nội dung: vẽ vào ngăn ở khung giữa nếu có, không thì ngay trong phần Phát hành.
  const pickers = canSubmit ? <>
  <div ref={coverRef} className={`pa-cover${expandCover ? ' expanded' : ''}`} role="group" aria-label="Ảnh bìa">
          {expandCover
            ? <CoverPickerPanel inline storyId={storyId} cover={cover} onClose={() => setPickingCover(false)} onSaved={onCoverSaved} />
            : <>
              <b>Ảnh bìa</b>
              <div className="edit-story-cover">
                <div className="edit-story-cover-preview" role="img" aria-label="Ảnh bìa hiện tại" style={{ background: coverFor(cover) }} />
                <button type="button" className="btn btn-s" disabled={busy || withdrawn} onPointerEnter={() => prefetchCoverPictures(storyId)} onFocus={() => prefetchCoverPictures(storyId)} onClick={() => setPickingCover(true)}><ImagePlus className="ic" />{cover ? 'Đổi ảnh bìa' : 'Chọn ảnh bìa'}</button>
              </div>
              {cover === null && <span className="notice warn" role="status" data-inline-notice>Cần chọn ảnh bìa từ tranh trong truyện trước khi gửi duyệt.</span>}
            </>}
        </div>
        <div className="pa-labels" role="group" aria-label="Nhãn nội dung">
          <b>Nhãn nội dung</b>
          {!categories ? <span role="status">Đang tải nhãn…</span>
            : categories.length === 0 ? <span>Chưa có nhãn nào để chọn. Hãy liên hệ quản trị viên.</span>
            : <div className="pa-label-chips">{categories.map(c => <button type="button" key={c.id} className={`pa-label-chip${labelIds.includes(c.id) ? ' on' : ''}`} aria-pressed={labelIds.includes(c.id)} disabled={busy} onClick={() => toggleLabel(c.id)}>{labelIds.includes(c.id) && <Check className="ic" aria-hidden="true" />}{c.displayName}</button>)}</div>}
        </div>
  </> : null;

  // Ẩn phần giao diện ở các bước trước media (vẫn chạy ở trên để tính trạng thái khóa chỉnh sửa cho màn cha).
  if (hidden) return null;
  return <section className="pa-card" aria-label="Phát hành"><div className="pa-head"><h3><span className="pa-num">3</span>Phát hành truyện</h3></div>
    {note && <p className="notice" role="status">{note}</p>}
    <p style={{ margin: 0, fontWeight: 800, fontSize: "var(--fs-md)" }}>{headline}</p>
    <p className="sub">Gửi bản hiện tại cho Moderator duyệt công khai. Khi yêu cầu còn chờ nhận, bạn có thể rút và gửi lại cùng phiên bản. Nếu sửa nội dung đã nộp, hãy tạo phiên bản chỉnh sửa mới.</p>

    <CreatorSafetyPanel check={status?.safetyCheck} busy={busy} checkable={checkable} onCheck={() => void runCheck()}/>

    <div className="pa-step">
      <b>Gửi duyệt công khai</b>
      {blocker && <p className="sub">{blocker}</p>}
      {!dock && pickers}
      <div className="pa-actions">
        {canSubmit && <button className="btn btn-p" disabled={busy || !safetyReady || !cover || labelIds.length === 0 || sameAsReturned} title={!cover ? 'Chọn ảnh bìa trước khi gửi' : labelIds.length === 0 ? 'Chọn ít nhất một nhãn nội dung trước khi gửi' : sameAsReturned ? 'Hãy thay đổi bộ nhãn so với lần bị trả về' : undefined} onClick={() => { if (safetyReady && !checkRequest.current && status?.storyId === storyId && status.versionId === versionId) void act(() => service.submit(storyId, status.versionId, labelIds)); }}>{labelsOnlyReturn ? 'Gửi lại với nhãn mới' : withdrawn ? 'Gửi lại phiên bản hiện tại' : 'Gửi bản hiện tại cho Moderator'}</button>}
        {pendingReview && <button className="btn btn-s" disabled={busy} onClick={async () => { if (!(await confirmDialog("Rút yêu cầu duyệt? Nội dung, tranh và giọng đọc đã xác nhận được giữ nguyên. Bạn có thể gửi lại cùng phiên bản khi sẵn sàng."))) return; void act(() => service.withdraw(status!.openItemId!)); }}>Rút yêu cầu duyệt</button>}
        {canRevise && <button className="btn btn-s" disabled={busy} onClick={() => void act(() => service.revision(storyId, status!.versionId), true)}>Tạo phiên bản chỉnh sửa mới</button>}
        <button className="btn btn-g" disabled={busy} onClick={() => setRefresh(n => n + 1)}>Tải lại trạng thái</button>
      </div>
    </div>

    {dock && pickers && createPortal(pickers, dock)}
    {/* Không có ngăn ở khung giữa (soạn thủ công…) thì chọn ảnh bìa bằng popup. */}
    {pickingCover && !dock && <CoverPickerDialog storyId={storyId} cover={cover} onClose={() => setPickingCover(false)} onSaved={onCoverSaved} />}
    {status?.isPublished && !status.openItemId && <div className="pa-step">
      <b>Yêu cầu gỡ để chỉnh sửa</b>
      <p className="sub">Truyện đang công khai nên không sửa trực tiếp được. Gỡ xuống, sửa rồi gửi duyệt lại.</p>
      <label className="field">Lý do yêu cầu gỡ<textarea className="inp" rows={2} maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} /></label>
      <div className="pa-actions"><button className="btn btn-s" disabled={busy || !reason.trim()} onClick={async () => { if (!(await confirmDialog("Gửi yêu cầu gỡ truyện? Moderator sẽ xem xét việc gỡ truyện khỏi thư viện công khai."))) return; void act(() => service.remove(storyId, reason)); }}>Yêu cầu gỡ</button></div>
    </div>}
  </section>;
}
