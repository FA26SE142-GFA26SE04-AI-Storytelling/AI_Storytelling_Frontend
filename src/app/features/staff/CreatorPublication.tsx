'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePop } from '@/app/lib/motion';
import { creatorPublicationService as service } from '@/app/services/creatorPublicationService';
import type * as B from '@/app/types/backendContracts';
import { useAuth } from '@/app/context/AuthContext';
import type { ApiResponse } from '@/app/types/auth';
import { confirmDialog } from "@/app/lib/confirm";
import { Check, FilePen, ImagePlus, RefreshCw, Send, ShieldCheck, Trash2, Undo2 } from 'lucide-react';
import Dialog from '@/app/components/Dialog';
import '@/app/features/created/created.css';
import CoverPickerDialog, { CoverPickerPanel, prefetchCoverPictures } from '@/app/features/created/CoverPickerDialog';
import { creatorService } from '@/app/services/creatorService';
import { coverFor } from '@/app/lib/storyView';
import { staffService } from '@/app/services/staffService';
import type { ContentCategory } from '@/app/types/childProfile';

/** Ngăn ở khung giữa (màn Tranh & giọng đọc) để vẽ khung Ảnh bìa và Nhãn nội dung; không có thì hai khung nằm ngay trong phần Phát hành. */
export const PublicationDock = createContext<HTMLElement | null>(null);

/** Trạng thái duyệt của backend là chuỗi tiếng Anh; dịch các giá trị đã biết, giá trị lạ giữ nguyên. */
export const REVIEW: Record<string, string> = {
  None: 'Chưa gửi duyệt', Pending: 'Đang chờ Moderator duyệt', Approved: 'Đã được duyệt', Rejected: 'Bị từ chối', ChangesRequested: 'Moderator yêu cầu sửa', Withdrawn: 'Đã rút yêu cầu',
};
const OPEN_ITEM: Record<string, string> = { Pending: 'đang chờ Moderator nhận', Claimed: 'Moderator đang xem xét', Approved: 'đã duyệt', Rejected: 'bị từ chối' };

/** Ba mức vùng xám của backend: Safe, GrayZone, HardBlock. */
const ZONE: Record<string, { tone: 'ok' | 'warn' | 'err'; title: string }> = {
  Safe: { tone: 'ok', title: 'An toàn' },
  GrayZone: { tone: 'warn', title: 'Vùng xám' },
  HardBlock: { tone: 'err', title: 'Bị chặn' },
};

function zoneAdvice(zone: B.GrayZoneContentCheckDto): string {
  if (zone.status === 'Safe') return 'Nội dung qua kiểm tra an toàn. Bạn có thể chốt media và gửi duyệt.';
  if (zone.status === 'HardBlock') return 'AI nhận thấy nội dung vi phạm nghiêm trọng với nhóm tuổi này nên không tiếp tục được. Quay lại bước 1, sửa nội dung rồi lưu bản mới và kiểm tra lại.';
  return zone.waitingForModeration
    ? 'AI thấy có chỗ có thể gây tranh cãi với nhóm tuổi này. Truyện đã được chuyển cho Moderator xem xét. Bạn chờ quyết định của họ. Nếu muốn, hãy sửa nội dung, lưu bản mới rồi kiểm tra lại.'
    : 'Nội dung nằm ở vùng xám nhưng hiện không còn chờ Moderator (có thể đã được xử lý trước đó). Nếu bạn sửa nội dung, hãy kiểm tra lại.';
}

/**
 * Phát hành truyện Creator: gửi Moderator duyệt, rút yêu cầu, tạo bản chỉnh sửa, xin gỡ khi đã công khai.
 * `showCheck`: hiện ô kiểm tra vùng xám (luồng AI). Luồng thủ công kiểm tra ở bước riêng trước khi chốt nên tắt đi.
 */
export default function CreatorPublication({ storyId, versionId, storyStatus, onRevision, onLockChange, hidden = false, showCheck = true, stepNo = 3 }: { storyId: number; versionId: number | null; storyStatus?: string; onRevision: () => void; onLockChange?: (locked: boolean) => void; hidden?: boolean; showCheck?: boolean; stepNo?: number }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<B.CreatorPublicationStatus | null>(null);
  const [reason, setReason] = useState('');
  const [removing, setRemoving] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [zone, setZone] = useState<B.GrayZoneContentCheckDto | null>(null);
  /** Nhãn nội dung (nhãn dán) Creator đề xuất khi gửi duyệt; danh sách lấy từ API, chỉ nhãn còn hoạt động. */
  const [categories, setCategories] = useState<ContentCategory[] | null>(null);
  const [labelIds, setLabelIds] = useState<number[]>([]);
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
  // Kết quả kiểm tra vùng xám chỉ đúng cho đúng phiên bản đã kiểm tra.
  useEffect(() => { setZone(null); }, [versionId]);
  useEffect(() => {
    const controller = new AbortController(); const run = Symbol(); scope.current = run;
    setStatus(null); onLockChange?.(true);
    if (!versionId) { onLockChange?.(false); return; }
    void service.status(storyId, controller.signal).then(r => {
      if (scope.current !== run) return;
      if (!r.success || !r.data) { setNote(r.message); return; }
      const s = r.data; setStatus(s);
      if (s.reviewStatus !== 'None' || s.openItemId) { knownSubmitted.current = s.versionId; setSubmittedVersion(s.versionId); }
      // Status does not expose past withdrawn submissions. Keep Ready versions read-only; revision is supported for Ready stories.
      const locked = s.isPublished || !!s.openItemId || s.reviewStatus !== 'None' || knownSubmitted.current === s.versionId || ['Ready','Archived'].includes(storyStatus ?? '');
      onLockChange?.(locked);
    });
    return () => { scope.current = Symbol(); controller.abort(); };
  }, [storyId, versionId, storyStatus, refresh, user?.id, onLockChange]);
  const toggleLabel = (id: number) => setLabelIds(cur => cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]);
  const act = async (fn: () => Promise<ApiResponse<unknown>>, revision = false, lockVersion = true) => {
    if (busy) return;
    setBusy(true); setNote(''); const run = scope.current;
    const r = await fn(); if (run !== scope.current) return;
    setBusy(false); setNote(r.message || (r.success ? 'Đã ghi nhận.' : 'Thao tác chưa hoàn tất.'));
    if (r.success) { setRemoving(false); setReason(''); if (revision) onRevision(); else { if (lockVersion) { knownSubmitted.current = status?.versionId ?? null; setSubmittedVersion(status?.versionId ?? null); onLockChange?.(true); } setRefresh(n => n + 1); } }
    else if (r.status === 409) setRefresh(n => n + 1);
  };
  const runCheck = async () => {
    if (busy || !status) return;
    setBusy(true); setNote(''); setZone(null); const run = scope.current;
    const r = await service.check(storyId, status.versionId); if (run !== scope.current) return;
    setBusy(false);
    if (r.success && r.data) setZone(r.data); else setNote(r.message || 'Không kiểm tra được nội dung.');
    setRefresh(n => n + 1);
  };

  const ready = storyStatus === 'Ready';
  // Bị trả về chỉ vì nhãn thì gửi lại ngay trên phiên bản này (backend cho phép), không bắt tạo phiên bản mới và làm lại media.
  const labelsOnlyReturn = !!status?.canResubmitLabels;
  const lastLabelIds = (status?.lastProposedLabels ?? []).map(l => l.contentCategoryId);
  const canSubmit = ready && !!status && !status.isPublished && !status.openItemId && (status.reviewStatus === 'None' || labelsOnlyReturn);
  // Backend từ chối gửi lại nếu bộ nhãn y hệt lần bị trả về.
  const sameAsReturned = labelsOnlyReturn && labelIds.length === lastLabelIds.length && labelIds.every(id => lastLabelIds.includes(id));
  const pendingReview = !!status && status.openItemType === 'PublicStoryReview' && status.openItemStatus === 'Pending' && !!status.openItemId;
  const grayWaiting = !!status && status.openItemType === 'GrayZoneStory' && ['Pending', 'Claimed'].includes(status.openItemStatus ?? '');
  const canRevise = !!status && !status.isPublished && !status.openItemId && storyStatus !== 'Archived' && (ready || status.reviewStatus !== 'None' || submittedVersion === status.versionId);
  // Chỉ tải danh sách nhãn khi thật sự có thể gửi duyệt.
  const labelsNeeded = canSubmit;
  // Gửi lại vì nhãn: điền sẵn bộ nhãn lần trước để Creator chỉ cần thêm/bớt.
  const lastLabelKey = lastLabelIds.join(',');
  useEffect(() => { if (labelsOnlyReturn) setLabelIds(lastLabelKey ? lastLabelKey.split(',').map(Number) : []); }, [labelsOnlyReturn, lastLabelKey]);
  useEffect(() => {
    if (!labelsNeeded || categories) return;
    const controller = new AbortController(); let alive = true;
    void staffService.categories().then(r => { if (alive && !controller.signal.aborted) { if (r.success) setCategories((r.data ?? []).filter(c => c.isActive)); else setNote(r.message); } });
    return () => { alive = false; controller.abort(); };
  }, [labelsNeeded, categories]);
  const checkable = !!status && !status.isPublished && !status.openItemId;
  const headline = !status ? 'Đang tải trạng thái…'
    : status.isPublished ? 'Đã công khai'
    : grayWaiting ? 'Đang chờ Moderator xem xét vùng xám'
    : status.openItemId ? `${REVIEW[status.reviewStatus] ?? status.reviewStatus}${status.openItemStatus ? ` (${OPEN_ITEM[status.openItemStatus] ?? status.openItemStatus})` : ''}`
    : REVIEW[status.reviewStatus] ?? status.reviewStatus;
  const blocker = !status ? null
    : status.isPublished ? 'Truyện đang công khai. Muốn sửa, hãy yêu cầu gỡ ở phần cuối trang.'
    : pendingReview ? 'Bạn đã gửi duyệt. Hãy chờ Moderator, hoặc rút yêu cầu nếu muốn sửa.'
    : grayWaiting ? 'Truyện đang chờ Moderator xem xét vùng xám nên chưa gửi duyệt được.'
    : !ready ? 'Truyện chưa sẵn sàng: hoàn tất bước 2 (media tạo xong và bạn đã xác nhận gói) rồi mới gửi duyệt được.'
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
                <button type="button" className="btn btn-s" disabled={busy} onPointerEnter={() => prefetchCoverPictures(storyId)} onFocus={() => prefetchCoverPictures(storyId)} onClick={() => setPickingCover(true)}><ImagePlus className="ic" />{cover ? 'Đổi ảnh bìa' : 'Chọn ảnh bìa'}</button>
              </div>
              {cover === null && <span className="notice warn" role="status">Cần chọn ảnh bìa từ tranh trong truyện trước khi gửi duyệt.</span>}
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
  return <section className="pa-card" aria-label="Phát hành"><div className="pa-head"><h3><span className="pa-num">{stepNo}</span>Phát hành truyện</h3></div>
    {note && <p className="notice" role="status">{note}</p>}
    <p style={{ margin: 0, fontWeight: 800, fontSize: "var(--fs-md)" }}>{headline}</p>
    <p className="sub">Gửi bản hiện tại cho Moderator duyệt công khai. Muốn sửa bản đã nộp, hãy tạo bản chỉnh sửa mới.</p>

    {showCheck && <div className="pa-step">
      <b>Kiểm tra vùng xám (nên làm trước khi gửi)</b>
      <p className="sub">AI đánh giá nội dung theo nhóm tuổi của truyện và cho ra một trong ba mức: <b>An toàn</b> (qua), <b>Vùng xám</b> (có chỗ gây tranh cãi, cần Moderator xem trước khi tiếp tục) hoặc <b>Bị chặn</b> (vi phạm nghiêm trọng, phải sửa). Kết quả chỉ cho biết mức, không chỉ ra câu cụ thể.</p>
      <div className="pa-actions"><button className="btn btn-s" disabled={busy || !checkable} onClick={() => void runCheck()}><ShieldCheck className="ic" />{busy ? 'Đang kiểm tra…' : 'Kiểm tra'}</button></div>
      {zone && zone.storyVersionId === status?.versionId && <div className={`notice ${ZONE[zone.status]?.tone ?? ''}`} role="status">
        <b>Kết quả: {ZONE[zone.status]?.title ?? zone.status}</b>
        <p style={{ margin: '6px 0 0' }}>{zoneAdvice(zone)}</p>
      </div>}
      {grayWaiting && !zone && <div className="notice warn" role="status">Truyện đang ở vùng xám và chờ Moderator xem xét. Bạn chờ quyết định của họ trước khi chốt hay gửi duyệt.</div>}
    </div>}

    <div className="pa-step">
      <b>Gửi duyệt công khai</b>
      {blocker && <p className="sub">{blocker}</p>}
      {!dock && pickers}
      <div className="pa-actions">
        {canSubmit && <button className="btn btn-p" disabled={busy || !cover || labelIds.length === 0 || sameAsReturned} title={!cover ? 'Chọn ảnh bìa trước khi gửi' : labelIds.length === 0 ? 'Chọn ít nhất một nhãn nội dung trước khi gửi' : sameAsReturned ? 'Hãy thay đổi bộ nhãn so với lần bị trả về' : undefined} onClick={() => void act(() => service.submit(storyId, status!.versionId, labelIds))}><Send className="ic" />{labelsOnlyReturn ? 'Gửi lại' : 'Gửi duyệt'}</button>}
        {pendingReview && <button className="btn btn-s" disabled={busy} onClick={async () => { if (!(await confirmDialog("Rút yêu cầu duyệt? Lượt đăng bài sẽ được hoàn lại nếu yêu cầu còn chờ duyệt."))) return; void act(() => service.withdraw(status!.openItemId!)); }}><Undo2 className="ic" />Rút yêu cầu</button>}
        {canRevise && <button className="btn btn-s" disabled={busy} onClick={async () => { if (!(await confirmDialog("Tạo bản chỉnh sửa mới? Bản hiện tại giữ nguyên trong lịch sử, bạn sẽ soạn và làm lại media cho bản mới."))) return; void act(() => service.revision(storyId, status!.versionId), true); }}><FilePen className="ic" />Tạo bản chỉnh sửa</button>}
        <button className="btn btn-g icon-only" aria-label="Tải lại trạng thái" title="Tải lại trạng thái" disabled={busy} onClick={() => setRefresh(n => n + 1)}><RefreshCw className="ic" /></button>
      </div>
    </div>

    {dock && pickers && createPortal(pickers, dock)}
    {/* Không có ngăn ở khung giữa (soạn thủ công…) thì chọn ảnh bìa bằng popup. */}
    {pickingCover && !dock && <CoverPickerDialog storyId={storyId} cover={cover} onClose={() => setPickingCover(false)} onSaved={onCoverSaved} />}
    {status?.isPublished && !status.openItemId && <div className="pa-step">
      <b>Yêu cầu gỡ để chỉnh sửa</b>
      <p className="sub">Truyện đang công khai nên không sửa trực tiếp được. Gỡ xuống, sửa rồi gửi duyệt lại.</p>
      <div className="pa-actions"><button className="btn btn-s" disabled={busy} onClick={() => setRemoving(true)}><Trash2 className="ic" />Yêu cầu gỡ</button></div>
    </div>}
    {removing && <Dialog title="Yêu cầu gỡ truyện" onClose={() => { if (!busy) setRemoving(false); }}>
      <label className="field"><span className="lbl">Lý do yêu cầu gỡ</span><textarea className="inp" autoFocus rows={3} maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} /></label>
      <div className="row"><button className="btn btn-g" disabled={busy} onClick={() => setRemoving(false)}>Huỷ</button><span className="grow" /><button className="btn btn-no" disabled={busy || !reason.trim()} onClick={async () => { if (!(await confirmDialog("Gửi yêu cầu gỡ truyện? Moderator sẽ xem xét việc gỡ truyện khỏi thư viện công khai."))) return; void act(() => service.remove(storyId, reason)); }}><Send className="ic" />Gửi yêu cầu</button></div>
    </Dialog>}
  </section>;
}
