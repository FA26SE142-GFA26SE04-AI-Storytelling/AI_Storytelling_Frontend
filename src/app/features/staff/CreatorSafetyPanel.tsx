'use client';
import type { CreatorSafetyCheckDto } from '@/app/types/backendContracts';
import { creatorSafetyMessage } from '@/app/features/story-workflow/creatorSafety';

export default function CreatorSafetyPanel({ check, busy, checkable, onCheck }: {
  check: CreatorSafetyCheckDto | undefined; busy: boolean; checkable: boolean; onCheck: () => void;
}) {
  const names: Record<string, string> = { Safe: 'An toàn', GrayZone: 'Cần Moderator xem xét', HardBlock: 'Bị chặn' };
  return <div className="pa-step">
    <b>Kiểm tra an toàn bằng AI</b>
    <p className="sub">Truyện AI được kiểm tra trong quá trình tạo. Truyện soạn tay hoặc bản đã sửa cần kết quả hợp lệ trước khi gửi duyệt. Kiểm tra không tự gửi truyện cho Moderator.</p>
    <div role="status" data-inline-notice className={`notice ${check?.state === 'Current' ? check.zone === 'Safe' ? 'ok' : check.zone === 'HardBlock' ? 'err' : 'warn' : ''}`}>
      {check?.state === 'Current' && check.zone && <b>{names[check.zone] ?? 'Chưa xác định'}</b>}
      <p>{creatorSafetyMessage(check)}</p>
    </div>
    {check?.required && check.state !== 'Current' && <>
      <button type="button" className="btn btn-s" disabled={busy || !checkable} onClick={onCheck}>{busy ? 'Đang kiểm tra…' : 'Kiểm tra an toàn bằng AI'}</button>
      {!checkable && <p className="sub">Bản đã nộp được giữ nguyên. Nếu cần sửa nội dung hoặc kiểm tra lại, hãy tạo phiên bản chỉnh sửa mới.</p>}
    </>}
  </div>;
}
