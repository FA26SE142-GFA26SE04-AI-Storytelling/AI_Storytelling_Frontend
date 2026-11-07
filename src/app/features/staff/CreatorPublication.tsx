'use client';
import { useEffect, useRef, useState } from 'react';
import { creatorPublicationService as service } from '@/app/services/creatorPublicationService';
import type * as B from '@/app/types/backendContracts';
import { useAuth } from '@/app/context/AuthContext';
import type { ApiResponse } from '@/app/types/auth';
import { confirmDialog } from "@/app/lib/confirm";
import { Check, ImagePlus } from 'lucide-react';
import '@/app/features/created/created.css';
import CoverPickerDialog from '@/app/features/created/CoverPickerDialog';
import { creatorService } from '@/app/services/creatorService';
import { coverFor } from '@/app/lib/storyView';
import { staffService } from '@/app/services/staffService';
import type { ContentCategory } from '@/app/types/childProfile';

/** Trạng thái duyệt của backend là chuỗi tiếng Anh; dịch các giá trị đã biết, giá trị lạ giữ nguyên. */
const REVIEW: Record<string, string> = {
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

export default function CreatorPublication({ storyId, versionId, storyStatus, onRevision, onLockChange, hidden = false }: { storyId: number; versionId: number | null; storyStatus?: string; onRevision: () => void; onLockChange?: (locked: boolean) => void; hidden?: boolean }) {
  const { user } = useAuth();
  const [status, setStatus] = useState<B.CreatorPublicationStatus | null>(null);
  const [reason, setReason] = useState('');
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
    if (r.success) { if (revision) onRevision(); else { if (lockVersion) { knownSubmitted.current = status?.versionId ?? null; setSubmittedVersion(status?.versionId ?? null); onLockChange?.(true); } setRefresh(n => n + 1); } }
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

  // Ẩn phần giao diện ở các bước trước media (vẫn chạy ở trên để tính trạng thái khóa chỉnh sửa cho màn cha).
  if (hidden) return null;
  return <section className="pa-card" aria-label="Phát hành"><div className="pa-head"><h3><span className="pa-num">3</span>Phát hành truyện</h3></div>
    {note && <p className="notice" role="status">{note}</p>}
    <p style={{ margin: 0, fontWeight: 800, fontSize: "var(--fs-md)" }}>{headline}</p>
    <p className="sub">Gửi bản hiện tại cho Moderator duyệt công khai. Bản đã nộp giữ nguyên trong lịch sử; muốn sửa bản sẵn sàng hoặc đã nộp, hãy tạo phiên bản chỉnh sửa mới.</p>

    <div className="pa-step">
      <b>Kiểm tra vùng xám (nên làm trước khi gửi)</b>
      <p className="sub">AI đánh giá nội dung theo nhóm tuổi của truyện và cho ra một trong ba mức: <b>An toàn</b> (qua), <b>Vùng xám</b> (có chỗ gây tranh cãi, cần Moderator xem trước khi tiếp tục) hoặc <b>Bị chặn</b> (vi phạm nghiêm trọng, phải sửa). Kết quả chỉ cho biết mức, không chỉ ra câu cụ thể.</p>
      <div className="pa-actions"><button className="btn btn-s" disabled={busy || !checkable} onClick={() => void runCheck()}>{busy ? 'Đang kiểm tra…' : 'Kiểm tra vùng xám bằng AI'}</button></div>
      {zone && zone.storyVersionId === status?.versionId && <div className={`notice ${ZONE[zone.status]?.tone ?? ''}`} role="status">
        <b>Kết quả: {ZONE[zone.status]?.title ?? zone.status}</b>
        <p style={{ margin: '6px 0 0' }}>{zoneAdvice(zone)}</p>
      </div>}
      {grayWaiting && !zone && <div className="notice warn">Truyện đang ở vùng xám và chờ Moderator xem xét. Bạn chờ quyết định của họ trước khi chốt hay gửi duyệt.</div>}
    </div>

    <div className="pa-step">
      <b>Gửi duyệt công khai</b>
      {blocker && <p className="sub">{blocker}</p>}
      {canSubmit && <div className="pa-cover" role="group" aria-label="Ảnh bìa">
        <b>Ảnh bìa</b>
        <div className="edit-story-cover">
          <div className="edit-story-cover-preview" role="img" aria-label="Ảnh bìa hiện tại" style={{ background: coverFor(cover) }} />
          <button type="button" className="btn btn-s" disabled={busy} onClick={() => setPickingCover(true)}><ImagePlus className="ic" />{cover ? 'Đổi ảnh bìa' : 'Chọn ảnh bìa'}</button>
        </div>
        {cover === null && <span className="notice warn" role="status" data-inline-notice>Cần chọn ảnh bìa từ tranh trong truyện trước khi gửi duyệt.</span>}
      </div>}
      {canSubmit && <div className="pa-labels" role="group" aria-label="Nhãn nội dung">
        <b>Nhãn nội dung</b>
        {!categories ? <span role="status">Đang tải nhãn…</span>
          : categories.length === 0 ? <span>Chưa có nhãn nào để chọn. Hãy liên hệ quản trị viên.</span>
          : <div className="pa-label-chips">{categories.map(c => <button type="button" key={c.id} className={`pa-label-chip${labelIds.includes(c.id) ? ' on' : ''}`} aria-pressed={labelIds.includes(c.id)} disabled={busy} onClick={() => toggleLabel(c.id)}>{labelIds.includes(c.id) && <Check className="ic" aria-hidden="true" />}{c.displayName}</button>)}</div>}
      </div>}
      <div className="pa-actions">
        {canSubmit && <button className="btn btn-p" disabled={busy || !cover || labelIds.length === 0 || sameAsReturned} title={!cover ? 'Chọn ảnh bìa trước khi gửi' : labelIds.length === 0 ? 'Chọn ít nhất một nhãn nội dung trước khi gửi' : sameAsReturned ? 'Hãy thay đổi bộ nhãn so với lần bị trả về' : undefined} onClick={() => void act(() => service.submit(storyId, status!.versionId, labelIds))}>{labelsOnlyReturn ? 'Gửi lại với nhãn mới' : 'Gửi bản hiện tại cho Moderator'}</button>}
        {pendingReview && <button className="btn btn-s" disabled={busy} onClick={async () => { if (!(await confirmDialog("Rút yêu cầu duyệt? Lượt đăng bài sẽ được hoàn lại nếu yêu cầu còn chờ duyệt."))) return; void act(() => service.withdraw(status!.openItemId!)); }}>Rút yêu cầu duyệt</button>}
        {canRevise && <button className="btn btn-s" disabled={busy} onClick={() => void act(() => service.revision(storyId, status!.versionId), true)}>Tạo phiên bản chỉnh sửa mới</button>}
        <button className="btn btn-g" disabled={busy} onClick={() => setRefresh(n => n + 1)}>Tải lại trạng thái</button>
      </div>
    </div>

    {pickingCover && <CoverPickerDialog storyId={storyId} cover={cover} onClose={() => setPickingCover(false)} onSaved={() => setCoverTick(n => n + 1)} />}
    {status?.isPublished && !status.openItemId && <div className="pa-step">
      <b>Yêu cầu gỡ để chỉnh sửa</b>
      <p className="sub">Truyện đang công khai nên không sửa trực tiếp được. Gỡ xuống, sửa rồi gửi duyệt lại.</p>
      <label className="field">Lý do yêu cầu gỡ<textarea className="inp" rows={2} maxLength={2000} value={reason} onChange={e => setReason(e.target.value)} /></label>
      <div className="pa-actions"><button className="btn btn-s" disabled={busy || !reason.trim()} onClick={async () => { if (!(await confirmDialog("Gửi yêu cầu gỡ truyện? Moderator sẽ xem xét việc gỡ truyện khỏi thư viện công khai."))) return; void act(() => service.remove(storyId, reason)); }}>Yêu cầu gỡ</button></div>
    </div>}
  </section>;
}
